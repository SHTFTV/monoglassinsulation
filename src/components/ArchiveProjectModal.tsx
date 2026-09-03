import React, { useState } from 'react';
import {
  Archive,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  X,
  HelpCircle,
} from 'lucide-react';
import { MultiRoomProject, ProjectArchiveStatus } from '../types';
import { archiveProjectEstimate } from '../utils/projectArchiveUtils';

interface ArchiveProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: MultiRoomProject;
  onArchivedSuccessfully: (
    archivedProject: any,
    postAction: 'new-blank' | 'template' | 'keep'
  ) => void;
}

const COMPLETED_REASON_PRESETS = [
  'Installation Completed & Quality Inspected',
  'Won Bid / Submittal Package Approved by Architect',
  'Specification Adopted in CSI Section 07 21 29 & 09 81 00',
  'Commercial Project Successfully Sprayed & Cured',
  'Custom Reason...',
];

const ABANDONED_REASON_PRESETS = [
  'Lost Bid to Competitor / Pricing Variance',
  'Value-Engineered Out by General Contractor',
  'Project Cancelled by Building Owner / Developer',
  'Switched to Rigid Board / Batt Insulation Alternate',
  'Structural Steel Design Changed / Schedule Deferred',
  'Custom Reason...',
];

export const ArchiveProjectModal: React.FC<ArchiveProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onArchivedSuccessfully,
}) => {
  const [status, setStatus] = useState<ProjectArchiveStatus>('completed');
  const [selectedReasonPreset, setSelectedReasonPreset] = useState<string>(COMPLETED_REASON_PRESETS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [archiveNotes, setArchiveNotes] = useState<string>('');
  const [contractValue, setContractValue] = useState<string>(
    project.costEstimate?.grandTotal ? project.costEstimate.grandTotal.toString() : ''
  );
  const [postAction, setPostAction] = useState<'new-blank' | 'template' | 'keep'>('new-blank');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleStatusChange = (newStatus: ProjectArchiveStatus) => {
    setStatus(newStatus);
    if (newStatus === 'completed') {
      setSelectedReasonPreset(COMPLETED_REASON_PRESETS[0]);
    } else if (newStatus === 'abandoned') {
      setSelectedReasonPreset(ABANDONED_REASON_PRESETS[0]);
    } else {
      setSelectedReasonPreset('Project On Hold Pending Financing');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalReason =
      selectedReasonPreset === 'Custom Reason...'
        ? customReason.trim() || 'Custom Archived Reason'
        : selectedReasonPreset;

    const numVal = contractValue ? parseFloat(contractValue.replace(/[^0-9.]/g, '')) : undefined;

    try {
      const archived = archiveProjectEstimate(project, status, {
        archiveReason: finalReason,
        archiveNotes: archiveNotes.trim() || undefined,
        finalContractValue: isNaN(numVal as number) ? undefined : numVal,
        costEstimateData: project.costEstimate,
      });

      onArchivedSuccessfully(archived, postAction);
      onClose();
    } catch (err) {
      console.error('Failed to archive project:', err);
      alert('Could not archive project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Move Project Estimate to Archive
              </h3>
              <p className="text-xs text-slate-400">
                Move "{project.name || 'Untitled Estimate'}" to the non-active archive to declutter your workspace.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Archive Classification / Outcome
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange('completed')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  status === 'completed'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase">Won / Done</span>
                </div>
                <div className="mt-2 font-bold text-xs text-white">Completed</div>
                <div className="text-[10px] text-slate-400">Installed or awarded</div>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('abandoned')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  status === 'abandoned'
                    ? 'bg-rose-500/15 border-rose-500 text-rose-300 ring-2 ring-rose-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span className="text-[10px] font-bold uppercase">Lost / Closed</span>
                </div>
                <div className="mt-2 font-bold text-xs text-white">Abandoned</div>
                <div className="text-[10px] text-slate-400">Cancelled or lost bid</div>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('on-hold')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  status === 'on-hold'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-bold uppercase">Deferred</span>
                </div>
                <div className="mt-2 font-bold text-xs text-white">On Hold</div>
                <div className="text-[10px] text-slate-400">Paused / awaiting funding</div>
              </button>
            </div>
          </div>

          {/* Reason Preset Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Primary Reason / Trigger
            </label>
            <select
              value={selectedReasonPreset}
              onChange={(e) => setSelectedReasonPreset(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-500 font-medium"
            >
              {(status === 'completed'
                ? COMPLETED_REASON_PRESETS
                : status === 'abandoned'
                ? ABANDONED_REASON_PRESETS
                : ['Project On Hold Pending Financing', 'Awaiting Architectural Spec Revision', 'Custom Reason...']
              ).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Reason Input if selected */}
          {selectedReasonPreset === 'Custom Reason...' && (
            <div className="space-y-1 animate-fadeIn">
              <label className="block text-[11px] font-semibold text-slate-400">
                Specify Custom Reason
              </label>
              <input
                type="text"
                required
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="e.g. Subcontractor unable to fulfill schedule requirements"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Final Value & Financials (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Final Contract / Bid Value ($ USD)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="number"
                  step="any"
                  value={contractValue}
                  onChange={(e) => setContractValue(e.target.value)}
                  placeholder="e.g. 145000"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Preserved Scope
              </label>
              <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center justify-between">
                <span>{project.rooms.length} Itemized Zones</span>
                <span className="font-mono text-amber-400 font-bold">
                  {project.rooms
                    .reduce((acc, r) => acc + (r.planArea || 0), 0)
                    .toLocaleString()}{' '}
                  {project.unitSystem === 'metric' ? 'm²' : 'sq ft'}
                </span>
              </div>
            </div>
          </div>

          {/* Archive Historical Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Archive Record Notes & Post-Mortem (Optional)
            </label>
            <textarea
              rows={3}
              value={archiveNotes}
              onChange={(e) => setArchiveNotes(e.target.value)}
              placeholder="e.g. General Contractor: Turner Construction. Installed thickness was verified at 4.5 inches with depth pins. Acoustic field testing passed without punchlist items."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none font-sans"
            />
          </div>

          {/* Workspace Behavior After Archiving */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Active Workspace After Archiving
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <label
                className={`p-2.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                  postAction === 'new-blank'
                    ? 'bg-sky-500/15 border-sky-500 text-sky-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <input
                    type="radio"
                    name="postAction"
                    checked={postAction === 'new-blank'}
                    onChange={() => setPostAction('new-blank')}
                    className="accent-sky-500"
                  />
                  <span>Start Fresh</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Clean blank takeoff workspace</span>
              </label>

              <label
                className={`p-2.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                  postAction === 'template'
                    ? 'bg-sky-500/15 border-sky-500 text-sky-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <input
                    type="radio"
                    name="postAction"
                    checked={postAction === 'template'}
                    onChange={() => setPostAction('template')}
                    className="accent-sky-500"
                  />
                  <span>Load Template</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Reset to commercial sample</span>
              </label>

              <label
                className={`p-2.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                  postAction === 'keep'
                    ? 'bg-sky-500/15 border-sky-500 text-sky-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <input
                    type="radio"
                    name="postAction"
                    checked={postAction === 'keep'}
                    onChange={() => setPostAction('keep')}
                    className="accent-sky-500"
                  />
                  <span>Keep Active</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Leave active project loaded</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-2"
            >
              <Archive className="w-4 h-4" />
              <span>{isSubmitting ? 'Archiving...' : 'Confirm & Move to Archive'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
