import React, { useState } from 'react';
import {
  Printer,
  Eye,
  FileDown,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  LayoutTemplate,
  Loader2,
} from 'lucide-react';
import {
  exportTechnicalGuidePdf,
  exportCsiSpecPdf,
  exportCalculatorReportPdf,
  exportComparisonPdf,
} from '../utils/pdfExport';

interface FloatingPrintButtonProps {
  activeTab: string;
  onOpenPrintPreview: () => void;
  isPrintPreviewActive?: boolean;
}

export const FloatingPrintButton: React.FC<FloatingPrintButtonProps> = ({
  activeTab,
  onOpenPrintPreview,
  isPrintPreviewActive = false,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (isPrintPreviewActive) {
    return null; // The top PrintPreviewBar takes over when in preview mode
  }

  const getLabel = () => {
    switch (activeTab) {
      case 'guide':
        return 'Technical Guide';
      case 'spec-builder':
        return 'CSI 3-Part Spec';
      case 'calculator':
        return 'R-Value & Acoustic Calc';
      case 'comparison':
        return 'Material Comparison';
      case 'case-studies':
        return 'Case Studies';
      default:
        return 'Technical Guide';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      if (activeTab === 'spec-builder') {
        await exportCsiSpecPdf({
          sectionCode: '07 21 29',
          projectName: 'Commercial Submittal',
          thicknessInches: 4.0,
          rValue: '16.0',
          nrc: '0.95',
          finishType: 'standard',
          requireBondTesting: true,
          requireFieldDensityTesting: true,
        });
      } else if (activeTab === 'calculator') {
        await exportCalculatorReportPdf({
          projectName: 'Commercial Project Takeoff',
          squareFootage: 25000,
          thicknessInches: 3.5,
          substrate: 'Cast-in-Place Concrete Soffit',
          finishType: 'Monoglass Natural White',
          rValue: 14.0,
          nrc: 0.95,
          bagsNeeded: 1650,
          adhesivePailsNeeded: 55,
          estimatedLaborDays: 4,
        });
      } else if (activeTab === 'comparison') {
        await exportComparisonPdf();
      } else {
        await exportTechnicalGuidePdf();
      }
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      id="floating-print-container"
      className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2 no-print group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Informational Tooltip Popover */}
      {showTooltip && (
        <div className="bg-slate-900/95 backdrop-blur-md text-slate-200 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl max-w-xs text-xs space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200 mb-1 pointer-events-auto">
          <div className="flex items-center justify-between font-bold text-white">
            <span className="flex items-center gap-1.5 text-sky-400">
              <FileDown className="w-3.5 h-3.5" /> PDF & Physical Submittals
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              jsPDF Vector
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Export sharp vector PDF architectural documents or launch paper preview with mobile QR codes.
          </p>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              id="popover-download-pdf-btn"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-[11px] transition-colors"
              title="Download standalone PDF document"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>PDF</span>
            </button>
            <button
              id="popover-print-preview-btn"
              onClick={onOpenPrintPreview}
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold text-[11px] border border-slate-700 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              id="popover-direct-print-btn"
              onClick={handlePrint}
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-[11px] transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button Group */}
      <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-full border border-slate-700/80 shadow-2xl shadow-black/60">
        <button
          id="floating-download-pdf-btn"
          onClick={handleDownloadPdf}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs transition-all border border-emerald-500/50 shadow-md shadow-emerald-500/20 active:scale-95"
          title="Download vector PDF file"
        >
          {isExporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileDown className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Download PDF</span>
        </button>

        <button
          id="floating-print-preview-btn"
          onClick={onOpenPrintPreview}
          className="flex items-center gap-1.5 px-3 py-2 sm:px-3 sm:py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs transition-all border border-slate-700"
          title="Open in-browser Print Preview mode"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Preview</span>
        </button>

        <button
          id="floating-print-guide-btn"
          onClick={handlePrint}
          className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-sky-500/20 active:scale-95"
          title="Print Technical Guide / Save as PDF"
        >
          <Printer className="w-3.5 h-3.5 text-slate-950" />
          <span>Print {getLabel()}</span>
        </button>
      </div>
    </div>
  );
};

