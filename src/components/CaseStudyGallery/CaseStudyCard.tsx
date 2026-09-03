import React, { useState } from 'react';
import { CaseStudy } from '../../types';
import {
  MapPin,
  Layers,
  Thermometer,
  Volume2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileDown,
  Building2,
  Camera,
  Check,
  X,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { exportCaseStudyPdf } from '../../utils/pdfExport';
import { useSettings } from '../../context/SettingsContext';

interface CaseStudyCardProps {
  caseStudy: CaseStudy;
  onSelect: (cs: CaseStudy) => void;
  onRequestBid: (cs: CaseStudy) => void;
  onCalculateSimilar?: (cs: CaseStudy) => void;
  onApprovalChange?: (csId: string, status: 'approved' | 'rejected' | 'pending') => void;
  onDelete?: (csId: string) => void;
}

export const CaseStudyCard: React.FC<CaseStudyCardProps> = ({
  caseStudy,
  onSelect,
  onRequestBid,
  onCalculateSimilar,
  onApprovalChange,
  onDelete,
}) => {
  const { getEffectiveWatermark } = useSettings();
  const [showBefore, setShowBefore] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const primaryImage =
    caseStudy.imageUrl ||
    (caseStudy.images && caseStudy.images[0]?.url) ||
    'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1600&q=80';

  const beforeImage = caseStudy.beforeAfter?.beforeUrl;
  const currentDisplayImage = showBefore && beforeImage ? beforeImage : primaryImage;

  const photoCount = caseStudy.images?.length || 1;

  const handleExportPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsExporting(true);
      const watermark = getEffectiveWatermark('technical');
      await exportCaseStudyPdf(caseStudy, { watermark });
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const categoryColorMap: Record<string, { bg: string; text: string; border: string }> = {
    commercial: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    industrial: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    recreational: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    acoustic: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
    parking: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
    institutional: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
    'user-submitted': { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40' },
  };

  const catStyle = categoryColorMap[caseStudy.category] || categoryColorMap.commercial;

  return (
    <div
      onClick={() => onSelect(caseStudy)}
      className="group bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Image Preview with Badges */}
      <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
        <img
          src={currentDisplayImage}
          alt={caseStudy.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <span
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md flex items-center gap-1 ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
            >
              {caseStudy.category === 'user-submitted' ? (
                <>
                  <Camera className="w-3 h-3" /> Field Snap
                </>
              ) : (
                caseStudy.category
              )}
            </span>

            {caseStudy.approvalStatus && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${
                  caseStudy.approvalStatus === 'approved'
                    ? 'bg-emerald-950/85 text-emerald-400 border-emerald-500/40'
                    : caseStudy.approvalStatus === 'pending'
                    ? 'bg-amber-950/85 text-amber-300 border-amber-500/40 animate-pulse'
                    : 'bg-rose-950/85 text-rose-400 border-rose-500/40'
                }`}
              >
                {caseStudy.approvalStatus === 'approved'
                  ? '✓ Approved'
                  : caseStudy.approvalStatus === 'pending'
                  ? '⏳ Pending Review'
                  : '✕ Rejected'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            {caseStudy.beforeAfter && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBefore((prev) => !prev);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold backdrop-blur-md border transition-all ${
                  showBefore
                    ? 'bg-amber-500/90 text-slate-950 border-amber-400'
                    : 'bg-slate-950/80 text-slate-300 border-slate-700 hover:bg-slate-900'
                }`}
                title="Toggle Before/After Preview"
              >
                {showBefore ? 'Viewing Before' : 'Toggle Before'}
              </button>
            )}

            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-md border border-slate-700 text-[10px] font-mono text-slate-300">
              <Camera className="w-3 h-3 text-sky-400" />
              {photoCount}
            </span>
          </div>
        </div>

        {/* Bottom Image Overlay: Specs Pill */}
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-white bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 shadow">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>{caseStudy.thicknessApplied}</span>
            <span className="text-sky-400">({caseStudy.rValueAchieved})</span>
          </div>

          <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-indigo-300 bg-indigo-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-indigo-500/30 shadow">
            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{caseStudy.nrcAchieved}</span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>{caseStudy.location}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 truncate">{caseStudy.facilityType}</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight line-clamp-2 group-hover:text-sky-300 transition-colors">
            {caseStudy.title}
          </h3>

          {caseStudy.contractorCompany && (
            <div className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1">
              <span className="text-slate-500">Submitted by:</span>
              <strong className="text-amber-300">{caseStudy.contractorCompany}</strong>
              {caseStudy.contractorName && <span>({caseStudy.contractorName})</span>}
            </div>
          )}

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {caseStudy.challenge}
          </p>
        </div>

        {/* Substrate & Finish Detail Bar */}
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-slate-500 block uppercase font-medium text-[9px]">Substrate</span>
            <span className="text-slate-300 font-medium truncate block">{caseStudy.substrate}</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-medium text-[9px]">Finish System</span>
            <span className="text-emerald-400 font-medium truncate block">{caseStudy.finishType}</span>
          </div>
        </div>

        {/* Quick Approval Action Bar if User-Submitted */}
        {caseStudy.category === 'user-submitted' && onApprovalChange && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2 text-[11px]"
          >
            <span className="text-slate-400 font-medium">Review Status:</span>
            <div className="flex items-center gap-1.5">
              {caseStudy.approvalStatus !== 'approved' && (
                <button
                  type="button"
                  onClick={() => onApprovalChange(caseStudy.id, 'approved')}
                  className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold flex items-center gap-1 transition-all"
                  title="Approve submission for verified gallery"
                >
                  <Check className="w-3 h-3" /> Approve
                </button>
              )}
              {caseStudy.approvalStatus !== 'rejected' && (
                <button
                  type="button"
                  onClick={() => onApprovalChange(caseStudy.id, 'rejected')}
                  className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-slate-950 font-bold flex items-center gap-1 transition-all"
                  title="Reject or request revisions"
                >
                  <X className="w-3 h-3" /> Reject
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(caseStudy.id)}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                  title="Delete local submission"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800/50">
          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-colors"
            title="Download Case Study Submittal Sheet (PDF)"
          >
            <FileDown className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestBid(caseStudy);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              Quote Similar
            </button>
            <button
              onClick={() => onSelect(caseStudy)}
              className="px-3.5 py-1.5 rounded-lg bg-sky-500/10 group-hover:bg-sky-500 text-sky-400 group-hover:text-slate-950 text-xs font-bold transition-all flex items-center gap-1"
            >
              Explore <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

