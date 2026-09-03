import React, { useState } from 'react';
import {
  Calculator,
  Layers,
  Thermometer,
  Volume2,
  Package,
  Droplet,
  Clock,
  Scale,
  AlertTriangle,
  CheckCircle,
  FileDown,
  PhoneCall,
  Info,
  Loader2,
  Globe,
  Sliders,
  Sparkles,
  ArrowRightLeft,
  Calendar,
} from 'lucide-react';
import { exportCalculatorReportPdf } from '../utils/pdfExport';
import { useSettings } from '../context/SettingsContext';
import { CalculatorProTipsSidebar } from './CalculatorProTipsSidebar';
import { getSubstrateProTip } from '../data/substrateAdvice';

interface CalculatorViewProps {
  onSendEstimateToQuote: (details: {
    squareFootage: number;
    substrate: string;
    thickness: number;
    rValue: number;
    nrc: number;
    bags: number;
    adhesiveGallons: number;
  }) => void;
  onAddToProjectEstimator?: (areaData: {
    areaInput: number;
    substrateType: string;
    targetThicknessInches: number;
    targetRValue: number;
    unitSystem: 'imperial' | 'metric';
  }) => void;
  onNavigateToScheduleEstimator?: (data: {
    areaInput: number;
    substrateType: string;
    targetThicknessInches: number;
    targetRValue: number;
    unitSystem: 'imperial' | 'metric';
  }) => void;
}

export const CalculatorView: React.FC<CalculatorViewProps> = ({
  onSendEstimateToQuote,
  onAddToProjectEstimator,
  onNavigateToScheduleEstimator,
}) => {
  const { getEffectiveWatermark } = useSettings();
  const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>('imperial');
  
  // Area values in native units (Imperial = sq ft, Metric = sq m)
  const [areaInput, setAreaInput] = useState<number>(10000);
  const [substrateType, setSubstrateType] = useState<string>('flat-concrete');
  const [targetMode, setTargetMode] = useState<'thermal' | 'thickness'>('thermal');
  
  // Primary Imperial controls
  const [targetRValue, setTargetRValue] = useState<number>(16); // R-16 is typical
  const [targetThicknessInches, setTargetThicknessInches] = useState<number>(4.0);
  
  // Primary Metric controls
  const [targetRsi, setTargetRsi] = useState<number>(2.8); // RSI 2.8 ≈ R-15.9
  const [targetThicknessMm, setTargetThicknessMm] = useState<number>(100);

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Condensation Dew Point parameters
  // Stored in Imperial (°F) internally or Metric (°C) when switched
  const [indoorTempF, setIndoorTempF] = useState<number>(70);
  const [indoorRhPercent, setIndoorRhPercent] = useState<number>(50);
  const [outdoorWinterTempF, setOutdoorWinterTempF] = useState<number>(10);

  // Substrate flute multipliers
  const substrateFactors: Record<string, { name: string; multiplier: number; description: string; metricName: string }> = {
    'flat-concrete': {
      name: 'Flat Concrete Slab / Post-Tensioned Soffit',
      metricName: 'Dalle de béton plane / Sous-face post-tendue',
      multiplier: 1.0,
      description: 'Standard flat surface area (1.0x factor).',
    },
    'fluted-metal-1.5': {
      name: '1.5" Corrugated Metal Deck (Standard 36" Rib)',
      metricName: 'Bac acier nervuré 38 mm (profil standard)',
      multiplier: 1.25,
      description: 'Accounts for high/low ribs (+25% surface area).',
    },
    'fluted-metal-3.0': {
      name: '3.0" Deep Rib Corrugated Metal Deck',
      metricName: 'Bac acier nervuré profond 75 mm',
      multiplier: 1.45,
      description: 'Accounts for deep flutes (+45% surface area).',
    },
    'open-web-joists': {
      name: 'Exposed Steel Bar Joists & Decking',
      metricName: 'Poutrelles ajourées en acier et platelage',
      multiplier: 1.35,
      description: 'Accounts for truss angles and bridging (+35% area).',
    },
    'gypsum-ceiling': {
      name: 'Gypsum Board / Plaster Ceiling',
      metricName: 'Plafond en plaques de plâtre / Enduit',
      multiplier: 1.0,
      description: 'Flat drywall or plaster ceiling (1.0x factor).',
    },
  };

  const currentSubstrateTip = getSubstrateProTip(substrateType);

  // Handler for unit system toggle with smooth continuous conversion
  const handleUnitSystemChange = (newSystem: 'imperial' | 'metric') => {
    if (newSystem === unitSystem) return;
    
    if (newSystem === 'metric') {
      // Imperial -> Metric conversion
      const newAreaM2 = Math.round(areaInput * 0.092903);
      setAreaInput(newAreaM2 > 0 ? newAreaM2 : 930);
      const computedMm = Math.round(calculatedThicknessInches * 25.4);
      setTargetThicknessMm(computedMm);
      setTargetRsi(Number((calculatedRValue / 5.67826).toFixed(2)));
    } else {
      // Metric -> Imperial conversion
      const newAreaSqFt = Math.round(areaInput * 10.7639);
      setAreaInput(newAreaSqFt > 0 ? newAreaSqFt : 10000);
      const computedInches = Number((targetThicknessMm / 25.4).toFixed(2));
      setTargetThicknessInches(computedInches);
      setTargetRValue(Number((targetRsi * 5.67826).toFixed(1)));
    }
    setUnitSystem(newSystem);
  };

  // Normalized area calculation
  const areaSqFt = unitSystem === 'metric' ? areaInput * 10.7639 : areaInput;
  const areaSqM = unitSystem === 'metric' ? areaInput : areaInput * 0.092903;
  const currentSubstrate = substrateFactors[substrateType];
  const effectiveAreaSqFt = areaSqFt * currentSubstrate.multiplier;
  const effectiveAreaSqM = areaSqM * currentSubstrate.multiplier;

  // Normalized thickness and thermal values
  let calculatedThicknessInches = 4.0;
  let calculatedThicknessMm = 100;
  let calculatedRValue = 16.0;
  let calculatedRsi = 2.82;

  if (unitSystem === 'imperial') {
    if (targetMode === 'thermal') {
      calculatedRValue = targetRValue;
      calculatedThicknessInches = targetRValue / 4.0;
      calculatedThicknessMm = Math.round(calculatedThicknessInches * 25.4);
      calculatedRsi = calculatedRValue / 5.67826;
    } else {
      calculatedThicknessInches = targetThicknessInches;
      calculatedThicknessMm = Math.round(targetThicknessInches * 25.4);
      calculatedRValue = targetThicknessInches * 4.0;
      calculatedRsi = calculatedRValue / 5.67826;
    }
  } else {
    // Metric Mode
    if (targetMode === 'thermal') {
      calculatedRsi = targetRsi;
      calculatedRValue = targetRsi * 5.67826;
      calculatedThicknessMm = Math.round(calculatedRsi * 36.0); // k=0.036 W/mK -> mm = RSI * 36
      calculatedThicknessInches = calculatedThicknessMm / 25.4;
    } else {
      calculatedThicknessMm = targetThicknessMm;
      calculatedThicknessInches = targetThicknessMm / 25.4;
      calculatedRsi = calculatedThicknessMm / 36.0;
      calculatedRValue = calculatedThicknessInches * 4.0;
    }
  }

  // Derive NRC (ASTM C423 / ISO 354 Sound Absorption)
  let calculatedNrc = 0.75;
  if (calculatedThicknessInches >= 3.0) calculatedNrc = 1.0;
  else if (calculatedThicknessInches >= 2.5) calculatedNrc = 0.95;
  else if (calculatedThicknessInches >= 2.0) calculatedNrc = 0.90;
  else if (calculatedThicknessInches >= 1.5) calculatedNrc = 0.85;
  else calculatedNrc = 0.75;

  // Total Volume:
  // Board feet = effectiveAreaSqFt * thicknessInches
  const totalBoardFeet = effectiveAreaSqFt * calculatedThicknessInches;
  // Metric volume = effectiveAreaSqM * (thicknessMm / 1000)
  const totalCubicMeters = effectiveAreaSqM * (calculatedThicknessMm / 1000);

  // Material Yield per bag:
  // Monoglass bag yield = ~28 board feet (0.066 m³)
  const bagsRequired = Math.ceil(totalBoardFeet / 28);
  const totalFiberWeightLbs = Math.round(bagsRequired * 30); // 30 lb dry fiber per bag
  const totalFiberWeightKg = Math.round(bagsRequired * 13.61); // 13.6 kg dry fiber per bag

  // Adhesive concentrate requirement:
  // 0.55 gal (2.08 L) concentrate per bag, diluted 1:1 with clean water
  const adhesiveConcentrateGallons = Math.ceil(bagsRequired * 0.55);
  const adhesiveConcentrateLiters = Math.round(adhesiveConcentrateGallons * 3.78541);
  const waterGallons = adhesiveConcentrateGallons;
  const waterLiters = adhesiveConcentrateLiters;

  // Weight calculations (installed dry density ~3.2 lbs/cu ft = ~51.3 kg/m³)
  // 1 board foot = 1/12 cu ft = ~0.267 lbs
  const weightPerSqFtLbs = Number((calculatedThicknessInches * 0.267).toFixed(2));
  const weightPerSqMKg = Number(((calculatedThicknessMm / 1000) * 51.3).toFixed(2));
  const totalWeightLbs = Math.round(effectiveAreaSqFt * weightPerSqFtLbs);
  const totalWeightKg = Math.round(effectiveAreaSqM * weightPerSqMKg);

  // Application Passes (up to 5" / 127 mm in a single pass)
  const passesRequired = calculatedThicknessInches <= 5.0 ? 1 : 2;

  // Estimated spray hours (standard 3-man rig sprays ~1,000 board feet / 2.36 m³ per hour)
  const estimatedSprayHours = Math.ceil(totalBoardFeet / 1000);
  const estimatedRigDays = Math.ceil(estimatedSprayHours / 7);

  // Condensation Dew Point Calculation (Magnus-Tetens psychrometric formula)
  const indoorTempC = (indoorTempF - 32) * (5 / 9);
  const outdoorWinterTempC = (outdoorWinterTempF - 32) * (5 / 9);
  const a = 17.27;
  const b = 237.7;
  const alpha = (a * indoorTempC) / (b + indoorTempC) + Math.log(indoorRhPercent / 100);
  const dewPointC = (b * alpha) / (a - alpha);
  const dewPointF = Math.round((dewPointC * 9) / 5 + 32);

  // Estimated inner surface temperature with insulation:
  // T_surface = T_indoor - (T_indoor - T_outdoor) * (R_inside_film / R_total)
  // R_inside_film ~ 0.61 hr·ft²·°F/BTU (0.11 m²·K/W)
  const totalR = calculatedRValue + 0.61 + 0.17;
  const innerSurfaceTempF = Math.round(
    indoorTempF - (indoorTempF - outdoorWinterTempF) * (0.61 / totalR)
  );
  const innerSurfaceTempC = Number((((innerSurfaceTempF - 32) * 5) / 9).toFixed(1));

  const isCondensationRisk = innerSurfaceTempF <= dewPointF;

  // Preset configuration helper
  const applyPreset = (preset: {
    rValue: number;
    rsi: number;
    inches: number;
    mm: number;
  }) => {
    if (unitSystem === 'imperial') {
      if (targetMode === 'thermal') {
        setTargetRValue(preset.rValue);
      } else {
        setTargetThicknessInches(preset.inches);
      }
    } else {
      if (targetMode === 'thermal') {
        setTargetRsi(preset.rsi);
      } else {
        setTargetThicknessMm(preset.mm);
      }
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const watermark = getEffectiveWatermark('estimate');
      await exportCalculatorReportPdf(
        {
          projectName: 'Takeoff Material & Thermal Report',
          squareFootage: Math.round(effectiveAreaSqFt),
          thicknessInches: Number(calculatedThicknessInches.toFixed(2)),
          substrate: unitSystem === 'metric' ? `${currentSubstrate.name} (${currentSubstrate.metricName})` : currentSubstrate.name,
          finishType: 'Monoglass Natural White Spray',
          rValue: Number(calculatedRValue.toFixed(1)),
          nrc: calculatedNrc,
          bagsNeeded: bagsRequired,
          adhesivePailsNeeded: Math.ceil(adhesiveConcentrateGallons / 5),
          estimatedLaborDays: estimatedRigDays,
        },
        undefined,
        watermark
      );
    } catch (err) {
      console.error('Failed to export calculator PDF report:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSendToQuote = () => {
    onSendEstimateToQuote({
      squareFootage: Math.round(effectiveAreaSqFt),
      substrate: currentSubstrate.name,
      thickness: Number(calculatedThicknessInches.toFixed(2)),
      rValue: Number(calculatedRValue.toFixed(1)),
      nrc: calculatedNrc,
      bags: bagsRequired,
      adhesiveGallons: adhesiveConcentrateGallons,
    });
  };

  const handleAddToEstimator = () => {
    if (onAddToProjectEstimator) {
      onAddToProjectEstimator({
        areaInput,
        substrateType,
        targetThicknessInches: calculatedThicknessInches,
        targetRValue: calculatedRValue,
        unitSystem,
      });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Title Header Banner with Global Unit Toggle */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <Calculator className="w-4 h-4" /> Thermal, Acoustic & Material Volume Engine
          </div>

          {/* Master Imperial / Metric Mode Selector */}
          <div
            id="unit-system-toggle-bar"
            className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-700/80 shadow-inner"
          >
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 px-2">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>Unit System:</span>
            </div>
            <button
              id="calculator-unit-imperial-btn"
              onClick={() => handleUnitSystemChange('imperial')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                unitSystem === 'imperial'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Imperial (sq ft, in, °F, lbs)</span>
            </button>
            <button
              id="calculator-unit-metric-btn"
              onClick={() => handleUnitSystemChange('metric')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                unitSystem === 'metric'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Metric SI (m², mm, °C, kg)</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Monoglass Technical Estimator & R-Value Calculator
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed mt-1">
              Calculate continuous thermal resistance ({unitSystem === 'imperial' ? 'R-value' : 'RSI'}), dry fiber bag volume, adhesive concentrate pails, substrate geometry factors, and psychrometric condensation prevention in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono">
              Active: <strong className="text-sky-400">{unitSystem === 'imperial' ? 'US Imperial (ASTM)' : 'International SI (ISO/CAN)'}</strong>
            </span>
          </div>
        </div>

        {/* Quick Industry Presets Bar */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Standard Code Presets:
          </span>
          <button
            onClick={() => applyPreset({ rValue: 16.0, rsi: 2.82, inches: 4.0, mm: 100 })}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
          >
            {unitSystem === 'imperial' ? 'ASHRAE 90.1 Soffit (R-16 / 4.0")' : 'ASHRAE 90.1 Soffit (RSI 2.8 / 100 mm)'}
          </button>
          <button
            onClick={() => applyPreset({ rValue: 20.0, rsi: 3.52, inches: 5.0, mm: 125 })}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
          >
            {unitSystem === 'imperial' ? 'Max 1-Pass Depth (R-20 / 5.0")' : 'Max 1-Pass Depth (RSI 3.5 / 125 mm)'}
          </button>
          <button
            onClick={() => applyPreset({ rValue: 22.7, rsi: 4.0, inches: 5.7, mm: 144 })}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
          >
            {unitSystem === 'imperial' ? 'NECB / Cold Climate (R-22.7 / 5.7")' : 'NECB / Cold Climate (RSI 4.0 / 144 mm)'}
          </button>
          <button
            onClick={() => applyPreset({ rValue: 10.0, rsi: 1.76, inches: 2.5, mm: 65 })}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
          >
            {unitSystem === 'imperial' ? 'Acoustic Gym NRC 0.95 (2.5")' : 'Acoustic Gym NRC 0.95 (65 mm)'}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Parameters Controls */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Project Dimensions & Substrate</span>
              </h3>

              {/* Sub-Header Unit Switcher Pill */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => handleUnitSystemChange('imperial')}
                  className={`px-2.5 py-1 rounded font-bold transition-colors ${
                    unitSystem === 'imperial'
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ft / in
                </button>
                <button
                  onClick={() => handleUnitSystemChange('metric')}
                  className={`px-2.5 py-1 rounded font-bold transition-colors ${
                    unitSystem === 'metric'
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  m / mm
                </button>
              </div>
            </div>

            {/* Surface Area Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Surface Plan Area ({unitSystem === 'imperial' ? 'Square Feet' : 'Square Meters'})
                </label>
                <span className="text-xs font-mono text-slate-400">
                  {unitSystem === 'imperial'
                    ? `≈ ${Math.round(areaSqM).toLocaleString()} m² metric`
                    : `≈ ${Math.round(areaSqFt).toLocaleString()} sq. ft imperial`}
                </span>
              </div>
              <div className="relative">
                <input
                  id="calc-area-input"
                  type="number"
                  min={10}
                  max={1000000}
                  step={unitSystem === 'imperial' ? 100 : 10}
                  value={areaInput}
                  onChange={(e) => setAreaInput(Math.max(0, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-lg font-bold focus:outline-none focus:border-sky-500 transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-sky-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                  {unitSystem === 'imperial' ? 'sq. ft (ft²)' : 'sq. meters (m²)'}
                </span>
              </div>
            </div>

            {/* Substrate Deck Profile */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Substrate Geometry Profile
              </label>
              <select
                id="calc-substrate-select"
                value={substrateType}
                onChange={(e) => setSubstrateType(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-sky-500 transition-colors font-medium"
              >
                {Object.entries(substrateFactors).map(([key, val]) => (
                  <option key={key} value={key}>
                    {unitSystem === 'imperial' ? val.name : `${val.name} (${val.metricName})`} — {val.multiplier}x Area
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between text-xs text-slate-400 italic pt-0.5">
                <span>{currentSubstrate.description}</span>
                <span className="font-mono text-sky-400 font-bold not-italic">
                  Effective: {unitSystem === 'imperial'
                    ? `${Math.round(effectiveAreaSqFt).toLocaleString()} sq ft`
                    : `${Math.round(effectiveAreaSqM).toLocaleString()} m²`}
                </span>
              </div>

              {/* Contextual Substrate Pro Tip & Adhesive Ratio Callout */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2 mt-2 shadow-inner">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Substrate Pro Tip: {currentSubstrateTip.categoryLabel}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                    {unitSystem === 'imperial'
                      ? `>${currentSubstrateTip.adhesionScoreLbs} lbs/ft² Adhesion`
                      : `>${currentSubstrateTip.adhesionScoreKpa} kPa Adhesion`}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white">Adhesive Dynamics: </strong>
                  {currentSubstrateTip.whyRatioMatters.slice(0, 160)}...
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1.5 border-t border-slate-800/80 text-slate-400">
                  <span>
                    Dilution: <strong className="text-sky-300">{currentSubstrateTip.recommendedDilution}</strong>
                  </span>
                  <a
                    href="#calculator-pro-tips-sidebar"
                    className="font-bold text-sky-400 hover:text-sky-300 underline flex items-center gap-1 transition-colors"
                  >
                    <span>View Full Substrate Pro Tips ↓</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Target Specification Mode Selector */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Specification Target
                </label>
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                  <button
                    id="calc-mode-thermal-btn"
                    onClick={() => setTargetMode('thermal')}
                    className={`px-3 py-1 rounded font-bold transition-colors ${
                      targetMode === 'thermal'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {unitSystem === 'imperial' ? 'Target R-Value' : 'Target RSI Value'}
                  </button>
                  <button
                    id="calc-mode-thickness-btn"
                    onClick={() => setTargetMode('thickness')}
                    className={`px-3 py-1 rounded font-bold transition-colors ${
                      targetMode === 'thickness'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {unitSystem === 'imperial' ? 'Target Thickness (in)' : 'Target Thickness (mm)'}
                  </button>
                </div>
              </div>

              {/* Slider for Imperial Mode */}
              {unitSystem === 'imperial' ? (
                targetMode === 'thermal' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">
                        R-{targetRValue.toFixed(1)} Continuous Insulation
                      </span>
                      <span className="text-xs font-mono text-sky-400">
                        {(targetRValue / 4.0).toFixed(2)} in ({Math.round((targetRValue / 4.0) * 25.4)} mm) | RSI {(targetRValue / 5.67826).toFixed(2)}
                      </span>
                    </div>
                    <input
                      id="calc-target-rvalue-slider"
                      type="range"
                      min={4}
                      max={32}
                      step={0.5}
                      value={targetRValue}
                      onChange={(e) => setTargetRValue(Number(e.target.value))}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>R-4 (1.0")</span>
                      <span>R-12 (3.0")</span>
                      <span>R-16 (4.0")</span>
                      <span>R-20 (5.0" Max 1-Pass)</span>
                      <span>R-32 (8.0")</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">
                        {targetThicknessInches.toFixed(2)} inches ({Math.round(targetThicknessInches * 25.4)} mm)
                      </span>
                      <span className="text-xs font-mono text-sky-400">
                        R-{(targetThicknessInches * 4.0).toFixed(1)} | RSI {((targetThicknessInches * 4.0) / 5.67826).toFixed(2)}
                      </span>
                    </div>
                    <input
                      id="calc-target-thickness-in-slider"
                      type="range"
                      min={1.0}
                      max={8.0}
                      step={0.25}
                      value={targetThicknessInches}
                      onChange={(e) => setTargetThicknessInches(Number(e.target.value))}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>1.0" (R-4)</span>
                      <span>2.5" (NRC 0.95)</span>
                      <span>4.0" (R-16)</span>
                      <span>5.0" (Max 1-Pass)</span>
                      <span>8.0" (R-32)</span>
                    </div>
                  </div>
                )
              ) : (
                /* Slider for Metric Mode */
                targetMode === 'thermal' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">
                        RSI {targetRsi.toFixed(2)} m²·K/W (R-{(targetRsi * 5.67826).toFixed(1)})
                      </span>
                      <span className="text-xs font-mono text-sky-400">
                        {calculatedThicknessMm} mm ({calculatedThicknessInches.toFixed(2)} in)
                      </span>
                    </div>
                    <input
                      id="calc-target-rsi-slider"
                      type="range"
                      min={0.7}
                      max={5.6}
                      step={0.05}
                      value={targetRsi}
                      onChange={(e) => setTargetRsi(Number(e.target.value))}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>RSI 0.70 (25 mm)</span>
                      <span>RSI 2.10 (75 mm)</span>
                      <span>RSI 2.80 (100 mm)</span>
                      <span>RSI 3.50 (125 mm)</span>
                      <span>RSI 5.60 (200 mm)</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">
                        {targetThicknessMm} mm ({calculatedThicknessInches.toFixed(2)} in)
                      </span>
                      <span className="text-xs font-mono text-sky-400">
                        RSI {calculatedRsi.toFixed(2)} m²·K/W (R-{calculatedRValue.toFixed(1)})
                      </span>
                    </div>
                    <input
                      id="calc-target-thickness-mm-slider"
                      type="range"
                      min={25}
                      max={200}
                      step={5}
                      value={targetThicknessMm}
                      onChange={(e) => setTargetThicknessMm(Number(e.target.value))}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>25 mm (R-4)</span>
                      <span>65 mm (NRC 0.95)</span>
                      <span>100 mm (R-16)</span>
                      <span>127 mm (Max 1-Pass)</span>
                      <span>200 mm (R-32)</span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Condensation & Dew Point Diagnostic Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-amber-400" />
                <span>Condensation & Dew Point Diagnostic</span>
              </h3>
              <span className="text-xs text-slate-400">ASHRAE Psychrometric Model</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                  Indoor Temp ({unitSystem === 'imperial' ? '°F' : '°C'})
                </label>
                {unitSystem === 'imperial' ? (
                  <input
                    type="number"
                    value={indoorTempF}
                    onChange={(e) => setIndoorTempF(Number(e.target.value))}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm"
                  />
                ) : (
                  <input
                    type="number"
                    value={Math.round(indoorTempC)}
                    onChange={(e) => setIndoorTempF(Math.round((Number(e.target.value) * 9) / 5 + 32))}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm"
                  />
                )}
                <span className="text-[10px] text-slate-400">
                  {unitSystem === 'imperial'
                    ? `°F (${indoorTempC.toFixed(1)}°C)`
                    : `°C (${indoorTempF}°F)`}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                  Indoor RH%
                </label>
                <input
                  type="number"
                  min={10}
                  max={95}
                  value={indoorRhPercent}
                  onChange={(e) => setIndoorRhPercent(Number(e.target.value))}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm"
                />
                <span className="text-[10px] text-slate-400">% Relative Hum.</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                  Outdoor Winter ({unitSystem === 'imperial' ? '°F' : '°C'})
                </label>
                {unitSystem === 'imperial' ? (
                  <input
                    type="number"
                    value={outdoorWinterTempF}
                    onChange={(e) => setOutdoorWinterTempF(Number(e.target.value))}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm"
                  />
                ) : (
                  <input
                    type="number"
                    value={Math.round(outdoorWinterTempC)}
                    onChange={(e) => setOutdoorWinterTempF(Math.round((Number(e.target.value) * 9) / 5 + 32))}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm"
                  />
                )}
                <span className="text-[10px] text-slate-400">
                  {unitSystem === 'imperial'
                    ? `°F (${outdoorWinterTempC.toFixed(1)}°C)`
                    : `°C (${outdoorWinterTempF}°F)`}
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Calculated Indoor Dew Point:</span>
                <span className="font-mono font-bold text-amber-400">
                  {unitSystem === 'imperial'
                    ? `${dewPointF}°F (${dewPointC.toFixed(1)}°C)`
                    : `${dewPointC.toFixed(1)}°C (${dewPointF}°F)`}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Insulated Surface Deck Temp:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {unitSystem === 'imperial'
                    ? `${innerSurfaceTempF}°F (${innerSurfaceTempC}°C)`
                    : `${innerSurfaceTempC}°C (${innerSurfaceTempF}°F)`}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                {!isCondensationRisk ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>
                      Protected: Insulated deck surface (
                      {unitSystem === 'imperial' ? `${innerSurfaceTempF}°F` : `${innerSurfaceTempC}°C`}
                      ) is safely above the dew point (
                      {unitSystem === 'imperial' ? `${dewPointF}°F` : `${dewPointC.toFixed(1)}°C`}
                      ). Zero dripping.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      Condensation Alert: Surface temperature is below dew point. Increase Monoglass thickness to raise surface temperature or add dehumidification.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Calculated Bill of Materials & Specs */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/80 rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="text-sky-400 text-xs font-bold uppercase tracking-wider">
                  Material Take-Off Output ({unitSystem === 'imperial' ? 'Imperial Units' : 'Metric SI Units'})
                </div>
                <h3 className="text-xl font-bold text-white">
                  Estimated Take-Off & System Specifications
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Volume:</span>
                <span className="text-lg font-mono font-black text-white">
                  {unitSystem === 'imperial'
                    ? `${Math.round(totalBoardFeet).toLocaleString()} bd. ft`
                    : `${totalCubicMeters.toFixed(1)} m³`}
                </span>
                <span className="text-[11px] text-slate-400 block font-mono">
                  {unitSystem === 'imperial'
                    ? `(${totalCubicMeters.toFixed(1)} m³)`
                    : `(${Math.round(totalBoardFeet).toLocaleString()} bd. ft)`}
                </span>
              </div>
            </div>

            {/* Key Output Metric Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Card 1: Monoglass Bags */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-sky-400 font-bold uppercase tracking-wider">
                  <Package className="w-4 h-4" /> Monoglass Bags
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  {bagsRequired.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400">
                  {unitSystem === 'imperial'
                    ? `@ 28 bd.ft yield/bag (~${totalFiberWeightLbs.toLocaleString()} lbs dry fiber)`
                    : `@ 0.066 m³ yield/bag (~${totalFiberWeightKg.toLocaleString()} kg dry fiber)`}
                </div>
              </div>

              {/* Card 2: Adhesive Concentrate */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-teal-400 font-bold uppercase tracking-wider">
                  <Droplet className="w-4 h-4" /> Adhesive Concentrate
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  {unitSystem === 'imperial'
                    ? `${adhesiveConcentrateGallons.toLocaleString()} gal`
                    : `${adhesiveConcentrateLiters.toLocaleString()} L`}
                </div>
                <div className="text-[11px] text-slate-400">
                  {unitSystem === 'imperial'
                    ? `+ ${waterGallons.toLocaleString()} gal water (1:1 mix ratio)`
                    : `+ ${waterLiters.toLocaleString()} L water (1:1 mix ratio)`}
                </div>
              </div>

              {/* Card 3: Acoustic Absorption */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold uppercase tracking-wider">
                  <Volume2 className="w-4 h-4" /> Acoustic Absorption
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  NRC {calculatedNrc.toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-400">
                  ASTM C423 / ISO 354 Sound Absorption
                </div>
              </div>

              {/* Card 4: Dead Load Weight */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold uppercase tracking-wider">
                  <Scale className="w-4 h-4" /> Dead Load Weight
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  {unitSystem === 'imperial' ? (
                    <>
                      {weightPerSqFtLbs} <span className="text-sm font-sans font-normal text-slate-400">lbs/sq.ft</span>
                    </>
                  ) : (
                    <>
                      {weightPerSqMKg} <span className="text-sm font-sans font-normal text-slate-400">kg/m²</span>
                    </>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  {unitSystem === 'imperial'
                    ? `Total load: ${totalWeightLbs.toLocaleString()} lbs across structure`
                    : `Total load: ${totalWeightKg.toLocaleString()} kg (${(totalWeightKg / 1000).toFixed(2)} tonnes)`}
                </div>
              </div>
            </div>

            {/* Installation Logistics Breakdown */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Installation Crew & Equipment Logistics
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Single-Pass Capability:</span>
                  <span className="font-semibold text-white">
                    {passesRequired === 1
                      ? unitSystem === 'imperial'
                        ? '1 Single Pass (Up to 5.0")'
                        : '1 Single Pass (Jusqu\'à 127 mm)'
                      : unitSystem === 'imperial'
                      ? '2 Passes Required (>5.0")'
                      : '2 Passes Requises (>127 mm)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Est. Spray Machine Time:</span>
                  <span className="font-semibold text-white">
                    ~{estimatedSprayHours} Hours ({estimatedRigDays} Rig Days @ 1 Crew)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Substrate Temp Minimum:</span>
                  <span className="font-semibold text-white">
                    {unitSystem === 'imperial' ? '≥ 40°F (4.5°C)' : '≥ 4.5°C (40°F)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Cure & Drying Window:</span>
                  <span className="font-semibold text-white">24 - 48 Hours</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-3">
              {onNavigateToScheduleEstimator && (
                <button
                  id="calc-model-schedule-btn"
                  onClick={() =>
                    onNavigateToScheduleEstimator({
                      areaInput,
                      substrateType,
                      targetThicknessInches,
                      targetRValue,
                      unitSystem,
                    })
                  }
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99] border border-slate-700"
                >
                  <Calendar className="w-4 h-4 text-sky-400" />
                  <span>Model Project Schedule & Trade Milestones</span>
                </button>
              )}

              {onAddToProjectEstimator && (
                <button
                  id="calc-add-to-estimator-btn"
                  onClick={handleAddToEstimator}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99] border border-sky-400/30"
                >
                  <Layers className="w-4 h-4 text-sky-200" />
                  <span>Add to Multi-Room Project Estimator</span>
                </button>
              )}

              <button
                id="calc-download-pdf-btn"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                title="Download comprehensive PDF takeoff and thermal submittal"
              >
                {isExportingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
                <span>
                  {isExportingPdf
                    ? 'Exporting PDF Report...'
                    : unitSystem === 'imperial'
                    ? 'Download Takeoff Report (.PDF)'
                    : 'Download Takeoff Report (.PDF Metric)'}
                </span>
              </button>

              <button
                onClick={handleSendToQuote}
                className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Send Estimate to Certified Contractors for Project Bids</span>
              </button>
              <p className="text-[11px] text-center text-slate-400">
                Instantly pre-fills project specifications into the contractor RFP bid distributor.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contextual Substrate Pro Tips & Adhesive Ratio Sidebar Section */}
      <div className="pt-2">
        <CalculatorProTipsSidebar
          currentSubstrateKey={substrateType}
          unitSystem={unitSystem}
          areaInput={areaInput}
          calculatedThicknessInches={calculatedThicknessInches}
          bagsRequired={bagsRequired}
          adhesiveConcentrateGallons={adhesiveConcentrateGallons}
          onSelectSubstrate={(newKey) => {
            if (substrateFactors[newKey]) {
              setSubstrateType(newKey);
            }
          }}
        />
      </div>
    </div>
  );
};
