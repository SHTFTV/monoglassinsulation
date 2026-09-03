import { MultiRoomProject, ConsolidatedBom } from '../types';
import { SAVED_COST_ESTIMATES_KEY } from './costEstimatorUtils';

export const PROJECT_STORAGE_KEY = 'monoglass_multi_room_project_v1';
export const PROJECT_ARCHIVE_STORAGE_KEY = 'monoglass_saved_projects_archive_v1';

export interface ConsolidatedProjectBackup {
  exportMeta: {
    formatVersion: '2.0.0';
    generator: string;
    exportTimestamp: string;
    exportDateFormatted: string;
    appUrl: string;
    unitSystem: 'imperial' | 'metric';
    totalActiveRooms: number;
    totalFiberBags: number;
    totalEffectiveAreaFormatted: string;
  };
  project: MultiRoomProject;
  consolidatedTakeoffBom: {
    totalPlanArea: number;
    totalEffectiveArea: number;
    areaUnit: string;
    totalBagsFiber: number;
    totalAdhesiveConcentrateGallons: number;
    totalAdhesivePails: number;
    totalSonoglazeGallons: number;
    totalSonoglazePails: number;
    blendedRValue: number;
    blendedRsi: number;
    blendedNrc: number;
    totalDeadLoadLbs: number;
    totalDeadLoadKg: number;
    roomBreakdowns: Array<{
      roomId: string;
      roomName: string;
      substrateType: string;
      planArea: number;
      effectiveArea: number;
      thicknessInches: number;
      thicknessMm: number;
      rValue: number;
      rsi: number;
      nrc: number;
      finishType: string;
      wastagePercent: number;
      bags: number;
      adhesiveGallons: number;
      sonoglazeGallons: number;
      deadLoadLbs: number;
      deadLoadKg: number;
      siteConditionNotes?: string;
    }>;
  };
  analyticsSummary: {
    primaryMaterialConsumerRoom?: {
      name: string;
      bags: number;
      percentage: number;
    };
    substrateExpansionRatio: number;
    flutingAreaIncreasePercent: number;
  };
  savedProjectsArchive?: MultiRoomProject[];
  savedCostEstimates?: any[];
  siteConditionsAndTenderNotes?: Array<{
    roomName: string;
    notes: string;
  }>;
}

/**
 * Compiles a rich consolidated project summary backup object
 */
export function buildConsolidatedProjectBackup(
  project: MultiRoomProject,
  bom: ConsolidatedBom,
  options?: {
    includeArchive?: boolean;
    includeCostEstimates?: boolean;
  }
): ConsolidatedProjectBackup {
  const unitSystem = project.unitSystem || 'imperial';
  const now = new Date();

  // Calculate high-consumer room
  const breakdowns = bom.roomBreakdowns || [];
  let primaryConsumer: { name: string; bags: number; percentage: number } | undefined;
  if (breakdowns.length > 0 && bom.totalBagsFiber > 0) {
    const sorted = [...breakdowns].sort((a, b) => b.bags - a.bags);
    const top = sorted[0];
    primaryConsumer = {
      name: top.room.name || 'Untitled Room',
      bags: top.bags,
      percentage: Number(((top.bags / bom.totalBagsFiber) * 100).toFixed(1)),
    };
  }

  // Calculate fluting expansion
  const planArea = unitSystem === 'metric' ? bom.totalPlanAreaSqM : bom.totalPlanAreaSqFt;
  const effArea = unitSystem === 'metric' ? bom.totalEffectiveAreaSqM : bom.totalEffectiveAreaSqFt;
  const flutingIncreasePct = planArea > 0 ? Number((((effArea - planArea) / planArea) * 100).toFixed(1)) : 0;
  const substrateRatio = planArea > 0 ? Number((effArea / planArea).toFixed(2)) : 1.0;

  // Retrieve saved archives from localStorage if available
  let savedArchive: MultiRoomProject[] = [];
  let savedCostEstimates: any[] = [];
  if (typeof window !== 'undefined') {
    if (options?.includeArchive !== false) {
      try {
        const storedArchive = localStorage.getItem(PROJECT_ARCHIVE_STORAGE_KEY);
        if (storedArchive) {
          const parsed = JSON.parse(storedArchive);
          if (Array.isArray(parsed)) savedArchive = parsed;
        }
      } catch (e) {
        console.warn('Could not read project archive:', e);
      }
    }

    if (options?.includeCostEstimates !== false) {
      try {
        const storedCosts = localStorage.getItem(SAVED_COST_ESTIMATES_KEY);
        if (storedCosts) {
          const parsed = JSON.parse(storedCosts);
          if (Array.isArray(parsed)) savedCostEstimates = parsed;
        }
      } catch (e) {
        console.warn('Could not read cost estimates:', e);
      }
    }
  }

  // Filter site condition notes
  const siteNotes = project.rooms
    .filter((r) => r.siteConditionNotes && r.siteConditionNotes.trim().length > 0)
    .map((r) => ({
      roomName: r.name || 'Untitled Room',
      notes: r.siteConditionNotes!.trim(),
    }));

  return {
    exportMeta: {
      formatVersion: '2.0.0',
      generator: 'Monoglass® Multi-Room Project Estimator',
      exportTimestamp: now.toISOString(),
      exportDateFormatted: now.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      appUrl: typeof window !== 'undefined' ? window.location.origin : 'https://monoglass.com',
      unitSystem,
      totalActiveRooms: breakdowns.length,
      totalFiberBags: bom.totalBagsFiber,
      totalEffectiveAreaFormatted: `${effArea.toLocaleString()} ${unitSystem === 'metric' ? 'm²' : 'sq ft'}`,
    },
    project,
    consolidatedTakeoffBom: {
      totalPlanArea: planArea,
      totalEffectiveArea: effArea,
      areaUnit: unitSystem === 'metric' ? 'sq meters' : 'sq ft',
      totalBagsFiber: bom.totalBagsFiber,
      totalAdhesiveConcentrateGallons: Number(bom.totalAdhesiveConcentrateGallons.toFixed(1)),
      totalAdhesivePails: bom.totalAdhesivePails,
      totalSonoglazeGallons: Number(bom.totalSonoglazeGallons.toFixed(1)),
      totalSonoglazePails: bom.totalSonoglazePails,
      blendedRValue: bom.blendedRValue,
      blendedRsi: bom.blendedRsi,
      blendedNrc: bom.blendedNrc,
      totalDeadLoadLbs: Math.round(bom.totalDeadLoadLbs),
      totalDeadLoadKg: Math.round(bom.totalDeadLoadKg),
      roomBreakdowns: breakdowns.map((b) => ({
        roomId: b.room.id,
        roomName: b.room.name || 'Untitled Room',
        substrateType: b.room.substrateType,
        planArea: b.room.planArea,
        effectiveArea: unitSystem === 'metric' ? b.effectiveAreaSqM : b.effectiveAreaSqFt,
        thicknessInches: Number(b.thicknessInches.toFixed(2)),
        thicknessMm: b.thicknessMm,
        rValue: Number(b.rValue.toFixed(1)),
        rsi: Number(b.rsi.toFixed(2)),
        nrc: Number(b.nrc.toFixed(2)),
        finishType: b.room.finishType,
        wastagePercent: b.room.wastagePercent,
        bags: b.bags,
        adhesiveGallons: Number(b.adhesiveGallons.toFixed(1)),
        sonoglazeGallons: Number(b.sonoglazeGallons.toFixed(1)),
        deadLoadLbs: Math.round(b.deadLoadLbs),
        deadLoadKg: Math.round(b.deadLoadKg),
        siteConditionNotes: b.room.siteConditionNotes,
      })),
    },
    analyticsSummary: {
      primaryMaterialConsumerRoom: primaryConsumer,
      substrateExpansionRatio: substrateRatio,
      flutingAreaIncreasePercent: flutingIncreasePct,
    },
    savedProjectsArchive: savedArchive.length > 0 ? savedArchive : undefined,
    savedCostEstimates: savedCostEstimates.length > 0 ? savedCostEstimates : undefined,
    siteConditionsAndTenderNotes: siteNotes.length > 0 ? siteNotes : undefined,
  };
}

/**
 * Triggers file download of consolidated project summary JSON in the browser
 */
export function downloadConsolidatedProjectSummaryJson(
  project: MultiRoomProject,
  bom: ConsolidatedBom,
  options?: {
    includeArchive?: boolean;
    includeCostEstimates?: boolean;
    customFileName?: string;
  }
): void {
  const backup = buildConsolidatedProjectBackup(project, bom, options);
  const jsonString = JSON.stringify(backup, null, 2);
  
  const cleanName = (project.name || 'Project').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = options?.customFileName || `Monoglass_ProjectSummary_${cleanName}_${dateStr}.json`;

  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Validates and parses imported JSON string, resolving either a consolidated backup or raw project takeoff
 */
export function parseImportedProjectJson(jsonText: string): {
  success: boolean;
  project?: MultiRoomProject;
  backup?: ConsolidatedProjectBackup;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonText);
    
    // Case 1: Full Consolidated Project Backup Bundle
    if (parsed && parsed.exportMeta && parsed.project && Array.isArray(parsed.project.rooms)) {
      return {
        success: true,
        project: parsed.project,
        backup: parsed as ConsolidatedProjectBackup,
      };
    }

    // Case 2: Standalone MultiRoomProject file
    if (parsed && Array.isArray(parsed.rooms)) {
      return {
        success: true,
        project: parsed as MultiRoomProject,
      };
    }

    return {
      success: false,
      error: 'The uploaded file does not contain a valid Monoglass project structure or rooms array.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to parse JSON file: ${err.message || 'Syntax error'}`,
    };
  }
}
