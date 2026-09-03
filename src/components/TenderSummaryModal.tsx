import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  X,
  Building2,
  Calendar,
  Layers,
  ShieldCheck,
  Printer,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { MultiRoomProject, ConsolidatedBom } from '../types';
import {
  generateTenderSummaryText,
  downloadTenderSummaryTextFile,
  TenderSummaryOptions,
} from '../utils/tenderSummaryGenerator';

interface TenderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: MultiRoomProject;
  bom: ConsolidatedBom;
}

export const TenderSummaryModal: React.FC<TenderSummaryModalProps> = ({
  isOpen,
  onClose,
  project,
  bom,
}) => {
  const [tenderRef, setTenderRef] = useState<string>('');
  const [contractorName, setContractorName] = useState<string>('');
  const [bidDeadline, setBidDeadline] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const summaryOptions: TenderSummaryOptions = useMemo(
    () => ({
      tenderReferenceNumber: tenderRef.trim() || undefined,
      contractorName: contractorName.trim() || undefined,
      bidSubmissionDeadline: bidDeadline.trim() || undefined,
    }),
    [tenderRef, contractorName, bidDeadline]
  );

  const generatedText = useMemo(() => {
    if (!isOpen) return '';
    return generateTenderSummaryText(project, bom, summaryOptions);
  }, [isOpen, project, bom, summaryOptions]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleDownload = () => {
    downloadTenderSummaryTextFile(project, bom, summaryOptions);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${project.name || 'Project'} - Site Conditions & Spec Summary</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              line-height: 1.45;
              color: #111;
              padding: 30px;
              white-space: pre-wrap;
              background: #fff;
            }
            @media print {
              body { padding: 15px; font-size: 11px; }
            }
          </style>
        </head>
        <body>${generatedText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scaleUp"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tender-summary-title"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/90 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 font-mono">
                  Formal Tender Addendum
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-medium">
                  .txt document
                </span>
              </div>
              <h3 id="tender-summary-title" className="text-xl font-bold text-white mt-0.5">
                Site Conditions & Specification Summary
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Generates a clean text document capturing calculated quantities, substrate assumptions, and user-entered notes formatted for formal tender packages and bid solicitations.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Optional Tender Parameters Bar */}
        <div className="bg-slate-950/90 border-b border-slate-800 p-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Tender / RFP Ref # (Optional)
            </label>
            <input
              type="text"
              value={tenderRef}
              onChange={(e) => setTenderRef(e.target.value)}
              placeholder="e.g. RFP-2026-072129"
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-sky-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Preparing Contractor / Submitter
            </label>
            <input
              type="text"
              value={contractorName}
              onChange={(e) => setContractorName(e.target.value)}
              placeholder="e.g. Apex Acoustic & Spray Specialists Inc."
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-sky-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Bid Submission Deadline
            </label>
            <input
              type="text"
              value={bidDeadline}
              onChange={(e) => setBidDeadline(e.target.value)}
              placeholder="e.g. September 15, 2026 @ 2:00 PM EST"
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-sky-500 font-sans"
            />
          </div>
        </div>

        {/* Text Preview Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-950/60 font-mono text-xs text-slate-300">
          <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-inner">
            <pre className="whitespace-pre-wrap select-all font-mono text-[11px] sm:text-xs leading-relaxed text-slate-200 overflow-x-auto">
              {generatedText}
            </pre>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Ready for inclusion in CSI 07 21 29 / 09 81 00 tender submissions</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Preview</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary Text'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-sky-500/25 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .txt Summary</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
