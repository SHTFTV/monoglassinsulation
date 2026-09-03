import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Users,
  HardHat,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  ArrowRight,
  Sparkles,
  Layers,
  Building2,
  Zap,
  ShieldAlert,
  Sliders,
  ChevronRight,
  Info,
  CalendarCheck,
  PackageCheck,
  Send,
  Calculator as CalcIcon,
  RotateCcw,
} from 'lucide-react';
import {
  ScheduleInput,
  SchedulePreset,
  ScheduleSubstrateType,
  ScheduleAccessType,
  ScheduleMepDensity,
  ScheduleMaskingLevel,
  ScheduleShiftType,
  ScheduleAmbientClimate,
} from '../types';
import { SCHEDULE_PRESETS, calculateProjectSchedule } from '../utils/scheduleUtils';
import { exportSchedulePdf } from '../utils/pdfExport';
import { useSettings } from '../context/SettingsContext';
import { ProjectTimelineCalendar } from './ProjectTimelineCalendar';

interface ProjectScheduleEstimatorProps {
  onSendProjectToQuote?: (estimateDetails: any) => void;
  onNavigateToCalculator?: (data: {
    areaInput: number;
    substrateType: string;
    targetThicknessInches: number;
    targetRValue: number;
    unitSystem: 'imperial' | 'metric';
  }) => void;
  onNavigateToEstimator?: (data: {
    areaInput: number;
    substrateType: string;
    targetThicknessInches: number;
    targetRValue: number;
    unitSystem: 'imperial' | 'metric';
  }) => void;
}

export const ProjectScheduleEstimator: React.FC<ProjectScheduleEstimatorProps> = ({
  onSendProjectToQuote,
  onNavigateToCalculator,
  onNavigateToEstimator,
}) => {
  const { unitSystem: globalUnitSystem, setUnitSystem, getEffectiveWatermark } = useSettings();

  // Initial Schedule Form State with localStorage persistence
  const defaultPreset = SCHEDULE_PRESETS[0];

  const [input, setInput] = useState<ScheduleInput>(() => {
    const defaultVal: ScheduleInput = {
      projectName: defaultPreset.defaults.projectName || 'Metro Plaza Soffit Installation',
      targetArea: defaultPreset.defaults.targetArea || 35000,
      unitSystem: globalUnitSystem || 'imperial',
      targetThicknessInches: defaultPreset.defaults.targetThicknessInches || 3.5,
      substrateType: defaultPreset.defaults.substrateType || 'flat-concrete',
      ceilingHeightFt: defaultPreset.defaults.ceilingHeightFt || 12,
      accessEquipment: defaultPreset.defaults.accessEquipment || 'ground-scaffold',
      mepDensity: defaultPreset.defaults.mepDensity || 'moderate',
      maskingLevel: defaultPreset.defaults.maskingLevel || 'standard',
      primerRequired: defaultPreset.defaults.primerRequired || false,
      finishType: defaultPreset.defaults.finishType || 'Natural White',
      ambientCondition: defaultPreset.defaults.ambientCondition || 'cold-unheated',
      crewCount: defaultPreset.defaults.crewCount || 1,
      shiftType: defaultPreset.defaults.shiftType || 'standard-8h',
      workDaysPerWeek: defaultPreset.defaults.workDaysPerWeek || 5,
      startDate: new Date().toISOString().split('T')[0],
    };

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem('monoglass_schedule_input_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...defaultVal, ...parsed };
        }
      } catch {
        // fallback
      }
    }
    return defaultVal;
  });

  // Auto-save schedule inputs to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('monoglass_schedule_input_v1', JSON.stringify(input));
      } catch (e) {
        console.warn('Failed to save schedule inputs to localStorage:', e);
      }
    }
  }, [input]);

  const [selectedPresetId, setSelectedPresetId] = useState<string>(defaultPreset.id);
  const [activeTabSection, setActiveTabSection] = useState<'calendar' | 'timeline' | 'logistics' | 'coordination'>('calendar');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Sync unitSystem changes with global settings
  const handleUnitSystemToggle = (newSys: 'imperial' | 'metric') => {
    setUnitSystem(newSys);
    setInput((prev) => ({
      ...prev,
      unitSystem: newSys,
      targetArea:
        newSys === 'metric'
          ? Math.round(prev.targetArea * 0.092903)
          : Math.round(prev.targetArea * 10.7639),
      targetThicknessInches:
        newSys === 'metric'
          ? Math.round(prev.targetThicknessInches * 25.4)
          : Number((prev.targetThicknessInches / 25.4).toFixed(1)),
    }));
  };

  // Load Preset
  const handleLoadPreset = (preset: SchedulePreset) => {
    setSelectedPresetId(preset.id);
    const isMetric = input.unitSystem === 'metric';
    const area = preset.defaults.targetArea || 25000;
    const thick = preset.defaults.targetThicknessInches || 3.0;

    setInput((prev) => ({
      ...prev,
      projectName: preset.defaults.projectName || prev.projectName,
      targetArea: isMetric ? Math.round(area * 0.092903) : area,
      targetThicknessInches: isMetric ? Math.round(thick * 25.4) : thick,
      substrateType: (preset.defaults.substrateType as ScheduleSubstrateType) || 'flat-concrete',
      ceilingHeightFt: preset.defaults.ceilingHeightFt || 14,
      accessEquipment: (preset.defaults.accessEquipment as ScheduleAccessType) || 'ground-scaffold',
      mepDensity: (preset.defaults.mepDensity as ScheduleMepDensity) || 'moderate',
      maskingLevel: (preset.defaults.maskingLevel as ScheduleMaskingLevel) || 'standard',
      primerRequired: preset.defaults.primerRequired ?? false,
      finishType: preset.defaults.finishType || 'Natural White',
      ambientCondition: (preset.defaults.ambientCondition as ScheduleAmbientClimate) || 'ideal',
      crewCount: preset.defaults.crewCount || 1,
      shiftType: (preset.defaults.shiftType as ScheduleShiftType) || 'standard-8h',
      workDaysPerWeek: preset.defaults.workDaysPerWeek || 5,
    }));
  };

  // Calculate schedule results
  const scheduleResult = useMemo(() => {
    return calculateProjectSchedule(input);
  }, [input]);

  // Handle PDF Export
  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const watermark = getEffectiveWatermark ? getEffectiveWatermark('estimate') : 'PROJECT ESTIMATE';
      await exportSchedulePdf(input, scheduleResult, { watermark: watermark || 'PROJECT ESTIMATE' });
    } catch (err) {
      console.error('Failed to export schedule PDF', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle Request Bid with prefilled schedule
  const handleRequestBid = () => {
    if (onSendProjectToQuote) {
      const isMetric = input.unitSystem === 'metric';
      const effThick = isMetric ? input.targetThicknessInches / 25.4 : input.targetThicknessInches;
      const effArea = isMetric ? input.targetArea * 10.7639 : input.targetArea;
      onSendProjectToQuote({
        projectName: `${input.projectName} (Timeline Request)`,
        squareFootage: Math.round(effArea),
        substrate: input.substrateType,
        thickness: Number(effThick.toFixed(1)),
        rValue: Number((effThick * 4.0).toFixed(1)),
        nrc: effThick >= 2.0 ? 0.95 : 0.75,
        bags: scheduleResult.estimatedBags,
        adhesiveGallons: Math.ceil(scheduleResult.estimatedAdhesivePails * 5),
        siteConditions: `Estimated Timeline: ${scheduleResult.totalWorkingDays} active working days (${scheduleResult.totalCalendarDays} calendar days). Access: ${input.accessEquipment}, Height: ${input.ceilingHeightFt}ft, MEP Density: ${input.mepDensity}. Ambient: ${input.ambientCondition}.`,
        notes: `Target Finish: ${input.finishType}. Primer Required: ${input.primerRequired ? 'Yes (K-Lastic)' : 'No'}. Proposed Start Date: ${input.startDate}. Subsequent trade clearance on Day ${scheduleResult.subsequentTradeReEntryDay}.`,
      });
    }
  };

  // Helper values
  const isMetric = input.unitSystem === 'metric';
  const effectiveAreaLabel = isMetric
    ? `${Math.round(scheduleResult.effectiveAreaSqFt * 0.092903).toLocaleString()} sq m`
    : `${Math.round(scheduleResult.effectiveAreaSqFt).toLocaleString()} sq ft`;

  const thicknessDisplay = isMetric
    ? `${input.targetThicknessInches} mm (R-${((input.targetThicknessInches / 25.4) * 4.0).toFixed(1)})`
    : `${input.targetThicknessInches.toFixed(1)}" (R-${(input.targetThicknessInches * 4.0).toFixed(1)})`;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              <span>CSI 07 21 29 / 09 81 00 • Field Logistics Model</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Project Schedule & Timeline Estimator
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
              Model precise installation durations, spray rig production capacities, and subsequent trade
              re-entry dates based on project square footage, ceiling heights, substrate complexity, and jobsite climate.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Unit System Toggle */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => handleUnitSystemToggle('imperial')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  !isMetric ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Imperial (sq ft / in)
              </button>
              <button
                type="button"
                onClick={() => handleUnitSystemToggle('metric')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  isMetric ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Metric (sq m / mm)
              </button>
            </div>

            {/* Export PDF Button */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExportingPdf ? 'Generating PDF...' : 'Export Schedule PDF'}</span>
            </button>

            {/* Request Bids Button */}
            {onSendProjectToQuote && (
              <button
                type="button"
                onClick={handleRequestBid}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-500 transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Request Contractor Bids</span>
              </button>
            )}
          </div>
        </div>

        {/* Preset Selector Carousel */}
        <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Quick Archetype Presets:
            </span>
            <span className="text-xs text-slate-400">Click to auto-populate scope parameters</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {SCHEDULE_PRESETS.map((preset) => {
              const isActive = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleLoadPreset(preset)}
                  className={`text-left p-2.5 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-200 text-slate-900'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{preset.name}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{preset.category}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Parameters Form (Left) & Live Results Dashboard (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Scope & Logistics Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section 1: Project Scope & Dimensions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-sky-600" />
              <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                1. Project Scope & Geometry
              </h2>
            </div>

            {/* Project Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Project / Scope Name</label>
              <input
                type="text"
                value={input.projectName}
                onChange={(e) => setInput((p) => ({ ...p, projectName: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="e.g. Underground Parking Garage P1"
              />
            </div>

            {/* Target Area */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">
                  Plan Area ({isMetric ? 'Square Meters' : 'Square Feet'})
                </label>
                <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {input.targetArea.toLocaleString()} {isMetric ? 'sq m' : 'sq ft'}
                </span>
              </div>
              <input
                type="number"
                min="100"
                max="500000"
                step="500"
                value={input.targetArea || ''}
                onChange={(e) =>
                  setInput((p) => ({ ...p, targetArea: Math.max(0, Number(e.target.value)) }))
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Quick increments:</span>
                <div className="space-x-1.5">
                  {[5000, 15000, 35000, 75000].map((val) => {
                    const displayVal = isMetric ? Math.round(val * 0.0929) : val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setInput((p) => ({ ...p, targetArea: displayVal }))}
                        className="text-[10px] font-bold text-slate-600 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 px-1.5 py-0.5 rounded transition-colors"
                      >
                        +{displayVal.toLocaleString()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Target Thickness */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">
                  Target Thickness ({isMetric ? 'mm' : 'inches'})
                </label>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {thicknessDisplay}
                </span>
              </div>
              <input
                type="range"
                min={isMetric ? 25 : 1.0}
                max={isMetric ? 127 : 5.0}
                step={isMetric ? 5 : 0.25}
                value={input.targetThicknessInches}
                onChange={(e) =>
                  setInput((p) => ({ ...p, targetThicknessInches: Number(e.target.value) }))
                }
                className="w-full accent-sky-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{isMetric ? '25mm (R-4)' : '1.0" (R-4)'}</span>
                <span>{isMetric ? '76mm (R-12)' : '3.0" (R-12)'}</span>
                <span>{isMetric ? '127mm (R-20)' : '5.0" (R-20)'}</span>
              </div>
            </div>

            {/* Substrate Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Substrate Geometry</label>
              <select
                value={input.substrateType}
                onChange={(e) =>
                  setInput((p) => ({
                    ...p,
                    substrateType: e.target.value as ScheduleSubstrateType,
                  }))
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-800"
              >
                <option value="flat-concrete">Flat Concrete Slab (1.0x baseline area)</option>
                <option value="fluted-metal-1.5">1.5" Fluted Metal Deck (+15% surface area)</option>
                <option value="fluted-metal-3.0">3.0" Deep Fluted Metal Deck (+30% surface area)</option>
                <option value="open-web-joists">Open-Web Steel Bar Joists & Truss (+45% surface area)</option>
                <option value="wood-framing">Wood Framing / Timber Joists (+12% surface area)</option>
                <option value="curved-vaulted">Curved / Vaulted Domes (+25% surface area)</option>
              </select>
            </div>
          </div>

          {/* Section 2: Access, Obstructions & Finishes */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-sky-600" />
              <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                2. Access, Height & Surface Treatment
              </h2>
            </div>

            {/* Ceiling Height & Access Equipment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Clear Ceiling Height</label>
                <div className="relative">
                  <input
                    type="number"
                    min="8"
                    max="100"
                    value={input.ceilingHeightFt}
                    onChange={(e) =>
                      setInput((p) => ({ ...p, ceilingHeightFt: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">ft</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Access Equipment</label>
                <select
                  value={input.accessEquipment}
                  onChange={(e) =>
                    setInput((p) => ({
                      ...p,
                      accessEquipment: e.target.value as ScheduleAccessType,
                    }))
                  }
                  className="w-full px-2.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-800"
                >
                  <option value="ground-scaffold">Ground / Rolling Scaffold (&lt;12ft)</option>
                  <option value="scissor-lift">Electric Scissor Lifts (12–25ft)</option>
                  <option value="boom-lift">Boom / Articulating Lifts (25–50ft)</option>
                  <option value="highbay-swing-stage">High-Bay Suspended Stage (&gt;50ft)</option>
                </select>
              </div>
            </div>

            {/* MEP Density & Masking Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">MEP Obstructions</label>
                <select
                  value={input.mepDensity}
                  onChange={(e) =>
                    setInput((p) => ({
                      ...p,
                      mepDensity: e.target.value as ScheduleMepDensity,
                    }))
                  }
                  className="w-full px-2.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-800"
                >
                  <option value="low">Low (Clear open shell)</option>
                  <option value="moderate">Moderate (Standard ducts/sprinklers)</option>
                  <option value="high">High (Dense mechanical / data racks)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Poly Containment</label>
                <select
                  value={input.maskingLevel}
                  onChange={(e) =>
                    setInput((p) => ({
                      ...p,
                      maskingLevel: e.target.value as ScheduleMaskingLevel,
                    }))
                  }
                  className="w-full px-2.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-800"
                >
                  <option value="minimal">Minimal (Raw warehouse)</option>
                  <option value="standard">Standard (Finished floor slab)</option>
                  <option value="critical">Critical (Occupied / Cleanroom)</option>
                </select>
              </div>
            </div>

            {/* Finish Type & Primer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Finish Specification</label>
                <select
                  value={input.finishType}
                  onChange={(e) =>
                    setInput((p) => ({
                      ...p,
                      finishType: e.target.value as any,
                    }))
                  }
                  className="w-full px-2.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-800"
                >
                  <option value="Natural White">Natural White (Blown Texture)</option>
                  <option value="Monoglass Black">Monoglass Black (Acoustic Tint)</option>
                  <option value="Tamped Smooth">Tamped Smooth Finish</option>
                  <option value="Sonoglaze Hard-Coat">Sonoglaze Hard-Coat Protective</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Substrate Primer</label>
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={input.primerRequired}
                      onChange={(e) =>
                        setInput((p) => ({ ...p, primerRequired: e.target.checked }))
                      }
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                    />
                    <span className="text-xs font-medium text-slate-700">
                      K-Lastic Primer (+1-2 days flash cure)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Crew Logistics & Shifts */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Users className="w-4 h-4 text-sky-600" />
              <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                3. Crew Logistics & Production Shifts
              </h2>
            </div>

            {/* Crew Count (Rigs) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Number of Spray Rigs / 3-Person Crews
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((count) => {
                  const isSelected = input.crewCount === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setInput((p) => ({ ...p, crewCount: count }))}
                      className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                        isSelected
                          ? 'bg-sky-600 border-sky-600 text-white shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {count} Rig{count > 1 ? 's' : ''} ({count * 3} crew)
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shift Type & Working Days */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Shift Configuration</label>
                <select
                  value={input.shiftType}
                  onChange={(e) =>
                    setInput((p) => ({
                      ...p,
                      shiftType: e.target.value as ScheduleShiftType,
                    }))
                  }
                  className="w-full px-2.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-800"
                >
                  <option value="standard-8h">Standard 8h Shift (5.5h net spray)</option>
                  <option value="extended-10h">Extended 10h Shift (7.5h net spray)</option>
                  <option value="double-shift">Double Shift 16h (11.5h net spray)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Work Schedule / Wk</label>
                <select
                  value={input.workDaysPerWeek}
                  onChange={(e) =>
                    setInput((p) => ({
                      ...p,
                      workDaysPerWeek: Number(e.target.value) as any,
                    }))
                  }
                  className="w-full px-2.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-800"
                >
                  <option value={5}>5 Days / Week (Mon–Fri Standard)</option>
                  <option value={6}>6 Days / Week (Mon–Sat Overtime)</option>
                  <option value={7}>7 Days / Week (Fast-Track Accelerated)</option>
                </select>
              </div>
            </div>

            {/* Jobsite Climate & Start Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Ambient Jobsite Climate</label>
                <select
                  value={input.ambientCondition}
                  onChange={(e) =>
                    setInput((p) => ({
                      ...p,
                      ambientCondition: e.target.value as ScheduleAmbientClimate,
                    }))
                  }
                  className="w-full px-2.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-800"
                >
                  <option value="ideal">Optimal (60–80°F, 40-60% RH)</option>
                  <option value="cold-unheated">Cold Unheated (&lt;40°F, Winter)</option>
                  <option value="high-humidity">High Humidity (&gt;80% RH)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Proposed Start Date</label>
                <input
                  type="date"
                  value={input.startDate}
                  onChange={(e) => setInput((p) => ({ ...p, startDate: e.target.value }))}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Results & Timeline Dashboard (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top KPI Scorecards (4 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Card 1: Calendar Days */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span>Calendar</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {scheduleResult.totalCalendarDays} <span className="text-xs font-bold text-slate-500">Days</span>
              </div>
              <div className="text-[11px] font-medium text-sky-600 truncate">
                Through {scheduleResult.calculatedEndDate}
              </div>
            </div>

            {/* Card 2: Active Work Days */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
                <HardHat className="w-3.5 h-3.5 text-amber-600" />
                <span>Work Days</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {scheduleResult.totalWorkingDays} <span className="text-xs font-bold text-slate-500">Days</span>
              </div>
              <div className="text-[11px] font-medium text-slate-500 truncate">
                {scheduleResult.totalSprayDays} Spray Days
              </div>
            </div>

            {/* Card 3: Total Crew Man-Hours */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Man-Hours</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {scheduleResult.totalCrewManHours} <span className="text-xs font-bold text-slate-500">Hrs</span>
              </div>
              <div className="text-[11px] font-medium text-emerald-600 truncate">
                {input.crewCount * 3} Field Crew
              </div>
            </div>

            {/* Card 4: Subsequent Trade Re-Entry */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                <span>Trade Re-Entry</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-purple-700 tracking-tight">
                Day {scheduleResult.subsequentTradeReEntryDay}
              </div>
              <div className="text-[11px] font-medium text-purple-600 truncate">
                Clearance: {scheduleResult.tradeReEntryDate}
              </div>
            </div>
          </div>

          {/* Tabs Navigation for Results Views */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTabSection('calendar')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  activeTabSection === 'calendar'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <Calendar className="w-4 h-4 text-sky-600" />
                <span>Interactive Calendar</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabSection('timeline')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  activeTabSection === 'timeline'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <CalendarCheck className="w-4 h-4 text-indigo-600" />
                <span>Phased Milestones & Gantt</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabSection('logistics')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  activeTabSection === 'logistics'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <Truck className="w-4 h-4 text-amber-600" />
                <span>Material & Rig Logistics</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabSection('coordination')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  activeTabSection === 'coordination'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                <span>Trade Coordination & QA</span>
              </button>
            </div>

            {/* TAB CONTENT 0: Interactive Project Timeline Calendar */}
            {activeTabSection === 'calendar' && (
              <div className="p-4 sm:p-6">
                <ProjectTimelineCalendar
                  initialInput={input}
                  initialResult={scheduleResult}
                  onSendToQuote={onSendProjectToQuote}
                  isEmbedded={true}
                />
              </div>
            )}

            {/* TAB CONTENT 1: Timeline & Gantt Chart */}
            {activeTabSection === 'timeline' && (
              <div className="p-6 space-y-6">
                {/* Visual Gantt Bar Track */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-sky-600" />
                      Sequential Milestone Schedule
                    </h3>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      Total Span: {scheduleResult.totalCalendarDays} Days
                    </span>
                  </div>

                  {/* Horizontal Visual Milestone Bar */}
                  <div className="w-full h-8 bg-slate-100 rounded-xl overflow-hidden flex border border-slate-200 p-0.5 gap-0.5">
                    {scheduleResult.phases.map((phase) => {
                      const totalSpan = scheduleResult.phases.reduce((acc, p) => acc + p.durationDays, 0);
                      const widthPercent = Math.max(12, (phase.durationDays / totalSpan) * 100);
                      return (
                        <div
                          key={phase.id}
                          style={{
                            width: `${widthPercent}%`,
                            backgroundColor: phase.color,
                          }}
                          className="h-full rounded-lg flex items-center justify-center px-1.5 transition-all text-white text-[11px] font-bold truncate group relative cursor-pointer"
                          title={`${phase.name}: ${phase.durationDays} days (${phase.crewManHours} crew hours)`}
                        >
                          <span className="truncate">{phase.durationDays}d: {phase.name.split(' ')[0]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Phased Milestone Cards List */}
                <div className="space-y-3.5">
                  {scheduleResult.phases.map((phase, idx) => (
                    <div
                      key={phase.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            style={{ backgroundColor: phase.color }}
                            className="w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center shrink-0 shadow-sm"
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{phase.name}</h4>
                            <span className="text-xs font-mono font-semibold text-slate-500">
                              Window: Day {phase.startDay} – Day {phase.endDay}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                            {phase.durationDays} {phase.durationDays === 1 ? 'Day' : 'Days'}
                          </span>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 shadow-2xs">
                            {phase.crewManHours} Man-Hrs
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{phase.description}</p>

                      {/* Key Deliverables Bullet Checklist */}
                      <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {phase.deliverables.map((item, dIdx) => (
                          <div key={dIdx} className="flex items-start gap-1.5 text-xs text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="leading-snug">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Daily Production Summary Bar */}
                <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-600 text-white rounded-xl shadow-sm">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-sky-900 uppercase">
                        Calibrated Spray Output Rate
                      </div>
                      <div className="text-xs text-sky-700">
                        {scheduleResult.dailyProductionSqFt.toLocaleString()} {isMetric ? 'sq m' : 'sq ft'} / Day
                        ({scheduleResult.dailyProductionBoardFt.toLocaleString()} board-feet / day)
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] font-bold text-sky-800">
                      Active Net Spraying Time:
                    </div>
                    <div className="text-xs font-bold text-sky-950 font-mono">
                      {scheduleResult.totalSprayDays} Shifts across {input.crewCount} Rig(s)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: Material & Rig Logistics */}
            {activeTabSection === 'logistics' && (
              <div className="p-6 space-y-6">
                {/* Material Quantities Grid */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-amber-600" />
                    Calculated Material Quantities
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Monoglass Fiber</span>
                      <div className="text-xl font-extrabold text-slate-900">
                        {scheduleResult.estimatedBags.toLocaleString()} <span className="text-xs font-medium">Bags</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {(scheduleResult.estimatedBags * 30).toLocaleString()} lbs net fiber weight
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Adhesive Concentrate</span>
                      <div className="text-xl font-extrabold text-slate-900">
                        {scheduleResult.estimatedAdhesivePails.toLocaleString()}{' '}
                        <span className="text-xs font-medium">Pails</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        5-gallon concentrated pails (mix 1:4 water)
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Freight & Logistics</span>
                      <div className="text-xl font-extrabold text-slate-900">
                        ~{scheduleResult.estimatedTruckloads}{' '}
                        <span className="text-xs font-medium">Semi-Truck(s)</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        Estimated 900 bags / 53-ft trailer
                      </span>
                    </div>
                  </div>
                </div>

                {/* Equipment Fleet Matrix */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-sky-600" />
                    Required Equipment & Staging Checklist
                  </h3>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Equipment Item</th>
                          <th className="p-3">Quantity</th>
                          <th className="p-3">Operational Spec & Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {scheduleResult.equipmentRequirements.map((eq, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 font-bold text-slate-900">{eq.item}</td>
                            <td className="p-3 font-mono font-semibold text-sky-700">{eq.quantity}</td>
                            <td className="p-3 text-slate-600">{eq.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Transfer Actions */}
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Want to view detailed material cost line items?
                  </span>
                  <div className="flex gap-2">
                    {onNavigateToCalculator && (
                      <button
                        type="button"
                        onClick={() =>
                          onNavigateToCalculator({
                            areaInput: input.targetArea,
                            substrateType: input.substrateType,
                            targetThicknessInches: isMetric
                              ? input.targetThicknessInches / 25.4
                              : input.targetThicknessInches,
                            targetRValue: isMetric
                              ? (input.targetThicknessInches / 25.4) * 4.0
                              : input.targetThicknessInches * 4.0,
                            unitSystem: input.unitSystem,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                      >
                        <CalcIcon className="w-3.5 h-3.5" />
                        <span>Send to Materials Calculator</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: Trade Coordination & QA */}
            {activeTabSection === 'coordination' && (
              <div className="p-6 space-y-6">
                {/* Critical Path & Trade Guidance */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-purple-600" />
                    Critical Path & General Contractor Coordination
                  </h3>

                  <div className="space-y-2">
                    {scheduleResult.criticalPathNotes.map((note, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700"
                      >
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{note}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weather & Climate Conditioning Advisory */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Climate & Ambient Curing Guidelines
                  </h3>

                  <div className="space-y-2">
                    {scheduleResult.weatherAdvisories.map((adv, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                          adv.includes('CRITICAL')
                            ? 'bg-amber-50 border-amber-300 text-amber-900 font-medium'
                            : adv.includes('ATTENTION')
                            ? 'bg-sky-50 border-sky-300 text-sky-900'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        }`}
                      >
                        {adv}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Crew & Schedule Optimization Tips */}
                {scheduleResult.crewRecommendations.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Schedule Optimization Insights
                    </h3>

                    <div className="space-y-2">
                      {scheduleResult.crewRecommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 leading-relaxed font-medium"
                        >
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
