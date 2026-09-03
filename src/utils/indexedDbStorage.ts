import { MultiRoomProject, CostEstimatorInput } from '../types';

export const DB_NAME = 'MonoglassEstimatorDB';
export const DB_VERSION = 2;

export const LS_ACTIVE_PROJECT_KEY = 'monoglass_multi_room_project_v1';
export const LS_ACTIVE_COST_INPUT_KEY = 'monoglass_active_cost_input_v1';
export const LS_PROJECT_REVISIONS_KEY = 'monoglass_project_revisions_backup_v1';

export interface StoredProjectRevision {
  id: string;
  projectId: string;
  projectName: string;
  timestamp: string;
  description: string;
  roomCount: number;
  totalPlanArea: number;
  unitSystem: 'imperial' | 'metric';
  projectData: MultiRoomProject;
}

export interface StorageDiagnostics {
  indexedDbSupported: boolean;
  indexedDbReady: boolean;
  localStorageSupported: boolean;
  lastSavedTimestamp: string | null;
  revisionCount: number;
  estimatedStorageSizeKb: number;
}

let dbInstance: IDBDatabase | null = null;
let isOpening = false;
const pendingDbPromises: Array<(db: IDBDatabase | null) => void> = [];

/**
 * Initializes and returns the IndexedDB instance with error handling
 */
export function getEstimatorDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    if (isOpening) {
      pendingDbPromises.push(resolve);
      return;
    }

    isOpening = true;

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 1. Key-Value Store for active states
        if (!db.objectStoreNames.contains('key_value')) {
          db.createObjectStore('key_value', { keyPath: 'key' });
        }

        // 2. Multi-room Projects Store
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }

        // 3. Project Revision Snapshots Store
        if (!db.objectStoreNames.contains('revisions')) {
          const revStore = db.createObjectStore('revisions', { keyPath: 'id' });
          revStore.createIndex('projectId', 'projectId', { unique: false });
          revStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 4. Cost Estimates Store
        if (!db.objectStoreNames.contains('cost_estimates')) {
          const costStore = db.createObjectStore('cost_estimates', { keyPath: 'id' });
          costStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        isOpening = false;
        resolve(dbInstance);
        pendingDbPromises.forEach((cb) => cb(dbInstance));
        pendingDbPromises.length = 0;
      };

      request.onerror = (event) => {
        console.warn('IndexedDB failed to open, falling back to LocalStorage:', event);
        isOpening = false;
        resolve(null);
        pendingDbPromises.forEach((cb) => cb(null));
        pendingDbPromises.length = 0;
      };

      request.onblocked = () => {
        console.warn('IndexedDB database upgrade is blocked by another tab.');
        isOpening = false;
        resolve(null);
        pendingDbPromises.forEach((cb) => cb(null));
        pendingDbPromises.length = 0;
      };
    } catch (e) {
      console.warn('IndexedDB initialization exception:', e);
      isOpening = false;
      resolve(null);
    }
  });
}

/**
 * Saves the active MultiRoomProject to both LocalStorage (synchronous) and IndexedDB (asynchronous)
 */
let revisionDebounceTimeout: any = null;
let lastSavedHash = '';

export async function saveActiveProject(project: MultiRoomProject, options?: { createRevision?: boolean; revisionDesc?: string }): Promise<boolean> {
  const timestamp = new Date().toISOString();
  const projectToSave: MultiRoomProject = {
    ...project,
    lastUpdated: timestamp,
  };

  // 1. Dual-layer: Synchronous write to LocalStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(LS_ACTIVE_PROJECT_KEY, JSON.stringify(projectToSave));
    } catch (err) {
      console.warn('LocalStorage save failed (possible quota limit):', err);
    }
  }

  // 2. Dual-layer: Asynchronous write to IndexedDB
  try {
    const db = await getEstimatorDatabase();
    if (db) {
      const tx = db.transaction(['key_value', 'projects'], 'readwrite');
      const kvStore = tx.objectStore('key_value');
      const projStore = tx.objectStore('projects');

      kvStore.put({ key: 'active_project', value: projectToSave, updatedAt: timestamp });
      if (projectToSave.id) {
        projStore.put(projectToSave);
      }
    }
  } catch (err) {
    console.warn('IndexedDB save failed:', err);
  }

  // 3. Auto-save Revision Snapshot (debounced to avoid spamming revisions on every keystroke)
  const currentHash = `${project.name}-${project.rooms.length}-${project.rooms.map(r => `${r.id}:${r.planArea}:${r.substrateType}`).join('|')}`;
  
  if (options?.createRevision || currentHash !== lastSavedHash) {
    if (revisionDebounceTimeout) clearTimeout(revisionDebounceTimeout);
    
    const delay = options?.createRevision ? 0 : 3000; // 3 second debounce for automatic revisions
    revisionDebounceTimeout = setTimeout(async () => {
      lastSavedHash = currentHash;
      await createProjectRevision(projectToSave, options?.revisionDesc || (options?.createRevision ? 'Manual Snapshot' : 'Auto-save Milestone'));
    }, delay);
  }

  // Notify active listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('monoglass-project-saved', { detail: { project: projectToSave, timestamp } }));
  }

  return true;
}

/**
 * Loads the active project synchronously from LocalStorage with an async IndexedDB fallback verification
 */
export function loadActiveProjectSync(defaultFallback: MultiRoomProject): MultiRoomProject {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultFallback;
  }
  try {
    const saved = localStorage.getItem(LS_ACTIVE_PROJECT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.rooms)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse active project from localStorage:', err);
  }
  return defaultFallback;
}

/**
 * Loads active project asynchronously from IndexedDB if fresher or LocalStorage missing
 */
export async function loadActiveProjectAsync(): Promise<MultiRoomProject | null> {
  try {
    const db = await getEstimatorDatabase();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction('key_value', 'readonly');
        const store = tx.objectStore('key_value');
        const req = store.get('active_project');
        req.onsuccess = () => {
          if (req.result && req.result.value && Array.isArray(req.result.value.rooms)) {
            resolve(req.result.value as MultiRoomProject);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    }
  } catch (e) {
    console.warn('Could not read project from IndexedDB:', e);
  }
  return null;
}

/**
 * Saves active Cost & Budget Estimator input configuration
 */
export async function saveActiveCostInput(input: CostEstimatorInput): Promise<void> {
  const timestamp = new Date().toISOString();

  // LocalStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(LS_ACTIVE_COST_INPUT_KEY, JSON.stringify(input));
    } catch (e) {
      console.warn('LocalStorage save cost input error:', e);
    }
  }

  // IndexedDB
  try {
    const db = await getEstimatorDatabase();
    if (db) {
      const tx = db.transaction('key_value', 'readwrite');
      const store = tx.objectStore('key_value');
      store.put({ key: 'active_cost_input', value: input, updatedAt: timestamp });
    }
  } catch (e) {
    console.warn('IndexedDB save cost input error:', e);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('monoglass-cost-input-saved', { detail: { input, timestamp } }));
  }
}

/**
 * Loads active Cost & Budget Estimator input configuration
 */
export function loadActiveCostInputSync(fallback: CostEstimatorInput): CostEstimatorInput {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const saved = localStorage.getItem(LS_ACTIVE_COST_INPUT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return { ...fallback, ...parsed };
      }
    }
  } catch (e) {
    console.warn('Could not read cost input from localStorage:', e);
  }
  return fallback;
}

/**
 * Creates a timestamped revision snapshot in IndexedDB (and LocalStorage backup for top 5)
 */
export async function createProjectRevision(project: MultiRoomProject, description: string = 'Auto Snapshot'): Promise<StoredProjectRevision> {
  const now = new Date();
  const totalPlan = project.rooms.reduce((acc, r) => acc + (r.planArea || 0), 0);

  const revision: StoredProjectRevision = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    projectId: project.id || 'default-project',
    projectName: project.name || 'Untitled Takeoff',
    timestamp: now.toISOString(),
    description,
    roomCount: project.rooms.length,
    totalPlanArea: totalPlan,
    unitSystem: project.unitSystem || 'imperial',
    projectData: JSON.parse(JSON.stringify(project)),
  };

  // 1. Write to IndexedDB revisions store
  try {
    const db = await getEstimatorDatabase();
    if (db) {
      const tx = db.transaction('revisions', 'readwrite');
      const store = tx.objectStore('revisions');
      store.put(revision);
    }
  } catch (e) {
    console.warn('Failed to write revision to IndexedDB:', e);
  }

  // 2. Keep top 8 latest revisions in LocalStorage as backup
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const existing = getProjectRevisionsFromLocalStorage();
      const updated = [revision, ...existing.filter((r) => r.id !== revision.id)].slice(0, 10);
      localStorage.setItem(LS_PROJECT_REVISIONS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to write revisions to localStorage:', e);
    }
  }

  return revision;
}

/**
 * Gets revisions from LocalStorage
 */
export function getProjectRevisionsFromLocalStorage(): StoredProjectRevision[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const saved = localStorage.getItem(LS_PROJECT_REVISIONS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('LocalStorage revisions parse error:', e);
  }
  return [];
}

/**
 * Retrieves all stored revisions across IndexedDB and LocalStorage
 */
export async function getAllProjectRevisions(): Promise<StoredProjectRevision[]> {
  const localRevisions = getProjectRevisionsFromLocalStorage();
  try {
    const db = await getEstimatorDatabase();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction('revisions', 'readonly');
        const store = tx.objectStore('revisions');
        const req = store.getAll();
        req.onsuccess = () => {
          const dbRevs: StoredProjectRevision[] = req.result || [];
          // Merge by id, sort newest first
          const map = new Map<string, StoredProjectRevision>();
          localRevisions.forEach((r) => map.set(r.id, r));
          dbRevs.forEach((r) => map.set(r.id, r));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          resolve(merged);
        };
        req.onerror = () => resolve(localRevisions);
      });
    }
  } catch (e) {
    console.warn('Error reading revisions from IndexedDB:', e);
  }
  return localRevisions;
}

/**
 * Deletes a single revision from IndexedDB and LocalStorage
 */
export async function deleteProjectRevision(revisionId: string): Promise<void> {
  // LocalStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const existing = getProjectRevisionsFromLocalStorage();
      const filtered = existing.filter((r) => r.id !== revisionId);
      localStorage.setItem(LS_PROJECT_REVISIONS_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Failed to delete from localStorage:', e);
    }
  }

  // IndexedDB
  try {
    const db = await getEstimatorDatabase();
    if (db) {
      const tx = db.transaction('revisions', 'readwrite');
      const store = tx.objectStore('revisions');
      store.delete(revisionId);
    }
  } catch (e) {
    console.warn('Failed to delete from IndexedDB:', e);
  }
}

/**
 * Clears all stored project data and resets storage
 */
export async function clearAllEstimatorStorage(): Promise<void> {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(LS_ACTIVE_PROJECT_KEY);
    localStorage.removeItem(LS_ACTIVE_COST_INPUT_KEY);
    localStorage.removeItem(LS_PROJECT_REVISIONS_KEY);
  }

  try {
    const db = await getEstimatorDatabase();
    if (db) {
      const tx = db.transaction(['key_value', 'projects', 'revisions'], 'readwrite');
      tx.objectStore('key_value').clear();
      tx.objectStore('projects').clear();
      tx.objectStore('revisions').clear();
    }
  } catch (e) {
    console.warn('Error clearing IndexedDB:', e);
  }
}

/**
 * Returns detailed storage health diagnostics
 */
export async function getStorageDiagnostics(): Promise<StorageDiagnostics> {
  const indexedDbSupported = typeof window !== 'undefined' && !!window.indexedDB;
  const localStorageSupported = typeof window !== 'undefined' && !!window.localStorage;
  
  let indexedDbReady = false;
  try {
    const db = await getEstimatorDatabase();
    indexedDbReady = !!db;
  } catch {
    indexedDbReady = false;
  }

  const revisions = await getAllProjectRevisions();
  
  // Calculate estimated size
  let totalBytes = 0;
  if (localStorageSupported) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('monoglass_')) {
        const val = localStorage.getItem(key) || '';
        totalBytes += key.length + val.length;
      }
    }
  }

  let lastSaved: string | null = null;
  if (localStorageSupported) {
    try {
      const activeProj = localStorage.getItem(LS_ACTIVE_PROJECT_KEY);
      if (activeProj) {
        const parsed = JSON.parse(activeProj);
        if (parsed.lastUpdated) lastSaved = parsed.lastUpdated;
      }
    } catch {
      // fallback
    }
  }

  return {
    indexedDbSupported,
    indexedDbReady,
    localStorageSupported,
    lastSavedTimestamp: lastSaved,
    revisionCount: revisions.length,
    estimatedStorageSizeKb: Number((totalBytes / 1024).toFixed(1)),
  };
}
