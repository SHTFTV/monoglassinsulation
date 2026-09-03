import React, { useState } from 'react';
import { COMPARISON_PRODUCTS } from '../data/monoglassData';
import {
  Layers,
  ShieldCheck,
  Flame,
  Droplets,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  AlertTriangle,
  FileDown,
  Loader2,
  Printer,
  Globe,
} from 'lucide-react';
import { exportComparisonPdf } from '../utils/pdfExport';
import { useSettings } from '../context/SettingsContext';
import { UnitToggle } from './UnitToggle';

export const ComparisonView: React.FC = () => {
  const { unitSystem, isMetric, getEffectiveWatermark } = useSettings();
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const watermark = getEffectiveWatermark('comparison');
      await exportComparisonPdf(undefined, watermark);
    } catch (err) {
      console.error('Failed to export comparison matrix PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Header */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-4 h-4" /> Material Engineering Matrix
          </div>
          <div className="flex items-center gap-2 no-print flex-wrap">
            {/* Quick Unit Toggle */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Units:</span>
              <UnitToggle variant="header" />
            </div>

            <button
              id="comparison-download-pdf-btn"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95"
              title="Download standalone vector PDF comparison matrix"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>{isExportingPdf ? 'Exporting...' : 'Download Matrix (PDF)'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Print</span>
            </button>
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Monoglass vs Alternative Commercial Insulation Systems
        </h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
          Compare physical properties, fire ratings, ASTM testing, moisture behavior, code requirements, and total installed efficiency between Monoglass, Cellulose Spray (K-13), Spray Polyurethane Foam (SPF), Mineral Wool, and Rigid Board in {isMetric ? 'Metric SI' : 'US Customary'} standards.
        </p>
      </section>

      {/* Side-by-Side Comparison Matrix Table */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">System Comparison Table ({isMetric ? 'Metric SI' : 'US Customary'})</h3>
          <span className="text-xs text-slate-400">Scroll horizontally on mobile →</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-950/80 text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-48 sticky left-0 bg-slate-950 z-10">Property / Parameter</th>
                <th className="py-3.5 px-4 bg-sky-950/40 text-sky-300 border-x border-sky-800/40 min-w-[220px]">
                  Monoglass (Glass Fiber)
                </th>
                <th className="py-3.5 px-4 min-w-[180px]">Cellulose Spray (K-13)</th>
                <th className="py-3.5 px-4 min-w-[180px]">Spray Foam (Closed-Cell)</th>
                <th className="py-3.5 px-4 min-w-[180px]">Mineral Wool Spray</th>
                <th className="py-3.5 px-4 min-w-[180px]">Rigid Board (XPS/Polyiso)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {/* Thermal R-Value */}
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-white sticky left-0 bg-slate-900">
                  {isMetric ? 'Thermal RSI / 25 mm' : 'Thermal R-Value / inch'}
                </td>
                <td className="py-3 px-4 font-mono font-bold text-sky-400 bg-sky-950/20 border-x border-sky-800/40">
                  {isMetric ? 'RSI 0.70 / 25 mm (λ=0.036)' : 'R-4.00 / in (k=0.25)'}
                </td>
                <td className="py-3 px-4 font-mono">{isMetric ? 'RSI 0.66 / 25 mm' : 'R-3.75 / in'}</td>
                <td className="py-3 px-4 font-mono">{isMetric ? 'RSI 1.14 / 25 mm' : 'R-6.50 / in'}</td>
                <td className="py-3 px-4 font-mono">{isMetric ? 'RSI 0.63 / 25 mm' : 'R-3.60 / in'}</td>
                <td className="py-3 px-4 font-mono">{isMetric ? 'RSI 0.88 - 1.05 / 25 mm' : 'R-5.00 - R-6.00 / in'}</td>
              </tr>

              {/* Flame Spread / Smoke (ASTM E84) */}
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-white sticky left-0 bg-slate-900">
                  ASTM E84 Flame / Smoke
                </td>
                <td className="py-3 px-4 font-bold text-emerald-400 bg-sky-950/20 border-x border-sky-800/40">
                  0 / 0 (Class 1 / Class A)
                </td>
                <td className="py-3 px-4 text-amber-300">5 - 15 / 5 - 20 (Class A)</td>
                <td className="py-3 px-4 text-rose-400">25 / 350 - 450 (High Smoke)</td>
                <td className="py-3 px-4 text-emerald-400">0 / 0 (Class A)</td>
                <td className="py-3 px-4 text-rose-400">25 - 75 / 150 - 450</td>
              </tr>

              {/* Non-Combustibility (ASTM E136) */}
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-white sticky left-0 bg-slate-900">
                  ASTM E136 Non-Combustible
                </td>
                <td className="py-3 px-4 bg-sky-950/20 border-x border-sky-800/40">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 100% Non-Combustible
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400">
                  <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" /> Combustible Paper Base
                  </span>
                </td>
                <td className="py-3 px-4 text-rose-400">
                  <span className="inline-flex items-center gap-1 text-xs text-rose-400">
                    <XCircle className="w-3.5 h-3.5" /> Combustible Plastic
                  </span>
                </td>
                <td className="py-3 px-4 text-emerald-400">
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Non-Combustible
                  </span>
                </td>
                <td className="py-3 px-4 text-rose-400">
                  <span className="inline-flex items-center gap-1 text-xs text-rose-400">
                    <XCircle className="w-3.5 h-3.5" /> Combustible Plastic
                  </span>
                </td>
              </tr>

              {/* Thermal Barrier Required (IBC 2603) */}
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-white sticky left-0 bg-slate-900">
                  IBC Thermal Barrier Needed?
                </td>
                <td className="py-3 px-4 font-semibold text-emerald-300 bg-sky-950/20 border-x border-sky-800/40">
                  NO — Left exposed legally
                </td>
                <td className="py-3 px-4 text-slate-300">NO — Left exposed</td>
                <td className="py-3 px-4 font-bold text-rose-400">
                  YES — Mandatory 15-min barrier (Drywall or Intumescent)
                </td>
                <td className="py-3 px-4 text-slate-300">NO — Left exposed</td>
                <td className="py-3 px-4 font-bold text-rose-400">
                  YES — Mandatory 15-min barrier
                </td>
              </tr>

              {/* Max Single-Pass Thickness */}
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-white sticky left-0 bg-slate-900">
                  Max Single Pass Build
                </td>
                <td className="py-3 px-4 font-bold text-sky-400 bg-sky-950/20 border-x border-sky-800/40">
                  {isMetric ? 'Up to 125 mm (RSI 3.52)' : 'Up to 5.0" (R-20)'}
                </td>
                <td className="py-3 px-4">{isMetric ? '38 mm - 64 mm (2+ passes)' : '1.5" - 2.5" (Requires 2+ passes)'}</td>
                <td className="py-3 px-4">{isMetric ? '38 mm - 50 mm (Pass limit)' : '1.5" - 2.0" (Pass limitation)'}</td>
                <td className="py-3 px-4">{isMetric ? '50 mm - 75 mm' : '2.0" - 3.0"'}</td>
                <td className="py-3 px-4">N/A (Rigid board joints)</td>
              </tr>

              {/* Moisture & Mold Resistance */}
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-white sticky left-0 bg-slate-900">
                  Mold Resistance (ASTM C1338)
                </td>
                <td className="py-3 px-4 text-emerald-300 bg-sky-950/20 border-x border-sky-800/40">
                  Zero Growth (Inorganic)
                </td>
                <td className="py-3 px-4 text-amber-300">Vulnerable if damp</td>
                <td className="py-3 px-4 text-slate-300">Resistant (Synthetic)</td>
                <td className="py-3 px-4 text-emerald-300">Zero Growth (Inorganic)</td>
                <td className="py-3 px-4 text-slate-300">Resistant</td>
              </tr>

              {/* Acoustic Absorption (NRC) */}
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-white sticky left-0 bg-slate-900">
                  Acoustic NRC Absorption
                </td>
                <td className="py-3 px-4 font-mono font-bold text-indigo-300 bg-sky-950/20 border-x border-sky-800/40">
                  0.75 - 0.95+
                </td>
                <td className="py-3 px-4 font-mono">0.75 - 0.90</td>
                <td className="py-3 px-4 font-mono text-slate-400">0.05 - 0.15 (Reflective)</td>
                <td className="py-3 px-4 font-mono">0.75 - 0.85</td>
                <td className="py-3 px-4 font-mono text-slate-400">0.05 - 0.10 (Reflective)</td>
              </tr>

              {/* Aesthetic Reflectance */}
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-white sticky left-0 bg-slate-900">
                  Aesthetic Light Reflectance
                </td>
                <td className="py-3 px-4 font-bold text-white bg-sky-950/20 border-x border-sky-800/40">
                  Bright White (~85% Reflectance)
                </td>
                <td className="py-3 px-4 text-slate-300">Gray / Off-white (65-75%)</td>
                <td className="py-3 px-4 text-slate-400">Yellow / Mustard foam</td>
                <td className="py-3 px-4 text-slate-400">Dark brownish gray (40%)</td>
                <td className="py-3 px-4 text-slate-300">Foil / Colored facer</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Deep-Dive Product Profile Cards */}
      <section className="space-y-6">
        <div>
          <div className="text-sky-400 text-xs font-bold uppercase tracking-wider">
            Detailed Profiles
          </div>
          <h2 className="text-2xl font-bold text-white">
            Individual Material Strengths & Critical Limitations
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COMPARISON_PRODUCTS.map((prod, idx) => {
            const dynamicThermal = isMetric
              ? prod.rValuePerInch.includes('4.00')
                ? 'RSI 0.70 / 25 mm (R-4.00)'
                : prod.rValuePerInch.includes('3.75')
                ? 'RSI 0.66 / 25 mm (R-3.75)'
                : prod.rValuePerInch.includes('6.50')
                ? 'RSI 1.14 / 25 mm (R-6.50)'
                : prod.rValuePerInch.includes('3.60')
                ? 'RSI 0.63 / 25 mm (R-3.60)'
                : 'RSI 0.88 - 1.05 / 25 mm'
              : prod.rValuePerInch;

            return (
              <div
                key={idx}
                className={`bg-slate-900 border rounded-2xl p-6 space-y-4 transition-all ${
                  idx === 0
                    ? 'border-sky-500/50 shadow-lg shadow-sky-500/10'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{prod.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{prod.materialType}</p>
                  </div>
                  {idx === 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 shrink-0">
                      Recommended Spec
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 block">{isMetric ? 'RSI Rate:' : 'Thermal Rate:'}</span>
                    <span className="font-bold text-white font-mono">{dynamicThermal}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 block">Flame / Smoke:</span>
                    <span className="font-bold text-white font-mono">{prod.flameSpreadIndex} / {prod.smokeDevelopedIndex}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Key Advantages
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {prod.pros.map((p, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-xs font-bold uppercase tracking-wider text-rose-400">
                    Engineering Limitations / Code Caveats
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-400">
                    {prod.cons.map((c, cIdx) => (
                      <li key={cIdx} className="flex items-start gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
