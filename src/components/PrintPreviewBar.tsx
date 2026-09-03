import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  Eye,
  FileCheck,
  LayoutTemplate,
  QrCode,
  Sparkles,
  Layers,
  FileDown,
  Loader2,
  CheckCircle2,
  Stamp,
} from 'lucide-react';
import {
  captureAndDownloadViewPdf,
  exportTechnicalGuidePdf,
  exportCsiSpecPdf,
  exportCalculatorReportPdf,
  exportComparisonPdf,
} from '../utils/pdfExport';
import { UnitToggle } from './UnitToggle';
import { useSettings } from '../context/SettingsContext';
import { WatermarkPreset } from '../types';

interface PrintPreviewBarProps {
  onClose: () => void;
  onPrint: () => void;
  showGuides: boolean;
  onToggleGuides: () => void;
  activeTab: string;
}

export const PrintPreviewBar: React.FC<PrintPreviewBarProps> = ({
  onClose,
  onPrint,
  showGuides,
  onToggleGuides,
  activeTab,
}) => {
  const {
    isMetric,
    watermarkPreset,
    setWatermarkPreset,
    getEffectiveWatermark,
  } = useSettings();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isWatermarkMenuOpen, setIsWatermarkMenuOpen] = useState(false);

  // Map active tab to doc type for watermark resolution
  const getDocType = (): 'estimate' | 'spec' | 'technical' | 'comparison' => {
    if (activeTab === 'calculator') return 'estimate';
    if (activeTab === 'spec-builder') return 'spec';
    if (activeTab === 'comparison') return 'comparison';
    return 'technical';
  };

  const effectiveWatermark = getEffectiveWatermark(getDocType());

  // Listen for Escape key to quickly exit preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      setDownloadSuccess(false);

      const tabTitleMap: Record<string, string> = {
        guide: 'Monoglass_Technical_Performance_Guide',
        'spec-builder': 'Monoglass_CSI_Section_072129_Specification',
        calculator: 'Monoglass_Thermal_Acoustic_Takeoff',
        comparison: 'Monoglass_Material_Comparison_Matrix',
        directory: 'Monoglass_Certified_Applicators_Directory',
        'case-studies': 'Monoglass_Project_Case_Histories',
        advisor: 'Monoglass_AI_Engineering_Submittal',
      };

      const docTitle = tabTitleMap[activeTab] || `Monoglass_${activeTab}_Submittal`;

      // Capture rendered DOM print sheet with html2canvas & export to PDF via jsPDF
      await captureAndDownloadViewPdf({
        elementSelector: '.print-preview-sheet',
        docTitle,
        watermark: effectiveWatermark,
      });

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('html2canvas / jsPDF print preview export error:', err);
      // Graceful fallback to standalone vector generator if DOM capture encounters restrictions
      try {
        if (activeTab === 'spec-builder') {
          await exportCsiSpecPdf(
            {
              sectionCode: '07 21 29',
              projectName: 'Commercial High-Rise Submittal',
              thicknessInches: 4.0,
              rValue: '16.0',
              nrc: '0.95',
              finishType: 'standard',
              requireBondTesting: true,
              requireFieldDensityTesting: true,
            },
            undefined,
            effectiveWatermark
          );
        } else if (activeTab === 'calculator') {
          await exportCalculatorReportPdf(
            {
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
            },
            undefined,
            effectiveWatermark
          );
        } else if (activeTab === 'comparison') {
          await exportComparisonPdf(undefined, effectiveWatermark);
        } else {
          await exportTechnicalGuidePdf(undefined, effectiveWatermark);
        }
      } catch (fallbackErr) {
        console.error('Fallback export error:', fallbackErr);
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  const getDocName = () => {
    switch (activeTab) {
      case 'guide':
        return 'Technical Performance Guide (ASTM & Substrate Matrix)';
      case 'spec-builder':
        return 'CSI 3-Part MasterFormat Specification (07 21 29 / 09 81 00)';
      case 'calculator':
        return 'R-Value & Acoustical NRC Calculation Report';
      case 'comparison':
        return 'Material Comparison Report (Monoglass vs Foam & Cellulose)';
      case 'case-studies':
        return 'Architectural Project Case Histories';
      default:
        return 'Monoglass Technical Documentation';
    }
  };

  const watermarkOptions: { label: string; value: WatermarkPreset; hint: string }[] = [
    { label: 'Auto (Doc Default)', value: 'AUTO', hint: activeTab === 'calculator' ? 'PROJECT ESTIMATE' : 'DRAFT - FOR REFERENCE ONLY' },
    { label: 'DRAFT - FOR REFERENCE ONLY', value: 'DRAFT - FOR REFERENCE ONLY', hint: 'Specs & Tech data' },
    { label: 'PROJECT ESTIMATE', value: 'PROJECT ESTIMATE', hint: 'Calculators & Takeoffs' },
    { label: 'PRELIMINARY SUBMITTAL', value: 'PRELIMINARY SUBMITTAL', hint: 'Architectural submittals' },
    { label: 'NOT FOR CONSTRUCTION', value: 'NOT FOR CONSTRUCTION', hint: 'Engineering review' },
    { label: 'CONFIDENTIAL', value: 'CONFIDENTIAL', hint: 'Internal bidding' },
    { label: 'None (Clean Submittal)', value: 'NONE', hint: 'No background watermark' },
  ];

  return (
    <div
      id="print-preview-toolbar"
      className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b-2 border-sky-500 shadow-2xl px-4 py-3 text-slate-100 no-print"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mode Title & Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-sky-400">
                Print & Submittal Preview Mode
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Letter Portrait (8.5 × 11 in)
              </span>
              {effectiveWatermark && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hidden md:inline-flex items-center gap-1">
                  <Stamp className="w-3 h-3" />
                  {effectiveWatermark}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-300 font-medium truncate max-w-md sm:max-w-xl">
              Simulating physical paper output: {getDocName()}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Watermark Selector Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-700">
              <Stamp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <label htmlFor="watermark-select" className="text-[11px] text-slate-400 font-medium hidden lg:inline">
                Watermark:
              </label>
              <select
                id="watermark-select"
                value={watermarkPreset}
                onChange={(e) => setWatermarkPreset(e.target.value as WatermarkPreset)}
                className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer pr-1"
                title="Select watermark text applied across exported PDFs and preview"
              >
                {watermarkOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Unit Toggle inside Preview toolbar */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Units:</span>
            <UnitToggle variant="header" />
          </div>

          <button
            id="toggle-guides-btn"
            onClick={onToggleGuides}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              showGuides
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Toggle paper margin boundary guides"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Margin Guides:</span>
            <span>{showGuides ? 'On' : 'Off'}</span>
          </button>

          {/* Primary Download as PDF Button (jsPDF + html2canvas) */}
          <button
            id="preview-download-pdf-btn"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            title="Capture current print view and download directly as PDF with watermark using jsPDF and html2canvas"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : downloadSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            <span>
              {isExportingPdf
                ? 'Capturing & Exporting PDF...'
                : downloadSuccess
                ? 'PDF Downloaded!'
                : 'Download as PDF'}
            </span>
          </button>

          <button
            id="preview-execute-print-btn"
            onClick={onPrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
            title="Open system print dialog / Save as PDF via browser"
          >
            <Printer className="w-4 h-4" />
            <span>Print Document</span>
          </button>

          <button
            id="exit-print-preview-btn"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
            title="Exit preview and return to interactive dark mode UI (or press Esc)"
          >
            <X className="w-4 h-4" />
            <span>Exit Preview</span>
            <span className="hidden md:inline text-[10px] text-slate-500 font-mono">Esc</span>
          </button>
        </div>
      </div>
    </div>
  );
};

