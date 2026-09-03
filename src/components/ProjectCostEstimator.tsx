import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  Package,
  Clock,
  Wrench,
  Percent,
  Sliders,
  FileDown,
  PhoneCall,
  Save,
  Trash2,
  Copy,
  Layers,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Info,
  MapPin,
  TrendingUp,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  Shield,
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
  Zap,
  Scale,
} from 'lucide-react';
import {
  CostEstimatorInput,
  CostEstimatorResult,
  RegionalLaborPreset,
  SavedProjectCostEstimate,
  MultiRoomProject,
  ProjectRoomItem,
} from '../types';
import {
  REGIONAL_LABOR_PRESETS,
  DEFAULT_COST_INPUT,
  calculateCostEstimate,
  getSavedCostEstimates,
  saveCostEstimateToStorage,
  deleteSavedCostEstimate,
} from '../utils/costEstimatorUtils';
import { exportCostEstimatorPdf } from '../utils/pdfExport';
import { SUBSTRATE_PROFILES } from '../utils/estimatorUtils';
import { useSettings } from '../context/SettingsContext';
import {
  saveActiveCostInput,
  loadActiveCostInputSync,
  loadActiveProjectSync,
} from '../utils/indexedDbStorage';
import { StorageStatusIndicator } from './StorageStatusIndicator';

interface ProjectCostEstimatorProps {
  onSendToQuote?: (quoteData: {
    projectName: string;
    squareFootage: number;
    substrate: string;
    thickness: number;
    rValue: number;
    nrc: number;
    bags: number;
    adhesiveGallons: number;
    siteConditions?: string;
    notes?: string;
  }) => void;
  onNavigateToMultiRoom?: () => void;
  onNavigateToCalculator?: () => void;
  initialMultiRoomProject?: MultiRoomProject | null;
  onSaveToProjectSummary?: (savedEstimate: SavedProjectCostEstimate) => void;
}

const STORAGE_MULTI_ROOM_KEY = 'monoglass_multi_room_project_v1';

export const ProjectCostEstimator: React.FC<ProjectCostEstimatorProps> = ({
  onSendToQuote,
  onNavigateToMultiRoom,
  onNavigateToCalculator,
  initialMultiRoomProject,
  onSaveToProjectSummary,
}) => {
  const { isMetric, getEffectiveWatermark } = useSettings();

  // Load existing multi-room project from storage if not provided
  const [multiRoomProject, setMultiRoomProject] = useState<MultiRoomProject | null>(() => {
    if (initialMultiRoomProject) return initialMultiRoomProject;
    return loadActiveProjectSync(null as any);
  });

  // Mode: Use Multi-Room Project Breakdown vs Custom Quick Area
  const [calculationMode, setCalculationMode] = useState<'multi-room' | 'single-area'>(
    multiRoomProject && multiRoomProject.rooms && multiRoomProject.rooms.length > 0
      ? 'multi-room'
      : 'single-area'
  );

  // Active Cost Estimator Input state with dual-layer auto-persistence
  const [input, setInput] = useState<CostEstimatorInput>(() => {
    const base = { ...DEFAULT_COST_INPUT };
    if (multiRoomProject) {
      base.projectName = multiRoomProject.name || base.projectName;
      base.clientOrArchitect = multiRoomProject.clientOrArchitect || base.clientOrArchitect;
      base.location = multiRoomProject.location || base.location;
      base.unitSystem = multiRoomProject.unitSystem || (isMetric ? 'metric' : 'imperial');
    } else {
      base.unitSystem = isMetric ? 'metric' : 'imperial';
    }
    return loadActiveCostInputSync(base);
  });

  // Auto-save active cost estimator inputs to IndexedDB and LocalStorage
  useEffect(() => {
    saveActiveCostInput(input);
  }, [input]);

  // UI state
  const [activeTab, setActiveTab] = useState<'scope' | 'materials' | 'labor' | 'equipment' | 'markups'>('materials');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [saveEstimateName, setSaveEstimateName] = useState<string>('Standard Commercial Bid (Rev 1)');
  const [saveNotes, setSaveNotes] = useState<string>('');
  const [savedEstimates, setSavedEstimates] = useState<SavedProjectCostEstimate[]>(() => getSavedCostEstimates());
  const [showSavedList, setShowSavedList] = useState<boolean>(false);
  const [compareModalOpen, setCompareModalOpen] = useState<boolean>(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [saveSuccessBanner, setSaveSuccessBanner] = useState<string | null>(null);

  // Sensitivity Analysis Sliders
  const [sensitivityLaborDelta, setSensitivityLaborDelta] = useState<number>(0); // -20% to +20%
  const [sensitivityMaterialDelta, setSensitivityMaterialDelta] = useState<number>(0); // -20% to +20%

  // Sync unitSystem if changed globally
  useEffect(() => {
    setInput((prev) => ({
      ...prev,
      unitSystem: isMetric ? 'metric' : 'imperial',
    }));
  }, [isMetric]);

  // Handle sensitivity adjustments
  const effectiveInput: CostEstimatorInput = useMemo(() => {
    return {
      ...input,
      fiberBagCost: Number((input.fiberBagCost * (1 + sensitivityMaterialDelta / 100)).toFixed(2)),
      adhesivePailCost: Number((input.adhesivePailCost * (1 + sensitivityMaterialDelta / 100)).toFixed(2)),
      sonoglazePailCost: Number((input.sonoglazePailCost * (1 + sensitivityMaterialDelta / 100)).toFixed(2)),
      loadedLaborRatePerHour: Number((input.loadedLaborRatePerHour * (1 + sensitivityLaborDelta / 100)).toFixed(2)),
    };
  }, [input, sensitivityLaborDelta, sensitivityMaterialDelta]);

  // Compute Cost Estimation Result
  const result: CostEstimatorResult = useMemo(() => {
    const projectToPass = calculationMode === 'multi-room' ? multiRoomProject : null;
    return calculateCostEstimate(effectiveInput, projectToPass);
  }, [effectiveInput, calculationMode, multiRoomProject]);

  // Multi-room itemized distribution breakdown
  const roomsBreakdown = useMemo(() => {
    if (!multiRoomProject || !multiRoomProject.rooms || multiRoomProject.rooms.length === 0) {
      return [];
    }

    const activeRooms = multiRoomProject.rooms.filter((r) => r.enabled);
    const totalEffective = activeRooms.reduce((acc, r) => {
      const substrate = SUBSTRATE_PROFILES[r.substrateType] || SUBSTRATE_PROFILES['flat-concrete'];
      const area = input.unitSystem === 'metric' ? r.planArea * 10.7639 : r.planArea;
      return acc + area * substrate.multiplier;
    }, 0);

    return activeRooms.map((room) => {
      const substrate = SUBSTRATE_PROFILES[room.substrateType] || SUBSTRATE_PROFILES['flat-concrete'];
      const multiplier = substrate.multiplier;
      const roomPlanSqFt = input.unitSystem === 'metric' ? room.planArea * 10.7639 : room.planArea;
      const roomEffSqFt = roomPlanSqFt * multiplier;

      let thickInches = 4.0;
      let rVal = 16.0;
      if (room.targetMode === 'thermal') {
        rVal = room.targetRValue;
        thickInches = rVal / 4.0;
      } else {
        thickInches = room.targetThicknessInches;
        rVal = thickInches * 4.0;
      }

      const wastageFactor = 1 + (room.wastagePercent || 8) / 100;
      const roomBdFt = roomEffSqFt * thickInches * wastageFactor;
      const roomBags = Math.ceil(roomBdFt / 28);
      const roomAdhGal = roomBags * 0.55;
      const roomAdhPails = Math.ceil(roomAdhGal / 5);

      let roomSonoPails = 0;
      if (room.finishType === 'Sonoglaze Hard-Coat') {
        const sonoGal = Math.ceil((roomEffSqFt * wastageFactor) / 75);
        roomSonoPails = Math.ceil(sonoGal / 5);
      }

      // Allocate grand total proportionally
      const allocationFactor = totalEffective > 0 ? roomEffSqFt / totalEffective : 1 / activeRooms.length;
      const estimatedCost = Math.round(result.grandTotalCost * allocationFactor);
      const costPerSqFt = roomPlanSqFt > 0 ? Number((estimatedCost / (input.unitSystem === 'metric' ? room.planArea : roomPlanSqFt)).toFixed(2)) : 0;

      return {
        id: room.id,
        name: room.name,
        area: room.planArea,
        thickness: `${thickInches.toFixed(1)}"`,
        rValue: `R-${rVal.toFixed(1)}`,
        finish: room.finishType,
        bags: roomBags,
        adhesivePails: roomAdhPails,
        sonoglazePails: roomSonoPails,
        estimatedCost,
        costPerSqFt,
      };
    });
  }, [multiRoomProject, input.unitSystem, result.grandTotalCost]);

  // Handle Labor Region Change
  const handleSelectLaborRegion = (regionId: string) => {
    const preset = REGIONAL_LABOR_PRESETS.find((p) => p.id === regionId);
    if (!preset) return;
    setInput((prev) => ({
      ...prev,
      selectedRegionId: preset.id,
      loadedLaborRatePerHour: preset.loadedHourlyRate,
      crewSize: preset.defaultCrewSize,
    }));
  };

  // Save Cost Estimate Handler
  const handleSaveEstimate = () => {
    const newSaved: SavedProjectCostEstimate = {
      id: 'cost-est-' + Date.now(),
      name: saveEstimateName.trim() || `Estimate ${new Date().toLocaleDateString()}`,
      projectName: input.projectName,
      projectId: multiRoomProject?.id,
      timestamp: new Date().toISOString(),
      unitSystem: input.unitSystem,
      totalPlanArea: result.planAreaSqFt,
      totalEffectiveArea: result.effectiveAreaSqFt,
      thickness: `${input.targetThicknessInches.toFixed(1)}"`,
      rValue: `R-${input.targetRValue.toFixed(1)}`,
      finishType: input.finishType,
      substrateType: input.substrateType,
      totalBags: result.totalBags,
      totalAdhesivePails: result.totalAdhesivePails,
      totalSonoglazePails: result.totalSonoglazePails,
      laborRatePreset: REGIONAL_LABOR_PRESETS.find((r) => r.id === input.selectedRegionId)?.name || 'Custom',
      loadedHourlyRate: input.loadedLaborRatePerHour,
      crewSize: input.crewSize,
      fiberBagPrice: input.fiberBagCost,
      adhesivePailPrice: input.adhesivePailCost,
      sonoglazePailPrice: input.sonoglazePailCost,
      overheadProfitPercent: input.overheadProfitPercent,
      contingencyPercent: input.contingencyPercent,
      materialsTotal: result.materialsCost,
      laborTotal: result.laborCost,
      equipmentTotal: result.equipmentCost,
      directCostSubtotal: result.directCostSubtotal,
      grandTotal: result.grandTotalCost,
      costPerSqFt: result.costPerSqFt,
      costPerSqM: result.costPerSqM,
      costPerBoardFt: result.costPerBoardFt,
      lineItems: result.lineItems,
      roomsBreakdown: roomsBreakdown.length > 0 ? roomsBreakdown : undefined,
      notes: saveNotes,
    };

    const updated = saveCostEstimateToStorage(newSaved);
    setSavedEstimates(updated);

    // Also attach to active multi-room project in state/localStorage
    if (multiRoomProject) {
      const updatedProject: MultiRoomProject = {
        ...multiRoomProject,
        costEstimate: newSaved,
        lastUpdated: new Date().toISOString(),
      };
      try {
        localStorage.setItem(STORAGE_MULTI_ROOM_KEY, JSON.stringify(updatedProject));
        setMultiRoomProject(updatedProject);
      } catch (err) {
        console.warn('Failed to update multi-room project storage:', err);
      }
    }

    if (onSaveToProjectSummary) {
      onSaveToProjectSummary(newSaved);
    }

    setSaveModalOpen(false);
    setSaveSuccessBanner(`Cost estimate "${newSaved.name}" saved to your Project Summaries!`);
    setTimeout(() => setSaveSuccessBanner(null), 5000);
  };

  // Load a Saved Estimate
  const handleLoadEstimate = (est: SavedProjectCostEstimate) => {
    setInput((prev) => ({
      ...prev,
      projectName: est.projectName || prev.projectName,
      unitSystem: est.unitSystem || prev.unitSystem,
      planArea: est.totalPlanArea || prev.planArea,
      fiberBagCost: est.fiberBagPrice || prev.fiberBagCost,
      adhesivePailCost: est.adhesivePailPrice || prev.adhesivePailCost,
      sonoglazePailCost: est.sonoglazePailPrice || prev.sonoglazePailCost,
      loadedLaborRatePerHour: est.loadedHourlyRate || prev.loadedLaborRatePerHour,
      crewSize: est.crewSize || prev.crewSize,
      overheadProfitPercent: est.overheadProfitPercent ?? prev.overheadProfitPercent,
      contingencyPercent: est.contingencyPercent ?? prev.contingencyPercent,
    }));
    setShowSavedList(false);
    setSaveSuccessBanner(`Loaded cost estimate: "${est.name}"`);
    setTimeout(() => setSaveSuccessBanner(null), 4000);
  };

  // Delete a Saved Estimate
  const handleDeleteEstimate = (id: string) => {
    if (window.confirm('Delete this saved estimate from storage?')) {
      const updated = deleteSavedCostEstimate(id);
      setSavedEstimates(updated);
      setSelectedForCompare((prev) => prev.filter((i) => i !== id));
    }
  };

  // PDF Export
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const watermark = getEffectiveWatermark('estimate') as any;
      await exportCostEstimatorPdf(effectiveInput, result, {
        watermark,
        estimateName: saveEstimateName,
        roomsBreakdown: calculationMode === 'multi-room' ? roomsBreakdown : undefined,
      });
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Send to Quote Modal
  const handleSendToQuote = () => {
    if (onSendToQuote) {
      onSendToQuote({
        projectName: `${input.projectName} (Turnkey Budget: $${result.grandTotalCost.toLocaleString()})`,
        squareFootage: result.planAreaSqFt,
        substrate: input.substrateType,
        thickness: input.targetThicknessInches,
        rValue: input.targetRValue,
        nrc: input.targetThicknessInches >= 3.0 ? 1.0 : 0.95,
        bags: result.totalBags,
        adhesiveGallons: result.totalAdhesivePails * 5,
        siteConditions: `Labor preset: ${REGIONAL_LABOR_PRESETS.find((r) => r.id === input.selectedRegionId)?.name || 'Custom'}. Estimated machine time: ${result.estimatedSprayHours} hrs.`,
        notes: `Turnkey budget estimate: $${result.grandTotalCost.toLocaleString()} (${input.unitSystem === 'metric' ? `$${result.costPerSqM}/m²` : `$${result.costPerSqFt}/sq ft`}). Material cost: $${result.materialsCost.toLocaleString()}, Labor: $${result.laborCost.toLocaleString()}.`,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* SUCCESS NOTIFICATION BANNER */}
      {saveSuccessBanner && (
        <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{saveSuccessBanner}</span>
          </div>
          <button
            onClick={() => setSaveSuccessBanner(null)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TOP HEADER & CONTROL BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 uppercase">
                <DollarSign className="w-3.5 h-3.5" /> Project Cost Estimator & Budget Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                CSI 07 21 29 & 09 81 00
              </span>
              {calculationMode === 'multi-room' && multiRoomProject && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Synced with {multiRoomProject.rooms.filter((r) => r.enabled).length} Multi-Room Zones
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Turnkey Project Budget & Labor Calculator
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Calculate accurate commercial installation budgets by pairing verified material consumption rates (fiber bags, adhesive pails, and Sonoglaze) with regional loaded labor rates, spray rig production schedules, equipment rentals, and contractor markups.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <StorageStatusIndicator />

            <button
              onClick={() => setShowSavedList(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span>Saved Summaries ({savedEstimates.length})</span>
            </button>

            <button
              onClick={() => setSaveModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save to Project Summary</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExportingPdf ? 'Generating PDF...' : 'Download PDF Takeoff'}</span>
            </button>

            <button
              onClick={handleSendToQuote}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-sky-500/25 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Request Contractor Bids</span>
            </button>
          </div>
        </div>

        {/* Project Context Metadata Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-slate-800/80">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Project Title / Scope
            </label>
            <input
              type="text"
              value={input.projectName}
              onChange={(e) => setInput({ ...input, projectName: e.target.value })}
              placeholder="e.g. Center City Tower Parkade"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Location / Market
            </label>
            <input
              type="text"
              value={input.location || ''}
              onChange={(e) => setInput({ ...input, location: e.target.value })}
              placeholder="City, State / Province"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Regional Labor Market Preset
            </label>
            <select
              value={input.selectedRegionId}
              onChange={(e) => handleSelectLaborRegion(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
            >
              {REGIONAL_LABOR_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} (${preset.loadedHourlyRate}/hr)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Calculation Mode & Source
            </label>
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setCalculationMode('multi-room')}
                disabled={!multiRoomProject || !multiRoomProject.rooms || multiRoomProject.rooms.length === 0}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                  calculationMode === 'multi-room'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200 disabled:opacity-40'
                }`}
              >
                <Layers className="w-3 h-3" /> Multi-Room
              </button>
              <button
                type="button"
                onClick={() => setCalculationMode('single-area')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                  calculationMode === 'single-area'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3 h-3" /> Custom Area
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EXECUTIVE FINANCIAL KPI DASHBOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Main Turnkey Budget Card */}
        <div className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-5 shadow-xl space-y-2 bg-gradient-to-br from-slate-900 to-amber-950/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" /> Total Installed Budget
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Turnkey Bid
            </span>
          </div>

          <div className="text-3xl font-black text-white font-mono tracking-tight">
            ${result.grandTotalCost.toLocaleString()}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-slate-800">
            <span className="font-semibold text-amber-300">
              {input.unitSystem === 'metric' ? `$${result.costPerSqM} / m²` : `$${result.costPerSqFt} / sq ft`}
            </span>
            <span className="text-slate-400">
              ${result.costPerBoardFt} / bd ft
            </span>
          </div>
        </div>

        {/* Materials Subtotal Card */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Package className="w-4 h-4" /> Materials Subtotal
            </span>
            <span className="text-[10px] font-bold text-emerald-400 font-mono">
              {Number(((result.materialsCost / result.grandTotalCost) * 100).toFixed(0))}%
            </span>
          </div>

          <div className="text-2xl font-black text-white font-mono">
            ${result.materialsCost.toLocaleString()}
          </div>

          <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>{result.totalBags.toLocaleString()} Fiber Bags</span>
            <span>{result.totalAdhesivePails} Pails Adh</span>
          </div>
        </div>

        {/* Labor & Crew Subtotal Card */}
        <div className="bg-slate-900 border border-sky-500/30 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Applicator Labor
            </span>
            <span className="text-[10px] font-bold text-sky-400 font-mono">
              {Number(((result.laborCost / result.grandTotalCost) * 100).toFixed(0))}%
            </span>
          </div>

          <div className="text-2xl font-black text-white font-mono">
            ${result.laborCost.toLocaleString()}
          </div>

          <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>{result.totalCrewManHours} Crew Man-Hrs</span>
            <span>~{result.estimatedRigDays} Rig Days</span>
          </div>
        </div>

        {/* Equipment, Markups & Taxes Card */}
        <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Wrench className="w-4 h-4" /> Equipment & O&P
            </span>
            <span className="text-[10px] font-bold text-purple-400 font-mono">
              {Number((((result.equipmentCost + result.overheadProfitCost + result.contingencyCost + result.logisticsCost + result.salesTaxCost) / result.grandTotalCost) * 100).toFixed(0))}%
            </span>
          </div>

          <div className="text-2xl font-black text-white font-mono">
            ${(
              result.equipmentCost +
              result.overheadProfitCost +
              result.contingencyCost +
              result.logisticsCost +
              result.salesTaxCost
            ).toLocaleString()}
          </div>

          <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>O&P: {input.overheadProfitPercent}%</span>
            <span>Contingency: {input.contingencyPercent}%</span>
          </div>
        </div>
      </div>

      {/* COST COMPOSITION VISUAL SEGMENTED BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Budget Cost Composition Breakdown
          </h3>
          <span className="text-xs text-slate-400">
            Direct Cost Subtotal: <strong className="text-white font-mono">${result.directCostSubtotal.toLocaleString()}</strong> + Markups & Tax: <strong className="text-white font-mono">${(result.grandTotalCost - result.directCostSubtotal).toLocaleString()}</strong>
          </span>
        </div>

        {/* Visual Multi-Segment Bar */}
        <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex shadow-inner border border-slate-800">
          <div
            style={{ width: `${(result.materialsCost / result.grandTotalCost) * 100}%` }}
            title={`Materials: $${result.materialsCost.toLocaleString()} (${((result.materialsCost / result.grandTotalCost) * 100).toFixed(1)}%)`}
            className="bg-emerald-500 hover:bg-emerald-400 transition-all cursor-pointer"
          />
          <div
            style={{ width: `${(result.laborCost / result.grandTotalCost) * 100}%` }}
            title={`Labor: $${result.laborCost.toLocaleString()} (${((result.laborCost / result.grandTotalCost) * 100).toFixed(1)}%)`}
            className="bg-sky-500 hover:bg-sky-400 transition-all cursor-pointer"
          />
          <div
            style={{ width: `${(result.equipmentCost / result.grandTotalCost) * 100}%` }}
            title={`Equipment: $${result.equipmentCost.toLocaleString()} (${((result.equipmentCost / result.grandTotalCost) * 100).toFixed(1)}%)`}
            className="bg-purple-500 hover:bg-purple-400 transition-all cursor-pointer"
          />
          <div
            style={{ width: `${(result.maskingPrepCost / result.grandTotalCost) * 100}%` }}
            title={`Prep & Masking: $${result.maskingPrepCost.toLocaleString()} (${((result.maskingPrepCost / result.grandTotalCost) * 100).toFixed(1)}%)`}
            className="bg-indigo-500 hover:bg-indigo-400 transition-all cursor-pointer"
          />
          <div
            style={{ width: `${(result.logisticsCost / result.grandTotalCost) * 100}%` }}
            title={`Logistics & Mob: $${result.logisticsCost.toLocaleString()} (${((result.logisticsCost / result.grandTotalCost) * 100).toFixed(1)}%)`}
            className="bg-teal-500 hover:bg-teal-400 transition-all cursor-pointer"
          />
          <div
            style={{ width: `${(result.overheadProfitCost / result.grandTotalCost) * 100}%` }}
            title={`Overhead & Profit: $${result.overheadProfitCost.toLocaleString()} (${((result.overheadProfitCost / result.grandTotalCost) * 100).toFixed(1)}%)`}
            className="bg-amber-500 hover:bg-amber-400 transition-all cursor-pointer"
          />
          <div
            style={{ width: `${((result.contingencyCost + result.salesTaxCost) / result.grandTotalCost) * 100}%` }}
            title={`Contingency & Tax: $${(result.contingencyCost + result.salesTaxCost).toLocaleString()} (${(((result.contingencyCost + result.salesTaxCost) / result.grandTotalCost) * 100).toFixed(1)}%)`}
            className="bg-rose-500 hover:bg-rose-400 transition-all cursor-pointer"
          />
        </div>

        {/* Legend Chips */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Materials (${result.materialsCost.toLocaleString()})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Labor (${result.laborCost.toLocaleString()})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Equipment (${result.equipmentCost.toLocaleString()})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Masking (${result.maskingPrepCost.toLocaleString()})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Logistics (${result.logisticsCost.toLocaleString()})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> O&P (${result.overheadProfitCost.toLocaleString()})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Contingency & Tax (${(result.contingencyCost + result.salesTaxCost).toLocaleString()})
          </span>
        </div>
      </div>

      {/* PARAMETER CONFIGURATION TABS & EDITORS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-7 shadow-2xl space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'materials'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" /> 1. Material Unit Costs (Bags & Pails)
          </button>

          <button
            onClick={() => setActiveTab('labor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'labor'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> 2. Local Labor Rates & Crew Speed
          </button>

          <button
            onClick={() => setActiveTab('scope')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'scope'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> 3. Project Area & Substrates
          </button>

          <button
            onClick={() => setActiveTab('equipment')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'equipment'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" /> 4. Equipment & Logistics
          </button>

          <button
            onClick={() => setActiveTab('markups')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'markups'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Percent className="w-3.5 h-3.5" /> 5. Overhead, Profit & Taxes
          </button>
        </div>

        {/* TAB 1: MATERIAL UNIT PRICING */}
        {activeTab === 'materials' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-400" />
                  Material Unit Pricing & Packaging Rates
                </h3>
                <p className="text-xs text-slate-400">
                  Input wholesale contractor pricing per 30 lb fiber bag, 5-gallon adhesive pail, and specialty topcoats.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setInput((prev) => ({
                    ...prev,
                    fiberBagCost: 42.5,
                    adhesivePailCost: 145.0,
                    sonoglazePailCost: 210.0,
                    primerPailCost: 185.0,
                    maskingPolyCostPerSqFt: 0.15,
                  }))
                }
                className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset to Manufacturer Benchmarks
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Monoglass Fiber Bag Price */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Monoglass® Fiber Bag Cost</label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    30 lb Bag
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="20"
                    max="100"
                    step="0.5"
                    value={input.fiberBagCost}
                    onChange={(e) => setInput({ ...input, fiberBagCost: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-400">/ bag</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">Fiber Color:</span>
                  <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setInput({ ...input, fiberColor: 'white' })}
                      className={`px-2.5 py-0.5 rounded font-bold ${
                        input.fiberColor === 'white' ? 'bg-slate-700 text-white' : 'text-slate-400'
                      }`}
                    >
                      White
                    </button>
                    <button
                      type="button"
                      onClick={() => setInput({ ...input, fiberColor: 'black' })}
                      className={`px-2.5 py-0.5 rounded font-bold ${
                        input.fiberColor === 'black' ? 'bg-slate-950 text-amber-300 border border-amber-500/40' : 'text-slate-400'
                      }`}
                    >
                      Black (+22%)
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-tight">
                  Yield: ~28 board feet per bag. Applied dry density ~3.2 lbs/cu ft.
                </p>
              </div>

              {/* Monoglass Adhesive Concentrate */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Adhesive Concentrate Cost</label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                    5-Gal Pail
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="50"
                    max="300"
                    step="1"
                    value={input.adhesivePailCost}
                    onChange={(e) => setInput({ ...input, adhesivePailCost: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-400">/ pail</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Usage: 0.55 gal concentrate per bag, diluted 1:1 with clean water at the spray nozzle manifold.
                </p>
              </div>

              {/* Sonoglaze Protective Hard-Coat */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Sonoglaze® Hard-Coat Pail</label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    5-Gal Pail
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="80"
                    max="400"
                    step="1"
                    value={input.sonoglazePailCost}
                    onChange={(e) => setInput({ ...input, sonoglazePailCost: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-400">/ pail</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  High-abuse protective polymer topcoat for natatoriums, ice arenas, or transit stations (coverage ~75 sq ft/gal).
                </p>
              </div>
            </div>

            {/* Secondary Materials: Primer & Masking Poly */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Substrate Bonding Primer</span>
                  <span className="text-slate-400 font-mono text-[11px]">${input.primerPailCost} / 5-gal pail</span>
                </label>
                <input
                  type="range"
                  min="100"
                  max="300"
                  step="5"
                  value={input.primerPailCost}
                  onChange={(e) => setInput({ ...input, primerPailCost: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500"
                />
                <div className="text-[10px] text-slate-400">
                  Applied at ~250 sq ft / gallon on difficult or painted substrates.
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Poly Masking & Overspray Protection Supplies</span>
                  <span className="text-slate-400 font-mono text-[11px]">${input.maskingPolyCostPerSqFt.toFixed(2)} / sq ft</span>
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.40"
                  step="0.01"
                  value={input.maskingPolyCostPerSqFt}
                  onChange={(e) => setInput({ ...input, maskingPolyCostPerSqFt: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500"
                />
                <div className="text-[10px] text-slate-400">
                  Includes floor poly, conduit/duct taping, plastic walls, and temporary zip-door air seals.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LOCAL LABOR RATES & PRODUCTIVITY */}
        {activeTab === 'labor' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  Applicator Labor Rates & Crew Speed
                </h3>
                <p className="text-xs text-slate-400">
                  Select regional loaded labor rates (base wage + payroll burden + union benefits + liability insurance).
                </p>
              </div>
            </div>

            {/* Regional Selector Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {REGIONAL_LABOR_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleSelectLaborRegion(preset.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    input.selectedRegionId === preset.id
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-amber-400">{preset.region}</span>
                    {input.selectedRegionId === preset.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <div className="text-lg font-black font-mono text-white">
                    ${preset.loadedHourlyRate} <span className="text-xs font-sans text-slate-400">/ hr</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-1">
                    {preset.unionStatus}
                  </div>
                </div>
              ))}
            </div>

            {/* Labor Control Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-white block">
                  Loaded Labor Rate ($ / Man-Hour)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="40"
                    max="200"
                    step="1"
                    value={input.loadedLaborRatePerHour}
                    onChange={(e) => setInput({ ...input, loadedLaborRatePerHour: parseFloat(e.target.value) || 0, selectedRegionId: 'custom' })}
                    className="w-full pl-8 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3.5 top-2 text-xs text-slate-400">/ hr</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Fully burdened rate including worker's comp, insurance, taxes, and FICA.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-white block">
                  Spray Rig Crew Size
                </label>
                <select
                  value={input.crewSize}
                  onChange={(e) => setInput({ ...input, crewSize: parseInt(e.target.value) || 3 })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value={2}>2-Man Crew (1 Nozzleman, 1 Feeder/Helper)</option>
                  <option value={3}>3-Man Crew (1 Nozzleman, 1 Feeder, 1 Helper/Masker)</option>
                  <option value={4}>4-Man Crew (1 Nozzleman, 1 Feeder, 2 Helpers/Scaffold)</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  Standard industry baseline is a 3-person certified applicator crew.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-white block">
                  Spray Speed (Bd Ft / Machine Hr)
                </label>
                <input
                  type="number"
                  min="400"
                  max="2000"
                  step="50"
                  value={input.productionRateBdFtPerHour}
                  onChange={(e) => setInput({ ...input, productionRateBdFtPerHour: parseInt(e.target.value) || 1000 })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-400">
                  Standard pneumatic rig throughput: 800 - 1,200 board feet per machine hour.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROJECT AREA & SUBSTRATES */}
        {activeTab === 'scope' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  Project Dimensions, Substrates & Thickness
                </h3>
                <p className="text-xs text-slate-400">
                  {calculationMode === 'multi-room'
                    ? 'Aggregated from your active Multi-Room Project schedule.'
                    : 'Customize single area square footage, substrate profile multiplier, and target R-value.'}
                </p>
              </div>

              {calculationMode === 'multi-room' && onNavigateToMultiRoom && (
                <button
                  type="button"
                  onClick={onNavigateToMultiRoom}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center gap-1"
                >
                  <Layers className="w-3.5 h-3.5" /> Edit Multi-Room Spaces in Estimator
                </button>
              )}
            </div>

            {calculationMode === 'single-area' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-white block">
                    Plan Surface Area ({input.unitSystem === 'metric' ? 'm²' : 'sq ft'})
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="1000000"
                    step="100"
                    value={input.planArea}
                    onChange={(e) => setInput({ ...input, planArea: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-white block">
                    Substrate Geometry Profile
                  </label>
                  <select
                    value={input.substrateType}
                    onChange={(e) => setInput({ ...input, substrateType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                  >
                    {Object.entries(SUBSTRATE_PROFILES).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.name} ({item.multiplier}x area)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-white block">
                    Target Thickness & Thermal R-Value
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1.0"
                      max="8.0"
                      step="0.5"
                      value={input.targetThicknessInches}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 1.0;
                        setInput({
                          ...input,
                          targetThicknessInches: val,
                          targetRValue: val * 4.0,
                        });
                      }}
                      className="w-1/2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-xs font-bold text-sky-400">
                      R-{(input.targetThicknessInches * 4.0).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-bold text-white">Active Multi-Room Takeoff Schedule</span>
                  <span className="text-sky-400 font-mono font-bold">
                    {roomsBreakdown.length} Zones • {result.planAreaSqFt.toLocaleString()} sq ft total
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-800">
                        <th className="py-2">Zone Name</th>
                        <th className="py-2">Plan Area</th>
                        <th className="py-2">Thickness</th>
                        <th className="py-2">R-Value</th>
                        <th className="py-2">Finish</th>
                        <th className="py-2 text-right">Fiber Bags</th>
                        <th className="py-2 text-right">Direct Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {roomsBreakdown.map((r) => (
                        <tr key={r.id} className="text-slate-200">
                          <td className="py-2 font-semibold text-white">{r.name}</td>
                          <td className="py-2 font-mono">
                            {input.unitSystem === 'metric' ? `${r.area} m²` : `${r.area.toLocaleString()} sq ft`}
                          </td>
                          <td className="py-2 font-mono">{r.thickness}</td>
                          <td className="py-2 font-mono text-sky-300">{r.rValue}</td>
                          <td className="py-2">{r.finish}</td>
                          <td className="py-2 text-right font-mono text-emerald-400 font-bold">{r.bags}</td>
                          <td className="py-2 text-right font-mono text-amber-300 font-bold">
                            ${r.estimatedCost.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EQUIPMENT & LOGISTICS */}
        {activeTab === 'equipment' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-purple-400" />
                  Spray Machinery, Lift Rentals & Site Logistics
                </h3>
                <p className="text-xs text-slate-400">
                  Equipment rental rates and mobilization allowances needed to complete the spray operation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-white block">
                  Spray Rig & Compressor Daily Rate
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="100"
                    max="1000"
                    step="25"
                    value={input.sprayRigDailyRate}
                    onChange={(e) => setInput({ ...input, sprayRigDailyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">/ day</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Total for ~{result.estimatedRigDays} rig days: ${(result.estimatedRigDays * input.sprayRigDailyRate).toLocaleString()}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-white block">
                  Scissor / Boom Lift Daily Rate
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="50"
                    max="800"
                    step="25"
                    value={input.liftDailyRate}
                    onChange={(e) => setInput({ ...input, liftDailyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">/ day</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Total for ~{result.estimatedRigDays} days: ${(result.estimatedRigDays * input.liftDailyRate).toLocaleString()}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-white block">
                  Material Freight & Shipping
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    step="50"
                    value={input.freightAndDeliveryCost}
                    onChange={(e) => setInput({ ...input, freightAndDeliveryCost: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="text-[10px] text-slate-400">
                  Dedicated truckload / LTL transport from manufacturing plant.
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-white block">
                  Applicator Mobilization Allowance
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    step="50"
                    value={input.mobilizationFee}
                    onChange={(e) => setInput({ ...input, mobilizationFee: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="text-[10px] text-slate-400">
                  Pre-construction staging, test spray passes, and safety briefing.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: MARKUPS, OVERHEAD & TAXES */}
        {activeTab === 'markups' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-400" />
                  Contractor Overhead, Profit Margin & Local Taxes
                </h3>
                <p className="text-xs text-slate-400">
                  Apply markup percentages for general contractor overhead & profit, contingency risk reserves, and material sales tax.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Overhead & Profit Slider */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Overhead & Profit (O&P)</span>
                  <span className="text-sm font-bold font-mono text-amber-400">
                    {input.overheadProfitPercent}% (${result.overheadProfitCost.toLocaleString()})
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  step="1"
                  value={input.overheadProfitPercent}
                  onChange={(e) => setInput({ ...input, overheadProfitPercent: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0% (Cost)</span>
                  <span>15% (Typical)</span>
                  <span>30% (High Complexity)</span>
                </div>
              </div>

              {/* Contingency Slider */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Contingency Risk Reserve</span>
                  <span className="text-sm font-bold font-mono text-rose-400">
                    {input.contingencyPercent}% (${result.contingencyCost.toLocaleString()})
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={input.contingencyPercent}
                  onChange={(e) => setInput({ ...input, contingencyPercent: parseFloat(e.target.value) })}
                  className="w-full accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0% (Tight)</span>
                  <span>5% (Standard)</span>
                  <span>15% (High Risk / Retrofit)</span>
                </div>
              </div>

              {/* Material Sales Tax Slider */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Material Sales Tax</span>
                  <span className="text-sm font-bold font-mono text-sky-400">
                    {input.salesTaxPercent}% (${result.salesTaxCost.toLocaleString()})
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.25"
                  value={input.salesTaxPercent}
                  onChange={(e) => setInput({ ...input, salesTaxPercent: parseFloat(e.target.value) })}
                  className="w-full accent-sky-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0% (Tax-Exempt)</span>
                  <span>7.5% (US Avg)</span>
                  <span>15% (Harmonized)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SENSITIVITY & VALUE ENGINEERING SANDBOX */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Interactive Value Engineering & Sensitivity Sandbox
            </h3>
          </div>
          {(sensitivityLaborDelta !== 0 || sensitivityMaterialDelta !== 0) && (
            <button
              onClick={() => {
                setSensitivityLaborDelta(0);
                setSensitivityMaterialDelta(0);
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              Reset Sensitivity Sliders
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Material Cost Sensitivity:</span>
              <span className={`font-mono font-bold ${sensitivityMaterialDelta > 0 ? 'text-rose-400' : sensitivityMaterialDelta < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                {sensitivityMaterialDelta > 0 ? `+${sensitivityMaterialDelta}%` : `${sensitivityMaterialDelta}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="5"
              value={sensitivityMaterialDelta}
              onChange={(e) => setSensitivityMaterialDelta(parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Labor Rate Sensitivity:</span>
              <span className={`font-mono font-bold ${sensitivityLaborDelta > 0 ? 'text-rose-400' : sensitivityLaborDelta < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                {sensitivityLaborDelta > 0 ? `+${sensitivityLaborDelta}%` : `${sensitivityLaborDelta}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="5"
              value={sensitivityLaborDelta}
              onChange={(e) => setSensitivityLaborDelta(parseInt(e.target.value))}
              className="w-full accent-sky-500"
            />
          </div>
        </div>
      </div>

      {/* ITEMIZED LINE-ITEM BID SCHEDULE TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Itemized Bid Schedule & Detailed Takeoff
            </h3>
            <p className="text-xs text-slate-400">
              Complete line-item breakdown with quantities, unit prices, and subtotal percentages.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Item Description</th>
                <th className="py-3 px-3 text-center">Quantity & Unit</th>
                <th className="py-3 px-3 text-right">Unit Price</th>
                <th className="py-3 px-3 text-right">Total Cost</th>
                <th className="py-3 px-3 text-right">% Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-sans">
              {result.lineItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.category === 'Materials'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : item.category === 'Labor'
                        ? 'bg-sky-500/20 text-sky-300'
                        : item.category === 'Equipment'
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-[10px] text-slate-400">{item.description}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                    {item.quantity.toLocaleString()} {item.unit}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                    ${item.unitRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                    ${item.totalCost.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                    {item.percentOfSubtotal}%
                  </td>
                </tr>
              ))}

              {/* Markups & Taxes Rows */}
              <tr className="bg-slate-950/60">
                <td className="py-2.5 px-3 font-bold text-amber-400">Markups</td>
                <td className="py-2.5 px-3 font-semibold text-slate-300">
                  Contingency Risk Allowance ({input.contingencyPercent}%)
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-slate-400">1 Lump Sum</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-400">—</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-300">
                  ${result.contingencyCost.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                  {((result.contingencyCost / result.grandTotalCost) * 100).toFixed(1)}%
                </td>
              </tr>

              <tr className="bg-slate-950/60">
                <td className="py-2.5 px-3 font-bold text-amber-400">Markups</td>
                <td className="py-2.5 px-3 font-semibold text-slate-300">
                  Contractor Overhead & Profit ({input.overheadProfitPercent}%)
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-slate-400">1 Lump Sum</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-400">—</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300">
                  ${result.overheadProfitCost.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                  {((result.overheadProfitCost / result.grandTotalCost) * 100).toFixed(1)}%
                </td>
              </tr>

              <tr className="bg-slate-950/60">
                <td className="py-2.5 px-3 font-bold text-amber-400">Taxes</td>
                <td className="py-2.5 px-3 font-semibold text-slate-300">
                  Materials Sales Tax ({input.salesTaxPercent}%)
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-slate-400">1 Lump Sum</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-400">—</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-sky-300">
                  ${result.salesTaxCost.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                  {((result.salesTaxCost / result.grandTotalCost) * 100).toFixed(1)}%
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-slate-950 font-bold text-white border-t-2 border-slate-700 text-sm">
                <td className="py-3 px-3 uppercase tracking-wider text-amber-400" colSpan={2}>
                  Grand Total Project Budget (Turnkey)
                </td>
                <td className="py-3 px-3 text-center font-mono text-xs text-slate-400">
                  {result.totalBags.toLocaleString()} Bags
                </td>
                <td className="py-3 px-3 text-right font-mono text-xs text-amber-300">
                  {input.unitSystem === 'metric' ? `$${result.costPerSqM}/m²` : `$${result.costPerSqFt}/sq ft`}
                </td>
                <td className="py-3 px-3 text-right font-mono text-amber-400 text-base">
                  ${result.grandTotalCost.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-400 text-xs">
                  100.0%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SAVE TO PROJECT SUMMARY MODAL */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Save className="w-5 h-5 text-amber-400" />
                Save Estimate to Project Summary
              </div>
              <button
                onClick={() => setSaveModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Budget Version Title
                </label>
                <input
                  type="text"
                  value={saveEstimateName}
                  onChange={(e) => setSaveEstimateName(e.target.value)}
                  placeholder="e.g. Standard Commercial Bid (Rev 1)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Budget Notes & Assumptions
                </label>
                <textarea
                  value={saveNotes}
                  onChange={(e) => setSaveNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Prevailing wage rates applied for public agency bidding; includes 15% O&P."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Summary snapshot */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Project Scope:</span>
                  <span className="font-semibold text-white">{input.projectName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Surface:</span>
                  <span className="font-semibold text-white">
                    {result.planAreaSqFt.toLocaleString()} sq ft ({result.totalBags} bags)
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Loaded Labor Rate:</span>
                  <span className="font-semibold text-white">${input.loadedLaborRatePerHour}/hr</span>
                </div>
                <div className="flex justify-between text-amber-300 font-bold pt-1 border-t border-slate-800">
                  <span>Grand Total Budget:</span>
                  <span className="font-mono text-sm">${result.grandTotalCost.toLocaleString()} (${input.unitSystem === 'metric' ? `$${result.costPerSqM}/m²` : `$${result.costPerSqFt}/sq ft`})</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEstimate}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20"
              >
                Confirm & Save Budget
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVED PROJECT SUMMARIES DRAWER / MODAL */}
      {showSavedList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <FolderOpen className="w-5 h-5 text-amber-400" />
                Saved Project Cost Estimates & Summaries ({savedEstimates.length})
              </div>
              <button
                onClick={() => setShowSavedList(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {savedEstimates.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <FolderOpen className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400">
                  No saved cost estimates found yet. Click "Save to Project Summary" above to save custom budget versions.
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                {savedEstimates.map((est) => (
                  <div
                    key={est.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{est.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {new Date(est.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Project: <strong className="text-slate-200">{est.projectName}</strong> • Area:{' '}
                        {est.totalPlanArea.toLocaleString()} sq ft ({est.totalBags} bags) • Labor: ${est.loadedHourlyRate}/hr
                      </div>
                      {est.notes && <div className="text-xs text-slate-500 italic">"{est.notes}"</div>}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-base font-black font-mono text-amber-400">
                          ${est.grandTotal.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ${est.costPerSqFt}/sq ft
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleLoadEstimate(est)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteEstimate(est.id)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSavedList(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
