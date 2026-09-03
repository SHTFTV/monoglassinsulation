import React, { useState, useMemo } from 'react';
import {
  FileText,
  Copy,
  Check,
  Download,
  Settings,
  ShieldCheck,
  Sparkles,
  Printer,
  Eye,
  FileDown,
  Loader2,
  Globe,
} from 'lucide-react';
import { exportCsiSpecPdf } from '../utils/pdfExport';
import { useSettings } from '../context/SettingsContext';
import { UnitToggle } from './UnitToggle';

interface SpecBuilderViewProps {
  onOpenPrintPreview?: () => void;
}

export const SpecBuilderView: React.FC<SpecBuilderViewProps> = ({ onOpenPrintPreview }) => {
  const {
    unitSystem,
    isMetric,
    formatThickness,
    formatRValue,
    formatArea,
    formatTemp,
    formatDensity,
    formatAdhesion,
    getEffectiveWatermark,
  } = useSettings();
  const [sectionCode, setSectionCode] = useState<'07 21 29' | '09 81 00'>('07 21 29');
  const [projectName, setProjectName] = useState('Commercial High-Rise Parking & Podium');
  const [thicknessInches, setThicknessInches] = useState<number>(4.0);
  const [finishStyle, setFinishStyle] = useState<'natural-white' | 'monoglass-black' | 'tamped-smooth' | 'sonoglaze-hardcoat'>('natural-white');
  const [substrateSelection, setSubstrateSelection] = useState('Cast-in-Place Post-Tensioned Concrete Ceiling Soffit');
  const [requireFieldDensityTesting, setRequireFieldDensityTesting] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const rValueCalculated = (thicknessInches * 4.0).toFixed(1);
  const rsiCalculated = (thicknessInches * 0.7044).toFixed(2);
  const mmCalculated = Math.round(thicknessInches * 25.4);
  const nrcCalculated = thicknessInches >= 2.5 ? '0.95' : thicknessInches >= 1.5 ? '0.85' : '0.75';

  const finishDescriptions: Record<string, { label: string; text: string }> = {
    'natural-white': {
      label: 'Monoglass Natural White Spray Texture',
      text: 'Standard natural spray texture, off-white color with minimum 85% light reflectance per ASTM E1477.',
    },
    'monoglass-black': {
      label: 'Monoglass Black Tinted System',
      text: 'Factory or field-tinted deep matte black for non-reflective ceiling visual absorption.',
    },
    'tamped-smooth': {
      label: 'Tamped Architectural Finish',
      text: 'Mechanically tamped / rolled smooth while damp to produce a uniform, compact, semi-smooth architectural planar surface.',
    },
    'sonoglaze-hardcoat': {
      label: 'Sonoglaze Protective Polymer Hardcoat',
      text: 'Post-spray application of Sonoglaze protective polymer coat over cured Monoglass for high-impact, abrasion resistance and cleanability.',
    },
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const watermark = getEffectiveWatermark('spec');
      await exportCsiSpecPdf(
        {
          sectionCode,
          projectName,
          thicknessInches,
          rValue: isMetric ? `RSI ${rsiCalculated} (R-${rValueCalculated})` : rValueCalculated,
          nrc: nrcCalculated,
          finishType: finishStyle === 'tamped-smooth' ? 'tamped' : finishStyle === 'monoglass-black' ? 'tinted' : 'standard',
          requireBondTesting: true,
          requireFieldDensityTesting,
        },
        undefined,
        watermark
      );
    } catch (err) {
      console.error('Failed to export CSI Spec PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const currentFinish = finishDescriptions[finishStyle];

  const generatedSpecText = useMemo(() => {
    const thicknessSpec = isMetric
      ? `${mmCalculated} mm (${thicknessInches.toFixed(2)} inches)`
      : `${thicknessInches.toFixed(2)} inches (${mmCalculated} mm)`;

    const thermalSpec = isMetric
      ? `RSI ${rsiCalculated} (R-${rValueCalculated}) [λ = 0.036 W/m·K / k = 0.250 BTU·in/hr·ft²·°F]`
      : `R-${rValueCalculated} (RSI ${rsiCalculated}) [k-factor = 0.250 BTU·in/hr·ft²·°F / 0.036 W/m·K]`;

    const densitySpec = isMetric
      ? '48 to 56 kg/m³ (3.0 to 3.5 lbs/cu ft)'
      : '3.0 to 3.5 lbs/cu ft (48 to 56 kg/m³)';

    const bondStrengthSpec = isMetric
      ? 'Minimum 9.6 kPa (200 lbs/sq ft)'
      : 'Minimum 200 lbs/sq ft (9.6 kPa)';

    const tempSpec = isMetric
      ? '4.5°C (40°F)'
      : '40°F (4.5°C)';

    const mockUpSize = isMetric
      ? '10 m² (100 sq ft)'
      : '100 sq ft (10 m²)';

    const testInterval = isMetric
      ? '100 m² (1,000 sq ft)'
      : '1,000 sq ft (100 m²)';

    return `SECTION ${sectionCode}
${sectionCode === '07 21 29' ? 'SPRAYED-ON GLASS FIBER INSULATION' : 'ACOUSTICAL SPRAYED-ON INSULATION'}

PROJECT: ${projectName}
SPECIFICATION SPECIFIER: Monoglass Authority Architectural Engine
SYSTEM STANDARDS: ${isMetric ? 'Metric SI (with US Customary Equivalents)' : 'US Customary (with Metric SI Equivalents)'}

PART 1 - GENERAL

1.1 SUMMARY
  A. Section Includes: Monolithic, non-combustible spray-applied glass fiber insulation and non-toxic adhesive binder applied directly to ${substrateSelection.toLowerCase()} for thermal insulation and acoustic reverberation control.
  B. Related Sections:
    1. Section 03 30 00 - Cast-in-Place Concrete.
    2. Section 05 31 00 - Steel Decking.
    3. Section 09 22 00 - Supports for Plaster and Gypsum Board.
    4. Section 09 81 00 - Acoustic Insulation.

1.2 REFERENCES & PERFORMANCE STANDARDS
  A. ASTM C518 / C177 - Standard Test Method for Steady-State Thermal Transmission Properties: Thermal Resistance ${thermalSpec}.
  B. ASTM E84 / UL 723 / CAN/ULC S102 - Surface Burning Characteristics:
    1. Flame Spread Index: 0.
    2. Smoke Developed Index: 0.
    3. Classification: Class 1 / Class A.
  C. ASTM E136 / CAN/ULC S114 - Standard Test Method for Assessing Combustibility: Non-Combustible.
  D. ASTM C423 / ISO 354 - Standard Test Method for Sound Absorption: Minimum Noise Reduction Coefficient (NRC) of ${nrcCalculated} at specified thickness.
  E. ASTM E736 - Cohesion / Adhesion: ${bondStrengthSpec} direct bond strength to substrate.
  F. ASTM E859 - Air Erosion: 0.000 g/m² loss at air velocities up to 50.8 m/s (10,000 FPM / 183 km/h).
  G. ASTM C1338 / ASTM G21 - Fungi & Mold Resistance: Zero growth (Rating 0 - Completely Inert).

1.3 SUBMITTALS
  A. Product Data: Manufacturer's technical data sheets, physical property verification, and safety data sheets (SDS).
  B. Test Reports: Certified laboratory test reports from Underwriters Laboratories (UL) or recognized third-party accredited testing agency confirming compliance with ASTM E84, ASTM E136, ASTM C518, and ASTM C423.
  C. Applicator Qualification: Written certificate from Monoglass Incorporated confirming the insulation contractor is a certified, licensed, and trained applicator.
  D. Sample Warranty: Manufacturer and applicator standard joint warranty document.

1.4 QUALITY ASSURANCE
  A. Applicator Qualifications: Installation shall be performed exclusively by an approved certified applicator holding active credentials issued by Monoglass Inc., with documented completion of not less than five (5) projects of similar scope.
  B. Mock-Up: Before full-scale application, spray a representative ${mockUpSize} mock-up area on the actual project substrate. Verify thickness, adhesion, finish texture, and curing. Obtain Architect approval prior to proceeding.
  C. Environmental Conditions: Maintain substrate and ambient air temperatures at a minimum of ${tempSpec} for not less than 24 hours prior to application, throughout installation, and for 48 hours post-application until full cure is achieved.

PART 2 - PRODUCTS

2.1 ACCEPTABLE MANUFACTURER
  A. Basis of Design: Monoglass Incorporated (monoglassinsulation.com).
  B. Product: Monoglass Spray-Applied Glass Fiber Insulation with Monoglass Concentrate Adhesive Binder.

2.2 MATERIALS
  A. Dry Insulation Fiber: 100% white, non-combustible inorganic virgin glass fibers manufactured specifically for pneumatic spray application. Contains zero asbestos, free formaldehyde, or hazardous volatile organic compounds (VOCs).
  B. Liquid Adhesive: Monoglass Concentrate water-dispersible, non-toxic polymer binder diluted 1:1 with clean potable water, engineered to impregnate the dry fiber during spray application.
  C. System Characteristics:
    1. Thickness: ${thicknessSpec}.
    2. Minimum Continuous Thermal Value: ${isMetric ? `RSI ${rsiCalculated} (R-${rValueCalculated})` : `R-${rValueCalculated} (RSI ${rsiCalculated})`}.
    3. Noise Reduction Coefficient (NRC): ${nrcCalculated} (Type A Mounting).
    4. Density: ${densitySpec} installed dry density.
    5. Color & Finish System: ${currentFinish.label} (${currentFinish.text}).
${finishStyle === 'sonoglaze-hardcoat' ? '    6. Protective Overcoat: Sonoglaze protective polymer coat applied over cured Monoglass.' : ''}

PART 3 - EXECUTION

3.1 EXAMINATION & PREPARATION
  A. Inspect target substrate for cleanliness, structural sound integrity, and absence of standing water, frost, grease, release agents, or incompatible coatings.
  B. Protect adjacent walls, glazing, mechanical equipment, electrical conduit, and floor slabs from overspray using polyethylene drop sheets and masking.
  C. Verify substrate temperature is at or above ${tempSpec}.

3.2 APPLICATION
  A. Proportion dry glass fibers and atomized diluted Monoglass Concentrate adhesive at the spray nozzle in strict accordance with manufacturer written instructions.
  B. Apply insulation in a uniform spray pattern perpendicular to the substrate, building to the specified nominal thickness of ${thicknessSpec}.
  C. Maintain uniform density across flutes, corners, and beam interfaces with zero voids or sagging.
${finishStyle === 'tamped-smooth' ? '  D. While damp, mechanically tamp / roll the surface to achieve the designated compact architectural finish.' : ''}
${finishStyle === 'sonoglaze-hardcoat' ? '  E. Allow Monoglass to cure 24-48 hours, then spray apply uniform continuous coat of Sonoglaze protective polymer sealer.' : ''}

3.3 FIELD QUALITY CONTROL
  A. Thickness Testing: Measure thickness at random ${testInterval} intervals using a certified depth gauge in accordance with AWCI Standard 12-A.
${requireFieldDensityTesting ? `  B. Core Density: Take periodic core samples to verify dry installed density is within ${densitySpec} range.` : ''}
  C. Defective Areas: Any area lacking proper thickness, adhesion, or uniformity shall be immediately cut back and re-sprayed to full specification.

3.4 CURING, CLEANING & PROTECTION
  A. Provide adequate air circulation to promote thorough drying (typically 24 to 72 hours depending on humidity).
  B. Remove all overspray masking, protective sheeting, and cleanup debris upon completion.
  C. Protect cured insulation from mechanical trade damage until substantial completion.

END OF SECTION ${sectionCode}`;
  }, [
    sectionCode,
    projectName,
    thicknessInches,
    rValueCalculated,
    rsiCalculated,
    mmCalculated,
    nrcCalculated,
    finishStyle,
    substrateSelection,
    requireFieldDensityTesting,
    currentFinish,
    isMetric,
  ]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSpecText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedSpecText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CSI_Section_${sectionCode.replace(' ', '_')}_Monoglass_Spec_${isMetric ? 'Metric' : 'Imperial'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Dedicated Print Specification Header (Visible only when printing) */}
      <div className="print-only print-document-header">
        <div>
          <div className="text-xs font-bold tracking-wider text-slate-500 uppercase">
            CSI MasterFormat Specification Document
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            SECTION {sectionCode} — {sectionCode === '07 21 29' ? 'SPRAYED-ON GLASS FIBER INSULATION' : 'ACOUSTICAL SPRAYED-ON INSULATION'}
          </h1>
          <div className="text-xs text-slate-700 mt-1 font-semibold">
            Project: {projectName} • Substrate: {substrateSelection} • Rating: {isMetric ? `RSI ${rsiCalculated} (R-${rValueCalculated})` : `R-${rValueCalculated} (RSI ${rsiCalculated})`} • NRC: {nrcCalculated}
          </div>
        </div>
        <div className="text-right text-xs text-slate-600">
          <div className="font-semibold text-slate-900">Monoglass Inc. Authority Guide</div>
          <div>Basis of Design Document ({isMetric ? 'Metric SI' : 'US Customary'})</div>
          <div>Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
        </div>
      </div>

      {/* Hero Title (Screen Only) */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-3 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-4 h-4" /> CSI MasterFormat Specification Generator
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Unit Toggle in Spec Builder Header */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Spec Units:</span>
              <UnitToggle variant="header" />
            </div>

            {onOpenPrintPreview && (
              <button
                id="spec-preview-print-btn"
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
              title="Print Specification Document or Export to PDF"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Print Spec</span>
            </button>
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          CSI 3-Part Architectural Specification Builder
        </h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
          Instantly generate code-compliant 3-part specifications for CSI Section 07 21 29 (Sprayed-On Insulation) or Section 09 81 00 (Acoustical Insulation) in {isMetric ? 'Metric SI' : 'Imperial US Customary'} units, ready for architectural submittal packages, project manuals, and PDF export.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 spec-grid-layout">
        {/* Left Column: Spec Configuration Parameters (Hidden on Print) */}
        <div className="lg:col-span-5 space-y-5 spec-config-sidebar no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-sky-400" />
              <span>Project Specification Parameters</span>
            </h3>

            {/* MasterFormat Section */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                CSI MasterFormat Section Code
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSectionCode('07 21 29')}
                  className={`p-2.5 rounded-xl text-xs font-bold text-left border transition-all ${
                    sectionCode === '07 21 29'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="font-mono text-white">07 21 29</div>
                  <div className="text-[11px] font-normal mt-0.5">Sprayed-On Thermal Insulation</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSectionCode('09 81 00')}
                  className={`p-2.5 rounded-xl text-xs font-bold text-left border transition-all ${
                    sectionCode === '09 81 00'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="font-mono text-white">09 81 00</div>
                  <div className="text-[11px] font-normal mt-0.5">Acoustical Insulation</div>
                </button>
              </div>
            </div>

            {/* Project Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Project Title
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Target Substrate */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Target Substrate
              </label>
              <select
                value={substrateSelection}
                onChange={(e) => setSubstrateSelection(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="Cast-in-Place Post-Tensioned Concrete Ceiling Soffit">Cast-in-Place / Precast Concrete Slab</option>
                <option value="Corrugated Fluted Steel Roof & Floor Decking">Corrugated Fluted Steel Deck</option>
                <option value="Exposed Structural Steel Bar Joists & Beams">Structural Steel & Bar Joists</option>
                <option value="Direct Gypsum Board & Plaster Ceilings">Gypsum Board & Plaster Ceilings</option>
                <option value="Tongue and Groove Timber Roof Deck">Wood Framing & Timber Decks</option>
              </select>
            </div>

            {/* Thickness & R-Value Slider with dynamic units */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Specified Thickness & Thermal Target
                </label>
                <span className="text-xs font-mono font-bold text-sky-400">
                  {isMetric
                    ? `${mmCalculated} mm (${thicknessInches.toFixed(2)}") • RSI ${rsiCalculated}`
                    : `${thicknessInches.toFixed(2)}" (${mmCalculated} mm) • R-${rValueCalculated}`}
                </span>
              </div>
              <input
                type="range"
                min={1.0}
                max={6.0}
                step={0.25}
                value={thicknessInches}
                onChange={(e) => setThicknessInches(Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{isMetric ? '25 mm (RSI 0.70)' : '1.0" (R-4)'}</span>
                <span>{isMetric ? '75 mm (RSI 2.11)' : '3.0" (R-12)'}</span>
                <span>{isMetric ? '100 mm (RSI 2.82)' : '4.0" (R-16)'}</span>
                <span>{isMetric ? '125 mm (RSI 3.52)' : '5.0" (R-20)'}</span>
                <span>{isMetric ? '150 mm (RSI 4.23)' : '6.0" (R-24)'}</span>
              </div>
            </div>

            {/* Finish System Selection */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Ceiling Finish System
              </label>
              <select
                value={finishStyle}
                onChange={(e) => setFinishStyle(e.target.value as any)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="natural-white">Monoglass Natural White (85% Reflectance)</option>
                <option value="monoglass-black">Monoglass Black (Theaters/Arenas)</option>
                <option value="tamped-smooth">Tamped Smooth Architectural Finish</option>
                <option value="sonoglaze-hardcoat">Sonoglaze Protective Polymer Hardcoat</option>
              </select>
              <p className="text-[11px] text-slate-400 italic">
                {currentFinish.text}
              </p>
            </div>

            {/* Quality Assurance Checkbox */}
            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireFieldDensityTesting}
                  onChange={(e) => setRequireFieldDensityTesting(e.target.checked)}
                  className="rounded border-slate-700 text-sky-500 focus:ring-0"
                />
                <span>
                  {isMetric
                    ? 'Include mandatory AWCI 12-A field core density verification (48-56 kg/m³)'
                    : 'Include mandatory AWCI 12-A field core density verification (3.0-3.5 lbs/cu ft)'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Generated Specification Code Viewer */}
        <div className="lg:col-span-7 space-y-4 spec-viewer-container">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col h-full">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 no-print">
              <div>
                <span className="text-xs font-mono text-sky-400 font-bold block">
                  CSI Section {sectionCode} • {isMetric ? 'Metric SI Standards' : 'US Customary Standards'}
                </span>
                <h3 className="text-lg font-bold text-white">
                  Live Architectural Specification Document
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="spec-download-pdf-btn"
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                  title="Download CSI 3-Part Section as formatted vector PDF"
                >
                  {isExportingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                  <span>{isExportingPdf ? 'Exporting...' : 'Download PDF'}</span>
                </button>

                {onOpenPrintPreview && (
                  <button
                    id="spec-preview-btn"
                    onClick={onOpenPrintPreview}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 text-xs font-bold transition-all"
                    title="Open Print Preview Mode"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </button>
                )}

                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
                  title="Print Specification Document"
                >
                  <Printer className="w-4 h-4 text-sky-400" />
                  <span>Print</span>
                </button>

                <button
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    copied
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Spec'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>.TXT</span>
                </button>
              </div>
            </div>

            {/* Code Output Viewer */}
            <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-4 overflow-y-auto max-h-[560px] font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all spec-code-block">
              {generatedSpecText}
            </div>

            <div className="text-xs text-slate-400 pt-2 flex items-center justify-between no-print">
              <span>Ready for MasterFormat specifications in {isMetric ? 'Metric SI' : 'Imperial'}</span>
              <span className="text-sky-400 font-mono">Format: 3-Part CSI Spec</span>
            </div>

            {/* Print Footer Metadata */}
            <div className="print-only print-document-footer">
              <div>End of CSI Section {sectionCode} Specification ({isMetric ? 'Metric SI' : 'US Customary'})</div>
              <div>Monoglass Technical Authority • Certified Applicator Network</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
