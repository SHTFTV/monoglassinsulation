import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Copy,
  FileDown,
  PhoneCall,
  Sparkles,
  RefreshCw,
  Info,
  CheckCircle,
  AlertTriangle,
  Building2,
  Scale,
  Package,
  Droplet,
  Clock,
  Volume2,
  Thermometer,
  Shield,
  Sliders,
  FileText,
  Upload,
  Download,
  Check,
  ChevronDown,
  ChevronUp,
  Wrench,
  DollarSign,
  FileSpreadsheet,
  Share2,
  CheckCircle2,
  ExternalLink,
  Users,
  BarChart3,
  FileJson,
  Archive,
} from 'lucide-react';
import {
  ProjectRoomItem,
  MultiRoomProject,
  ConsolidatedBom,
  RoomBomLine,
} from '../types';
import {
  SUBSTRATE_PROFILES,
  FINISH_OPTIONS,
  PROJECT_TEMPLATES,
  calculateRoomBom,
  calculateConsolidatedBom,
} from '../utils/estimatorUtils';
import { exportMultiRoomEstimatorPdf } from '../utils/pdfExport';
import { useSettings } from '../context/SettingsContext';
import { TenderSummaryModal } from './TenderSummaryModal';
import { downloadTenderSummaryTextFile } from '../utils/tenderSummaryGenerator';
import { ShareProjectModal } from './ShareProjectModal';
import { ProjectAnalytics } from './ProjectAnalytics';
import { ExportProjectSummaryModal } from './ExportProjectSummaryModal';
import { ProjectArchiveView } from './ProjectArchiveView';
import { ArchiveProjectModal } from './ArchiveProjectModal';
import { getArchivedProjects } from '../utils/projectArchiveUtils';
import {
  downloadConsolidatedProjectSummaryJson,
  parseImportedProjectJson,
} from '../utils/projectExportUtils';
import {
  decodeProjectFromCompressedString,
  fetchServerSharedProject,
} from '../utils/shareUtils';
import {
  saveActiveProject,
  loadActiveProjectSync,
  loadActiveProjectAsync,
} from '../utils/indexedDbStorage';
import { StorageStatusIndicator } from './StorageStatusIndicator';
import { StorageManagerModal } from './StorageManagerModal';

interface ProjectEstimatorViewProps {
  onSendProjectToQuote: (quoteData: {
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
  // External payload passed from single-room Calculator "Add to Multi-Room" button
  importedCalculatorData?: {
    areaInput: number;
    substrateType: string;
    targetThicknessInches: number;
    targetRValue: number;
    unitSystem: 'imperial' | 'metric';
  } | null;
  onClearImportedData?: () => void;
  onNavigateToCostEstimator?: () => void;
}

const STORAGE_KEY = 'monoglass_multi_room_project_v1';

export const ProjectEstimatorView: React.FC<ProjectEstimatorViewProps> = ({
  onSendProjectToQuote,
  importedCalculatorData,
  onClearImportedData,
  onNavigateToCostEstimator,
}) => {
  const { isMetric, getEffectiveWatermark } = useSettings();

  // Active Project State (initialized synchronously from LocalStorage with IndexedDB synchronization)
  const [project, setProject] = useState<MultiRoomProject>(() => {
    const defaultTemplate = PROJECT_TEMPLATES[0];
    const defaultFallback: MultiRoomProject = {
      id: 'proj-' + Date.now(),
      name: 'Downtown Commercial High-Rise Parkade & Pool',
      projectType: 'Commercial Mixed-Use',
      location: 'Seattle, WA / Vancouver, BC',
      clientOrArchitect: 'Apex Architecture & Engineering',
      unitSystem: isMetric ? 'metric' : 'imperial',
      rooms: defaultTemplate.defaultRooms.map((r, idx) => ({
        ...r,
        id: `room-${Date.now()}-${idx}`,
      })),
      notes: 'Monolithic thermal and acoustic spray application per CSI Section 07 21 29 & 09 81 00.',
      lastUpdated: new Date().toISOString(),
    };
    return loadActiveProjectSync(defaultFallback);
  });

  const [activeTemplateId, setActiveTemplateId] = useState<string>(PROJECT_TEMPLATES[0].id);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [aiAuditing, setAiAuditing] = useState<boolean>(false);
  const [aiAuditResults, setAiAuditResults] = useState<{
    score: number;
    summary: string;
    recommendations: string[];
    riskFlags: string[];
    stagingSequence: string[];
  } | null>(null);

  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [estimatorViewMode, setEstimatorViewMode] = useState<'workspace' | 'archive'>('workspace');
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState<boolean>(false);
  const [archivedCount, setArchivedCount] = useState<number>(() => getArchivedProjects().length);
  const [isTenderSummaryModalOpen, setIsTenderSummaryModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isExportSummaryModalOpen, setIsExportSummaryModalOpen] = useState<boolean>(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState<boolean>(false);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(true);
  const [sharedProjectMeta, setSharedProjectMeta] = useState<{
    isShared: boolean;
    sharedBy?: string;
    timestamp?: string;
    accessMode?: string;
  } | null>(null);

  // Keep archivedCount in sync with storage updates
  useEffect(() => {
    const handleCountUpdate = () => {
      setArchivedCount(getArchivedProjects().length);
    };
    window.addEventListener('monoglass-project-archives-updated', handleCountUpdate);
    window.addEventListener('monoglass-project-archived', handleCountUpdate);
    return () => {
      window.removeEventListener('monoglass-project-archives-updated', handleCountUpdate);
      window.removeEventListener('monoglass-project-archived', handleCountUpdate);
    };
  }, []);

  // Sync unitSystem if globally changed or keep project's native unitSystem
  const unitSystem = project.unitSystem || (isMetric ? 'metric' : 'imperial');

  // Recalculate consolidated BOM
  const bom: ConsolidatedBom = calculateConsolidatedBom(project, unitSystem);

  // Check URL parameters/hash on mount for shared project or verify async IndexedDB cache
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadSharedFromUrlOrIndexedDb = async () => {
      try {
        const hash = window.location.hash;
        const search = window.location.search;

        // 1. Check direct compressed payload in hash (#project=...) or query param (?p=...)
        let compressedPayload = '';
        if (hash.includes('project=')) {
          compressedPayload = hash.split('project=')[1]?.split('&')[0];
        } else if (search.includes('p=')) {
          const params = new URLSearchParams(search);
          compressedPayload = params.get('p') || '';
        }

        if (compressedPayload) {
          const decoded = decodeProjectFromCompressedString(compressedPayload);
          if (decoded && decoded.project && Array.isArray(decoded.project.rooms)) {
            setProject(decoded.project);
            setSharedProjectMeta({
              isShared: true,
              sharedBy: decoded.sharedBy,
              timestamp: decoded.timestamp,
              accessMode: decoded.accessMode,
            });
            setSaveBanner(`Loaded shared estimate: "${decoded.project.name || 'Untitled Takeoff'}"${decoded.sharedBy ? ` (Shared by ${decoded.sharedBy})` : ''}`);
            return;
          }
        }

        // 2. Check short server link (?share=MNG-XXXXXX)
        if (search.includes('share=')) {
          const params = new URLSearchParams(search);
          const shareId = params.get('share');
          if (shareId) {
            const remote = await fetchServerSharedProject(shareId);
            if (remote && remote.project && Array.isArray(remote.project.rooms)) {
              setProject(remote.project);
              setSharedProjectMeta({
                isShared: true,
                sharedBy: remote.sharedBy,
                timestamp: remote.createdAt,
                accessMode: remote.accessMode,
              });
              setSaveBanner(`Loaded shared estimate "${remote.project.name}" (Ref: ${shareId})`);
              return;
            }
          }
        }

        // 3. Fallback: check IndexedDB if fresher
        const idbProject = await loadActiveProjectAsync();
        if (idbProject && idbProject.lastUpdated) {
          if (!project.lastUpdated || new Date(idbProject.lastUpdated).getTime() > new Date(project.lastUpdated).getTime()) {
            setProject(idbProject);
          }
        }
      } catch (err) {
        console.warn('Could not auto-load project from URL or IndexedDB:', err);
      }
    };

    loadSharedFromUrlOrIndexedDb();
  }, []);

  // Save to dual-layer IndexedDB + LocalStorage whenever project changes
  useEffect(() => {
    saveActiveProject(project);
  }, [project]);

  // Handle incoming calculator data import
  useEffect(() => {
    if (importedCalculatorData) {
      const newRoom: ProjectRoomItem = {
        id: `room-${Date.now()}`,
        name: `Imported Calculator Area (${importedCalculatorData.substrateType.replace('-', ' ')})`,
        planArea: importedCalculatorData.areaInput,
        substrateType: importedCalculatorData.substrateType,
        targetMode: 'thermal',
        targetRValue: importedCalculatorData.targetRValue,
        targetThicknessInches: importedCalculatorData.targetThicknessInches,
        finishType: 'Natural White',
        wastagePercent: 8,
        ceilingHeightFt: 12,
        siteConditionNotes: 'Imported from Single-Room Calculator',
        enabled: true,
      };

      setProject((prev) => ({
        ...prev,
        rooms: [...prev.rooms, newRoom],
        lastUpdated: new Date().toISOString(),
      }));

      setSaveBanner('Successfully imported area from R-Value & Acoustic Calculator!');
      setTimeout(() => setSaveBanner(null), 4000);

      if (onClearImportedData) {
        onClearImportedData();
      }
    }
  }, [importedCalculatorData, onClearImportedData]);

  // Template switch handler
  const handleApplyTemplate = (templateId: string) => {
    const template = PROJECT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    if (
      project.rooms.length > 0 &&
      !window.confirm(
        `Load the "${template.name}" template? This will replace current room entries.`
      )
    ) {
      return;
    }

    setActiveTemplateId(templateId);
    setProject((prev) => ({
      ...prev,
      name: template.name,
      projectType: template.projectType,
      rooms: template.defaultRooms.map((r, idx) => ({
        ...r,
        id: `room-${Date.now()}-${idx}`,
      })),
      lastUpdated: new Date().toISOString(),
    }));
    setAiAuditResults(null);
  };

  // Unit switch handler with conversion
  const handleToggleUnitSystem = (newSystem: 'imperial' | 'metric') => {
    if (newSystem === project.unitSystem) return;

    const convertedRooms = project.rooms.map((room) => {
      let convertedArea = room.planArea;
      if (newSystem === 'metric') {
        convertedArea = Math.round(room.planArea * 0.092903);
      } else {
        convertedArea = Math.round(room.planArea * 10.7639);
      }
      return {
        ...room,
        planArea: Math.max(10, convertedArea),
      };
    });

    setProject((prev) => ({
      ...prev,
      unitSystem: newSystem,
      rooms: convertedRooms,
      lastUpdated: new Date().toISOString(),
    }));
  };

  // Add Room
  const handleAddRoom = () => {
    const newRoom: ProjectRoomItem = {
      id: `room-${Date.now()}`,
      name: `Area ${project.rooms.length + 1} - New Space / Zone`,
      planArea: unitSystem === 'imperial' ? 5000 : 465,
      substrateType: 'flat-concrete',
      targetMode: 'thermal',
      targetRValue: 16,
      targetThicknessInches: 4.0,
      finishType: 'Natural White',
      wastagePercent: 8,
      ceilingHeightFt: 12,
      siteConditionNotes: '',
      enabled: true,
    };

    setProject((prev) => ({
      ...prev,
      rooms: [...prev.rooms, newRoom],
      lastUpdated: new Date().toISOString(),
    }));
    setExpandedRoomId(newRoom.id);
  };

  // Duplicate Room
  const handleDuplicateRoom = (roomId: string) => {
    const target = project.rooms.find((r) => r.id === roomId);
    if (!target) return;

    const copy: ProjectRoomItem = {
      ...target,
      id: `room-${Date.now()}`,
      name: `${target.name} (Copy)`,
    };

    setProject((prev) => ({
      ...prev,
      rooms: [...prev.rooms, copy],
      lastUpdated: new Date().toISOString(),
    }));
  };

  // Delete Room
  const handleDeleteRoom = (roomId: string) => {
    if (project.rooms.length <= 1) {
      alert('A project must contain at least one room / zone.');
      return;
    }
    setProject((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((r) => r.id !== roomId),
      lastUpdated: new Date().toISOString(),
    }));
  };

  // Update Room Field
  const handleUpdateRoom = (roomId: string, updates: Partial<ProjectRoomItem>) => {
    setProject((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) => (r.id === roomId ? { ...r, ...updates } : r)),
      lastUpdated: new Date().toISOString(),
    }));
  };

  // Toggle Room Enabled/Disabled
  const handleToggleRoom = (roomId: string) => {
    setProject((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) => (r.id === roomId ? { ...r, enabled: !r.enabled } : r)),
      lastUpdated: new Date().toISOString(),
    }));
  };

  // Export Consolidated JSON Project Summary & Backup
  const handleExportJson = () => {
    downloadConsolidatedProjectSummaryJson(project, bom, {
      includeArchive: true,
      includeCostEstimates: true,
    });
    setSaveBanner(`Downloaded consolidated JSON backup for "${project.name || 'Project'}"!`);
    setTimeout(() => setSaveBanner(null), 4000);
  };

  // Import JSON Project File (Supports both Consolidated Backup and Standalone Takeoff)
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        const text = event.target?.result as string;
        const result = parseImportedProjectJson(text);
        if (result.success && result.project) {
          setProject(result.project);
          setSaveBanner(`Project takeoff "${result.project.name || 'Imported'}" successfully loaded with ${result.project.rooms.length} zones!`);
          setTimeout(() => setSaveBanner(null), 4500);
        } else {
          alert(result.error || 'Invalid project file format.');
        }
      };
    }
  };

  // Export PDF Report
  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      await exportMultiRoomEstimatorPdf(
        {
          project: {
            name: project.name,
            projectType: project.projectType,
            location: project.location,
            clientOrArchitect: project.clientOrArchitect,
            unitSystem: project.unitSystem,
            notes: project.notes,
          },
          bom,
        },
        {
          watermark: getEffectiveWatermark('estimate'),
        }
      );
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF generation encountered an issue. Please retry.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Restore project from archive into active workspace
  const handleRestoreFromArchive = (restored: MultiRoomProject) => {
    setProject(restored);
    setEstimatorViewMode('workspace');
    saveActiveProject(restored);
    setSaveBanner(`Restored archived estimate "${restored.name || 'Untitled'}" into active workspace!`);
    setTimeout(() => setSaveBanner(null), 4500);
  };

  // Duplicate / clone project from archive into new active takeoff
  const handleDuplicateFromArchive = (cloned: MultiRoomProject) => {
    setProject(cloned);
    setEstimatorViewMode('workspace');
    saveActiveProject(cloned);
    setSaveBanner(`Cloned archived estimate as new active takeoff "${cloned.name}"!`);
    setTimeout(() => setSaveBanner(null), 4500);
  };

  // Handle successful archiving from modal
  const handleArchiveSuccess = (
    archived: any,
    postAction: 'new-blank' | 'template' | 'keep'
  ) => {
    setArchivedCount(getArchivedProjects().length);
    if (postAction === 'new-blank') {
      const blankProject: MultiRoomProject = {
        id: 'proj-' + Date.now(),
        name: 'New Commercial Takeoff',
        projectType: 'Commercial Building',
        location: '',
        clientOrArchitect: '',
        unitSystem: isMetric ? 'metric' : 'imperial',
        rooms: [
          {
            id: 'room-' + Date.now(),
            name: 'Zone 1 - Main Deck',
            planArea: isMetric ? 100 : 1000,
            substrateType: 'flat-concrete',
            targetMode: 'thermal',
            targetRValue: 16,
            targetThicknessInches: 4.0,
            finishType: 'Natural White',
            wastagePercent: 8,
            enabled: true,
          },
        ],
        notes: '',
        lastUpdated: new Date().toISOString(),
      };
      setProject(blankProject);
      saveActiveProject(blankProject);
      setSaveBanner(`Moved "${archived.name}" to Archive and started a fresh blank workspace!`);
    } else if (postAction === 'template') {
      const defaultTemplate = PROJECT_TEMPLATES[0];
      const templateProject: MultiRoomProject = {
        id: 'proj-' + Date.now(),
        name: defaultTemplate.name,
        projectType: 'Commercial Mixed-Use',
        location: '',
        clientOrArchitect: '',
        unitSystem: isMetric ? 'metric' : 'imperial',
        rooms: defaultTemplate.defaultRooms.map((r, idx) => ({
          ...r,
          id: `room-${Date.now()}-${idx}`,
        })),
        notes: defaultTemplate.description,
        lastUpdated: new Date().toISOString(),
      };
      setProject(templateProject);
      saveActiveProject(templateProject);
      setSaveBanner(`Moved "${archived.name}" to Archive and reset workspace to standard template!`);
    } else {
      setSaveBanner(`Moved "${archived.name}" to the Project Archive!`);
    }
    setTimeout(() => setSaveBanner(null), 4500);
  };

  // Send Consolidated Estimate to Contractor Quote Modal
  const handleSendToQuote = () => {
    // Build descriptive multi-room summary for architectural notes
    const activeRooms = project.rooms.filter((r) => r.enabled);
    const roomSummary = activeRooms
      .map(
        (r, i) =>
          `[Zone ${i + 1}: ${r.name}] - ${r.planArea.toLocaleString()} ${
            unitSystem === 'imperial' ? 'sq ft' : 'm²'
          }, Substrate: ${r.substrateType}, Target: ${
            r.targetMode === 'thermal' ? `R-${r.targetRValue}` : `${r.targetThicknessInches}"`
          }, Finish: ${r.finishType}, Waste: ${r.wastagePercent}%`
      )
      .join('\n');

    const primarySubstrate =
      activeRooms.length === 1
        ? activeRooms[0].substrateType
        : `Multi-Substrate (${activeRooms.length} Zones: ${Array.from(
            new Set(activeRooms.map((r) => r.substrateType))
          ).join(', ')})`;

    const siteConditionsSummary = activeRooms
      .filter((r) => r.siteConditionNotes)
      .map((r) => `• ${r.name}: ${r.siteConditionNotes}`)
      .join('\n');

    onSendProjectToQuote({
      projectName: project.name,
      squareFootage: bom.totalEffectiveAreaSqFt,
      substrate: primarySubstrate,
      thickness: Number((bom.blendedRValue / 4.0).toFixed(1)),
      rValue: bom.blendedRValue,
      nrc: bom.blendedNrc,
      bags: bom.totalBagsFiber,
      adhesiveGallons: bom.totalAdhesiveConcentrateGallons,
      siteConditions: siteConditionsSummary || undefined,
      notes: `CONSOLIDATED MULTI-ROOM PROJECT TAKEOFF:\nProject: ${project.name} (${project.projectType})\nLocation: ${
        project.location || 'N/A'
      }\nClient/Architect: ${
        project.clientOrArchitect || 'N/A'
      }\n\nITEMIZED ZONES BREAKDOWN:\n${roomSummary}\n\nCONSOLIDATED BILL OF MATERIALS:\n• Total Gross Surface: ${bom.totalEffectiveAreaSqFt.toLocaleString()} sq ft (${bom.totalEffectiveAreaSqM.toLocaleString()} m²)\n• Monoglass White Fiber Bags: ${bom.totalBagsFiber.toLocaleString()} bags (${bom.totalFiberWeightLbs.toLocaleString()} lbs dry)\n• Adhesive Concentrate: ${bom.totalAdhesivePails} Pails (${bom.totalAdhesiveConcentrateGallons} Gal)\n• Sonoglaze Hard-Coat: ${
        bom.totalSonoglazeGallons > 0 ? `${bom.totalSonoglazePails} Pails (${bom.totalSonoglazeGallons} Gal)` : 'None'
      }\n• Blended Thermal: R-${bom.blendedRValue} (RSI ${bom.blendedRsi})\n• Blended Acoustic: NRC ${bom.blendedNrc}\n• Est. Crew Rig Days: ~${bom.totalRigDays} days`,
    });
  };

  // Run AI Takeoff & Specification Auditor
  const handleRunAiAudit = () => {
    setAiAuditing(true);
    setAiAuditResults(null);

    setTimeout(() => {
      // Rule-based architectural audit heuristic
      const activeRooms = project.rooms.filter((r) => r.enabled);
      const risks: string[] = [];
      const recs: string[] = [];
      const staging: string[] = [];

      let score = 96;

      // Check single pass (>5 inches)
      const thickRooms = activeRooms.filter((r) => {
        const thickness = r.targetMode === 'thermal' ? r.targetRValue / 4.0 : r.targetThicknessInches;
        return thickness > 5.0;
      });

      if (thickRooms.length > 0) {
        score -= 6;
        risks.push(
          `Multi-Pass Required: ${thickRooms
            .map((r) => r.name)
            .join(', ')} exceed 5.0" (127 mm). Must be installed in 2 sequential passes with 24h inter-pass cure.`
        );
        recs.push(
          'Ensure specification documents stipulate 2-pass application with substrate inspection prior to second lift.'
        );
      }

      // Check natatorium / pool
      const poolRooms = activeRooms.filter(
        (r) =>
          r.name.toLowerCase().includes('pool') ||
          r.name.toLowerCase().includes('natatorium') ||
          (r.siteConditionNotes && r.siteConditionNotes.toLowerCase().includes('chloramine'))
      );

      if (poolRooms.length > 0) {
        poolRooms.forEach((pr) => {
          if (pr.finishType !== 'Sonoglaze Hard-Coat') {
            score -= 4;
            risks.push(
              `Natatorium Protection: "${pr.name}" should specify Sonoglaze Polymer Protective Hard-Coat for chloramine resistance.`
            );
            recs.push(
              'Apply Sonoglaze at 75 sq ft / gal over Monoglass spray in indoor swimming pools to safeguard against warm chloramine vapor.'
            );
          }
        });
      }

      // Check oily deck
      const metalDecks = activeRooms.filter(
        (r) => r.substrateType.includes('fluted') || r.substrateType.includes('joists')
      );
      if (metalDecks.length > 0) {
        recs.push(
          'Metal Decks & Joists: Inspect new roll-formed decking for manufacturing oils; solvent degreasing or water-wash required prior to Monoglass adhesive prime-spray.'
        );
      }

      // Staging sequence
      staging.push('1. Substrate surface inspection, temperature verification (≥40°F / 4.5°C), and masking.');
      staging.push('2. Adhesive primer atomization pass (1:1 diluted Monoglass adhesive).');
      if (thickRooms.length > 0) {
        staging.push('3. First pass application on deep zones (up to 4.0" base lift).');
        staging.push('4. Secondary pass to final target R-value.');
      } else {
        staging.push('3. Full monolithic single-pass spray to target thickness pins.');
      }
      if (bom.totalSonoglazeGallons > 0) {
        staging.push('4. Sonoglaze acrylic protective seal-coat airless spray application.');
      }
      staging.push('5. 24–48h cross-ventilation curing window (2–4 air changes/hour).');

      recs.push(
        `Total bag order requirement: ${bom.totalBagsFiber.toLocaleString()} bags with built-in wastage factors (${bom.totalFiberWeightLbs.toLocaleString()} lbs dry fiber).`
      );
      recs.push(
        `Project logistics: ~${bom.totalRigDays} working rig days for a standard 3-person certified spray applicator crew.`
      );

      setAiAuditResults({
        score,
        summary: `Project takeoff is well-structured with ${activeRooms.length} active zones covering ${bom.totalEffectiveAreaSqFt.toLocaleString()} sq ft (${bom.totalEffectiveAreaSqM.toLocaleString()} m²). Blended thermal performance meets R-${bom.blendedRValue} with zero flame spread (ASTM E84 0/0).`,
        recommendations: recs,
        riskFlags: risks,
        stagingSequence: staging,
      });

      setAiAuditing(false);
    }, 900);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Shared Project Live Collaboration Banner */}
      {sharedProjectMeta?.isShared && (
        <div className="bg-gradient-to-r from-sky-950/90 via-indigo-950/80 to-slate-900 border border-sky-500/40 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-scaleUp">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded font-mono">
                  Shared Team Takeoff
                </span>
                {sharedProjectMeta.sharedBy && (
                  <span className="text-xs text-slate-300">
                    Shared by <strong className="text-white">{sharedProjectMeta.sharedBy}</strong>
                  </span>
                )}
                {sharedProjectMeta.timestamp && (
                  <span className="text-[11px] text-slate-400">
                    • {new Date(sharedProjectMeta.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5">
                Collaborating on "{project.name || 'Untitled Estimate'}"
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Any modifications made here can be saved locally or re-shared back to your project team as an updated revision.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
                  setSaveBanner('Saved as your primary active project estimate in local storage.');
                  setTimeout(() => setSaveBanner(null), 4000);
                } catch {
                  // ignore
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              Save As My Project
            </button>
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Updates</span>
            </button>
            <button
              type="button"
              onClick={() => setSharedProjectMeta(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs"
              title="Dismiss banner"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Banner / Notification */}
      {saveBanner && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{saveBanner}</span>
          </div>
          <button onClick={() => setSaveBanner(null)} className="text-emerald-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Primary Workspace vs Project Archive Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-2.5 rounded-2xl shadow-lg">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEstimatorViewMode('workspace')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              estimatorViewMode === 'workspace'
                ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Active Takeoff Workspace</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              estimatorViewMode === 'workspace' ? 'bg-slate-950/80 text-sky-300 font-bold' : 'bg-slate-800 text-slate-400'
            }`}>
              {project.rooms.filter((r) => r.enabled).length} Zones
            </span>
          </button>

          <button
            type="button"
            onClick={() => setEstimatorViewMode('archive')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              estimatorViewMode === 'archive'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>Project Archive</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              estimatorViewMode === 'archive' ? 'bg-slate-950/80 text-amber-300 font-bold' : 'bg-slate-800 text-slate-400'
            }`}>
              {archivedCount}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsArchiveModalOpen(true)}
            title="Archive current active project estimate into the non-active archive repository"
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Archive className="w-3.5 h-3.5 text-amber-400" />
            <span>Archive Active Takeoff</span>
          </button>
        </div>
      </div>

      {/* Conditionally Render Project Archive View OR Active Workspace */}
      {estimatorViewMode === 'archive' ? (
        <ProjectArchiveView
          onRestoreToActive={handleRestoreFromArchive}
          onDuplicateToActive={handleDuplicateFromArchive}
          onOpenArchiveActiveModal={() => setIsArchiveModalOpen(true)}
          currentActiveProjectName={project.name}
        />
      ) : (
        <>
          {/* Main Header & Project Configuration Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div>
                <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Building2 className="w-4 h-4" /> Multi-Room Project Estimator & Material Takeoff
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Consolidated Bill of Materials (BOM)
                </h1>
                <p className="text-sm text-slate-400 mt-1 max-w-3xl">
                  Build multi-area commercial building takeoffs, configure different substrates and R-values per room, and calculate aggregated jobsite material requirements.
                </p>
              </div>

              {/* Quick Actions & Unit Switcher */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Unit System Toggle */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleToggleUnitSystem('imperial')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      unitSystem === 'imperial'
                        ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Imperial (sq ft / R)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleUnitSystem('metric')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      unitSystem === 'metric'
                        ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Metric (m² / RSI)
                  </button>
                </div>

                {/* Template Selector Dropdown */}
                <div className="relative">
                  <select
                    aria-label="Select Project Template"
                    value={activeTemplateId}
                    onChange={(e) => handleApplyTemplate(e.target.value)}
                    className="bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-sky-500 transition-colors"
                  >
                    <option value="" disabled>
                      Load Project Template...
                    </option>
                    {PROJECT_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>
                        Template: {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Save / Export JSON, Tender Summary, Analytics & Share Project */}
                <div className="flex items-center gap-1.5">
                  <StorageStatusIndicator
                    onClick={() => setIsStorageModalOpen(true)}
                    lastSavedIso={project.lastUpdated}
                  />

                  <button
                    type="button"
                    onClick={() => setShowAnalytics(!showAnalytics)}
                    title="Toggle Material Distribution & Zone Analytics Visualizer"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                      showAnalytics
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-slate-950 hover:bg-slate-800 text-indigo-300 border border-slate-700 hover:border-indigo-500/50'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Analytics</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    title="Share this estimate via unique link or mobile QR code"
                    className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-95"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Project</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsArchiveModalOpen(true)}
                    title="Move current estimate into Project Archive"
                    className="px-2.5 py-1.5 rounded-xl bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 hover:text-white border border-amber-500/40 transition-colors flex items-center gap-1.5 text-xs font-bold shadow-sm active:scale-95"
                  >
                    <Archive className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden xl:inline">Archive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTenderSummaryModalOpen(true)}
                    title="Generate & Export Site Conditions & Specification Summary (.txt for Tender Documents)"
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-sky-400 hover:text-sky-300 border border-slate-700 hover:border-sky-500/50 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tender Summary</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsExportSummaryModalOpen(true)}
                    title="Export Project Summary & Takeoff Backup (Consolidated JSON)"
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 hover:text-white border border-indigo-500/40 transition-colors flex items-center gap-1.5 text-xs font-bold shadow-sm active:scale-95"
                  >
                    <FileJson className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Export Summary</span>
                  </button>

                  <button
                    onClick={handleExportJson}
                    title="Quick Download Consolidated Project JSON File"
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:text-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <label
                    title="Restore / Import Project File or Backup (JSON)"
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:text-white transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportJson}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

        {/* Project Metadata Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Project Title / Name
            </label>
            <input
              type="text"
              value={project.name}
              onChange={(e) => setProject({ ...project, name: e.target.value })}
              placeholder="e.g. Center City Tower Parkade & Pool"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-sky-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Building / Facility Type
            </label>
            <input
              type="text"
              value={project.projectType}
              onChange={(e) => setProject({ ...project, projectType: e.target.value })}
              placeholder="e.g. Commercial Mixed-Use / Arena"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Project Location / Jurisdiction
            </label>
            <input
              type="text"
              value={project.location || ''}
              onChange={(e) => setProject({ ...project, location: e.target.value })}
              placeholder="City, State / Province"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Architect / Specifying Engineer
            </label>
            <input
              type="text"
              value={project.clientOrArchitect || ''}
              onChange={(e) => setProject({ ...project, clientOrArchitect: e.target.value })}
              placeholder="Firm or Specifier Name"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500 font-sans"
            />
          </div>
        </div>

        {/* General Project Specification Notes & Tender Comments */}
        <div className="pt-1 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              General Specification Notes & Jobsite Conditions (Included in Formal Tender Documents)
            </label>
            <button
              type="button"
              onClick={() => setIsTenderSummaryModalOpen(true)}
              className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <FileSpreadsheet className="w-3 h-3" /> Preview Tender Summary .txt
            </button>
          </div>
          <textarea
            rows={2}
            value={project.notes || ''}
            onChange={(e) => setProject({ ...project, notes: e.target.value })}
            placeholder="e.g. Monolithic thermal and acoustic spray application per CSI Section 07 21 29 & 09 81 00. Substrate requires solvent degreasing on new decking. 40°F (4.5°C) minimum ambient temperature required during spray and 72-hour cure."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-500 font-sans resize-y"
          />
        </div>
      </div>

      {/* TOP EXECUTIVE CONSOLIDATED BOM DASHBOARD */}
      <div className="bg-slate-900 border border-sky-900/40 rounded-2xl p-5 md:p-6 shadow-xl space-y-5 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Executive Consolidated Material Takeoff
              </h2>
              <p className="text-xs text-slate-400">
                Aggregated across {project.rooms.filter((r) => r.enabled).length} active project zones (including wastage allowance)
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                showAnalytics
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border-indigo-500/40'
              }`}
              title="Toggle multi-room material distribution and fluting visual analytics"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{showAnalytics ? 'Hide Analytics' : 'Project Analytics'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 hover:text-white border border-sky-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Share live estimate link or mobile QR code with team members"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Share Estimate</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTenderSummaryModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white border border-sky-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Generate formal Site Conditions and Specification Summary .txt document"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
              <span>Tender Spec Summary</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExportSummaryModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-200 hover:text-white border border-indigo-500/50 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Export Consolidated Project Summary JSON Backup for offline local storage"
            >
              <FileJson className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export Project Summary</span>
            </button>

            <button
              onClick={handleRunAiAudit}
              disabled={aiAuditing}
              className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className={`w-3.5 h-3.5 ${aiAuditing ? 'animate-spin' : 'text-indigo-400'}`} />
              <span>{aiAuditing ? 'Auditing...' : 'Audit Takeoff with AI'}</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Exporting PDF...' : 'Download Takeoff PDF'}</span>
            </button>

            <button
              onClick={handleSendToQuote}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-sky-500/25 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Send to Certified Contractors</span>
            </button>
          </div>
        </div>

        {/* 6 Metric KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Total Surface Area */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Total Surface
            </div>
            <div className="text-xl font-extrabold text-white font-mono">
              {unitSystem === 'imperial'
                ? `${bom.totalEffectiveAreaSqFt.toLocaleString()} sq ft`
                : `${bom.totalEffectiveAreaSqM.toLocaleString()} m²`}
            </div>
            <div className="text-[10px] text-slate-400">
              {unitSystem === 'imperial'
                ? `Plan: ${bom.totalPlanAreaSqFt.toLocaleString()} sq ft`
                : `Plan: ${bom.totalPlanAreaSqM.toLocaleString()} m²`}
            </div>
          </div>

          {/* Card 2: Monoglass Fiber Bags */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Package className="w-3 h-3" /> Monoglass Fiber
            </div>
            <div className="text-xl font-extrabold text-white font-mono">
              {bom.totalBagsFiber.toLocaleString()} <span className="text-xs font-sans text-slate-400">Bags</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {unitSystem === 'imperial'
                ? `${bom.totalFiberWeightLbs.toLocaleString()} lbs dry`
                : `${(bom.totalFiberWeightKg / 1000).toFixed(1)} tonnes dry`}
            </div>
          </div>

          {/* Card 3: Adhesive Concentrate */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Droplet className="w-3 h-3" /> Adhesive Conc.
            </div>
            <div className="text-xl font-extrabold text-white font-mono">
              {bom.totalAdhesivePails.toLocaleString()} <span className="text-xs font-sans text-slate-400">Pails</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {bom.totalAdhesiveConcentrateGallons} gal (1:1 dilute)
            </div>
          </div>

          {/* Card 4: Blended R-Value */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
              <Thermometer className="w-3 h-3" /> Blended R-Val
            </div>
            <div className="text-xl font-extrabold text-white font-mono">
              {unitSystem === 'imperial' ? `R-${bom.blendedRValue.toFixed(1)}` : `RSI ${bom.blendedRsi.toFixed(2)}`}
            </div>
            <div className="text-[10px] text-slate-400">
              ASTM C518 k=0.250
            </div>
          </div>

          {/* Card 5: Blended Acoustic NRC */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
              <Volume2 className="w-3 h-3" /> Blended NRC
            </div>
            <div className="text-xl font-extrabold text-white font-mono">
              NRC {bom.blendedNrc.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400">
              ASTM C423 absorption
            </div>
          </div>

          {/* Card 6: Estimated Crew Days */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Est. Spray Days
            </div>
            <div className="text-xl font-extrabold text-white font-mono">
              ~{bom.totalRigDays} <span className="text-xs font-sans text-slate-400">Rig Days</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {bom.totalSprayHours} machine hours
            </div>
          </div>
        </div>

        {/* Sonoglaze & Budgetary Cost Footnote Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-sky-400" /> Sonoglaze Hard-Coat:
            </span>
            <span className="font-bold text-white">
              {bom.totalSonoglazeGallons > 0
                ? `${bom.totalSonoglazePails} Pails (${bom.totalSonoglazeGallons} Gal)`
                : 'None Specified'}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-emerald-400" /> Dead Load on Frame:
            </span>
            <span className="font-bold text-white">
              {unitSystem === 'imperial'
                ? `${bom.totalDeadLoadLbs.toLocaleString()} lbs total`
                : `${bom.totalDeadLoadTonnes} metric tonnes`}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Budgetary Material Range:
            </span>
            <span className="font-bold text-amber-300">
              ${bom.estimatedMaterialCostLow.toLocaleString()} – ${bom.estimatedMaterialCostHigh.toLocaleString()} USD
            </span>
          </div>
        </div>

        {/* Detailed Cost Estimator & Turnkey Budget Integration */}
        {project.costEstimate ? (
          <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-4 sm:p-5 mt-4 space-y-3 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <DollarSign className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Saved Turnkey Project Cost Estimate
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {project.costEstimate.name}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Labor Rate: ${project.costEstimate.loadedHourlyRate}/hr ({project.costEstimate.laborRatePreset}) • Fiber: ${project.costEstimate.fiberBagPrice}/bag • Adhesive: ${project.costEstimate.adhesivePailPrice}/pail
                  </p>
                </div>
              </div>

              {onNavigateToCostEstimator && (
                <button
                  type="button"
                  onClick={onNavigateToCostEstimator}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1 self-start sm:self-auto"
                >
                  <DollarSign className="w-3.5 h-3.5" /> Open / Adjust Budget in Cost Estimator
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-amber-400 block">Grand Total Budget</span>
                <span className="text-lg font-black font-mono text-white">${project.costEstimate.grandTotal.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 block">${project.costEstimate.costPerSqFt}/sq ft</span>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">Materials Subtotal</span>
                <span className="text-base font-black font-mono text-white">${project.costEstimate.materialsTotal.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 block">{project.costEstimate.totalBags} bags fiber</span>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-sky-400 block">Crew Labor Subtotal</span>
                <span className="text-base font-black font-mono text-white">${project.costEstimate.laborTotal.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 block">{project.costEstimate.crewSize}-man crew</span>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-purple-400 block">Equipment & O&P</span>
                <span className="text-base font-black font-mono text-white">
                  ${(project.costEstimate.grandTotal - project.costEstimate.materialsTotal - project.costEstimate.laborTotal).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block">O&P: {project.costEstimate.overheadProfitPercent}%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>Calculate Turnkey Project Budget (Labor Rates + Bag Pricing)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Determine complete project costs including local hourly labor rates, crew productivity, spray rig rentals, and general contractor markups.
              </p>
            </div>
            {onNavigateToCostEstimator && (
              <button
                type="button"
                onClick={onNavigateToCostEstimator}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
              >
                <DollarSign className="w-3.5 h-3.5" /> Open Project Cost Estimator
              </button>
            )}
          </div>
        )}

        {/* AI Audit Expansion Results */}
        {aiAuditResults && (
          <div className="bg-slate-950 border border-indigo-500/40 rounded-xl p-4 space-y-3 mt-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">
                  Gemini Architectural Takeoff & Specification Audit
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Specification Score: {aiAuditResults.score}/100
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {aiAuditResults.summary}
            </p>

            {aiAuditResults.riskFlags.length > 0 && (
              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Advisory Risk Items:
                </div>
                {aiAuditResults.riskFlags.map((risk, rIdx) => (
                  <div key={rIdx} className="text-xs text-amber-200 bg-amber-950/40 border border-amber-800/50 p-2 rounded-lg">
                    • {risk}
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                  Specification Recommendations:
                </div>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  {aiAuditResults.recommendations.map((rec, rIdx) => (
                    <li key={rIdx}>{rec}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Recommended Staging Sequence:
                </div>
                <ul className="text-xs text-slate-300 space-y-1 list-none">
                  {aiAuditResults.stagingSequence.map((stg, sIdx) => (
                    <li key={sIdx} className="text-slate-300">
                      {stg}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PROJECT MATERIAL ANALYTICS & VISUAL DISTRIBUTION */}
      {showAnalytics && (
        <div className="animate-fadeIn">
          <ProjectAnalytics
            project={project}
            bom={bom}
            unitSystem={unitSystem}
          />
        </div>
      )}

      {/* ROOM & AREA MANAGER SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              Project Areas & Zones ({project.rooms.length})
            </h2>
            <span className="text-xs text-slate-400">
              Customize substrate profiles, thicknesses, and finishes per room
            </span>
          </div>

          <button
            onClick={handleAddRoom}
            className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-sky-500/20 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Room / Area</span>
          </button>
        </div>

        {/* Room Items List */}
        <div className="space-y-3">
          {project.rooms.map((room, index) => {
            const line = calculateRoomBom(room, unitSystem);
            const isExpanded = expandedRoomId === room.id;
            const substrateInfo = SUBSTRATE_PROFILES[room.substrateType] || SUBSTRATE_PROFILES['flat-concrete'];

            return (
              <div
                key={room.id}
                className={`bg-slate-900 border rounded-2xl transition-all ${
                  room.enabled
                    ? 'border-slate-800 hover:border-slate-700'
                    : 'border-slate-800/40 opacity-60 bg-slate-950'
                }`}
              >
                {/* Room Header Strip */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Include / Exclude Checkbox */}
                    <input
                      type="checkbox"
                      id={`room-enable-${room.id}`}
                      checked={room.enabled}
                      onChange={() => handleToggleRoom(room.id)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0 cursor-pointer"
                      title={room.enabled ? 'Enabled in BOM' : 'Excluded from BOM'}
                    />

                    {/* Room Index & Name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/60 border border-sky-800/40 px-2 py-0.5 rounded">
                          Zone {index + 1}
                        </span>
                        <input
                          type="text"
                          value={room.name}
                          onChange={(e) => handleUpdateRoom(room.id, { name: e.target.value })}
                          className="bg-transparent font-bold text-white text-sm sm:text-base focus:bg-slate-950 focus:px-2 py-0.5 rounded border border-transparent focus:border-slate-700 w-full max-w-md focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                        <span>{substrateInfo.name}</span>
                        <span>•</span>
                        <span className="text-slate-300 font-semibold">{room.finishType}</span>
                        {room.ceilingHeightFt && (
                          <>
                            <span>•</span>
                            <span>{room.ceilingHeightFt} ft clearance</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Room Quick KPI Badges */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                    <div className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      <span className="text-slate-400">Area: </span>
                      <span className="font-mono font-bold text-white">
                        {unitSystem === 'imperial'
                          ? `${room.planArea.toLocaleString()} sq ft`
                          : `${room.planArea.toLocaleString()} m²`}
                      </span>
                    </div>

                    <div className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      <span className="text-slate-400">Target: </span>
                      <span className="font-mono font-bold text-sky-400">
                        {room.targetMode === 'thermal'
                          ? `R-${room.targetRValue}`
                          : `${room.targetThicknessInches}" (${line.thicknessMm} mm)`}
                      </span>
                    </div>

                    <div className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      <span className="text-slate-400">Yield: </span>
                      <span className="font-mono font-bold text-emerald-400">
                        {line.bags.toLocaleString()} Bags
                      </span>
                    </div>

                    {/* Room Actions */}
                    <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                      <button
                        onClick={() => handleDuplicateRoom(room.id)}
                        title="Duplicate Room"
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        title="Delete Room"
                        className="p-1.5 rounded-lg hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setExpandedRoomId(isExpanded ? null : room.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed Editor */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-slate-950/60 border-t border-slate-800/80 space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Substrate Selector */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                          Substrate Geometry
                        </label>
                        <select
                          value={room.substrateType}
                          onChange={(e) => handleUpdateRoom(room.id, { substrateType: e.target.value })}
                          className="w-full py-2 px-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-sky-500"
                        >
                          {Object.entries(SUBSTRATE_PROFILES).map(([key, val]) => (
                            <option key={key} value={key}>
                              {val.name} ({val.multiplier}x Area)
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-400 italic">{substrateInfo.description}</p>
                      </div>

                      {/* Plan Area Input */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                          Plan Surface Area ({unitSystem === 'imperial' ? 'sq ft' : 'm²'})
                        </label>
                        <input
                          type="number"
                          min={10}
                          step={unitSystem === 'imperial' ? 100 : 10}
                          value={room.planArea}
                          onChange={(e) =>
                            handleUpdateRoom(room.id, { planArea: Math.max(1, Number(e.target.value)) })
                          }
                          className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono font-bold focus:outline-none focus:border-sky-500"
                        />
                        <p className="text-[10px] text-slate-400">
                          Effective Deck Area: {unitSystem === 'imperial' ? `${line.effectiveAreaSqFt} sq ft` : `${line.effectiveAreaSqM} m²`}
                        </p>
                      </div>

                      {/* Target Thermal / Thickness */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                            Thermal / Thickness
                          </label>
                          <div className="flex items-center gap-1 text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleUpdateRoom(room.id, { targetMode: 'thermal' })}
                              className={`px-1.5 py-0.5 rounded ${
                                room.targetMode === 'thermal' ? 'bg-sky-500/30 text-sky-300 font-bold' : 'text-slate-400'
                              }`}
                            >
                              R-Value
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateRoom(room.id, { targetMode: 'thickness' })}
                              className={`px-1.5 py-0.5 rounded ${
                                room.targetMode === 'thickness' ? 'bg-sky-500/30 text-sky-300 font-bold' : 'text-slate-400'
                              }`}
                            >
                              Inches
                            </button>
                          </div>
                        </div>

                        {room.targetMode === 'thermal' ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={4}
                              max={40}
                              step={1}
                              value={room.targetRValue}
                              onChange={(e) =>
                                handleUpdateRoom(room.id, { targetRValue: Number(e.target.value) })
                              }
                              className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono font-bold focus:outline-none focus:border-sky-500"
                            />
                            <span className="text-xs text-sky-400 font-bold">R-Val</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1.0}
                              max={10.0}
                              step={0.25}
                              value={room.targetThicknessInches}
                              onChange={(e) =>
                                handleUpdateRoom(room.id, { targetThicknessInches: Number(e.target.value) })
                              }
                              className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono font-bold focus:outline-none focus:border-sky-500"
                            />
                            <span className="text-xs text-sky-400 font-bold">Inches</span>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 font-mono">
                          {line.thicknessInches}" ({line.thicknessMm} mm) | R-{line.rValue} (RSI {line.rsi})
                        </p>
                      </div>

                      {/* Finish & Coating */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                          Surface Finish Type
                        </label>
                        <select
                          value={room.finishType}
                          onChange={(e) =>
                            handleUpdateRoom(room.id, {
                              finishType: e.target.value as ProjectRoomItem['finishType'],
                            })
                          }
                          className="w-full py-2 px-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-sky-500"
                        >
                          {FINISH_OPTIONS.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-400">
                          {FINISH_OPTIONS.find((f) => f.id === room.finishType)?.description}
                        </p>
                      </div>
                    </div>

                    {/* Secondary Row: Wastage, Height, Site Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/60">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Wastage & Overspray Allowance ({room.wastagePercent}%)
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={20}
                          step={1}
                          value={room.wastagePercent}
                          onChange={(e) =>
                            handleUpdateRoom(room.id, { wastagePercent: Number(e.target.value) })
                          }
                          className="w-full accent-sky-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>0% (Tight)</span>
                          <span>8% (Standard)</span>
                          <span>20% (Complex)</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Ceiling Clearance Height (ft)
                        </label>
                        <input
                          type="number"
                          min={6}
                          max={100}
                          value={room.ceilingHeightFt || 10}
                          onChange={(e) =>
                            handleUpdateRoom(room.id, { ceilingHeightFt: Number(e.target.value) })
                          }
                          placeholder="e.g. 14"
                          className="w-full py-1.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Site Condition / Staging Notes
                        </label>
                        <input
                          type="text"
                          value={room.siteConditionNotes || ''}
                          onChange={(e) =>
                            handleUpdateRoom(room.id, { siteConditionNotes: e.target.value })
                          }
                          placeholder="e.g. Scissor lift access, unpainted steel deck..."
                          className="w-full py-1.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500 font-sans"
                        />
                      </div>
                    </div>

                    {/* Room Output Quick Summary Strip */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-4">
                        <span>
                          <strong className="text-white">Fiber Bags:</strong>{' '}
                          <span className="text-emerald-400 font-mono font-bold">{line.bags} Bags</span>
                        </span>
                        <span>
                          <strong className="text-white">Adhesive:</strong>{' '}
                          <span className="text-amber-400 font-mono font-bold">{line.adhesiveGallons} Gal</span>
                        </span>
                        {line.sonoglazeGallons > 0 && (
                          <span>
                            <strong className="text-white">Sonoglaze:</strong>{' '}
                            <span className="text-sky-400 font-mono font-bold">{line.sonoglazeGallons} Gal</span>
                          </span>
                        )}
                        <span>
                          <strong className="text-white">Acoustic:</strong>{' '}
                          <span className="text-indigo-400 font-mono font-bold">NRC {line.nrc.toFixed(2)}</span>
                        </span>
                        <span>
                          <strong className="text-white">Dead Load:</strong>{' '}
                          <span className="text-slate-300 font-mono font-bold">
                            {unitSystem === 'imperial' ? `${line.deadLoadLbs} lbs` : `${line.deadLoadKg} kg`}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CONSOLIDATED MATERIAL SCHEDULE & TAKEOFF TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Consolidated Takeoff Schedule & Room Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Detailed room-by-room breakdown with engineering factors, acoustic ratings, and container counts.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3"># Room / Zone</th>
                <th className="py-3 px-3">Substrate Profile</th>
                <th className="py-3 px-3">{unitSystem === 'imperial' ? 'Plan Area' : 'Plan Area (m²)'}</th>
                <th className="py-3 px-3">{unitSystem === 'imperial' ? 'Eff. Area' : 'Eff. Area (m²)'}</th>
                <th className="py-3 px-3">Thickness</th>
                <th className="py-3 px-3">Thermal</th>
                <th className="py-3 px-3">Acoustics</th>
                <th className="py-3 px-3">Finish</th>
                <th className="py-3 px-3">Waste</th>
                <th className="py-3 px-3 text-right">Fiber Bags</th>
                <th className="py-3 px-3 text-right">Adhesive</th>
                <th className="py-3 px-3 text-right">Sonoglaze</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {bom.roomBreakdowns.map((line, idx) => (
                <tr key={line.room.id} className="hover:bg-slate-800/40 transition-colors font-sans">
                  <td className="py-2.5 px-3 font-semibold text-white">
                    {idx + 1}. {line.room.name}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {SUBSTRATE_PROFILES[line.room.substrateType]?.name || line.room.substrateType}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">
                    {unitSystem === 'imperial'
                      ? `${line.room.planArea.toLocaleString()} sq ft`
                      : `${line.room.planArea.toLocaleString()} m²`}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-sky-300 font-semibold">
                    {unitSystem === 'imperial'
                      ? `${line.effectiveAreaSqFt.toLocaleString()} sq ft`
                      : `${line.effectiveAreaSqM.toLocaleString()} m²`}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">
                    {unitSystem === 'imperial' ? `${line.thicknessInches.toFixed(1)}"` : `${line.thicknessMm} mm`}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-teal-300 font-bold">
                    {unitSystem === 'imperial' ? `R-${line.rValue.toFixed(1)}` : `RSI ${line.rsi.toFixed(2)}`}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-indigo-300">
                    NRC {line.nrc.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {line.room.finishType}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono">
                    {line.room.wastagePercent}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                    {line.bags.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-300">
                    {line.adhesiveGallons} gal
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-sky-400">
                    {line.sonoglazeGallons > 0 ? `${line.sonoglazeGallons} gal` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-950 font-bold text-white border-t-2 border-slate-700 text-xs">
                <td className="py-3 px-3 uppercase tracking-wider text-sky-400">
                  Consolidated Totals
                </td>
                <td className="py-3 px-3 text-slate-400">
                  {bom.roomBreakdowns.length} Active Zones
                </td>
                <td className="py-3 px-3 font-mono">
                  {unitSystem === 'imperial'
                    ? `${bom.totalPlanAreaSqFt.toLocaleString()} sq ft`
                    : `${bom.totalPlanAreaSqM.toLocaleString()} m²`}
                </td>
                <td className="py-3 px-3 font-mono text-sky-300">
                  {unitSystem === 'imperial'
                    ? `${bom.totalEffectiveAreaSqFt.toLocaleString()} sq ft`
                    : `${bom.totalEffectiveAreaSqM.toLocaleString()} m²`}
                </td>
                <td className="py-3 px-3 font-mono text-slate-400">—</td>
                <td className="py-3 px-3 font-mono text-teal-300">
                  {unitSystem === 'imperial' ? `Avg R-${bom.blendedRValue}` : `Avg RSI ${bom.blendedRsi}`}
                </td>
                <td className="py-3 px-3 font-mono text-indigo-300">
                  Avg NRC {bom.blendedNrc}
                </td>
                <td className="py-3 px-3 text-slate-400">—</td>
                <td className="py-3 px-3 text-slate-400">—</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-400 text-sm">
                  {bom.totalBagsFiber.toLocaleString()} Bags
                </td>
                <td className="py-3 px-3 text-right font-mono text-amber-300 text-sm">
                  {bom.totalAdhesivePails} Pails
                </td>
                <td className="py-3 px-3 text-right font-mono text-sky-400 text-sm">
                  {bom.totalSonoglazeGallons > 0 ? `${bom.totalSonoglazePails} Pails` : '—'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  )}

      {/* Archive Project Modal */}
      <ArchiveProjectModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        project={project}
        onArchivedSuccessfully={handleArchiveSuccess}
      />

      {/* Tender Summary Modal (.txt generator) */}
      <TenderSummaryModal
        isOpen={isTenderSummaryModalOpen}
        onClose={() => setIsTenderSummaryModalOpen(false)}
        project={project}
        bom={bom}
      />

      {/* Share Project Modal (Unique link & Mobile QR generator) */}
      <ShareProjectModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        project={project}
        bom={bom}
      />

      {/* Export Project Summary Modal (Consolidated JSON Backup & Restorer) */}
      <ExportProjectSummaryModal
        isOpen={isExportSummaryModalOpen}
        onClose={() => setIsExportSummaryModalOpen(false)}
        project={project}
        bom={bom}
        onRestoreProject={(restored) => {
          setProject(restored);
          setSaveBanner(`Restored project "${restored.name || 'Untitled'}" from local backup!`);
          setTimeout(() => setSaveBanner(null), 4500);
        }}
      />

      {/* Local Storage & Revision History Manager Modal */}
      <StorageManagerModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        currentProject={project}
        onRestoreRevision={(restored) => {
          setProject(restored);
          setSaveBanner(`Restored project workspace to snapshot "${restored.name || 'Untitled'}" (${restored.rooms.length} zones)!`);
          setTimeout(() => setSaveBanner(null), 4500);
        }}
      />
    </div>
  );
};
