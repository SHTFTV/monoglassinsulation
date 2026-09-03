import React, { useState } from 'react';
import {
  ASTM_TEST_RECORDS,
  ACOUSTIC_FREQUENCY_DATA,
  SUBSTRATE_GUIDES,
} from '../data/monoglassData';
import {
  ShieldCheck,
  Flame,
  Volume2,
  Thermometer,
  Layers,
  CheckCircle,
  HelpCircle,
  Building,
  Sparkles,
  ArrowRight,
  Info,
  Droplets,
  Wind,
  Compass,
  Printer,
  Eye,
  FileDown,
  Loader2,
  Globe,
  Scale,
} from 'lucide-react';
import { exportTechnicalGuidePdf } from '../utils/pdfExport';
import { useSettings } from '../context/SettingsContext';
import { UnitToggle } from './UnitToggle';

interface TechGuideViewProps {
  onNavigateToCalculator: () => void;
  onNavigateToContractors: () => void;
  onNavigateToSpecBuilder: () => void;
  onOpenPrintPreview?: () => void;
}

export const TechGuideView: React.FC<TechGuideViewProps> = ({
  onNavigateToCalculator,
  onNavigateToContractors,
  onNavigateToSpecBuilder,
  onOpenPrintPreview,
}) => {
  const {
    unitSystem,
    isMetric,
    formatThickness,
    formatRValue,
    formatArea,
    formatTemp,
    formatDensity,
    formatAdhesion,
    formatAirVelocity,
    getEffectiveWatermark,
  } = useSettings();
  const [selectedThicknessIndex, setSelectedThicknessIndex] = useState(3); // 2.5" by default
  const [activeSubstrateIndex, setActiveSubstrateIndex] = useState(0);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const selectedAcoustic = ACOUSTIC_FREQUENCY_DATA[selectedThicknessIndex];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const watermark = getEffectiveWatermark('technical');
      await exportTechnicalGuidePdf(undefined, watermark);
    } catch (err) {
      console.error('Failed to export technical guide PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Print Document Header (Visible only when printing) */}
      <div className="print-only print-document-header">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            MONOGLASS SPRAY-APPLIED GLASS FIBER INSULATION
          </h1>
          <p className="text-xs text-slate-600">
            Technical Performance Guide, ASTM Compliance Standards & Substrate Adhesion Matrix ({isMetric ? 'Metric SI Standards' : 'US Customary Standards'})
          </p>
        </div>
        <div className="text-right text-xs text-slate-600">
          <div>CSI Division 07 21 29 / 09 81 00</div>
          <div>monoglassinsulation.com</div>
        </div>
      </div>

      {/* Hero Technical Overview Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none no-print" />
        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> The Official Master Guide to Spray-Applied Glass Fiber
            </div>
            <div className="flex items-center gap-2 no-print flex-wrap">
              {/* Quick Unit Toggle in Guide Hero */}
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-700">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Units:</span>
                <UnitToggle variant="header" />
              </div>

              <button
                id="guide-download-pdf-btn"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                title="Download complete technical data submittal PDF"
              >
                {isExportingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
                <span>{isExportingPdf ? 'Exporting PDF...' : 'Download Tech PDF'}</span>
              </button>

              {onOpenPrintPreview && (
                <button
                  id="guide-preview-print-btn"
                  onClick={onOpenPrintPreview}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 text-xs font-semibold transition-all shadow-sm"
                  title="Preview print layout on screen"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview Print</span>
                </button>
              )}

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all shadow-sm"
                title="Print Technical Guide or save as PDF"
              >
                <Printer className="w-4 h-4 text-sky-400" />
                <span>Print Guide</span>
              </button>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Monoglass Spray Insulation:
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-300">
              The Non-Combustible Thermal & Acoustic Authority
            </span>
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl">
            Monoglass is a 100% white inorganic spray-applied glass fiber insulation bonded with a specialized non-toxic, water-soluble polymer adhesive. Engineered for monolithic continuous insulation over concrete, fluted steel decks, and complex architectural geometries with zero mechanical fasteners.
          </p>

          {/* Key Metric Value Cards with Dynamic Units */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <Thermometer className="w-4 h-4" /> Thermal Value
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {isMetric ? 'RSI 0.70' : 'R-4.00'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {isMetric ? 'per 25 mm (λ = 0.036 W/m·K)' : 'per 1.0 inch (k = 0.25)'}
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <Flame className="w-4 h-4" /> Fire Safety
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">0 / 0</div>
              <div className="text-xs text-slate-400 mt-1">Flame Spread 0 / Smoke 0</div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <Volume2 className="w-4 h-4" /> Acoustic NRC
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">0.95+</div>
              <div className="text-xs text-slate-400 mt-1">
                {isMetric ? 'Up to NRC 1.00 @ 75 mm' : 'Up to NRC 1.00 @ 3.0"'}
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <Layers className="w-4 h-4" /> Single Pass
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {isMetric ? '125 mm' : '5.0"'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {isMetric ? 'Up to RSI 3.52 without pins' : 'Up to R-20 without pins'}
              </div>
            </div>
          </div>

          {/* Quick Action Navigation (hidden on print) */}
          <div className="flex flex-wrap items-center gap-3 pt-2 no-print">
            <button
              onClick={onNavigateToContractors}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-lg shadow-sky-500/25 transition-all"
            >
              <span>Find Certified Spray Applicator</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateToCalculator}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm border border-slate-700 transition-all"
            >
              <span>Calculate Project Material & R-Value</span>
            </button>
            <button
              onClick={onNavigateToSpecBuilder}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-sky-300 font-medium text-sm border border-slate-700/60 transition-all"
            >
              <span>CSI Section 07 21 29 Spec</span>
            </button>
          </div>
        </div>
      </section>

      {/* Core Engineering Advantages Section */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-sky-400 text-xs font-bold uppercase tracking-wider">
              Material Engineering
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Why Monoglass is Specified on Major Commercial Structures
            </h2>
          </div>
          <p className="text-sm text-slate-400 max-w-md">
            Engineered to overcome the moisture, fire, and structural limitations of cellulose, polyurethane foams, and rigid board insulation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">100% Non-Combustible (ASTM E136)</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Unlike combustible polyurethane foams that require expensive 15-minute thermal barriers (IBC 2603) or chemically-treated organic cellulose, Monoglass consists entirely of inorganic glass fibers. It carries Flame Spread 0 and Smoke Developed 0.
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Meets all IBC, NFPA, and NBC high-rise codes</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero toxic cyanide or halogen smoke in fires</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {isMetric ? 'High Single-Pass Build (Up to 125 mm)' : 'High Single-Pass Build (Up to 5")'}
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isMetric
                ? 'Achieve up to RSI 3.52 (125 mm) continuous insulation in a single monolithic pass without intermediate drying cycles, mechanical clips, stick pins, or wire lath. Dramatically accelerates job site installation timelines and lowers labor costs.'
                : 'Achieve up to R-20 (5.0 inches) continuous insulation in a single monolithic pass without intermediate drying cycles, mechanical clips, stick pins, or wire lath. Dramatically accelerates job site installation timelines and lowers labor costs.'}
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Adheres directly to unprimed concrete & metal deck</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Conforms perfectly to flutes and structural steel</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Droplets className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Inert & Mold Proof (ASTM C1338)</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Parking garages and semi-conditioned spaces experience high ambient humidity and automotive exhaust. Pure glass fiber contains zero organic material for mold, mildew, rot, or vermin to consume, ensuring lifetime durability.
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero fungal growth rating per ASTM G21</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>No fire retardant leaching over time</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ASTM Testing & Standards Official Breakdown */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="text-sky-400 text-xs font-bold uppercase tracking-wider">
              Verification & Compliance
            </div>
            <h2 className="text-2xl font-bold text-white">
              Official ASTM & Building Code Test Standards
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <Info className="w-3.5 h-3.5 text-sky-400" />
              Certified by Underwriters Laboratories (UL) & Warnock Hersey
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/70 text-xs font-semibold text-slate-300 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Standard & Designation</th>
                <th className="py-3 px-4">Test Title / Scope</th>
                <th className="py-3 px-4">
                  Certified Test Result ({isMetric ? 'Metric SI' : 'US Customary'})
                </th>
                <th className="py-3 px-4">Building Code Significance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {ASTM_TEST_RECORDS.map((rec, i) => {
                let dynamicResult = rec.result;
                if (rec.standard.includes('ASTM C518')) {
                  dynamicResult = isMetric
                    ? 'RSI 0.70 per 25 mm (λ = 0.036 W/m·K / R-4.00/in)'
                    : 'R-4.00 per inch (k = 0.250 BTU·in/hr·ft²·°F / 0.036 W/m·K)';
                } else if (rec.standard.includes('ASTM C423')) {
                  dynamicResult = isMetric
                    ? 'NRC 0.75 @ 25 mm up to NRC 1.00 @ 75 mm'
                    : 'NRC 0.75 @ 1.0" up to NRC 0.95-1.00 @ 2.5"-3.0"';
                } else if (rec.standard.includes('ASTM E736')) {
                  dynamicResult = isMetric
                    ? '> 9.6+ kPa / > 200 lbs/sq ft (Exceeds AWCI / IBC)'
                    : '> 200+ lbs/sq ft (Exceeds AWCI / IBC criteria)';
                } else if (rec.standard.includes('ASTM E859')) {
                  dynamicResult = isMetric
                    ? '0.000 g/m² loss @ air velocities up to 50.8 m/s (183 km/h)'
                    : '0.000 g/ft² loss @ air velocities up to 10,000+ FPM (114 mph)';
                }

                return (
                  <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400 whitespace-nowrap">
                      {rec.standard}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white max-w-xs">
                      {rec.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold text-xs whitespace-nowrap">
                        {dynamicResult}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 leading-relaxed max-w-md">
                      {rec.industrySignificance}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Interactive Acoustic Performance & Octave Band Spectrum */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-indigo-400 text-xs font-bold uppercase tracking-wider">
              Acoustics & Sound Absorption (ASTM C423 / ISO 354)
            </div>
            <h2 className="text-2xl font-bold text-white">
              Sound Absorption Coefficients Across Octave Frequencies
            </h2>
          </div>
          <div className="text-xs text-slate-400">
            Mounting: Type A (Direct to rigid backing / slab)
          </div>
        </div>

        {/* Thickness selector tabs with dynamic units */}
        <div className="flex flex-wrap gap-2">
          {ACOUSTIC_FREQUENCY_DATA.map((item, idx) => {
            const label = isMetric
              ? `${item.thicknessMm} mm (${(item.thicknessMm / 25.4).toFixed(1)}")`
              : `${(item.thicknessMm / 25.4).toFixed(1)}" (${item.thicknessMm} mm)`;
            return (
              <button
                key={idx}
                onClick={() => setSelectedThicknessIndex(idx)}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                  selectedThicknessIndex === idx
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {label} — <span className="text-indigo-200 font-mono">NRC {item.nrc.toFixed(2)}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Spectrum Graphic */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 md:p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs text-slate-400">Selected Profile:</span>
              <h4 className="text-lg font-bold text-white">
                {isMetric
                  ? `${selectedAcoustic.thicknessMm} mm (${(selectedAcoustic.thicknessMm / 25.4).toFixed(1)} inches)`
                  : `${(selectedAcoustic.thicknessMm / 25.4).toFixed(1)} inches (${selectedAcoustic.thicknessMm} mm)`}
              </h4>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs text-slate-400 block">Noise Reduction Coeff:</span>
                <span className="text-2xl font-black text-indigo-400 font-mono">
                  NRC {selectedAcoustic.nrc.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">
                  {isMetric ? 'Equivalent RSI Value:' : 'Equivalent R-Value:'}
                </span>
                <span className="text-2xl font-black text-sky-400 font-mono">
                  {isMetric
                    ? `RSI ${(selectedAcoustic.thicknessMm / 36.0).toFixed(2)}`
                    : `R-${((selectedAcoustic.thicknessMm / 25.4) * 4.0).toFixed(1)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization of Frequency Coefficients */}
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-2 sm:gap-4 text-center items-end h-48 sm:h-56 pt-6 px-2">
              {[
                { freq: '125 Hz (Low Bass)', val: selectedAcoustic.freq125 },
                { freq: '250 Hz (Vocal Low)', val: selectedAcoustic.freq250 },
                { freq: '500 Hz (Mid Voice)', val: selectedAcoustic.freq500 },
                { freq: '1000 Hz (Mid Clarity)', val: selectedAcoustic.freq1000 },
                { freq: '2000 Hz (High Speech)', val: selectedAcoustic.freq2000 },
                { freq: '4000 Hz (Treble / Sibilance)', val: selectedAcoustic.freq4000 },
              ].map((band, bIdx) => {
                const heightPercent = Math.min(100, Math.round(band.val * 85));
                return (
                  <div key={bIdx} className="flex flex-col items-center h-full justify-end group">
                    <span className="text-xs font-mono font-bold text-indigo-300 mb-1">
                      {band.val.toFixed(2)}
                    </span>
                    <div className="w-full bg-slate-800 rounded-t-lg relative flex items-end h-full overflow-hidden">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-indigo-700 via-indigo-500 to-sky-400 rounded-t-lg transition-all duration-300 group-hover:brightness-110"
                      />
                    </div>
                    <span className="text-[10px] sm:text-xs text-slate-400 mt-2 font-medium truncate w-full">
                      {band.freq.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-center text-slate-400 pt-2">
              Sound Absorption Coefficient (1.00 = 100% absorption of incident sound energy per ASTM C423)
            </div>
          </div>
        </div>
      </section>

      {/* Substrate Compatibility & Application Engineering Guide */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div>
          <div className="text-sky-400 text-xs font-bold uppercase tracking-wider">
            Substrates & Field Preparation
          </div>
          <h2 className="text-2xl font-bold text-white">
            Substrate Compatibility & Adhesion Engineering
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Monoglass adheres tenaciously to a wide variety of commercial building surfaces without mechanical pins or weld pins.
          </p>
        </div>

        {/* Substrate Nav Pills */}
        <div className="flex flex-wrap gap-2">
          {SUBSTRATE_GUIDES.map((sub, sIdx) => (
            <button
              key={sIdx}
              onClick={() => setActiveSubstrateIndex(sIdx)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeSubstrateIndex === sIdx
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {sub.name.split('/')[0]}
            </button>
          ))}
        </div>

        {/* Active Substrate Card */}
        {(() => {
          const current = SUBSTRATE_GUIDES[activeSubstrateIndex];
          const dynamicSinglePass = isMetric
            ? current.recommendedMaxSinglePass.includes('5.0')
              ? 'Jusqu\'à 125 mm (5.0") / RSI 3.52 en une seule passe'
              : current.recommendedMaxSinglePass.includes('4.0')
              ? 'Jusqu\'à 100 mm (4.0") / RSI 2.82 en une seule passe'
              : current.recommendedMaxSinglePass.includes('3.5')
              ? 'Jusqu\'à 88 mm (3.5") en une seule passe'
              : 'Jusqu\'à 75 mm (3.0") en une seule passe'
            : current.recommendedMaxSinglePass;

          return (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-sky-400" />
                  {current.name}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  <CheckCircle className="w-3.5 h-3.5" /> High Adhesion Verified
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Required Surface Preparation
                    </h4>
                    <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
                      {current.surfacePrep}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Primer Requirement
                    </h4>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${current.primerRequired ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                        {current.primerRequired ? 'Primer Required' : 'No Primer Needed on Clean Substrate'}
                      </span>
                    </div>
                    {current.primerNotes && (
                      <p className="text-xs text-slate-400 italic">
                        {current.primerNotes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Adhesion & Structural Behavior
                    </h4>
                    <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
                      {current.adhesionNotes}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Max Recommended Single Pass
                    </h4>
                    <p className="text-sm font-semibold text-sky-400 bg-sky-500/10 p-3 rounded-lg border border-sky-500/20">
                      {dynamicSinglePass}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Aesthetic Finishes & Color Systems */}
      <section className="space-y-6">
        <div>
          <div className="text-sky-400 text-xs font-bold uppercase tracking-wider">
            Architectural Appearance
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Color Options, Textures & Protective Coatings
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Tailor the visual ceiling finish for architectural design, light reflectance, or heavy wash-down environments.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="w-full h-24 rounded-lg bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-300 flex items-center justify-center text-slate-900 font-bold text-xs shadow-inner">
              Natural Monoglass White
            </div>
            <h4 className="text-base font-bold text-white">Monoglass Natural White</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Crisp off-white spray texture with ~85% light reflectance. Brightens underground parking garages, reducing required lighting fixtures and energy consumption.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="w-full h-24 rounded-lg bg-gradient-to-b from-neutral-900 to-black border border-neutral-800 flex items-center justify-center text-neutral-300 font-bold text-xs shadow-inner">
              Monoglass Black
            </div>
            <h4 className="text-base font-bold text-white">Monoglass Black</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Deep black system for sound stages, film studios, arenas, nightclubs, and black-box theaters where overhead light reflection must be completely eliminated.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="w-full h-24 rounded-lg bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 border border-slate-400 flex items-center justify-center text-slate-900 font-bold text-xs shadow-inner">
              Tamped Smooth Finish
            </div>
            <h4 className="text-base font-bold text-white">Tamped Finish</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Applied using flat pneumatic tampers or rollers while damp, creating a compact, uniform, semi-smooth architectural ceiling texture.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="w-full h-24 rounded-lg bg-gradient-to-b from-sky-900 to-slate-900 border border-sky-600/40 flex items-center justify-center text-sky-200 font-bold text-xs shadow-inner">
              Sonoglaze Protective Hardcoat
            </div>
            <h4 className="text-base font-bold text-white">Sonoglaze Hardcoat</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Spray-applied polymer hardener over cured Monoglass for gymnasiums, transit stations, and wash-down areas requiring abrasion & impact resistance.
            </p>
          </div>
        </div>
      </section>

      {/* Step-by-Step Spray Applicator Quality Protocol */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div>
          <div className="text-sky-400 text-xs font-bold uppercase tracking-wider">
            Field Execution Protocol
          </div>
          <h2 className="text-2xl font-bold text-white">
            Monoglass Installation & Quality Assurance Guidelines
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-sky-400 font-mono text-xl font-bold">01.</div>
            <h4 className="text-sm font-bold text-white">Site Conditions & Temperature</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isMetric
                ? 'Substrate and ambient air temperature must be maintained at a minimum of 4.5°C (40°F) for 24 hours before, during, and 48 hours after application.'
                : 'Substrate and ambient air temperature must be maintained at a minimum of 40°F (4.5°C) for 24 hours before, during, and 48 hours after application.'}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-sky-400 font-mono text-xl font-bold">02.</div>
            <h4 className="text-sm font-bold text-white">Adhesive Proportioning</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dilute Monoglass Concentrate 1:1 with clean potable water. The liquid adhesive is atomized at the spray nozzle wands, impregnating the dry glass fiber stream.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-sky-400 font-mono text-xl font-bold">03.</div>
            <h4 className="text-sm font-bold text-white">Uniform Spray Application</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isMetric
                ? 'Applied perpendicular (90°) to the target deck at a distance of 450 mm to 600 mm (18"-24"). Overlap spray patterns 50% for homogenous density.'
                : 'Applied perpendicular (90°) to the target deck at a distance of 18"-24". Overlap spray patterns 50% to ensure homogenous density and thickness.'}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-sky-400 font-mono text-xl font-bold">04.</div>
            <h4 className="text-sm font-bold text-white">Depth Gauging & Quality Verification</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isMetric
                ? 'Thickness verified using depth gauges per AWCI Standard 12-A. Core sample density should measure between 48 to 56 kg/m³ (3.0 to 3.5 lbs/cu ft).'
                : 'Thickness verified using standard depth gauges per AWCI Standard 12-A. Core sample density should measure between 3.0 to 3.5 lbs/cu ft.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
