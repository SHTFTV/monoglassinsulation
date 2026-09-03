import React, { useState, useEffect } from 'react';
import {
  Database,
  HardDrive,
  Clock,
  RotateCcw,
  Trash2,
  BookmarkPlus,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  FileCheck,
  Check,
} from 'lucide-react';
import { MultiRoomProject } from '../types';
import {
  StoredProjectRevision,
  StorageDiagnostics,
  getAllProjectRevisions,
  createProjectRevision,
  deleteProjectRevision,
  getStorageDiagnostics,
  clearAllEstimatorStorage,
} from '../utils/indexedDbStorage';

interface StorageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: MultiRoomProject;
  onRestoreRevision: (restoredProject: MultiRoomProject) => void;
}

export const StorageManagerModal: React.FC<StorageManagerModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onRestoreRevision,
}) => {
  const [revisions, setRevisions] = useState<StoredProjectRevision[]>([]);
  const [diagnostics, setDiagnostics] = useState<StorageDiagnostics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [snapshotName, setSnapshotName] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);

  // Load storage diagnostics and revisions
  const loadData = async () => {
    setLoading(true);
    try {
      const [revs, diag] = await Promise.all([
        getAllProjectRevisions(),
        getStorageDiagnostics(),
      ]);
      setRevisions(revs);
      setDiagnostics(diag);
    } catch (e) {
      console.warn('Error loading storage manager data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = snapshotName.trim() || `Manual Snapshot (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    try {
      const newRev = await createProjectRevision(currentProject, label);
      setSnapshotName('');
      setFeedback({
        type: 'success',
        message: `Saved snapshot checkpoint "${label}"!`,
      });
      setTimeout(() => setFeedback(null), 3500);
      loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Failed to save snapshot: ${err.message || 'Error'}`,
      });
    }
  };

  const handleApplyRestore = (revision: StoredProjectRevision) => {
    if (revision.projectData) {
      onRestoreRevision(revision.projectData);
      setFeedback({
        type: 'success',
        message: `Restored workspace to "${revision.description}" (${revision.roomCount} rooms)!`,
      });
      setConfirmRestoreId(null);
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1200);
    }
  };

  const handleDeleteRevision = async (id: string) => {
    try {
      await deleteProjectRevision(id);
      setRevisions((prev) => prev.filter((r) => r.id !== id));
      setFeedback({
        type: 'success',
        message: 'Revision removed from local database.',
      });
      setTimeout(() => setFeedback(null), 2500);
    } catch (e) {
      console.warn('Delete revision error:', e);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllEstimatorStorage();
      setConfirmClearAll(false);
      setFeedback({
        type: 'success',
        message: 'Cleared local database cache and revisions.',
      });
      setTimeout(() => {
        setFeedback(null);
        window.location.reload();
      }, 1000);
    } catch (e) {
      console.warn('Clear storage error:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                  Persistence & Storage
                </span>
                <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Dual IndexedDB + LocalStorage Active
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Project Storage & Revision History
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Storage Diagnostics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
              <div className="text-[10px] text-slate-400 font-mono uppercase flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>IndexedDB Engine</span>
              </div>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>{diagnostics?.indexedDbReady ? 'Connected & Ready' : 'Fallback Active'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
              <div className="text-[10px] text-slate-400 font-mono uppercase flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-sky-400" />
                <span>LocalStorage Sync</span>
              </div>
              <div className="text-xs font-bold text-sky-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Synchronized</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
              <div className="text-[10px] text-slate-400 font-mono uppercase flex items-center gap-1">
                <Clock className="w-3 h-3 text-purple-400" />
                <span>Saved Revisions</span>
              </div>
              <div className="text-xs font-bold text-purple-300 font-mono">
                {revisions.length} Snapshots
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
              <div className="text-[10px] text-slate-400 font-mono uppercase flex items-center gap-1">
                <FileCheck className="w-3 h-3 text-amber-400" />
                <span>Storage Footprint</span>
              </div>
              <div className="text-xs font-bold text-amber-300 font-mono">
                {diagnostics?.estimatedStorageSizeKb || 0} KB Cached
              </div>
            </div>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 animate-fadeIn ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="font-semibold">{feedback.message}</span>
            </div>
          )}

          {/* Manual Snapshot Form */}
          <form onSubmit={handleCreateSnapshot} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Save Milestone Checkpoint Snapshot
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Current: {currentProject.rooms.length} rooms ({currentProject.name})
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                placeholder="e.g., Pre-Tender Baseline or 3rd Floor Parkade Revision..."
                className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95 shrink-0"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save Milestone</span>
              </button>
            </div>
          </form>

          {/* Revision History List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Automatic Revision Snapshots ({revisions.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={loadData}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Loading saved snapshots...</span>
              </div>
            ) : revisions.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center text-xs text-slate-400 space-y-1">
                <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto opacity-60" />
                <p className="font-semibold text-slate-300">Continuous Auto-Save Active</p>
                <p className="text-[11px] text-slate-500">
                  Every change is saved to local storage automatically. Snapshots will appear as you edit or create manual checkpoints.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {revisions.map((rev) => {
                  const date = new Date(rev.timestamp);
                  const isConfirming = confirmRestoreId === rev.id;

                  return (
                    <div
                      key={rev.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">
                            {rev.description || rev.projectName}
                          </span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                            {rev.roomCount} {rev.roomCount === 1 ? 'Room' : 'Rooms'}
                          </span>
                          <span className="text-[10px] bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded font-mono">
                            {rev.totalPlanArea.toLocaleString()} {rev.unitSystem === 'metric' ? 'm²' : 'sq ft'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>
                            {date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>•</span>
                          <span className="text-slate-500 truncate max-w-xs">{rev.projectName}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 justify-end shrink-0">
                        {isConfirming ? (
                          <div className="flex items-center gap-1.5 animate-fadeIn">
                            <span className="text-[11px] text-amber-300 font-semibold">Restore this snapshot?</span>
                            <button
                              type="button"
                              onClick={() => handleApplyRestore(rev)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition-colors"
                            >
                              Yes, Restore
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmRestoreId(null)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setConfirmRestoreId(rev.id)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1 active:scale-95"
                              title="Restore your project workspace to this snapshot"
                            >
                              <RotateCcw className="w-3 h-3 text-emerald-400" />
                              <span>Restore</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteRevision(rev.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Delete snapshot from database"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 w-full sm:w-auto">
            {confirmClearAll ? (
              <div className="flex items-center gap-2">
                <span className="text-rose-300 font-semibold">Purge all local cache?</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold"
                >
                  Yes, Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[11px]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Reset Local Cache</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
          >
            Close Manager
          </button>
        </div>
      </div>
    </div>
  );
};
