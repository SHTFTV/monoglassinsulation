import React, { useState, useEffect, useMemo } from 'react';
import {
  Archive,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RotateCcw,
  Copy,
  Download,
  Trash2,
  Eye,
  Edit3,
  Layers,
  Package,
  Droplet,
  Shield,
  Thermometer,
  Volume2,
  DollarSign,
  Building2,
  MapPin,
  Calendar,
  AlertCircle,
  FileJson,
  Plus,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
} from 'lucide-react';
import { ArchivedProject, ProjectArchiveStatus, MultiRoomProject } from '../types';
import {
  getArchivedProjects,
  restoreArchivedProject,
  duplicateArchivedProject,
  deleteArchivedProject,
  updateArchivedProject,
  exportArchivedProjectJson,
} from '../utils/projectArchiveUtils';
import { SUBSTRATE_PROFILES } from '../utils/estimatorUtils';

interface ProjectArchiveViewProps {
  onRestoreToActive: (restoredProject: MultiRoomProject) => void;
  onDuplicateToActive: (clonedProject: MultiRoomProject) => void;
  onOpenArchiveActiveModal?: () => void;
  currentActiveProjectName?: string;
}

export const ProjectArchiveView: React.FC<ProjectArchiveViewProps> = ({
  onRestoreToActive,
  onDuplicateToActive,
  onOpenArchiveActiveModal,
  currentActiveProjectName,
}) => {
  const [archives, setArchives] = useState<ArchivedProject[]>(() => getArchivedProjects());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectArchiveStatus>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'area-desc' | 'name-asc'>('newest');

  // Modal / Drawer state for inspecting an archive
  const [inspectedArchive, setInspectedArchive] = useState<ArchivedProject | null>(null);

  // Edit archive record modal state
  const [editingArchive, setEditingArchive] = useState<ArchivedProject | null>(null);
  const [editStatus, setEditStatus] = useState<ProjectArchiveStatus>('completed');
  const [editReason, setEditReason] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editValue, setEditValue] = useState<string>('');

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Reload archives whenever storage event or custom event triggers
  useEffect(() => {
    const handleArchivesChanged = () => {
      setArchives(getArchivedProjects());
    };

    window.addEventListener('monoglass-project-archives-updated', handleArchivesChanged);
    window.addEventListener('monoglass-project-archived', handleArchivesChanged);

    return () => {
      window.removeEventListener('monoglass-project-archives-updated', handleArchivesChanged);
      window.removeEventListener('monoglass-project-archived', handleArchivesChanged);
    };
  }, []);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Filter & sort archives
  const filteredArchives = useMemo(() => {
    return archives
      .filter((item) => {
        if (statusFilter !== 'all' && item.status !== statusFilter) {
          return false;
        }
        if (!searchQuery.trim()) return true;

        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          (item.projectType && item.projectType.toLowerCase().includes(q)) ||
          (item.location && item.location.toLowerCase().includes(q)) ||
          (item.clientOrArchitect && item.clientOrArchitect.toLowerCase().includes(q)) ||
          (item.archiveReason && item.archiveReason.toLowerCase().includes(q)) ||
          (item.archiveNotes && item.archiveNotes.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.archivedAt || 0).getTime() - new Date(a.archivedAt || 0).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.archivedAt || 0).getTime() - new Date(b.archivedAt || 0).getTime();
        }
        if (sortBy === 'area-desc') {
          return (b.totalEffectiveArea || 0) - (a.totalEffectiveArea || 0);
        }
        if (sortBy === 'name-asc') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [archives, searchQuery, statusFilter, sortBy]);

  // Aggregate Metrics for the Archive Dashboard
  const metrics = useMemo(() => {
    const total = archives.length;
    const completed = archives.filter((a) => a.status === 'completed');
    const abandoned = archives.filter((a) => a.status === 'abandoned');
    const onHold = archives.filter((a) => a.status === 'on-hold');

    const totalAreaSqFt = archives.reduce((acc, a) => {
      const area = a.unitSystem === 'metric' ? a.totalEffectiveArea * 10.7639 : a.totalEffectiveArea;
      return acc + (area || 0);
    }, 0);

    const totalBags = archives.reduce((acc, a) => acc + (a.totalBagsFiber || 0), 0);

    const completedValueTotal = completed.reduce((acc, a) => acc + (a.finalContractValue || 0), 0);

    return {
      total,
      completedCount: completed.length,
      abandonedCount: abandoned.length,
      onHoldCount: onHold.length,
      totalAreaSqFt: Math.round(totalAreaSqFt),
      totalBags,
      completedValueTotal,
    };
  }, [archives]);

  // Handle Restore
  const handleRestore = (item: ArchivedProject) => {
    const restored = restoreArchivedProject(item.id);
    if (restored) {
      onRestoreToActive(restored);
      showNotice(`Restored archived project "${item.name}" into active workspace.`);
    }
  };

  // Handle Clone
  const handleClone = (item: ArchivedProject) => {
    const cloned = duplicateArchivedProject(item.id);
    if (cloned) {
      onDuplicateToActive(cloned);
      showNotice(`Created new active copy of "${item.name}" in workspace.`);
    }
  };

  // Handle Delete
  const handleDelete = (id: string) => {
    const success = deleteArchivedProject(id);
    if (success) {
      setArchives(getArchivedProjects());
      setDeleteConfirmId(null);
      showNotice('Archived project permanently deleted.');
    }
  };

  // Start Edit
  const handleStartEdit = (item: ArchivedProject) => {
    setEditingArchive(item);
    setEditStatus(item.status);
    setEditReason(item.archiveReason || '');
    setEditNotes(item.archiveNotes || '');
    setEditValue(item.finalContractValue ? item.finalContractValue.toString() : '');
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArchive) return;

    const numVal = editValue ? parseFloat(editValue.replace(/[^0-9.]/g, '')) : undefined;

    updateArchivedProject(editingArchive.id, {
      status: editStatus,
      archiveReason: editReason.trim() || undefined,
      archiveNotes: editNotes.trim() || undefined,
      finalContractValue: isNaN(numVal as number) ? undefined : numVal,
    });

    setArchives(getArchivedProjects());
    setEditingArchive(null);
    showNotice('Archived project details updated.');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Notice Banner */}
      {actionNotice && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-emerald-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Main Header & Workspace Declutter Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-5 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Archive className="w-4 h-4" /> Non-Active Workspace Repository
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Project Estimate Archive
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Completed and abandoned project estimates are stored here separately from your active takeoff workspace. Preserves full historical room BOMs, specification parameters, and contractor costings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenArchiveActiveModal && (
              <button
                type="button"
                onClick={onOpenArchiveActiveModal}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-2"
              >
                <Archive className="w-4 h-4" />
                <span>Archive Current Estimate</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Archive Metrics KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Archive className="w-3 h-3 text-amber-400" /> Total Archived
            </span>
            <div className="text-xl font-extrabold text-white font-mono">
              {metrics.total} <span className="text-xs font-sans text-slate-400">Projects</span>
            </div>
            <span className="text-[10px] text-slate-400 block">
              {metrics.completedCount} won • {metrics.abandonedCount} closed
            </span>
          </div>

          <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Completed / Won
            </span>
            <div className="text-xl font-extrabold text-emerald-400 font-mono">
              {metrics.completedCount} <span className="text-xs font-sans text-slate-400">Jobs</span>
            </div>
            <span className="text-[10px] text-emerald-300 font-mono">
              {metrics.completedValueTotal > 0
                ? `$${metrics.completedValueTotal.toLocaleString()} contract volume`
                : 'Installed specifications'}
            </span>
          </div>

          <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Abandoned / VE'd
            </span>
            <div className="text-xl font-extrabold text-rose-400 font-mono">
              {metrics.abandonedCount} <span className="text-xs font-sans text-slate-400">Takeoffs</span>
            </div>
            <span className="text-[10px] text-slate-400 block">
              Lost bids & cancelled specs
            </span>
          </div>

          <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
              <Package className="w-3 h-3" /> Historical Material
            </span>
            <div className="text-xl font-extrabold text-white font-mono">
              {metrics.totalBags.toLocaleString()} <span className="text-xs font-sans text-slate-400">Bags</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-mono">
              {metrics.totalAreaSqFt.toLocaleString()} sq ft scope
            </span>
          </div>
        </div>
      </div>

      {/* Filter, Search & Sorting Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            All Archives ({archives.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'completed'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed ({metrics.completedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('abandoned')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'abandoned'
                ? 'bg-rose-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-slate-950 hover:bg-slate-800 text-rose-400 border border-slate-800'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Abandoned ({metrics.abandonedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('on-hold')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'on-hold'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>On Hold ({metrics.onHoldCount})</span>
          </button>
        </div>

        {/* Search Input & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search archive history..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="newest">Sort: Newest Archived</option>
            <option value="oldest">Sort: Oldest Archived</option>
            <option value="area-desc">Sort: Largest Scope (sq ft)</option>
            <option value="name-asc">Sort: Project Title (A–Z)</option>
          </select>
        </div>
      </div>

      {/* Archived Projects List */}
      {filteredArchives.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <Archive className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Archived Projects Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'No historical project estimates match your search filter criteria.'
              : 'Your project archive is currently empty. Move completed bids or abandoned takeoffs here to keep your active workspace clean.'}
          </p>
          {onOpenArchiveActiveModal && (
            <button
              onClick={onOpenArchiveActiveModal}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 inline-flex items-center gap-1.5"
            >
              <Archive className="w-3.5 h-3.5" /> Archive Active Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredArchives.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all space-y-4 relative group"
            >
              {/* Card Top Row: Status badge, Title, Date, Main Actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    {item.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Completed
                      </span>
                    )}
                    {item.status === 'abandoned' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <XCircle className="w-3 h-3 text-rose-400" /> Abandoned
                      </span>
                    )}
                    {item.status === 'on-hold' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Clock className="w-3 h-3 text-amber-400" /> On Hold
                      </span>
                    )}

                    {/* Archived Date */}
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Archived on {new Date(item.archivedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>

                    {/* Unit System */}
                    <span className="text-[10px] font-mono uppercase bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                      {item.unitSystem}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    {item.name}
                  </h3>

                  {/* Location & Client meta */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    {item.projectType && (
                      <span className="flex items-center gap-1 text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-sky-400" /> {item.projectType}
                      </span>
                    )}
                    {item.location && (
                      <span className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" /> {item.location}
                      </span>
                    )}
                    {item.clientOrArchitect && (
                      <span className="text-slate-400">
                        Specifier: <strong className="text-slate-200">{item.clientOrArchitect}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                  <button
                    type="button"
                    onClick={() => handleRestore(item)}
                    title="Restore estimate to active workspace (replaces or prompts active takeoff)"
                    className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5 active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore to Workspace</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleClone(item)}
                    title="Clone as new active project without altering this historical archive record"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Clone as New</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInspectedArchive(item)}
                    title="View itemized rooms, substrate profiles, and full BOM calculation"
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-400" />
                    <span>Inspect</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportArchivedProjectJson(item)}
                    title="Download standalone archived project JSON specification"
                    className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    title="Edit archive status, notes, or contract value"
                    className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(item.id)}
                    title="Delete permanently from archive"
                    className="p-1.5 rounded-xl bg-slate-950 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 border border-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Archive Reason & Notes Banner */}
              {(item.archiveReason || item.archiveNotes) && (
                <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 text-xs space-y-1 font-sans">
                  {item.archiveReason && (
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider shrink-0 mt-0.5">
                        Archive Outcome:
                      </span>
                      <span className="text-slate-200 font-medium">{item.archiveReason}</span>
                    </div>
                  )}
                  {item.archiveNotes && (
                    <p className="text-slate-400 pl-0 sm:pl-28 italic">
                      "{item.archiveNotes}"
                    </p>
                  )}
                </div>
              )}

              {/* Preserved Project Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-sky-400 block">Total Surface</span>
                  <span className="text-sm font-extrabold text-white font-mono">
                    {item.totalEffectiveArea.toLocaleString()}{' '}
                    <span className="text-[10px] text-slate-400 font-sans">
                      {item.unitSystem === 'metric' ? 'm²' : 'sq ft'}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {item.roomCount} itemized zones
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">Fiber Required</span>
                  <span className="text-sm font-extrabold text-white font-mono">
                    {item.totalBagsFiber.toLocaleString()}{' '}
                    <span className="text-[10px] text-slate-400 font-sans">Bags</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    ~{Math.round(item.totalBagsFiber * 28).toLocaleString()} bd ft
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">Adhesive Conc.</span>
                  <span className="text-sm font-extrabold text-white font-mono">
                    {item.totalAdhesivePails.toLocaleString()}{' '}
                    <span className="text-[10px] text-slate-400 font-sans">Pails</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {item.totalAdhesivePails * 5} gal concentrate
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-teal-400 block">Thermal R-Val</span>
                  <span className="text-sm font-extrabold text-teal-300 font-mono">
                    R-{item.blendedRValue.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    k = 0.250 / NRC {item.blendedNrc.toFixed(2)}
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 block">Sonoglaze Finish</span>
                  <span className="text-sm font-extrabold text-white font-mono">
                    {item.totalSonoglazePails > 0
                      ? `${item.totalSonoglazePails} Pails`
                      : 'None'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {item.totalSonoglazePails > 0 ? 'Hard-coat sealed' : 'Natural White / Black'}
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-purple-400 block">Contract Value</span>
                  <span className="text-sm font-extrabold text-white font-mono">
                    {item.finalContractValue
                      ? `$${item.finalContractValue.toLocaleString()}`
                      : item.costEstimateData?.grandTotal
                      ? `$${item.costEstimateData.grandTotal.toLocaleString()}`
                      : '—'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {item.finalContractValue || item.costEstimateData
                      ? 'Recorded budget'
                      : 'Material takeoff only'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* INSPECT MODAL / DRAWER */}
      {inspectedArchive && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-amber-500/20 text-amber-300">
                    <Archive className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Archived Specification Inspection
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    inspectedArchive.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {inspectedArchive.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">
                  {inspectedArchive.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {inspectedArchive.projectType} • {inspectedArchive.location} • Archived on{' '}
                  {new Date(inspectedArchive.archivedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setInspectedArchive(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="overflow-y-auto space-y-4 pr-1">
              {/* Outcome Reason & Notes */}
              {(inspectedArchive.archiveReason || inspectedArchive.archiveNotes) && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  {inspectedArchive.archiveReason && (
                    <div>
                      <strong className="text-amber-400 uppercase tracking-wider text-[10px] block">
                        Archive Outcome / Reason:
                      </strong>
                      <span className="text-white font-medium">{inspectedArchive.archiveReason}</span>
                    </div>
                  )}
                  {inspectedArchive.archiveNotes && (
                    <div>
                      <strong className="text-slate-400 uppercase tracking-wider text-[10px] block">
                        Record Notes:
                      </strong>
                      <span className="text-slate-300 italic">{inspectedArchive.archiveNotes}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Itemized Room Zones Breakdown Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-sky-400" />
                  Preserved Takeoff Zones ({inspectedArchive.projectData.rooms.length})
                </h4>

                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Zone / Room Name</th>
                        <th className="py-2.5 px-3 font-semibold">Substrate Profile</th>
                        <th className="py-2.5 px-3 font-semibold">Plan Area</th>
                        <th className="py-2.5 px-3 font-semibold">Thickness / R-Val</th>
                        <th className="py-2.5 px-3 font-semibold">Finish Type</th>
                        <th className="py-2.5 px-3 font-semibold">Wastage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                      {inspectedArchive.projectData.rooms.map((room, idx) => (
                        <tr key={room.id} className="hover:bg-slate-800/40 font-sans">
                          <td className="py-2 px-3 font-semibold text-white">
                            {idx + 1}. {room.name}
                          </td>
                          <td className="py-2 px-3 text-slate-300">
                            {SUBSTRATE_PROFILES[room.substrateType]?.name || room.substrateType}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-300">
                            {room.planArea.toLocaleString()}{' '}
                            {inspectedArchive.unitSystem === 'metric' ? 'm²' : 'sq ft'}
                          </td>
                          <td className="py-2 px-3 font-mono text-teal-300 font-semibold">
                            {room.targetMode === 'thermal'
                              ? `R-${room.targetRValue}`
                              : `${room.targetThicknessInches.toFixed(1)}"`}
                          </td>
                          <td className="py-2 px-3 text-slate-300">{room.finishType}</td>
                          <td className="py-2 px-3 font-mono text-slate-400">
                            {room.wastagePercent}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* General Project Comments */}
              {inspectedArchive.projectData.notes && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <strong className="text-slate-400 uppercase tracking-wider text-[10px] block">
                    Specification Notes:
                  </strong>
                  <p className="text-slate-300">{inspectedArchive.projectData.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportArchivedProjectJson(inspectedArchive)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Spec JSON</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleClone(inspectedArchive);
                    setInspectedArchive(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/40 transition-colors flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Clone to Active</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleRestore(inspectedArchive);
                    setInspectedArchive(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore to Workspace</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingArchive && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative my-8">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Edit Archive Details: {editingArchive.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingArchive(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Archive Classification
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['completed', 'abandoned', 'on-hold'] as ProjectArchiveStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditStatus(st)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                        editStatus === st
                          ? st === 'completed'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : st === 'abandoned'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                            : 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {st === 'on-hold' ? 'On Hold' : st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Reason / Outcome
                </label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g. Won tender / Installed per spec"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Final Contract Value ($ USD)
                </label>
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="e.g. 148500"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Archive Notes & Comments
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Historical project post-mortem and site comments..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingArchive(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Permanently Delete Archive?</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete this historical project record? This action removes all preserved zone BOM calculations and cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
