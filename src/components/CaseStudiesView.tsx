import React, { useState, useMemo, useEffect } from 'react';
import { CASE_STUDIES } from '../data/monoglassData';
import { CaseStudy, BuildingCategory } from '../types';
import { CaseStudyCard } from './CaseStudyGallery/CaseStudyCard';
import { CaseStudyModal } from './CaseStudyGallery/CaseStudyModal';
import { BeforeAfterSlider } from './CaseStudyGallery/BeforeAfterSlider';
import { OnSiteCameraModal } from './CaseStudyGallery/OnSiteCameraModal';
import {
  Building2,
  MapPin,
  CheckCircle2,
  Layers,
  Thermometer,
  Volume2,
  Sparkles,
  ArrowRight,
  Search,
  Filter,
  Grid,
  List,
  SlidersHorizontal,
  FileDown,
  ShieldCheck,
  Send,
  Camera,
  Flame,
  Droplets,
  HelpCircle,
  X,
  Plus,
  Check,
  AlertCircle,
} from 'lucide-react';
import { exportCaseStudyPdf } from '../utils/pdfExport';
import { useSettings } from '../context/SettingsContext';

const LOCAL_STORAGE_KEY = 'monoglass_user_submitted_case_studies_v1';

interface CaseStudiesViewProps {
  onFindContractors: () => void;
  onRequestBid: (caseStudy?: CaseStudy) => void;
  onNavigateToCalculator?: (params: { substrate: string; thicknessInches: number; rValue: number }) => void;
  onNavigateToEstimator?: (caseStudy: CaseStudy) => void;
}

export const CaseStudiesView: React.FC<CaseStudiesViewProps> = ({
  onFindContractors,
  onRequestBid,
  onNavigateToCalculator,
  onNavigateToEstimator,
}) => {
  const { getEffectiveWatermark } = useSettings();
  const [selectedCategory, setSelectedCategory] = useState<BuildingCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [substrateFilter, setSubstrateFilter] = useState<string>('all');
  const [finishFilter, setFinishFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'detailed' | 'before-after'>('grid');
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(null);
  const [sortBy, setSortBy] = useState<'featured' | 'sqft' | 'rvalue' | 'nrc'>('featured');
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User-submitted case studies stored locally + base CASE_STUDIES
  const [allCaseStudies, setAllCaseStudies] = useState<CaseStudy[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: CaseStudy[] = JSON.parse(saved);
        const existingIds = new Set(CASE_STUDIES.map((c) => c.id));
        const customItems = parsed.filter((p) => !existingIds.has(p.id));
        return [...customItems, ...CASE_STUDIES];
      }
    } catch (e) {
      console.warn('Could not load saved case studies from localStorage:', e);
    }
    return CASE_STUDIES;
  });

  const persistCaseStudies = (updatedList: CaseStudy[]) => {
    setAllCaseStudies(updatedList);
    try {
      const customOnly = updatedList.filter(
        (cs) => cs.category === 'user-submitted' || cs.id.startsWith('cs-user-')
      );
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customOnly));
    } catch (e) {
      console.warn('Could not persist case studies to localStorage:', e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Categories config
  const categories: { id: BuildingCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Projects', icon: <Grid className="w-3.5 h-3.5" /> },
    { id: 'user-submitted', label: 'User-Submitted', icon: <Camera className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'commercial', label: 'Commercial & High-Rise', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'industrial', label: 'Industrial & Warehouses', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'recreational', label: 'Sports & Natatoriums', icon: <Droplets className="w-3.5 h-3.5" /> },
    { id: 'acoustic', label: 'Acoustic & Studios', icon: <Volume2 className="w-3.5 h-3.5" /> },
    { id: 'parking', label: 'Parking & Soffits', icon: <Thermometer className="w-3.5 h-3.5" /> },
    { id: 'institutional', label: 'Institutional & Labs', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  ];

  // Unique substrates & finishes for filter dropdowns
  const substrates = useMemo(() => {
    const set = new Set<string>();
    allCaseStudies.forEach((cs) => set.add(cs.substrate));
    return Array.from(set);
  }, [allCaseStudies]);

  const finishTypes = useMemo(() => {
    const set = new Set<string>();
    allCaseStudies.forEach((cs) => set.add(cs.finishType));
    return Array.from(set);
  }, [allCaseStudies]);

  // Handle new submission from OnSiteCameraModal
  const handleAddNewCaseStudy = (newCs: CaseStudy) => {
    const updated = [newCs, ...allCaseStudies];
    persistCaseStudies(updated);
    setSelectedCategory('user-submitted');
    setIsCameraModalOpen(false);
    showToast(`✓ Field photo "${newCs.title}" submitted to gallery!`);
  };

  // Handle approval state change
  const handleApprovalChange = (csId: string, status: 'approved' | 'rejected' | 'pending') => {
    const updated = allCaseStudies.map((cs) => {
      if (cs.id === csId) {
        return {
          ...cs,
          approvalStatus: status,
          verifiedBadge: status === 'approved',
        };
      }
      return cs;
    });
    persistCaseStudies(updated);
    showToast(`Status updated to ${status.toUpperCase()} for submission.`);
  };

  // Handle delete
  const handleDeleteCaseStudy = (csId: string) => {
    const updated = allCaseStudies.filter((cs) => cs.id !== csId);
    persistCaseStudies(updated);
    showToast('Submission removed from local gallery.');
  };

  // Filtered & Sorted Projects
  const filteredCaseStudies = useMemo(() => {
    return allCaseStudies.filter((cs) => {
      // Category match
      if (selectedCategory !== 'all' && cs.category !== selectedCategory) {
        return false;
      }

      // Approval filter (especially when viewing user-submitted)
      if (approvalFilter !== 'all') {
        if (cs.category === 'user-submitted' && cs.approvalStatus !== approvalFilter) {
          return false;
        }
      }

      // Substrate filter
      if (substrateFilter !== 'all' && cs.substrate !== substrateFilter) {
        return false;
      }

      // Finish filter
      if (finishFilter !== 'all' && cs.finishType !== finishFilter) {
        return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = cs.title.toLowerCase().includes(q);
        const matchesLoc = cs.location.toLowerCase().includes(q);
        const matchesType = cs.facilityType.toLowerCase().includes(q);
        const matchesChallenge = cs.challenge.toLowerCase().includes(q);
        const matchesSubstrate = cs.substrate.toLowerCase().includes(q);
        const matchesContractor = cs.contractorCompany?.toLowerCase().includes(q) || cs.contractorName?.toLowerCase().includes(q);
        const matchesArch = cs.architectOrEngineer?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesLoc && !matchesType && !matchesChallenge && !matchesSubstrate && !matchesArch && !matchesContractor) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'sqft') {
        return b.squareFootage - a.squareFootage;
      }
      if (sortBy === 'rvalue') {
        return (b.rValueNum || 0) - (a.rValueNum || 0);
      }
      if (sortBy === 'nrc') {
        return (b.nrcNum || 0) - (a.nrcNum || 0);
      }
      return 0; // Default order
    });
  }, [allCaseStudies, selectedCategory, approvalFilter, substrateFilter, finishFilter, searchQuery, sortBy]);

  // Counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allCaseStudies.length };
    allCaseStudies.forEach((cs) => {
      counts[cs.category] = (counts[cs.category] || 0) + 1;
    });
    return counts;
  }, [allCaseStudies]);

  // Total square footage across case studies
  const totalSquareFootage = useMemo(() => {
    return allCaseStudies.reduce((acc, cs) => acc + cs.squareFootage, 0);
  }, [allCaseStudies]);

  const handleExportPdf = async (cs: CaseStudy) => {
    const watermark = getEffectiveWatermark('technical');
    await exportCaseStudyPdf(cs, { watermark });
  };

  return (
    <div className="space-y-8 pb-16 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Hero Banner */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider">
              <Camera className="w-4 h-4" /> Architectural Project Gallery & On-Site Snaps
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Monoglass® Installation Case Studies & Photo Gallery
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Explore high-resolution field photography, verified acoustic test results, and documented thermal envelope performance. Contractors can also snap live on-site installation photos using device cameras for QA approval.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={() => setIsCameraModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 shrink-0 animate-pulse hover:animate-none"
            >
              <Camera className="w-4 h-4" /> Snap Jobsite Photo
            </button>
            <button
              onClick={() => onRequestBid()}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/20 transition-all flex items-center gap-2 shrink-0"
            >
              <Send className="w-4 h-4" /> Request Project Bid
            </button>
            <button
              onClick={onFindContractors}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition-all shrink-0"
            >
              Certified Contractors
            </button>
          </div>
        </div>

        {/* Aggregate KPI Badges Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Documented Surface Area
            </span>
            <div className="text-lg font-bold text-white font-mono">
              {totalSquareFootage.toLocaleString()} sq. ft
            </div>
            <span className="text-[11px] text-sky-400 font-medium">
              {allCaseStudies.length} Installations ({categoryCounts['user-submitted'] || 0} Field Snaps)
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Fire Life Safety
            </span>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              Class A (0 / 0)
            </div>
            <span className="text-[11px] text-slate-400">ASTM E84 Non-Combustible</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Max Thermal Capability
            </span>
            <div className="text-lg font-bold text-white font-mono">
              Up to R-20 (5.0")
            </div>
            <span className="text-[11px] text-sky-400">Single Monolithic Pass</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Acoustic Performance
            </span>
            <div className="text-lg font-bold text-indigo-400 font-mono">
              NRC 0.90 – 1.00
            </div>
            <span className="text-[11px] text-slate-400">ASTM C423 Verified</span>
          </div>
        </div>
      </section>

      {/* Building Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = categoryCounts[cat.id] || 0;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border ${
                isSelected
                  ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20 scale-102'
                  : cat.id === 'user-submitted'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-slate-950 text-sky-400' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category-specific banner when viewing User-Submitted */}
      {selectedCategory === 'user-submitted' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm sm:text-base">
              <Camera className="w-4 h-4" /> User & Contractor Submitted Jobsite Gallery
            </div>
            <p className="text-xs text-slate-300">
              Photos snapped live on-site with device cameras, watermarked with QA timestamp, and submitted for architectural verification and approval.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Approval Filter Buttons */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
              <button
                onClick={() => setApprovalFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  approvalFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setApprovalFilter('approved')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  approvalFilter === 'approved' ? 'bg-emerald-500 text-slate-950' : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setApprovalFilter('pending')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  approvalFilter === 'pending' ? 'bg-amber-500 text-slate-950' : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                Pending
              </button>
            </div>

            <button
              onClick={() => setIsCameraModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Snap New Photo
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by facility, city, contractor, substrate, challenge..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Substrate & Finish Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={substrateFilter}
              onChange={(e) => setSubstrateFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Substrates</option>
              {substrates.map((s) => (
                <option key={s} value={s}>
                  {s.length > 28 ? s.substring(0, 28) + '...' : s}
                </option>
              ))}
            </select>

            <select
              value={finishFilter}
              onChange={(e) => setFinishFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Finishes</option>
              {finishTypes.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
            >
              <option value="featured">Featured Projects</option>
              <option value="sqft">Largest Square Footage</option>
              <option value="rvalue">Highest R-Value</option>
              <option value="nrc">Highest NRC Sound Rating</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Photo Gallery Grid"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'detailed'
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Detailed Engineering Reports"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('before-after')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'before-after'
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Before & After Comparisons"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(substrateFilter !== 'all' || finishFilter !== 'all' || approvalFilter !== 'all' || searchQuery || selectedCategory !== 'all') && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
            <span>Active filters:</span>
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                Category: {selectedCategory}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-rose-400"
                  onClick={() => setSelectedCategory('all')}
                />
              </span>
            )}
            {approvalFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                Approval: {approvalFilter}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-rose-400"
                  onClick={() => setApprovalFilter('all')}
                />
              </span>
            )}
            {substrateFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                Substrate: {substrateFilter}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-rose-400"
                  onClick={() => setSubstrateFilter('all')}
                />
              </span>
            )}
            {finishFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                Finish: {finishFilter}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-rose-400"
                  onClick={() => setFinishFilter('all')}
                />
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                Query: "{searchQuery}"
                <X
                  className="w-3 h-3 cursor-pointer hover:text-rose-400"
                  onClick={() => setSearchQuery('')}
                />
              </span>
            )}
            <button
              onClick={() => {
                setSelectedCategory('all');
                setApprovalFilter('all');
                setSubstrateFilter('all');
                setFinishFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-sky-400 hover:underline ml-2"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Projects Results Count Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong className="text-white">{filteredCaseStudies.length}</strong> of{' '}
          {allCaseStudies.length} architectural installations
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCameraModalOpen(true)}
            className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" /> Submit On-Site Photo
          </button>
          <span className="text-slate-600">•</span>
          <span className="text-slate-500 hidden sm:inline">Click any card to inspect full specs</span>
        </div>
      </div>

      {/* Empty State */}
      {filteredCaseStudies.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Camera className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-lg font-bold text-white">No projects found</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              No case studies match your current filter criteria. Try adjusting your search query or snap a photo of an on-site installation now.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setApprovalFilter('all');
                setSubstrateFilter('all');
                setFinishFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Clear Filters
            </button>
            <button
              onClick={() => setIsCameraModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" /> Snap Jobsite Photo
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: Visual Photo Grid */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCaseStudies.map((cs) => (
            <CaseStudyCard
              key={cs.id}
              caseStudy={cs}
              onSelect={(project) => setSelectedCaseStudy(project)}
              onRequestBid={(project) => onRequestBid(project)}
              onApprovalChange={(csId, status) => handleApprovalChange(csId, status)}
              onDelete={(csId) => handleDeleteCaseStudy(csId)}
              onCalculateSimilar={(project) => {
                if (onNavigateToCalculator && project.thicknessInches && project.rValueNum) {
                  onNavigateToCalculator({
                    substrate: project.substrate,
                    thicknessInches: project.thicknessInches,
                    rValue: project.rValueNum,
                  });
                }
              }}
            />
          ))}
        </div>
      )}

      {/* VIEW MODE 2: Detailed Engineering Case Study Feed */}
      {viewMode === 'detailed' && (
        <div className="space-y-8">
          {filteredCaseStudies.map((cs) => (
            <div
              key={cs.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 font-semibold uppercase">
                      {cs.category}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      {cs.location}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-300">{cs.facilityType}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {cs.title}
                  </h2>
                </div>

                {/* Spec Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20 text-xs font-bold font-mono">
                    {cs.thicknessApplied} ({cs.rValueAchieved})
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold font-mono">
                    {cs.nrcAchieved}
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium">
                    {cs.squareFootage.toLocaleString()} sq. ft
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Photo Preview Column */}
                <div className="lg:col-span-4 space-y-3">
                  <div
                    onClick={() => setSelectedCaseStudy(cs)}
                    className="relative aspect-[16/10] rounded-xl overflow-hidden border border-slate-800 cursor-pointer group bg-slate-950"
                  >
                    <img
                      src={cs.imageUrl || (cs.images && cs.images[0]?.url)}
                      alt={cs.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                    <span className="absolute bottom-2 right-2 px-2 py-1 rounded bg-slate-950/80 backdrop-blur-md text-[10px] text-sky-400 font-bold border border-slate-700 flex items-center gap-1">
                      <Camera className="w-3 h-3" /> View Gallery ({cs.images?.length || 1})
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Substrate:</span>
                      <span className="text-white font-medium text-right">{cs.substrate}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Finish System:</span>
                      <span className="text-emerald-400 font-medium text-right">{cs.finishType}</span>
                    </div>
                    {cs.architectOrEngineer && (
                      <div className="flex justify-between text-slate-400">
                        <span>Specifier:</span>
                        <span className="text-slate-300 text-right">{cs.architectOrEngineer}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Challenge & Solution */}
                <div className="lg:col-span-4 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">
                      The Engineering Challenge
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      {cs.challenge}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-1.5">
                      The Monoglass Solution
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      {cs.solution}
                    </p>
                  </div>
                </div>

                {/* Verified Results */}
                <div className="lg:col-span-4 bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Documented Field Results
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-200">
                      {cs.results.map((res, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{res}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleExportPdf(cs)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <FileDown className="w-3.5 h-3.5 text-sky-400" /> PDF Sheet
                    </button>
                    <button
                      onClick={() => onRequestBid(cs)}
                      className="text-sky-400 hover:text-sky-300 font-semibold text-xs flex items-center gap-1"
                    >
                      Specify Similar <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW MODE 3: Before & After Interactive Showcase */}
      {viewMode === 'before-after' && (
        <div className="space-y-10">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Before & After Installation Showcase
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Drag the interactive slider handle on each project below to observe how Monoglass transforms bare concrete slabs, fluted metal roof decks, and soundstage trusses into high-performance monolithic envelopes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredCaseStudies
              .filter((cs) => cs.beforeAfter)
              .map((cs) => (
                <div
                  key={cs.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                        {cs.category} • {cs.location}
                      </span>
                      <h4 className="text-base font-bold text-white tracking-tight">
                        {cs.title}
                      </h4>
                    </div>
                    <button
                      onClick={() => setSelectedCaseStudy(cs)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold shrink-0"
                    >
                      Full Details
                    </button>
                  </div>

                  {cs.beforeAfter && (
                    <BeforeAfterSlider
                      beforeUrl={cs.beforeAfter.beforeUrl}
                      afterUrl={cs.beforeAfter.afterUrl}
                      beforeLabel={cs.beforeAfter.beforeLabel}
                      afterLabel={cs.beforeAfter.afterLabel}
                    />
                  )}

                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    {cs.beforeAfter?.description}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400 font-mono">
                      {cs.thicknessApplied} ({cs.rValueAchieved})
                    </span>
                    <button
                      onClick={() => onRequestBid(cs)}
                      className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                    >
                      Quote Scope <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Bottom CTA Banner */}
      <section className="bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 border border-sky-500/30 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
        <h3 className="text-xl sm:text-2xl font-bold text-white">
          Have an upcoming commercial, industrial, or arena project?
        </h3>
        <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Our certified contractor network provides on-site substrate inspections, thermal dew-point simulations, and competitive project bids across North America.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            onClick={() => setIsCameraModalOpen(true)}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2"
          >
            <Camera className="w-4 h-4" /> Snap Jobsite Field Photo
          </button>
          <button
            onClick={() => onRequestBid()}
            className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-lg shadow-sky-500/25 transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Request Project Bid RFP
          </button>
          <button
            onClick={onFindContractors}
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all"
          >
            Locate Certified Insulators
          </button>
        </div>
      </section>

      {/* Interactive Case Study Lightbox / Modal */}
      {selectedCaseStudy && (
        <CaseStudyModal
          caseStudy={selectedCaseStudy}
          onClose={() => setSelectedCaseStudy(null)}
          onRequestBid={(cs) => {
            setSelectedCaseStudy(null);
            onRequestBid(cs);
          }}
          onCalculateSimilar={(cs) => {
            setSelectedCaseStudy(null);
            if (onNavigateToCalculator && cs.thicknessInches && cs.rValueNum) {
              onNavigateToCalculator({
                substrate: cs.substrate,
                thicknessInches: cs.thicknessInches,
                rValue: cs.rValueNum,
              });
            }
          }}
          onAddToEstimator={(cs) => {
            setSelectedCaseStudy(null);
            if (onNavigateToEstimator) {
              onNavigateToEstimator(cs);
            }
          }}
        />
      )}

      {/* On-Site Camera & Live Submission Modal */}
      {isCameraModalOpen && (
        <OnSiteCameraModal
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
          onSubmitCaseStudy={handleAddNewCaseStudy}
        />
      )}
    </div>
  );
};
