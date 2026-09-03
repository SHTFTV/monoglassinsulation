import React, { useState } from 'react';
import { CaseStudy, CaseStudyImage } from '../../types';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import {
  X,
  MapPin,
  Building2,
  Layers,
  Thermometer,
  Volume2,
  FileDown,
  Calculator,
  Send,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Maximize2,
  Tag,
  Clock,
  Briefcase,
  Camera,
  Building,
} from 'lucide-react';
import { exportCaseStudyPdf } from '../../utils/pdfExport';
import { useSettings } from '../../context/SettingsContext';

interface CaseStudyModalProps {
  caseStudy: CaseStudy | null;
  onClose: () => void;
  onRequestBid: (caseStudy: CaseStudy) => void;
  onCalculateSimilar?: (caseStudy: CaseStudy) => void;
  onAddToEstimator?: (caseStudy: CaseStudy) => void;
}

export const CaseStudyModal: React.FC<CaseStudyModalProps> = ({
  caseStudy,
  onClose,
  onRequestBid,
  onCalculateSimilar,
  onAddToEstimator,
}) => {
  const { getEffectiveWatermark } = useSettings();
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [activeStageFilter, setActiveStageFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'photos' | 'before-after' | 'specs'>('photos');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  if (!caseStudy) return null;

  const images: CaseStudyImage[] =
    caseStudy.images && caseStudy.images.length > 0
      ? caseStudy.images
      : [
          {
            url: caseStudy.imageUrl || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1600&q=80',
            caption: `${caseStudy.title} - Finished Installation`,
            stage: 'Finished Surface',
          },
        ];

  const filteredImages =
    activeStageFilter === 'all'
      ? images
      : images.filter((img) => img.stage === activeStageFilter);

  const currentImage = filteredImages[activeImageIndex] || filteredImages[0] || images[0];

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % filteredImages.length);
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const watermark = getEffectiveWatermark('technical');
      await exportCaseStudyPdf(caseStudy, { watermark });
    } catch (err) {
      console.error('Failed to export Case Study PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const stages = [
    'all',
    'Finished Surface',
    'In-Progress Spray',
    'Substrate Prep',
    'Detail View',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800 bg-slate-950/70 sticky top-0 z-20">
          <div className="space-y-1 max-w-[80%]">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 font-semibold uppercase tracking-wider">
                {caseStudy.category.toUpperCase()}
              </span>
              <span className="flex items-center gap-1 text-slate-400 font-medium">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                {caseStudy.location}
              </span>
              {caseStudy.yearCompleted && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Completed {caseStudy.yearCompleted}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight line-clamp-1">
              {caseStudy.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              title="Download Architectural Case Study Submittal Sheet"
            >
              <FileDown className="w-3.5 h-3.5 text-sky-400" />
              {isExportingPdf ? 'Generating...' : 'Export PDF'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/80 p-3 sm:p-4 rounded-xl border border-slate-800">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Applied Thickness
              </span>
              <div className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-400" />
                {caseStudy.thicknessApplied}
              </div>
              <span className="text-[11px] text-sky-400 font-medium block">
                {caseStudy.rValueAchieved}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Acoustic Rating
              </span>
              <div className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                {caseStudy.nrcAchieved}
              </div>
              <span className="text-[11px] text-slate-400 block">Sound Absorption</span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Substrate & Scope
              </span>
              <div className="text-sm sm:text-base font-bold text-white font-mono">
                {caseStudy.squareFootage.toLocaleString()} sq. ft
              </div>
              <span className="text-[11px] text-slate-300 truncate block">
                {caseStudy.substrate}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Finish System
              </span>
              <div className="text-sm sm:text-base font-bold text-emerald-400 truncate">
                {caseStudy.finishType}
              </div>
              <span className="text-[11px] text-slate-400 block">
                CSI {caseStudy.csiSection || '07 21 29'}
              </span>
            </div>
          </div>

          {/* Visual Gallery Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setActiveTab('photos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'photos'
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Installation Photos ({images.length})
              </button>
              {caseStudy.beforeAfter && (
                <button
                  onClick={() => setActiveTab('before-after')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    activeTab === 'before-after'
                      ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Before & After
                </button>
              )}
              <button
                onClick={() => setActiveTab('specs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'specs'
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Full Engineering Specs
              </button>
            </div>

            {activeTab === 'photos' && (
              <div className="hidden md:flex items-center gap-1">
                {stages.map((stg) => (
                  <button
                    key={stg}
                    onClick={() => {
                      setActiveStageFilter(stg);
                      setActiveImageIndex(0);
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                      activeStageFilter === stg
                        ? 'bg-slate-700 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {stg === 'all' ? 'All Stages' : stg}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TAB 1: Installation Photo Viewer */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              {/* Main Photo Display */}
              <div className="relative aspect-[16/9] sm:aspect-[16/10] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 group shadow-inner">
                {currentImage ? (
                  <img
                    src={currentImage.url}
                    alt={currentImage.caption}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                    No image available for this stage
                  </div>
                )}

                {/* Stage Tag Overlay */}
                {currentImage && (
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700 text-xs font-bold text-sky-400 shadow-md">
                      {currentImage.stage}
                    </span>
                  </div>
                )}

                {/* Photo Counter */}
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700 text-xs font-mono text-slate-300">
                    {activeImageIndex + 1} / {filteredImages.length}
                  </span>
                </div>

                {/* Caption Bar */}
                {currentImage && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 pt-8">
                    <p className="text-xs sm:text-sm text-slate-200 font-medium drop-shadow">
                      {currentImage.caption}
                    </p>
                  </div>
                )}

                {/* Navigation Arrows */}
                {filteredImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-sm border border-slate-700 opacity-80 hover:opacity-100 transition-opacity"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-sm border border-slate-700 opacity-80 hover:opacity-100 transition-opacity"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails Row */}
              {filteredImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {filteredImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative flex-shrink-0 w-20 sm:w-24 aspect-[16/10] rounded-lg overflow-hidden border-2 transition-all ${
                        activeImageIndex === idx
                          ? 'border-sky-500 shadow-md shadow-sky-500/20 scale-102'
                          : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.caption}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[8px] text-slate-300 font-semibold px-1 truncate text-center">
                        {img.stage}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Before & After Interactive Slider */}
          {activeTab === 'before-after' && caseStudy.beforeAfter && (
            <div className="space-y-4">
              <BeforeAfterSlider
                beforeUrl={caseStudy.beforeAfter.beforeUrl}
                afterUrl={caseStudy.beforeAfter.afterUrl}
                beforeLabel={caseStudy.beforeAfter.beforeLabel}
                afterLabel={caseStudy.beforeAfter.afterLabel}
              />
              <p className="text-xs sm:text-sm text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed">
                <strong className="text-white block mb-1">Substrate Transformation Overview:</strong>
                {caseStudy.beforeAfter.description}
              </p>
            </div>
          )}

          {/* TAB 3 / Engineering Details Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Challenge & Solution */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-950 p-4 sm:p-5 rounded-xl border border-amber-500/20 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  The Engineering & Architectural Challenge
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {caseStudy.challenge}
                </p>
              </div>

              <div className="bg-slate-950 p-4 sm:p-5 rounded-xl border border-sky-500/20 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  The Monoglass® Solution
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {caseStudy.solution}
                </p>
              </div>

              {caseStudy.keyFeatures && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Key Installation Highlights
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {caseStudy.keyFeatures.map((feat, fIdx) => (
                      <div
                        key={fIdx}
                        className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Documented Results & Project Metadata */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-950 p-4 sm:p-5 rounded-xl border border-emerald-500/20 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Documented Project Results
                </h4>
                <ul className="space-y-2 text-xs text-slate-200">
                  {caseStudy.results.map((res, rIdx) => (
                    <li key={rIdx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{res}</span>
                    </li>
                  ))}
                </ul>

                {caseStudy.energySavingsOrDecibelDrop && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <span className="text-[11px] font-bold text-emerald-400 block uppercase tracking-wider mb-1">
                      Verified Field Metric
                    </span>
                    <span className="text-xs font-semibold text-white bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-md block">
                      {caseStudy.energySavingsOrDecibelDrop}
                    </span>
                  </div>
                )}
              </div>

              {/* Architect / Specifier / Contractor Info */}
              {caseStudy.contractorCompany ? (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/30 text-xs text-slate-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" /> User-Submitted On-Site Photo
                    </span>
                    {caseStudy.approvalStatus && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          caseStudy.approvalStatus === 'approved'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                            : caseStudy.approvalStatus === 'pending'
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                        }`}
                      >
                        {caseStudy.approvalStatus === 'approved'
                          ? 'Approved for Gallery'
                          : caseStudy.approvalStatus === 'pending'
                          ? 'Pending Review'
                          : 'Revision Requested'}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 pt-1 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Contractor / Applicator:</span>
                      <strong className="text-white">{caseStudy.contractorCompany}</strong>
                    </div>
                    {caseStudy.contractorName && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Technician:</span>
                        <span className="text-slate-200">{caseStudy.contractorName}</span>
                      </div>
                    )}
                    {caseStudy.submittedAt && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Date Captured:</span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {new Date(caseStudy.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                caseStudy.architectOrEngineer && (
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2.5">
                    <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Architect / Engineering Specifier
                      </span>
                      <span className="text-white font-medium">
                        {caseStudy.architectOrEngineer}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Modal Sticky Bottom Action Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-20">
          <div className="flex items-center gap-2">
            {onCalculateSimilar && (
              <button
                onClick={() => {
                  onClose();
                  onCalculateSimilar(caseStudy);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
              >
                <Calculator className="w-3.5 h-3.5 text-sky-400" />
                Calculate Similar Assembly
              </button>
            )}
            {onAddToEstimator && (
              <button
                onClick={() => {
                  onClose();
                  onAddToEstimator(caseStudy);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Add to Multi-Room Project
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="sm:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700"
            >
              <FileDown className="w-3.5 h-3.5 text-sky-400" />
              PDF
            </button>
            <button
              onClick={() => {
                onClose();
                onRequestBid(caseStudy);
              }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/20 transition-all"
            >
              <Send className="w-4 h-4" />
              Request Contractor Bid for Similar Scope
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
