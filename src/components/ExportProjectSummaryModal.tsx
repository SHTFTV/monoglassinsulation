import React, { useState, useMemo } from 'react';
import {
  Download,
  Copy,
  Check,
  FileJson,
  Database,
  Layers,
  Sparkles,
  Package,
  HardDrive,
  RefreshCw,
  Upload,
  X,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Sliders,
} from 'lucide-react';
import { MultiRoomProject, ConsolidatedBom } from '../types';
import {
  buildConsolidatedProjectBackup,
  downloadConsolidatedProjectSummaryJson,
  parseImportedProjectJson,
  ConsolidatedProjectBackup,
} from '../utils/projectExportUtils';

interface ExportProjectSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: MultiRoomProject;
  bom: ConsolidatedBom;
  onRestoreProject?: (restoredProject: MultiRoomProject) => void;
}

export const ExportProjectSummaryModal: React.FC<ExportProjectSummaryModalProps> = ({
  isOpen,
  onClose,
  project,
  bom,
  onRestoreProject,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'preview' | 'restore'>('export');
  const [includeArchives, setIncludeArchives] = useState<boolean>(true);
  const [includeCosts, setIncludeCosts] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [restoreFeedback, setRestoreFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Generate backup bundle
  const backupData: ConsolidatedProjectBackup = useMemo(() => {
    return buildConsolidatedProjectBackup(project, bom, {
      includeArchive: includeArchives,
      includeCostEstimates: includeCosts,
    });
  }, [project, bom, includeArchives, includeCosts]);

  const jsonString = useMemo(() => {
    return JSON.stringify(backupData, null, 2);
  }, [backupData]);

  // Size in KB
  const fileSizeKb = useMemo(() => {
    const bytes = new Blob([jsonString]).size;
    return (bytes / 1024).toFixed(1);
  }, [jsonString]);

  if (!isOpen) return null;

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Could not copy to clipboard:', err);
    }
  };

  const handleDownload = () => {
    downloadConsolidatedProjectSummaryJson(project, bom, {
      includeArchive: includeArchives,
      includeCostEstimates: includeCosts,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const result = parseImportedProjectJson(content);

      if (result.success && result.project) {
        if (onRestoreProject) {
          onRestoreProject(result.project);
        }
        setRestoreFeedback({
          type: 'success',
          message: `Successfully loaded "${result.project.name || 'Project Takeoff'}" with ${result.project.rooms.length} zones!`,
        });
      } else {
        setRestoreFeedback({
          type: 'error',
          message: result.error || 'Failed to restore project from file.',
        });
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono">
                  Local Data Backup
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  v2.0.0 JSON
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Export Project Summary & Takeoff Backup
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

        {/* Modal Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`px-3 py-2 border-b-2 font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export & Download</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-2 border-b-2 font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Raw JSON Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('restore')}
            className={`px-3 py-2 border-b-2 font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'restore'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restore / Import</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: EXPORT & DOWNLOAD */}
          {activeTab === 'export' && (
            <div className="space-y-5">
              {/* Project Snapshot Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Project Name</div>
                  <div className="text-xs font-bold text-white truncate" title={project.name}>
                    {project.name || 'Untitled'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Active Zones</div>
                  <div className="text-xs font-bold text-sky-400 font-mono">
                    {project.rooms.filter((r) => r.enabled).length} Rooms
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Total Fiber</div>
                  <div className="text-xs font-bold text-emerald-400 font-mono">
                    {bom.totalBagsFiber.toLocaleString()} Bags
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Payload Size</div>
                  <div className="text-xs font-bold text-purple-400 font-mono">
                    {fileSizeKb} KB
                  </div>
                </div>
              </div>

              {/* What's Included in this Consolidated Summary */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Consolidated Backup Package Contents
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Active Multi-Room Takeoff</span>
                      <p className="text-[11px] text-slate-400">All {project.rooms.length} room geometries, substrate rib factors, R-values & finishes.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Calculated Material BOM</span>
                      <p className="text-[11px] text-slate-400">Bags, adhesive pail requirements, sonoglaze hard-coat, and dead loads.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Distribution Analytics</span>
                      <p className="text-[11px] text-slate-400">Room percentages, fluting area multipliers, and quantity driver metrics.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Site Conditions & Tender Notes</span>
                      <p className="text-[11px] text-slate-400">Jobsite environmental access notes and architectural submittal text.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Bundle Inclusions */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Additional Storage Archives
                </span>

                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 cursor-pointer hover:bg-slate-950 transition-colors">
                    <input
                      type="checkbox"
                      checked={includeArchives}
                      onChange={(e) => setIncludeArchives(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-400 border-slate-700 bg-slate-900"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-200">Include Local Project History & Saved Drafts</span>
                      <p className="text-[11px] text-slate-400">Bundles all cached estimator project revisions from your browser storage.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 cursor-pointer hover:bg-slate-950 transition-colors">
                    <input
                      type="checkbox"
                      checked={includeCosts}
                      onChange={(e) => setIncludeCosts(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-400 border-slate-700 bg-slate-900"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-200">Include Saved Cost Estimator & Labor Presets</span>
                      <p className="text-[11px] text-slate-400">Includes labor rate models, crew setups, and bid cost breakdowns.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RAW JSON PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Formatted JSON Payload ({fileSizeKb} KB)</span>
                <span className="font-mono text-[11px]">Format: Monoglass-Estimator-v2.0.0</span>
              </div>
              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72 leading-relaxed">
                  {jsonString}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: RESTORE / IMPORT */}
          {activeTab === 'restore' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span>Restore from Local Backup File</span>
                </h4>
                <p className="text-slate-400">
                  Select or drag in a previously exported Monoglass JSON project backup (supports both consolidated project summary backups and raw project files).
                </p>
              </div>

              {/* Upload Dropzone */}
              <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950/70 group">
                <div className="p-3 rounded-full bg-slate-800 group-hover:bg-indigo-500/20 text-slate-400 group-hover:text-indigo-400 mb-3 transition-colors">
                  <FileJson className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-white group-hover:text-indigo-300">
                  Click to select JSON backup file
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Supports .json files exported from the Monoglass Project Estimator
                </span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Feedback Banner */}
              {restoreFeedback && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
                    restoreFeedback.type === 'success'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {restoreFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold">
                      {restoreFeedback.type === 'success' ? 'Backup Restored!' : 'Import Error'}
                    </span>
                    <p className="mt-0.5">{restoreFeedback.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 w-full sm:w-auto">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            <span>Local file download (no cloud account required)</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopyJson}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-bold">Copied JSON!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Project Summary JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
