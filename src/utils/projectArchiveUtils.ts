import { MultiRoomProject, ArchivedProject, ProjectArchiveStatus, SavedProjectCostEstimate } from '../types';
import { calculateConsolidatedBom } from './estimatorUtils';
import { getEstimatorDatabase } from './indexedDbStorage';

export const PROJECT_ARCHIVE_STORAGE_KEY = 'monoglass_saved_projects_archive_v1';

// Initial realistic historical reference projects to populate the archive
const INITIAL_HISTORICAL_ARCHIVES: ArchivedProject[] = [
  {
    id: 'arch-hist-001',
    originalProjectId: 'proj-historical-01',
    name: 'Pacific Arts Center Symphony Hall & Upper Balcony',
    projectType: 'Auditorium & Performing Arts Center',
    location: 'Seattle, WA',
    clientOrArchitect: 'LMN Architects / Sound Solutions Acoustics',
    unitSystem: 'imperial',
    status: 'completed',
    archiveReason: 'Installation Completed & Acoustically Certified',
    archiveNotes: 'Successfully completed spray application of 5.0" Monoglass Black (NRC 0.95) over fluted metal decking with Sonoglaze hard-coat finish on perimeter acoustic baffles. Passed third-party acoustic reverberation testing at 1.4s RT60.',
    archivedAt: '2026-06-18T14:30:00.000Z',
    lastUpdated: '2026-06-18T14:30:00.000Z',
    finalContractValue: 148500,
    totalPlanArea: 18500,
    totalEffectiveArea: 23125,
    roomCount: 3,
    totalBagsFiber: 3470,
    totalAdhesivePails: 382,
    totalSonoglazePails: 62,
    blendedRValue: 20.0,
    blendedNrc: 0.95,
    projectData: {
      id: 'proj-historical-01',
      name: 'Pacific Arts Center Symphony Hall & Upper Balcony',
      projectType: 'Auditorium & Performing Arts Center',
      location: 'Seattle, WA',
      clientOrArchitect: 'LMN Architects / Sound Solutions Acoustics',
      unitSystem: 'imperial',
      status: 'completed',
      archivedAt: '2026-06-18T14:30:00.000Z',
      archiveReason: 'Installation Completed & Acoustically Certified',
      archiveNotes: 'Successfully completed spray application of 5.0" Monoglass Black (NRC 0.95) over fluted metal decking with Sonoglaze hard-coat finish on perimeter acoustic baffles.',
      finalContractValue: 148500,
      rooms: [
        {
          id: 'room-arch-1',
          name: 'Main Auditorium Ceiling & Cloud Canopy',
          planArea: 12000,
          substrateType: 'fluted-metal-1.5',
          targetMode: 'thermal',
          targetRValue: 20,
          targetThicknessInches: 5.0,
          finishType: 'Monoglass Black',
          wastagePercent: 8,
          ceilingHeightFt: 38,
          siteConditionNotes: 'High-access boom lifts required over sloped orchestra tier. Clean air ventilation maintained during 48h cure.',
          enabled: true,
        },
        {
          id: 'room-arch-2',
          name: 'Upper Balcony Soffit & Return Plenum',
          planArea: 4500,
          substrateType: 'open-web-joists',
          targetMode: 'thermal',
          targetRValue: 20,
          targetThicknessInches: 5.0,
          finishType: 'Monoglass Black',
          wastagePercent: 12,
          ceilingHeightFt: 22,
          siteConditionNotes: 'Bridging and gusset plates masked prior to spray prime.',
          enabled: true,
        },
        {
          id: 'room-arch-3',
          name: 'Sound Stage Proscenium Transition',
          planArea: 2000,
          substrateType: 'flat-concrete',
          targetMode: 'thickness',
          targetRValue: 16,
          targetThicknessInches: 4.0,
          finishType: 'Sonoglaze Hard-Coat',
          wastagePercent: 8,
          ceilingHeightFt: 28,
          siteConditionNotes: 'Sonoglaze hard-coat applied at 75 sq ft/gal for mechanical scuff protection.',
          enabled: true,
        },
      ],
      notes: 'Completed contract bid under CSI Section 09 81 00 Acoustic Spray Insulation.',
      lastUpdated: '2026-06-18T14:30:00.000Z',
    },
  },
  {
    id: 'arch-hist-002',
    originalProjectId: 'proj-historical-02',
    name: 'Cascade Distribution Logistics Hub (Value-Engineered)',
    projectType: 'Industrial Warehouse & Logistics',
    location: 'Calgary, AB',
    clientOrArchitect: 'Pinnacle Industrial REIT / Stantec',
    unitSystem: 'imperial',
    status: 'abandoned',
    archiveReason: 'Value-Engineered Out / General Contractor Switched to Rigid Board',
    archiveNotes: 'Project estimate closed. General Contractor elected to install 2-inch polyiso board on roof exterior rather than underside spray application due to pre-existing steel deck delivery delays.',
    archivedAt: '2026-04-12T09:15:00.000Z',
    lastUpdated: '2026-04-12T09:15:00.000Z',
    finalContractValue: 215000,
    totalPlanArea: 48000,
    totalEffectiveArea: 60000,
    roomCount: 2,
    totalBagsFiber: 8572,
    totalAdhesivePails: 943,
    totalSonoglazePails: 0,
    blendedRValue: 16.0,
    blendedNrc: 0.85,
    projectData: {
      id: 'proj-historical-02',
      name: 'Cascade Distribution Logistics Hub (Value-Engineered)',
      projectType: 'Industrial Warehouse & Logistics',
      location: 'Calgary, AB',
      clientOrArchitect: 'Pinnacle Industrial REIT / Stantec',
      unitSystem: 'imperial',
      status: 'abandoned',
      archivedAt: '2026-04-12T09:15:00.000Z',
      archiveReason: 'Value-Engineered Out / General Contractor Switched to Rigid Board',
      archiveNotes: 'Project estimate closed. General Contractor elected to install 2-inch polyiso board on roof exterior rather than underside spray application due to pre-existing steel deck delivery delays.',
      rooms: [
        {
          id: 'room-arch-4',
          name: 'Main High-Bay Warehouse Roof Deck',
          planArea: 40000,
          substrateType: 'fluted-metal-3.0',
          targetMode: 'thermal',
          targetRValue: 16,
          targetThicknessInches: 4.0,
          finishType: 'Natural White',
          wastagePercent: 8,
          ceilingHeightFt: 32,
          siteConditionNotes: '3.0 inch deep fluted deck with bar joists at 6ft on center.',
          enabled: true,
        },
        {
          id: 'room-arch-5',
          name: 'Loading Bay Canopies & Truck Staging',
          planArea: 8000,
          substrateType: 'flat-concrete',
          targetMode: 'thermal',
          targetRValue: 16,
          targetThicknessInches: 4.0,
          finishType: 'Natural White',
          wastagePercent: 8,
          ceilingHeightFt: 18,
          siteConditionNotes: 'Exterior unconditioned soffit exposure.',
          enabled: true,
        },
      ],
      notes: 'Monoglass thermal insulation bid takeoff. Archived for reference pricing.',
      lastUpdated: '2026-04-12T09:15:00.000Z',
    },
  },
];

/**
 * Retrieves all archived projects from LocalStorage and IndexedDB
 */
export function getArchivedProjects(): ArchivedProject[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return INITIAL_HISTORICAL_ARCHIVES;
  }

  try {
    const raw = localStorage.getItem(PROJECT_ARCHIVE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse archived projects from localStorage:', err);
  }

  // Initialize with realistic defaults if storage is empty
  try {
    localStorage.setItem(PROJECT_ARCHIVE_STORAGE_KEY, JSON.stringify(INITIAL_HISTORICAL_ARCHIVES));
  } catch (err) {
    console.warn('Could not seed initial archives to localStorage:', err);
  }

  return INITIAL_HISTORICAL_ARCHIVES;
}

/**
 * Saves the list of archived projects to LocalStorage and syncs to IndexedDB
 */
export function saveArchivedProjects(archives: ArchivedProject[]): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(PROJECT_ARCHIVE_STORAGE_KEY, JSON.stringify(archives));
    } catch (err) {
      console.warn('Failed to save archived projects to localStorage:', err);
    }
  }

  // Sync to IndexedDB asynchronously
  (async () => {
    try {
      const db = await getEstimatorDatabase();
      if (db) {
        const tx = db.transaction('projects', 'readwrite');
        const store = tx.objectStore('projects');
        // Store each archived project into the projects store
        archives.forEach((arch) => {
          store.put({
            ...arch.projectData,
            id: arch.id,
            status: arch.status,
            archivedAt: arch.archivedAt,
            archiveReason: arch.archiveReason,
            archiveNotes: arch.archiveNotes,
            isArchived: true,
          });
        });
      }
    } catch (e) {
      console.warn('Failed to sync archives to IndexedDB:', e);
    }
  })();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('monoglass-project-archives-updated', {
        detail: { archives, count: archives.length },
      })
    );
  }
}

/**
 * Archives an active project estimate, calculates BOM metrics snapshot, and inserts it into the archive store
 */
export function archiveProjectEstimate(
  project: MultiRoomProject,
  status: ProjectArchiveStatus = 'completed',
  options?: {
    archiveReason?: string;
    archiveNotes?: string;
    finalContractValue?: number;
    costEstimateData?: SavedProjectCostEstimate;
  }
): ArchivedProject {
  const now = new Date().toISOString();
  const unitSystem = project.unitSystem || 'imperial';
  const bom = calculateConsolidatedBom(project, unitSystem);

  const existingArchives = getArchivedProjects();
  const archiveId = `arch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const cleanProjectData: MultiRoomProject = {
    ...JSON.parse(JSON.stringify(project)),
    status,
    archivedAt: now,
    archiveReason: options?.archiveReason,
    archiveNotes: options?.archiveNotes,
    finalContractValue: options?.finalContractValue,
    lastUpdated: now,
  };

  const archivedItem: ArchivedProject = {
    id: archiveId,
    originalProjectId: project.id || `proj-${Date.now()}`,
    name: project.name || 'Untitled Estimate Takeoff',
    projectType: project.projectType || 'Commercial Building',
    location: project.location,
    clientOrArchitect: project.clientOrArchitect,
    unitSystem,
    status,
    archiveReason: options?.archiveReason,
    archiveNotes: options?.archiveNotes,
    archivedAt: now,
    lastUpdated: now,
    finalContractValue: options?.finalContractValue,
    totalPlanArea: unitSystem === 'metric' ? bom.totalPlanAreaSqM : bom.totalPlanAreaSqFt,
    totalEffectiveArea: unitSystem === 'metric' ? bom.totalEffectiveAreaSqM : bom.totalEffectiveAreaSqFt,
    roomCount: project.rooms.length,
    totalBagsFiber: bom.totalBagsFiber,
    totalAdhesivePails: bom.totalAdhesivePails,
    totalSonoglazePails: bom.totalSonoglazePails,
    blendedRValue: bom.blendedRValue,
    blendedNrc: bom.blendedNrc,
    projectData: cleanProjectData,
    costEstimateData: options?.costEstimateData || project.costEstimate,
  };

  const updatedArchives = [archivedItem, ...existingArchives.filter((a) => a.id !== archiveId)];
  saveArchivedProjects(updatedArchives);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('monoglass-project-archived', {
        detail: { archivedItem },
      })
    );
  }

  return archivedItem;
}

/**
 * Restores an archived project back into an active MultiRoomProject format
 */
export function restoreArchivedProject(archiveId: string): MultiRoomProject | null {
  const archives = getArchivedProjects();
  const target = archives.find((a) => a.id === archiveId);
  if (!target) return null;

  const restoredProject: MultiRoomProject = {
    ...JSON.parse(JSON.stringify(target.projectData)),
    id: target.originalProjectId || `proj-${Date.now()}`,
    status: 'active',
    lastUpdated: new Date().toISOString(),
  };

  return restoredProject;
}

/**
 * Duplicates an archived project as a fresh new project takeoff (leaving the archive record intact)
 */
export function duplicateArchivedProject(archiveId: string, customName?: string): MultiRoomProject | null {
  const archives = getArchivedProjects();
  const target = archives.find((a) => a.id === archiveId);
  if (!target) return null;

  const now = new Date();
  const clonedProject: MultiRoomProject = {
    ...JSON.parse(JSON.stringify(target.projectData)),
    id: `proj-${Date.now()}`,
    name: customName || `${target.name} (Active Clone)`,
    status: 'active',
    archiveReason: undefined,
    archivedAt: undefined,
    archiveNotes: undefined,
    rooms: target.projectData.rooms.map((r, idx) => ({
      ...r,
      id: `room-${Date.now()}-${idx}`,
    })),
    lastUpdated: now.toISOString(),
  };

  return clonedProject;
}

/**
 * Deletes an archived project permanently
 */
export function deleteArchivedProject(archiveId: string): boolean {
  const archives = getArchivedProjects();
  const filtered = archives.filter((a) => a.id !== archiveId);
  if (filtered.length === archives.length) return false;

  saveArchivedProjects(filtered);
  return true;
}

/**
 * Updates metadata of an existing archived project (e.g. changes status or notes)
 */
export function updateArchivedProject(
  archiveId: string,
  updates: Partial<ArchivedProject>
): boolean {
  const archives = getArchivedProjects();
  const idx = archives.findIndex((a) => a.id === archiveId);
  if (idx === -1) return false;

  const current = archives[idx];
  const updated: ArchivedProject = {
    ...current,
    ...updates,
    projectData: {
      ...current.projectData,
      ...(updates.name ? { name: updates.name } : {}),
      ...(updates.projectType ? { projectType: updates.projectType } : {}),
      ...(updates.status ? { status: updates.status } : {}),
      ...(updates.archiveNotes !== undefined ? { archiveNotes: updates.archiveNotes } : {}),
      ...(updates.archiveReason !== undefined ? { archiveReason: updates.archiveReason } : {}),
      ...(updates.finalContractValue !== undefined ? { finalContractValue: updates.finalContractValue } : {}),
      lastUpdated: new Date().toISOString(),
    },
    lastUpdated: new Date().toISOString(),
  };

  archives[idx] = updated;
  saveArchivedProjects([...archives]);
  return true;
}

/**
 * Downloads a single archived project JSON specification
 */
export function exportArchivedProjectJson(archive: ArchivedProject): void {
  const cleanName = (archive.name || 'Archived_Project').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = (archive.archivedAt || new Date().toISOString()).split('T')[0];
  const filename = `Monoglass_Archive_${archive.status.toUpperCase()}_${cleanName}_${dateStr}.json`;

  const payload = {
    archiveMeta: {
      archiveId: archive.id,
      originalProjectId: archive.originalProjectId,
      status: archive.status,
      archiveReason: archive.archiveReason,
      archiveNotes: archive.archiveNotes,
      archivedAt: archive.archivedAt,
      exportedAt: new Date().toISOString(),
      generator: 'Monoglass® Project Archive System',
    },
    projectTakeoff: archive.projectData,
    summaryMetrics: {
      totalPlanArea: archive.totalPlanArea,
      totalEffectiveArea: archive.totalEffectiveArea,
      unitSystem: archive.unitSystem,
      roomCount: archive.roomCount,
      totalBagsFiber: archive.totalBagsFiber,
      totalAdhesivePails: archive.totalAdhesivePails,
      totalSonoglazePails: archive.totalSonoglazePails,
      blendedRValue: archive.blendedRValue,
      blendedNrc: archive.blendedNrc,
      finalContractValue: archive.finalContractValue,
    },
    costEstimate: archive.costEstimateData,
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
