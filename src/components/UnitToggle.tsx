import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { Globe, Scale, SlidersHorizontal } from 'lucide-react';

interface UnitToggleProps {
  variant?: 'compact' | 'full' | 'pill' | 'header';
  className?: string;
  showLabels?: boolean;
}

export const UnitToggle: React.FC<UnitToggleProps> = ({
  variant = 'compact',
  className = '',
  showLabels = true,
}) => {
  const { unitSystem, setUnitSystem, isMetric } = useSettings();

  if (variant === 'header') {
    return (
      <div className={`inline-flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-700/80 shadow-inner ${className}`}>
        <button
          type="button"
          id="global-unit-toggle-imperial"
          onClick={() => setUnitSystem('imperial')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
            !isMetric
              ? 'bg-sky-500 text-slate-950 shadow-sm font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Imperial Units: sq ft, inches, °F, R-Value, lbs/ft³, gal"
        >
          <span>US (Imp)</span>
        </button>
        <button
          type="button"
          id="global-unit-toggle-metric"
          onClick={() => setUnitSystem('metric')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
            isMetric
              ? 'bg-sky-500 text-slate-950 shadow-sm font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Metric (SI) Units: m², mm, °C, RSI (m²·K/W), kg/m³, Liters"
        >
          <span>Metric (SI)</span>
        </button>
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs ${className}`}>
        <Globe className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-slate-400 font-medium">Units:</span>
        <button
          type="button"
          onClick={() => setUnitSystem('imperial')}
          className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
            !isMetric ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Imperial
        </button>
        <button
          type="button"
          onClick={() => setUnitSystem('metric')}
          className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
            isMetric ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Metric
        </button>
      </div>
    );
  }

  // Full / Banner variant
  return (
    <div className={`flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs ${className}`}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
          <Scale className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-white flex items-center gap-1.5">
            <span>Measurement Standard</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono">
              {isMetric ? 'SI METRIC' : 'US CUSTOMARY'}
            </span>
          </div>
          <p className="text-slate-400 text-[11px]">
            {isMetric
              ? 'Displaying in Millimeters (mm), RSI (m²·K/W), m², °C & kg/m²'
              : 'Displaying in Inches (in), R-Value, sq ft, °F & lbs/ft²'}
          </p>
        </div>
      </div>

      <div className="flex items-center p-1 rounded-lg bg-slate-950 border border-slate-800">
        <button
          type="button"
          onClick={() => setUnitSystem('imperial')}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
            !isMetric
              ? 'bg-sky-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Imperial (°F, in, R)
        </button>
        <button
          type="button"
          onClick={() => setUnitSystem('metric')}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
            isMetric
              ? 'bg-sky-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Metric (°C, mm, RSI)
        </button>
      </div>
    </div>
  );
};
