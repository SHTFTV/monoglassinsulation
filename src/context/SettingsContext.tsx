import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WatermarkPreset } from '../types';

export type UnitSystem = 'imperial' | 'metric';

export interface UnitSettingsContextType {
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
  toggleUnitSystem: () => void;
  isMetric: boolean;
  
  // Watermark Settings
  watermarkPreset: WatermarkPreset;
  setWatermarkPreset: (preset: WatermarkPreset) => void;
  customWatermark: string;
  setCustomWatermark: (text: string) => void;
  getEffectiveWatermark: (docType: 'estimate' | 'spec' | 'technical' | 'comparison') => string | null;
  
  // Formatters and Conversion Helpers
  formatThickness: (inches: number, showBoth?: boolean) => string;
  formatRValue: (rValue: number, showBoth?: boolean) => string;
  formatArea: (sqFt: number, showBoth?: boolean) => string;
  formatTemp: (tempF: number, showBoth?: boolean) => string;
  formatDensity: (lbsPerCuFt: number, showBoth?: boolean) => string;
  formatWeight: (lbsPerSqFt: number, showBoth?: boolean) => string;
  formatVolume: (bdFt: number, showBoth?: boolean) => string;
  formatAdhesion: (lbsPerSqFt: number, showBoth?: boolean) => string;
  formatAirVelocity: (fpm: number, showBoth?: boolean) => string;

  // Conversion math helpers
  inchesToMm: (inches: number) => number;
  mmToInches: (mm: number) => number;
  rValueToRsi: (rValue: number) => number;
  rsiToRValue: (rsi: number) => number;
  sqFtToM2: (sqFt: number) => number;
  m2ToSqFt: (m2: number) => number;
  fToC: (tempF: number) => number;
  cToF: (tempC: number) => number;
  lbsToKg: (lbs: number) => number;
  kgToLbs: (kg: number) => number;
  galToLiters: (gal: number) => number;
  litersToGal: (liters: number) => number;
}

const SettingsContext = createContext<UnitSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'monoglass_unit_system';
const WATERMARK_STORAGE_KEY = 'monoglass_watermark_preset';
const CUSTOM_WATERMARK_STORAGE_KEY = 'monoglass_custom_watermark';

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>('imperial');
  const [watermarkPreset, setWatermarkPresetState] = useState<WatermarkPreset>('AUTO');
  const [customWatermark, setCustomWatermarkState] = useState<string>('DRAFT - FOR REVIEW ONLY');

  // Load persisted setting from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'metric' || saved === 'imperial') {
        setUnitSystemState(saved);
      }
      const savedWatermark = localStorage.getItem(WATERMARK_STORAGE_KEY) as WatermarkPreset | null;
      if (savedWatermark) {
        setWatermarkPresetState(savedWatermark);
      }
      const savedCustom = localStorage.getItem(CUSTOM_WATERMARK_STORAGE_KEY);
      if (savedCustom) {
        setCustomWatermarkState(savedCustom);
      }
    } catch {
      // ignore storage error
    }
  }, []);

  const setUnitSystem = (system: UnitSystem) => {
    setUnitSystemState(system);
    try {
      localStorage.setItem(STORAGE_KEY, system);
    } catch {
      // ignore storage error
    }
  };

  const setWatermarkPreset = (preset: WatermarkPreset) => {
    setWatermarkPresetState(preset);
    try {
      localStorage.setItem(WATERMARK_STORAGE_KEY, preset);
    } catch {
      // ignore storage error
    }
  };

  const setCustomWatermark = (text: string) => {
    setCustomWatermarkState(text);
    try {
      localStorage.setItem(CUSTOM_WATERMARK_STORAGE_KEY, text);
    } catch {
      // ignore storage error
    }
  };

  const getEffectiveWatermark = (docType: 'estimate' | 'spec' | 'technical' | 'comparison'): string | null => {
    if (watermarkPreset === 'NONE') {
      return null;
    }
    if (watermarkPreset === 'CUSTOM') {
      return customWatermark.trim() || 'DRAFT - FOR REFERENCE ONLY';
    }
    if (watermarkPreset === 'AUTO') {
      switch (docType) {
        case 'estimate':
          return 'PROJECT ESTIMATE';
        case 'spec':
          return 'DRAFT - FOR REFERENCE ONLY';
        case 'technical':
          return 'PRELIMINARY SUBMITTAL';
        case 'comparison':
          return 'DRAFT - FOR REFERENCE ONLY';
        default:
          return 'DRAFT - FOR REFERENCE ONLY';
      }
    }
    return watermarkPreset;
  };

  const toggleUnitSystem = () => {
    setUnitSystem(unitSystem === 'imperial' ? 'metric' : 'imperial');
  };

  const isMetric = unitSystem === 'metric';

  // Math Conversion functions
  const inchesToMm = (inches: number) => Math.round(inches * 25.4);
  const mmToInches = (mm: number) => Number((mm / 25.4).toFixed(2));
  const rValueToRsi = (rValue: number) => Number((rValue / 5.67826).toFixed(2));
  const rsiToRValue = (rsi: number) => Number((rsi * 5.67826).toFixed(1));
  const sqFtToM2 = (sqFt: number) => Number((sqFt * 0.092903).toFixed(1));
  const m2ToSqFt = (m2: number) => Math.round(m2 * 10.7639);
  const fToC = (tempF: number) => Math.round(((tempF - 32) * 5) / 9);
  const cToF = (tempC: number) => Math.round((tempC * 9) / 5 + 32);
  const lbsToKg = (lbs: number) => Number((lbs * 0.453592).toFixed(1));
  const kgToLbs = (kg: number) => Math.round(kg * 2.20462);
  const galToLiters = (gal: number) => Number((gal * 3.78541).toFixed(1));
  const litersToGal = (liters: number) => Number((liters / 3.78541).toFixed(1));

  // Formatter functions
  const formatThickness = (inches: number, showBoth = false): string => {
    const mm = Math.round(inches * 25.4);
    if (showBoth) {
      return isMetric ? `${mm} mm (${inches.toFixed(1)}")` : `${inches.toFixed(1)}" (${mm} mm)`;
    }
    return isMetric ? `${mm} mm` : `${inches.toFixed(1)}"`;
  };

  const formatRValue = (rValue: number, showBoth = false): string => {
    const rsi = (rValue / 5.67826).toFixed(2);
    if (showBoth) {
      return isMetric ? `RSI ${rsi} (R-${rValue.toFixed(1)})` : `R-${rValue.toFixed(1)} (RSI ${rsi})`;
    }
    return isMetric ? `RSI ${rsi} m²·K/W` : `R-${rValue.toFixed(1)}`;
  };

  const formatArea = (sqFt: number, showBoth = false): string => {
    const m2 = Math.round(sqFt * 0.092903);
    const sqFtFormatted = Math.round(sqFt).toLocaleString();
    const m2Formatted = m2.toLocaleString();
    if (showBoth) {
      return isMetric ? `${m2Formatted} m² (${sqFtFormatted} sq ft)` : `${sqFtFormatted} sq ft (${m2Formatted} m²)`;
    }
    return isMetric ? `${m2Formatted} m²` : `${sqFtFormatted} sq ft`;
  };

  const formatTemp = (tempF: number, showBoth = false): string => {
    const tempC = Math.round(((tempF - 32) * 5) / 9);
    if (showBoth) {
      return isMetric ? `${tempC}°C (${tempF}°F)` : `${tempF}°F (${tempC}°C)`;
    }
    return isMetric ? `${tempC}°C` : `${tempF}°F`;
  };

  const formatDensity = (lbsPerCuFt: number, showBoth = false): string => {
    const kgPerM3 = Math.round(lbsPerCuFt * 16.0185);
    if (showBoth) {
      return isMetric ? `${kgPerM3} kg/m³ (${lbsPerCuFt.toFixed(1)} lbs/ft³)` : `${lbsPerCuFt.toFixed(1)} lbs/ft³ (${kgPerM3} kg/m³)`;
    }
    return isMetric ? `${kgPerM3} kg/m³` : `${lbsPerCuFt.toFixed(1)} lbs/ft³`;
  };

  const formatWeight = (lbsPerSqFt: number, showBoth = false): string => {
    const kgPerM2 = (lbsPerSqFt * 4.88243).toFixed(2);
    if (showBoth) {
      return isMetric ? `${kgPerM2} kg/m² (${lbsPerSqFt.toFixed(2)} lbs/sq ft)` : `${lbsPerSqFt.toFixed(2)} lbs/sq ft (${kgPerM2} kg/m²)`;
    }
    return isMetric ? `${kgPerM2} kg/m²` : `${lbsPerSqFt.toFixed(2)} lbs/sq ft`;
  };

  const formatVolume = (bdFt: number, showBoth = false): string => {
    const m3 = (bdFt * 0.00235974).toFixed(2);
    if (showBoth) {
      return isMetric ? `${m3} m³ (${Math.round(bdFt).toLocaleString()} bd. ft)` : `${Math.round(bdFt).toLocaleString()} bd. ft (${m3} m³)`;
    }
    return isMetric ? `${m3} m³` : `${Math.round(bdFt).toLocaleString()} bd. ft`;
  };

  const formatAdhesion = (lbsPerSqFt: number, showBoth = false): string => {
    const kPa = (lbsPerSqFt * 0.04788).toFixed(1);
    if (showBoth) {
      return isMetric ? `${kPa} kPa (${lbsPerSqFt} lbs/sq ft)` : `${lbsPerSqFt} lbs/sq ft (${kPa} kPa)`;
    }
    return isMetric ? `${kPa} kPa` : `${lbsPerSqFt} lbs/sq ft`;
  };

  const formatAirVelocity = (fpm: number, showBoth = false): string => {
    const ms = (fpm * 0.00508).toFixed(1);
    if (showBoth) {
      return isMetric ? `${ms} m/s (${fpm.toLocaleString()} FPM)` : `${fpm.toLocaleString()} FPM (${ms} m/s)`;
    }
    return isMetric ? `${ms} m/s` : `${fpm.toLocaleString()} FPM`;
  };

  const value: UnitSettingsContextType = {
    unitSystem,
    setUnitSystem,
    toggleUnitSystem,
    isMetric,
    watermarkPreset,
    setWatermarkPreset,
    customWatermark,
    setCustomWatermark,
    getEffectiveWatermark,
    formatThickness,
    formatRValue,
    formatArea,
    formatTemp,
    formatDensity,
    formatWeight,
    formatVolume,
    formatAdhesion,
    formatAirVelocity,
    inchesToMm,
    mmToInches,
    rValueToRsi,
    rsiToRValue,
    sqFtToM2,
    m2ToSqFt,
    fToC,
    cToF,
    lbsToKg,
    kgToLbs,
    galToLiters,
    litersToGal,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): UnitSettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
