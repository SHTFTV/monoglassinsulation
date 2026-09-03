import React, { useState } from 'react';
import {
  Sparkles,
  Droplet,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Wrench,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Info,
  Sliders,
  Scale,
  Building,
  Maximize2,
  Minimize2,
  Compass,
} from 'lucide-react';
import {
  SUBSTRATE_PRO_TIPS,
  ALL_SUBSTRATE_KEYS,
  getSubstrateProTip,
  SubstrateProTip,
} from '../data/substrateAdvice';

interface CalculatorProTipsSidebarProps {
  currentSubstrateKey: string;
  unitSystem: 'imperial' | 'metric';
  areaInput: number;
  calculatedThicknessInches: number;
  bagsRequired: number;
  adhesiveConcentrateGallons: number;
  onSelectSubstrate?: (key: string) => void;
  className?: string;
  isCollapsible?: boolean;
}

export const CalculatorProTipsSidebar: React.FC<CalculatorProTipsSidebarProps> = ({
  currentSubstrateKey,
  unitSystem,
  areaInput,
  calculatedThicknessInches,
  bagsRequired,
  adhesiveConcentrateGallons,
  onSelectSubstrate,
  className = '',
  isCollapsible = true,
}) => {
  const [inspectedKey, setInspectedKey] = useState<string>(currentSubstrateKey);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'ratio' | 'technique' | 'prep' | 'all'>('ratio');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sync inspected key if user changes it in the parent calculator and user wasn't deliberately inspecting another
  const activeSubstrate = getSubstrateProTip(inspectedKey);
  const isCurrentlyActiveInCalc = inspectedKey === currentSubstrateKey;

  // Handle syncing back to active calculator substrate
  const handleSyncToCalculator = () => {
    setInspectedKey(currentSubstrateKey);
  };

  const handleSelectKey = (key: string) => {
    setInspectedKey(key);
    if (onSelectSubstrate) {
      onSelectSubstrate(key);
    }
  };

  // Substrate-specific dynamic calculations for the current takeoff
  const effectiveConcentrateGallons = adhesiveConcentrateGallons;
  const effectiveConcentrateLiters = Math.round(effectiveConcentrateGallons * 3.78541);
  const effectivePails5Gal = Math.ceil(effectiveConcentrateGallons / 5);
  const waterGallons = effectiveConcentrateGallons;
  const waterLiters = effectiveConcentrateLiters;

  const handleCopySpec = () => {
    const text = `MONOGLASS APPLICATOR SPECIFICATION - ${activeSubstrate.name.toUpperCase()}
--------------------------------------------------
Substrate Category: ${activeSubstrate.categoryLabel}
Surface Geometry Multiplier: ${activeSubstrate.multiplier}x
ASTM E736 Tensile Adhesion: ${activeSubstrate.adhesionRating}
Max Single-Pass Depth: ${unitSystem === 'imperial' ? `${activeSubstrate.maxSinglePassInches}" (${activeSubstrate.maxSinglePassMm} mm)` : `${activeSubstrate.maxSinglePassMm} mm (${activeSubstrate.maxSinglePassInches}")`}

ADHESIVE APPLICATION RATIO & DILUTION:
- Dilution: ${activeSubstrate.recommendedDilution}
- Concentrate Ratio: 0.55 gal (2.08 L) per 30 lb bag
- Clean Water Ratio: 0.55 gal (2.08 L) per 30 lb bag (1:1 mix)
- Atomization Pressure: ${activeSubstrate.atomizationPressurePsi}
- Spray Standoff Distance: ${activeSubstrate.sprayStandoffDistance}
- Optimal Nozzle Angle: ${activeSubstrate.optimalSprayAngle}

WHY THIS SUBSTRATE DIFFERS:
${activeSubstrate.whyRatioMatters}

SURFACE PREPARATION CHECKLIST:
${activeSubstrate.surfacePrepChecklist.map((item, i) => `${i + 1}. ${item}`).join('\n')}

PRIMER REQUIREMENT:
${activeSubstrate.primerRequired ? 'MANDATORY PRIMER' : 'DIRECT BOND / NO PRIMER NEEDED'} - ${activeSubstrate.primerGuidance}

FIELD PITFALLS TO AVOID:
${activeSubstrate.fieldPitfallsToAvoid.map((item, i) => `! ${item}`).join('\n')}
`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <aside
      id="calculator-pro-tips-sidebar"
      className={`bg-slate-900/95 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${className}`}
    >
      {/* Sidebar Header Bar */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-400 shadow-inner">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-white tracking-tight truncate">
                Applicator Pro Tips & Adhesive Ratio Insights
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30 whitespace-nowrap">
                Contextual Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Field-proven chemistry, substrate mechanics, & mix ratios
            </p>
          </div>
        </div>

        {isCollapsible && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shrink-0"
            title={isCollapsed ? 'Expand Pro Tips' : 'Collapse Pro Tips'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="p-4 sm:p-6 space-y-5">
          {/* Substrate Quick Selector Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Layers className="w-3.5 h-3.5 text-sky-400" /> Inspect Substrate Advice:
              </span>
              {!isCurrentlyActiveInCalc && (
                <button
                  onClick={handleSyncToCalculator}
                  className="text-[11px] font-bold text-sky-400 hover:text-sky-300 underline flex items-center gap-1 transition-colors"
                >
                  <span>Sync with Active Substrate</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ALL_SUBSTRATE_KEYS.map((key) => {
                const item = SUBSTRATE_PRO_TIPS[key];
                const isSelected = inspectedKey === key;
                const isCalcActive = currentSubstrateKey === key;

                return (
                  <button
                    key={key}
                    onClick={() => handleSelectKey(key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/25 scale-[1.02]'
                        : isCalcActive
                        ? 'bg-slate-800 text-sky-300 border border-sky-500/40 hover:bg-slate-750'
                        : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <span>{item.name.split('/')[0].split('(')[0].trim()}</span>
                    {isCalcActive && (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isSelected ? 'bg-slate-950' : 'bg-sky-400'
                        }`}
                        title="Active in calculator"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Substrate Overview Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/25">
                    {activeSubstrate.categoryLabel}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Geometry Factor: <strong className="text-white">{activeSubstrate.multiplier}x</strong>
                  </span>
                </div>
                <h4 className="text-base font-bold text-white mt-1">
                  {unitSystem === 'imperial' ? activeSubstrate.name : `${activeSubstrate.name} (${activeSubstrate.metricName})`}
                </h4>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopySpec}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                  title="Copy formatted contractor specification text"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-sky-400" />
                      <span>Copy Spec</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                  Adhesion Strength
                </span>
                <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm">
                  {unitSystem === 'imperial' ? `>${activeSubstrate.adhesionScoreLbs} lbs/ft²` : `>${activeSubstrate.adhesionScoreKpa} kPa`}
                </span>
                <span className="text-[10px] text-slate-400 block">ASTM E736</span>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                  Max Single Pass
                </span>
                <span className="font-mono font-bold text-sky-400 text-xs sm:text-sm">
                  {unitSystem === 'imperial' ? `${activeSubstrate.maxSinglePassInches.toFixed(1)}" depth` : `${activeSubstrate.maxSinglePassMm} mm depth`}
                </span>
                <span className="text-[10px] text-slate-400 block">Zero pins needed</span>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                  Nozzle Pressure
                </span>
                <span className="font-mono font-bold text-indigo-300 text-xs sm:text-sm">
                  {activeSubstrate.atomizationPressurePsi}
                </span>
                <span className="text-[10px] text-slate-400 block">Fluid atomization</span>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                  Primer Status
                </span>
                <span
                  className={`font-bold text-xs sm:text-sm block truncate ${
                    activeSubstrate.primerRequired ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {activeSubstrate.primerRequired ? 'Primer Required' : 'Direct Bond'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {activeSubstrate.primerRequired ? 'PVA / Pre-Spray' : 'Clean substrate'}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation for Detailed Advice */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab('ratio')}
              className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'ratio'
                  ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Droplet className="w-3.5 h-3.5 text-sky-400" />
              <span>Adhesive Ratio & Chemistry</span>
            </button>
            <button
              onClick={() => setActiveTab('technique')}
              className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'technique'
                  ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Spray Dynamics</span>
            </button>
            <button
              onClick={() => setActiveTab('prep')}
              className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'prep'
                  ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Prep & Checklist</span>
            </button>
          </div>

          {/* Tab Content 1: Adhesive Ratio & Physical Chemistry */}
          {activeTab === 'ratio' && (
            <div className="space-y-4">
              {/* Ratio Formula & Live Batch Output */}
              <div className="bg-gradient-to-br from-sky-950/40 via-slate-950 to-indigo-950/40 border border-sky-500/25 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
                    <Droplet className="w-4 h-4 text-sky-400" /> Certified Adhesive Mixing Ratio
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    1:1 Volumetric Dilution
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase">1 Part Concentrate</div>
                    <div className="text-lg font-black text-sky-400 font-mono mt-0.5">
                      0.55 gal <span className="text-xs font-normal text-slate-400">(2.08 L)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Per 30 lb dry fiber bag</div>
                  </div>

                  <div className="flex items-center justify-center text-slate-400 font-black text-lg">
                    <span>+</span>
                  </div>

                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase">1 Part Clean Water</div>
                    <div className="text-lg font-black text-teal-400 font-mono mt-0.5">
                      0.55 gal <span className="text-xs font-normal text-slate-400">(2.08 L)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Clean potable water</div>
                  </div>
                </div>

                {/* Live batch requisition based on calculator inputs */}
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Batch Requisition for Active Takeoff:</span>
                    <span className="font-mono font-bold text-white">
                      {unitSystem === 'imperial'
                        ? `${effectiveConcentrateGallons.toLocaleString()} gal Concentrate (${effectivePails5Gal} × 5-gal pails)`
                        : `${effectiveConcentrateLiters.toLocaleString()} L Concentrate (${effectivePails5Gal} × 18.9L pails)`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Potable Dilution Water:</span>
                    <span className="font-mono font-bold text-teal-300">
                      {unitSystem === 'imperial'
                        ? `+ ${waterGallons.toLocaleString()} gal clean water`
                        : `+ ${waterLiters.toLocaleString()} L clean water`}
                    </span>
                  </div>
                </div>
              </div>

              {/* In-depth Engineering Explanation: Why this substrate differs */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-2.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>Why {activeSubstrate.name.split('/')[0]} Requires Specific Ratio Dynamics:</span>
                </h5>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/80">
                  {activeSubstrate.whyRatioMatters}
                </p>

                {activeSubstrate.fluteAdjustmentExplanation && (
                  <div className="text-xs text-sky-300/90 bg-sky-500/10 p-3 rounded-lg border border-sky-500/20 leading-relaxed">
                    <strong>Geometric Expansion Note:</strong> {activeSubstrate.fluteAdjustmentExplanation}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Content 2: Spray Dynamics & Applicator Technique */}
          {activeTab === 'technique' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Applicator Field Dynamics & Nozzle Parameters:</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Recommended Standoff:</span>
                    <span className="font-bold text-white text-sm">{activeSubstrate.sprayStandoffDistance}</span>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Optimal Spray Angle:</span>
                    <span className="font-bold text-white text-sm">{activeSubstrate.optimalSprayAngle}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Execution Directives:
                  </span>
                  <ul className="space-y-2">
                    {activeSubstrate.applicatorDynamics.map((dyn, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                        <ChevronRight className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{dyn}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pitfalls to Avoid Alert Box */}
              <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-400">
                  <AlertTriangle className="w-4 h-4 text-rose-400" /> Common Field Pitfalls to Avoid
                </div>
                <ul className="space-y-1.5">
                  {activeSubstrate.fieldPitfallsToAvoid.map((pit, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-2 text-xs text-rose-200">
                      <span className="text-rose-400 font-bold">•</span>
                      <span className="leading-relaxed">{pit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tab Content 3: Surface Preparation & Primer Checklist */}
          {activeTab === 'prep' && (
            <div className="space-y-4">
              {/* Primer Status Box */}
              <div
                className={`p-4 rounded-xl border ${
                  activeSubstrate.primerRequired
                    ? 'bg-amber-950/30 border-amber-500/30'
                    : 'bg-emerald-950/30 border-emerald-500/30'
                } space-y-1.5`}
              >
                <div className="flex items-center gap-2">
                  {activeSubstrate.primerRequired ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      activeSubstrate.primerRequired ? 'text-amber-300' : 'text-emerald-300'
                    }`}
                  >
                    {activeSubstrate.primerRequired ? 'Primer Required Prior to Spray' : 'Direct Monolithic Bond / No Primer Required'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pl-6">
                  {activeSubstrate.primerGuidance}
                </p>
              </div>

              {/* Surface Prep Checklist */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mandatory Substrate Inspection Checklist:</span>
                </h5>
                <div className="space-y-2.5">
                  {activeSubstrate.surfacePrepChecklist.map((chk, cIdx) => (
                    <div
                      key={cIdx}
                      className="flex items-start gap-2.5 bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80 text-xs text-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{chk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {activeSubstrate.caseStudyRef && (
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-slate-400">Representative Field Reference:</span>
                  <span className="font-semibold text-sky-400 font-mono text-[11px] truncate max-w-[220px]">
                    {activeSubstrate.caseStudyRef}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
