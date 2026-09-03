import { ProjectRoomItem, MultiRoomProject, ConsolidatedBom, RoomBomLine } from '../types';

export const SUBSTRATE_PROFILES: Record<
  string,
  {
    name: string;
    metricName: string;
    multiplier: number;
    description: string;
  }
> = {
  'flat-concrete': {
    name: 'Flat Concrete Slab / Soffit',
    metricName: 'Dalle de béton plane',
    multiplier: 1.0,
    description: 'Standard flat surface area (1.0x factor)',
  },
  'fluted-metal-1.5': {
    name: '1.5" Corrugated Metal Deck (Standard Rib)',
    metricName: 'Bac acier nervuré 38 mm',
    multiplier: 1.25,
    description: 'Accounts for flutes & ribs (+25% surface area)',
  },
  'fluted-metal-3.0': {
    name: '3.0" Deep Rib Corrugated Metal Deck',
    metricName: 'Bac acier nervuré 75 mm',
    multiplier: 1.45,
    description: 'Accounts for deep flutes (+45% surface area)',
  },
  'open-web-joists': {
    name: 'Exposed Steel Bar Joists & Metal Deck',
    metricName: 'Poutrelles ajourées et platelage',
    multiplier: 1.35,
    description: 'Accounts for steel webbing & chords (+35% area)',
  },
  'gypsum-ceiling': {
    name: 'Gypsum Board / Plaster Ceiling',
    metricName: 'Plafond plaques de plâtre',
    multiplier: 1.0,
    description: 'Flat drywall or cement board (1.0x factor)',
  },
};

export const FINISH_OPTIONS = [
  {
    id: 'Natural White',
    label: 'Natural Off-White (~85% Reflectance)',
    description: 'Standard monolithic spray texture for parking garages & soffits.',
    requiresSonoglaze: false,
  },
  {
    id: 'Monoglass Black',
    label: 'Monoglass Black (100% Dyed Fiber)',
    description: 'Jet black aesthetic for theaters, arenas, sound stages, & open ceilings.',
    requiresSonoglaze: false,
  },
  {
    id: 'Tamped Smooth',
    label: 'Tamped Semi-Smooth Architectural Finish',
    description: 'Lightly troweled / rolled finish for high-visibility lobbies & retail.',
    requiresSonoglaze: false,
  },
  {
    id: 'Sonoglaze Hard-Coat',
    label: 'Sonoglaze Polymer Protective Hard-Coat',
    description: 'High-abuse, washdown, transit, or high air-velocity (>10,000 FPM) zones.',
    requiresSonoglaze: true,
  },
] as const;

export const PROJECT_TEMPLATES: {
  id: string;
  name: string;
  projectType: string;
  description: string;
  defaultRooms: Omit<ProjectRoomItem, 'id'>[];
}[] = [
  {
    id: 'mixed-use-tower',
    name: 'Mixed-Use Residential High-Rise',
    projectType: 'Commercial Mixed-Use',
    description: 'Multi-level unheated parkade, natatorium pool ceiling, and mechanical fan room.',
    defaultRooms: [
      {
        name: 'P1 Parking Garage Soffit (Under Residential)',
        planArea: 14500,
        substrateType: 'flat-concrete',
        targetMode: 'thermal',
        targetRValue: 20,
        targetThicknessInches: 5.0,
        finishType: 'Natural White',
        wastagePercent: 8,
        ceilingHeightFt: 10.5,
        siteConditionNotes: 'Post-tensioned concrete slab, clean formwork',
        enabled: true,
      },
      {
        name: 'P2 Parking Garage Soffit',
        planArea: 16000,
        substrateType: 'flat-concrete',
        targetMode: 'thermal',
        targetRValue: 16,
        targetThicknessInches: 4.0,
        finishType: 'Natural White',
        wastagePercent: 8,
        ceilingHeightFt: 9.5,
        siteConditionNotes: 'Clean unpainted concrete',
        enabled: true,
      },
      {
        name: 'Indoor Natatorium / Pool Ceiling',
        planArea: 4200,
        substrateType: 'fluted-metal-1.5',
        targetMode: 'thickness',
        targetRValue: 12,
        targetThicknessInches: 3.0,
        finishType: 'Sonoglaze Hard-Coat',
        wastagePercent: 10,
        ceilingHeightFt: 18.0,
        siteConditionNotes: 'High humidity chloramine environment, vapor retarder verified',
        enabled: true,
      },
      {
        name: 'Level 1 Central Mechanical Room',
        planArea: 2800,
        substrateType: 'open-web-joists',
        targetMode: 'thickness',
        targetRValue: 10,
        targetThicknessInches: 2.5,
        finishType: 'Sonoglaze Hard-Coat',
        wastagePercent: 12,
        ceilingHeightFt: 14.0,
        siteConditionNotes: 'High air velocity equipment room >10,000 FPM (ASTM E859)',
        enabled: true,
      },
    ],
  },
  {
    id: 'sports-arena',
    name: 'Community Ice Rink & Sports Complex',
    projectType: 'Sports & Recreation',
    description: 'NHL-size ice arena roof deck, spectator seating, and multi-purpose gymnasium.',
    defaultRooms: [
      {
        name: 'Main Ice Rink Roof Deck (Anti-Drip & Acoustic)',
        planArea: 22000,
        substrateType: 'fluted-metal-3.0',
        targetMode: 'thickness',
        targetRValue: 14,
        targetThicknessInches: 3.5,
        finishType: 'Natural White',
        wastagePercent: 10,
        ceilingHeightFt: 32.0,
        siteConditionNotes: 'Psychrometric anti-condensation control, high scissor lift work',
        enabled: true,
      },
      {
        name: 'Spectator Seating & Concourse Ceiling',
        planArea: 6500,
        substrateType: 'open-web-joists',
        targetMode: 'thickness',
        targetRValue: 10,
        targetThicknessInches: 2.5,
        finishType: 'Monoglass Black',
        wastagePercent: 10,
        ceilingHeightFt: 16.0,
        siteConditionNotes: 'Acoustic reverberation control (NRC 0.95), black aesthetic',
        enabled: true,
      },
      {
        name: 'Refrigeration Chiller Plant Room',
        planArea: 1800,
        substrateType: 'flat-concrete',
        targetMode: 'thickness',
        targetRValue: 12,
        targetThicknessInches: 3.0,
        finishType: 'Sonoglaze Hard-Coat',
        wastagePercent: 8,
        ceilingHeightFt: 12.0,
        siteConditionNotes: 'Acoustic attenuation and washdown resilience',
        enabled: true,
      },
    ],
  },
  {
    id: 'performing-arts',
    name: 'Auditorium & Cinema Center',
    projectType: 'Acoustics & Entertainment',
    description: 'Blacked-out theater ceilings, acoustic reflection baffles, and lobby soffits.',
    defaultRooms: [
      {
        name: 'Main Auditorium Ceiling (Sound Absorption)',
        planArea: 8500,
        substrateType: 'open-web-joists',
        targetMode: 'thickness',
        targetRValue: 12,
        targetThicknessInches: 3.0,
        finishType: 'Monoglass Black',
        wastagePercent: 10,
        ceilingHeightFt: 26.0,
        siteConditionNotes: 'Critical RT60 reverberation control (NRC 1.00+), zero light reflection',
        enabled: true,
      },
      {
        name: 'Black Box Studio Theater',
        planArea: 3200,
        substrateType: 'fluted-metal-1.5',
        targetMode: 'thickness',
        targetRValue: 10,
        targetThicknessInches: 2.5,
        finishType: 'Monoglass Black',
        wastagePercent: 8,
        ceilingHeightFt: 18.0,
        siteConditionNotes: 'Acoustic isolation from adjacent studio wings',
        enabled: true,
      },
      {
        name: 'Main Entry Canopy & Drive-Under Soffit',
        planArea: 4800,
        substrateType: 'flat-concrete',
        targetMode: 'thermal',
        targetRValue: 20,
        targetThicknessInches: 5.0,
        finishType: 'Tamped Smooth',
        wastagePercent: 8,
        ceilingHeightFt: 14.0,
        siteConditionNotes: 'Architectural semi-smooth tamped finish with R-20 continuous insulation',
        enabled: true,
      },
    ],
  },
  {
    id: 'blank-custom',
    name: 'Custom Multi-Room Project',
    projectType: 'Custom Building Spec',
    description: 'Start with a clean blank canvas to build custom area takeoffs.',
    defaultRooms: [
      {
        name: 'Area 1 - Main Soffit / Ceiling',
        planArea: 5000,
        substrateType: 'flat-concrete',
        targetMode: 'thermal',
        targetRValue: 16,
        targetThicknessInches: 4.0,
        finishType: 'Natural White',
        wastagePercent: 8,
        ceilingHeightFt: 10.0,
        siteConditionNotes: 'Standard substrate conditions',
        enabled: true,
      },
    ],
  },
];

/**
 * Calculates itemized BOM for a single room item
 */
export function calculateRoomBom(
  room: ProjectRoomItem,
  unitSystem: 'imperial' | 'metric'
): RoomBomLine {
  const substrate = SUBSTRATE_PROFILES[room.substrateType] || SUBSTRATE_PROFILES['flat-concrete'];
  const multiplier = substrate.multiplier;

  // Plan Area conversions
  const planAreaSqFt = unitSystem === 'metric' ? room.planArea * 10.7639 : room.planArea;
  const planAreaSqM = unitSystem === 'metric' ? room.planArea : room.planArea * 0.092903;

  const effectiveAreaSqFt = planAreaSqFt * multiplier;
  const effectiveAreaSqM = planAreaSqM * multiplier;

  // Thickness & Thermal
  let thicknessInches = 4.0;
  let rValue = 16.0;

  if (room.targetMode === 'thermal') {
    rValue = room.targetRValue;
    thicknessInches = rValue / 4.0;
  } else {
    thicknessInches = room.targetThicknessInches;
    rValue = thicknessInches * 4.0;
  }

  const thicknessMm = Math.round(thicknessInches * 25.4);
  const rsi = Number((rValue / 5.67826).toFixed(2));

  // Derive NRC (ASTM C423 Sound Absorption)
  let nrc = 0.75;
  if (thicknessInches >= 3.0) nrc = 1.0;
  else if (thicknessInches >= 2.5) nrc = 0.95;
  else if (thicknessInches >= 2.0) nrc = 0.90;
  else if (thicknessInches >= 1.5) nrc = 0.85;
  else nrc = 0.75;

  // Volume & Board Feet
  const wastageFactor = 1 + (room.wastagePercent || 8) / 100;
  const rawBoardFeet = effectiveAreaSqFt * thicknessInches;
  const grossBoardFeet = rawBoardFeet * wastageFactor;
  const grossCubicMeters = (effectiveAreaSqM * (thicknessMm / 1000)) * wastageFactor;

  // Bag Count (~28 board feet per 30 lb bag)
  const bags = Math.ceil(grossBoardFeet / 28);

  // Adhesive (0.55 gal concentrate per bag, diluted 1:1)
  const adhesiveGallons = Math.ceil(bags * 0.55);

  // Sonoglaze Hard-Coat (coverage ~75 sq ft / gal on spray texture)
  let sonoglazeGallons = 0;
  if (room.finishType === 'Sonoglaze Hard-Coat') {
    sonoglazeGallons = Math.ceil((effectiveAreaSqFt * wastageFactor) / 75);
  }

  // Dead Load Weight (~0.267 lbs per board foot installed dry)
  const weightPerSqFt = thicknessInches * 0.267;
  const deadLoadLbs = Math.round(effectiveAreaSqFt * weightPerSqFt);
  const deadLoadKg = Math.round(deadLoadLbs * 0.453592);

  // Spray Machine Time (standard 3-man crew @ ~1,000 board feet / hour)
  const sprayHours = Number((grossBoardFeet / 1000).toFixed(1));

  return {
    room,
    effectiveAreaSqFt: Math.round(effectiveAreaSqFt),
    effectiveAreaSqM: Math.round(effectiveAreaSqM),
    thicknessInches: Number(thicknessInches.toFixed(2)),
    thicknessMm,
    rValue: Number(rValue.toFixed(1)),
    rsi,
    nrc,
    boardFeet: Math.round(grossBoardFeet),
    cubicMeters: Number(grossCubicMeters.toFixed(2)),
    bags,
    adhesiveGallons,
    sonoglazeGallons,
    deadLoadLbs,
    deadLoadKg,
    sprayHours,
  };
}

/**
 * Computes consolidated project bill of materials across all enabled rooms
 */
export function calculateConsolidatedBom(
  project: MultiRoomProject,
  unitSystem: 'imperial' | 'metric'
): ConsolidatedBom {
  const activeRooms = project.rooms.filter((r) => r.enabled);
  const breakdowns = activeRooms.map((room) => calculateRoomBom(room, unitSystem));

  let totalPlanAreaSqFt = 0;
  let totalPlanAreaSqM = 0;
  let totalEffectiveAreaSqFt = 0;
  let totalEffectiveAreaSqM = 0;
  let totalBagsFiber = 0;
  let totalAdhesiveConcentrateGallons = 0;
  let totalSonoglazeGallons = 0;
  let totalDeadLoadLbs = 0;
  let totalDeadLoadKg = 0;
  let totalSprayHours = 0;

  // Weighted averages
  let weightedRSum = 0;
  let weightedRsiSum = 0;
  let weightedNrcSum = 0;

  breakdowns.forEach((line) => {
    const planSqFt = unitSystem === 'metric' ? line.room.planArea * 10.7639 : line.room.planArea;
    const planSqM = unitSystem === 'metric' ? line.room.planArea : line.room.planArea * 0.092903;

    totalPlanAreaSqFt += planSqFt;
    totalPlanAreaSqM += planSqM;
    totalEffectiveAreaSqFt += line.effectiveAreaSqFt;
    totalEffectiveAreaSqM += line.effectiveAreaSqM;
    totalBagsFiber += line.bags;
    totalAdhesiveConcentrateGallons += line.adhesiveGallons;
    totalSonoglazeGallons += line.sonoglazeGallons;
    totalDeadLoadLbs += line.deadLoadLbs;
    totalDeadLoadKg += line.deadLoadKg;
    totalSprayHours += line.sprayHours;

    weightedRSum += line.rValue * line.effectiveAreaSqFt;
    weightedRsiSum += line.rsi * line.effectiveAreaSqM;
    weightedNrcSum += line.nrc * line.effectiveAreaSqFt;
  });

  const blendedRValue =
    totalEffectiveAreaSqFt > 0 ? Number((weightedRSum / totalEffectiveAreaSqFt).toFixed(1)) : 0;
  const blendedRsi =
    totalEffectiveAreaSqM > 0 ? Number((weightedRsiSum / totalEffectiveAreaSqM).toFixed(2)) : 0;
  const blendedNrc =
    totalEffectiveAreaSqFt > 0 ? Number((weightedNrcSum / totalEffectiveAreaSqFt).toFixed(2)) : 0;

  const totalFiberWeightLbs = Math.round(totalBagsFiber * 30);
  const totalFiberWeightKg = Math.round(totalBagsFiber * 13.61);

  const totalAdhesiveConcentrateLiters = Math.round(totalAdhesiveConcentrateGallons * 3.78541);
  const totalAdhesivePails = Math.ceil(totalAdhesiveConcentrateGallons / 5); // 5-gallon pails
  const totalWaterGallons = totalAdhesiveConcentrateGallons;

  const totalSonoglazePails = Math.ceil(totalSonoglazeGallons / 5);

  const totalDeadLoadTonnes = Number((totalDeadLoadKg / 1000).toFixed(2));
  const totalRigDays = Math.ceil(totalSprayHours / 7); // ~7 operational spray hours/day

  // Rough budgetary ranges:
  // Monoglass material ~ $1.10 - $1.60 per board foot (fiber + adhesive)
  // Installed turnkey contractor spray ~ $2.50 - $4.80 per board foot depending on height/scaffolding
  const totalBf = breakdowns.reduce((acc, curr) => acc + curr.boardFeet, 0);
  const estimatedMaterialCostLow = Math.round(totalBf * 1.15);
  const estimatedMaterialCostHigh = Math.round(totalBf * 1.65);
  const estimatedTurnkeyCostLow = Math.round(totalBf * 2.85);
  const estimatedTurnkeyCostHigh = Math.round(totalBf * 4.95);

  return {
    totalPlanAreaSqFt: Math.round(totalPlanAreaSqFt),
    totalPlanAreaSqM: Math.round(totalPlanAreaSqM),
    totalEffectiveAreaSqFt: Math.round(totalEffectiveAreaSqFt),
    totalEffectiveAreaSqM: Math.round(totalEffectiveAreaSqM),
    totalBagsFiber,
    totalFiberWeightLbs,
    totalFiberWeightKg,
    totalAdhesiveConcentrateGallons,
    totalAdhesiveConcentrateLiters,
    totalAdhesivePails,
    totalWaterGallons,
    totalSonoglazeGallons,
    totalSonoglazePails,
    blendedRValue,
    blendedRsi,
    blendedNrc,
    totalDeadLoadLbs,
    totalDeadLoadKg,
    totalDeadLoadTonnes,
    totalSprayHours: Number(totalSprayHours.toFixed(1)),
    totalRigDays,
    estimatedMaterialCostLow,
    estimatedMaterialCostHigh,
    estimatedTurnkeyCostLow,
    estimatedTurnkeyCostHigh,
    roomBreakdowns: breakdowns,
  };
}
