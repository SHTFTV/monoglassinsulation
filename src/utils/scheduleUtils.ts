import {
  ScheduleInput,
  ScheduleEstimateResult,
  SchedulePhase,
  SchedulePreset,
} from '../types';

export const SCHEDULE_PRESETS: SchedulePreset[] = [
  {
    id: 'parking-garage',
    name: 'Underground Parking Garage Soffit',
    category: 'Commercial / Transit',
    description:
      'Continuous thermal envelope under cold unconditioned slab. Standard concrete substrate with typical lighting conduits and fire sprinklers.',
    defaults: {
      projectName: 'Metro Plaza Parking Garage P1 & P2 Soffit',
      targetArea: 35000,
      unitSystem: 'imperial',
      targetThicknessInches: 3.5, // R-14
      substrateType: 'flat-concrete',
      ceilingHeightFt: 11,
      accessEquipment: 'ground-scaffold',
      mepDensity: 'moderate',
      maskingLevel: 'standard',
      primerRequired: false,
      finishType: 'Natural White',
      ambientCondition: 'cold-unheated',
      crewCount: 1,
      shiftType: 'standard-8h',
      workDaysPerWeek: 5,
    },
  },
  {
    id: 'sports-arena',
    name: 'High School Sports Gymnasium',
    category: 'Recreational / Acoustic',
    description:
      'High-NRC sound reverberation control over deep fluted metal roof deck and open-web steel bar joists at 28 ft ceiling height.',
    defaults: {
      projectName: 'Westbrook High School Multi-Sport Arena',
      targetArea: 18000,
      unitSystem: 'imperial',
      targetThicknessInches: 2.0, // NRC 0.95-1.00
      substrateType: 'open-web-joists',
      ceilingHeightFt: 28,
      accessEquipment: 'boom-lift',
      mepDensity: 'moderate',
      maskingLevel: 'standard',
      primerRequired: false,
      finishType: 'Natural White',
      ambientCondition: 'ideal',
      crewCount: 1,
      shiftType: 'standard-8h',
      workDaysPerWeek: 5,
    },
  },
  {
    id: 'commercial-office',
    name: 'Commercial High-Rise Core & Shell',
    category: 'Commercial High-Rise',
    description:
      'Perimeter soffits and mechanical floors on fluted metal deck with 16 ft slab-to-slab clear heights using scissor lifts.',
    defaults: {
      projectName: 'Apex Tower Floors 4–12 Mechanical & Soffits',
      targetArea: 24000,
      unitSystem: 'imperial',
      targetThicknessInches: 2.5, // R-10
      substrateType: 'fluted-metal-1.5',
      ceilingHeightFt: 16,
      accessEquipment: 'scissor-lift',
      mepDensity: 'moderate',
      maskingLevel: 'standard',
      primerRequired: false,
      finishType: 'Natural White',
      ambientCondition: 'ideal',
      crewCount: 2,
      shiftType: 'standard-8h',
      workDaysPerWeek: 5,
    },
  },
  {
    id: 'distribution-center',
    name: 'Industrial Distribution Logistics Center',
    category: 'Industrial / Warehouses',
    description:
      'High-volume metal roof deck insulation. Multi-rig accelerated fast-track production over large open expanses.',
    defaults: {
      projectName: 'Interstate Logistics Hub Distribution Center',
      targetArea: 75000,
      unitSystem: 'imperial',
      targetThicknessInches: 3.0, // R-12
      substrateType: 'fluted-metal-1.5',
      ceilingHeightFt: 36,
      accessEquipment: 'scissor-lift',
      mepDensity: 'low',
      maskingLevel: 'minimal',
      primerRequired: false,
      finishType: 'Natural White',
      ambientCondition: 'ideal',
      crewCount: 3,
      shiftType: 'extended-10h',
      workDaysPerWeek: 6,
    },
  },
  {
    id: 'soundstage-studio',
    name: 'Film Soundstage & Production Studio',
    category: 'Acoustics & Theaters',
    description:
      'Ultra-quiet NC-20 acoustic envelope with Monoglass Black pigmented finish and critical dust containment.',
    defaults: {
      projectName: 'Stage 4 Production Soundstage Acoustic Ceiling',
      targetArea: 14000,
      unitSystem: 'imperial',
      targetThicknessInches: 4.5, // R-18 / NRC 1.00+
      substrateType: 'open-web-joists',
      ceilingHeightFt: 42,
      accessEquipment: 'boom-lift',
      mepDensity: 'high',
      maskingLevel: 'critical',
      primerRequired: false,
      finishType: 'Monoglass Black',
      ambientCondition: 'ideal',
      crewCount: 1,
      shiftType: 'standard-8h',
      workDaysPerWeek: 5,
    },
  },
  {
    id: 'mechanical-room',
    name: 'Central Utility Plant / Mechanical Room',
    category: 'Institutional & Labs',
    description:
      'High-traffic mechanical room with dense overhead piping, K-Lastic bonding primer, and Sonoglaze hard-coat abuse-resistant sealer.',
    defaults: {
      projectName: 'Hospital Central Plant Mechanical Penthouse',
      targetArea: 6500,
      unitSystem: 'imperial',
      targetThicknessInches: 3.0, // R-12
      substrateType: 'flat-concrete',
      ceilingHeightFt: 14,
      accessEquipment: 'scissor-lift',
      mepDensity: 'high',
      maskingLevel: 'standard',
      primerRequired: true,
      finishType: 'Sonoglaze Hard-Coat',
      ambientCondition: 'ideal',
      crewCount: 1,
      shiftType: 'standard-8h',
      workDaysPerWeek: 5,
    },
  },
];

/**
 * Calculates project schedule, crew hours, and milestone timeline
 */
export function calculateProjectSchedule(input: ScheduleInput): ScheduleEstimateResult {
  // Convert area to sq ft if metric
  const planAreaSqFt =
    input.unitSystem === 'metric' ? input.targetArea * 10.7639 : input.targetArea;

  const thicknessInches =
    input.unitSystem === 'metric'
      ? input.targetThicknessInches / 25.4
      : input.targetThicknessInches;

  // Substrate surface area multiplier
  const substrateFactors: Record<string, number> = {
    'flat-concrete': 1.0,
    'fluted-metal-1.5': 1.15,
    'fluted-metal-3.0': 1.3,
    'open-web-joists': 1.45,
    'wood-framing': 1.12,
    'curved-vaulted': 1.25,
  };
  const substrateMultiplier = substrateFactors[input.substrateType] || 1.0;
  const effectiveAreaSqFt = planAreaSqFt * substrateMultiplier;
  const boardFeetTotal = effectiveAreaSqFt * thicknessInches;

  // Material estimations
  const estimatedBags = Math.ceil(boardFeetTotal / 115);
  const estimatedAdhesivePails = Math.ceil(estimatedBags * 0.15); // 5-gal pails
  const estimatedSonoglazePails =
    input.finishType === 'Sonoglaze Hard-Coat'
      ? Math.ceil(effectiveAreaSqFt / 500)
      : undefined;
  const estimatedTruckloads = Math.max(1, Math.ceil(estimatedBags / 900));

  // Access Equipment Multiplier
  const accessSpeedFactors: Record<string, number> = {
    'ground-scaffold': 1.0,
    'scissor-lift': 0.88,
    'boom-lift': 0.74,
    'highbay-swing-stage': 0.62,
  };
  const accessFactor = accessSpeedFactors[input.accessEquipment] || 1.0;

  // MEP Density Multiplier
  const mepSpeedFactors: Record<string, number> = {
    low: 1.0,
    moderate: 0.86,
    high: 0.72,
  };
  const mepFactor = mepSpeedFactors[input.mepDensity] || 1.0;

  // Finish type speed factor
  const finishSpeedFactors: Record<string, number> = {
    'Natural White': 1.0,
    'Monoglass Black': 0.95,
    'Tamped Smooth': 0.82,
    'Sonoglaze Hard-Coat': 1.0, // Sonoglaze is separate post-spray pass
  };
  const finishFactor = finishSpeedFactors[input.finishType] || 1.0;

  // Multi-pass overhead if thickness > 3.0"
  const multiPassFactor = thicknessInches > 3.0 ? 0.9 : 1.0;

  // Net spray hours per shift
  const shiftNetHours: Record<string, number> = {
    'standard-8h': 5.5,
    'extended-10h': 7.5,
    'double-shift': 11.5,
  };
  const netHoursPerShift = shiftNetHours[input.shiftType] || 5.5;

  // Baseline standard: 450 board-ft per net spray hour for 1 3-person certified crew
  const baselineBoardFtPerHour = 450;
  const adjustedBoardFtPerHour =
    baselineBoardFtPerHour *
    accessFactor *
    mepFactor *
    finishFactor *
    multiPassFactor;

  const boardFtPerShiftPerCrew = adjustedBoardFtPerHour * netHoursPerShift;
  const totalBoardFtPerDay = boardFtPerShiftPerCrew * input.crewCount;

  // Spray Days (rounded to nearest half day)
  const rawSprayDays = boardFeetTotal / totalBoardFtPerDay;
  const totalSprayDays = Math.max(0.5, Math.round(rawSprayDays * 2) / 2);

  // Daily Production Metrics
  const dailyProductionBoardFt = Math.round(boardFeetTotal / totalSprayDays);
  const dailyProductionSqFt = Math.round(planAreaSqFt / totalSprayDays);

  // Phase 1 & 2: Mobilization, Masking & Primer Days
  let prepDays = 0.5;
  if (planAreaSqFt > 12000) prepDays = 1.0;
  if (planAreaSqFt > 40000) prepDays = 1.5;
  if (planAreaSqFt > 80000) prepDays = 2.0;

  if (input.maskingLevel === 'standard') prepDays += 0.5;
  if (input.maskingLevel === 'critical') prepDays += 1.5;

  let primerDays = 0;
  if (input.primerRequired) {
    primerDays = Math.max(1.0, Math.round((planAreaSqFt / 25000) * 2) / 2);
  }

  const totalPrepDays = Math.round((prepDays + primerDays) * 2) / 2;

  // Phase 4: Finish / Sonoglaze Days
  let finishExtraDays = 0;
  if (input.finishType === 'Sonoglaze Hard-Coat') {
    finishExtraDays = Math.max(1.0, Math.round((planAreaSqFt / 20000) * 2) / 2);
  }

  // Phase 5: Curing & Demobilization Days
  let cureDays = 1.5; // Ideal baseline
  if (input.ambientCondition === 'cold-unheated') cureDays = 3.5;
  if (input.ambientCondition === 'high-humidity') cureDays = 3.0;

  const demobDays = planAreaSqFt > 30000 ? 1.0 : 0.5;
  const totalCureDays = cureDays + demobDays;

  // Total Working Days (Active Contractor Crew on Site)
  const totalWorkingDays = Math.ceil(totalPrepDays + totalSprayDays + finishExtraDays + demobDays);

  // Total Calendar Days (Including weekends & curing period before trade release)
  const workDaysPerWeek = input.workDaysPerWeek || 5;
  const weekendMultiplier = 7 / workDaysPerWeek;
  const calendarWorkingDays = Math.ceil(totalWorkingDays * weekendMultiplier);
  const totalCalendarDays = Math.ceil(calendarWorkingDays + (cureDays - 1.0));

  // Subsequent trade re-entry (days after start)
  const subsequentTradeReEntryDay = Math.ceil(totalWorkingDays + cureDays);

  // Calculate Dates based on Start Date
  const parsedStartDate = input.startDate ? new Date(input.startDate) : new Date();
  const validStartDate = isNaN(parsedStartDate.getTime()) ? new Date() : parsedStartDate;

  const endDate = new Date(validStartDate);
  endDate.setDate(validStartDate.getDate() + totalCalendarDays);
  const calculatedEndDate = endDate.toISOString().split('T')[0];

  const tradeDate = new Date(validStartDate);
  tradeDate.setDate(validStartDate.getDate() + subsequentTradeReEntryDay);
  const tradeReEntryDate = tradeDate.toISOString().split('T')[0];

  // Total Crew Man-Hours
  // 3 workers per crew, plus shift length (8, 10, or 16 for double shift)
  const hoursPerWorkerShift =
    input.shiftType === 'extended-10h' ? 10 : input.shiftType === 'double-shift' ? 16 : 8;
  const totalCrewManHours = Math.round(
    (totalPrepDays + totalSprayDays + finishExtraDays + demobDays) *
      input.crewCount *
      3 *
      hoursPerWorkerShift
  );

  // Build Phased Schedule Gantt Elements
  const phases: SchedulePhase[] = [];
  let currentDay = 1;

  // Phase 1: Mobilization & Site Setup
  const mobDuration = Math.max(0.5, Math.round(prepDays * 2) / 2);
  phases.push({
    id: 'phase-mob-mask',
    name: 'Mobilization, Staging & Poly Masking',
    phaseCategory: 'prep',
    startDay: currentDay,
    durationDays: mobDuration,
    endDay: currentDay + mobDuration,
    crewManHours: Math.round(mobDuration * input.crewCount * 3 * hoursPerWorkerShift),
    description:
      'Equipment rig positioning, 200ft high-pressure hose routing, containment poly masking on perimeter walls, finished floors, and MEP components.',
    deliverables: [
      'Rig positioning & 220V/480V 3-phase power verification',
      'Water supply line connection (min 5 GPM @ 40 PSI)',
      'Floor & mechanical duct polyethylene containment',
    ],
    color: '#0284c7', // sky 600
  });
  currentDay += mobDuration;

  // Phase 2: Primer Coat (if required)
  if (input.primerRequired && primerDays > 0) {
    phases.push({
      id: 'phase-primer',
      name: 'Substrate Cleaning & K-Lastic Primer Coat',
      phaseCategory: 'primer',
      startDay: currentDay,
      durationDays: primerDays,
      endDay: currentDay + primerDays,
      crewManHours: Math.round(primerDays * input.crewCount * 3 * hoursPerWorkerShift),
      description:
        'Spray application of Monoglass K-Lastic / Prime-Lock water-based bonding primer to ensure monolithic adhesive bond on non-standard substrate.',
      deliverables: [
        'Substrate degrease and loose scale removal',
        'Even primer film coverage @ 300 sq.ft/gal',
        'Flash-off cure period (min 12 hours) before fiber spray',
      ],
      color: '#d97706', // amber 600
    });
    currentDay += primerDays;
  }

  // Phase 3: Production Spray Application
  phases.push({
    id: 'phase-spray',
    name: 'Monoglass® Spray-Applied Fiber Production',
    phaseCategory: 'spray',
    startDay: currentDay,
    durationDays: totalSprayDays,
    endDay: currentDay + totalSprayDays,
    crewManHours: Math.round(totalSprayDays * input.crewCount * 3 * hoursPerWorkerShift),
    description: `Continuous spray installation of Monoglass glass fiber at ${thicknessInches.toFixed(
      1
    )}" target thickness (${(thicknessInches * 4.0).toFixed(
      1
    )} R-Value) utilizing ${input.crewCount} certified 3-person spray rig crew(s).`,
    deliverables: [
      `Continuous monolithic glass fiber thermal/acoustic blanket`,
      `Adhesive liquid atomization ratio monitoring (0.75 gal concentrate / bag)`,
      `Hourly pin-gauge depth verification per ASTM E605 standards`,
    ],
    color: '#3b82f6', // blue 500
  });
  currentDay += totalSprayDays;

  // Phase 4: Secondary Finish / Sonoglaze (if required)
  if (input.finishType === 'Sonoglaze Hard-Coat' && finishExtraDays > 0) {
    phases.push({
      id: 'phase-sonoglaze',
      name: 'Sonoglaze® Protective Hard-Coat Overspray',
      phaseCategory: 'finish',
      startDay: currentDay,
      durationDays: finishExtraDays,
      endDay: currentDay + finishExtraDays,
      crewManHours: Math.round(finishExtraDays * input.crewCount * 3 * hoursPerWorkerShift),
      description:
        'Spray application of Sonoglaze acrylic polymer sealer over cured Monoglass fiber for high-abuse, impact-resistant surface protection.',
      deliverables: [
        'Surface inspection prior to topcoat application',
        'Uniform cross-hatch spray pass of Sonoglaze concentrate',
        'Impact & abrasion hardened surface finish',
      ],
      color: '#10b981', // emerald 500
    });
    currentDay += finishExtraDays;
  }

  // Phase 5: Curing, Demobilization & Trade Turnover
  phases.push({
    id: 'phase-cure-turnover',
    name: 'Curing Period, Demobilization & QA Turnover',
    phaseCategory: 'cure',
    startDay: currentDay,
    durationDays: totalCureDays,
    endDay: currentDay + totalCureDays,
    crewManHours: Math.round(demobDays * input.crewCount * 3 * hoursPerWorkerShift),
    description:
      'Air exchange curing cycle, removal of masking poly, final ASTM thickness certification, and formal clearance for subsequent trade re-entry.',
    deliverables: [
      'Active air movement and humidity ventilation management',
      'Masking poly removal and final floor broom sweep',
      'ASTM E605 / E736 field testing signoff for General Contractor',
      'Clearance release for HVAC duct, lighting, and drywall installers',
    ],
    color: '#8b5cf6', // purple 500
  });

  // Critical Path & Trade Coordination Notes
  const criticalPathNotes: string[] = [
    `Nozzle production rate calibrated at ${Math.round(
      adjustedBoardFtPerHour
    )} board-ft/hour per crew based on ${input.accessEquipment} access and ${input.mepDensity} MEP density.`,
    `Subsequent trades (HVAC, electricians, ceiling grid contractors) must maintain a clearance buffer until Day ${subsequentTradeReEntryDay} to prevent thermal bridge indentation or fiber disturbance.`,
    `General Contractor must verify continuous 220V/480V 3-phase power and uninterrupted water supply at 40 PSI minimum before Day 1 mobilization.`,
  ];

  if (thicknessInches > 3.0) {
    criticalPathNotes.push(
      `Thickness exceeds 3.0" (${thicknessInches.toFixed(
        1
      )}" specified) — dual spray passes will be staged within the same shift to prevent adhesive slump.`
    );
  }

  if (input.primerRequired) {
    criticalPathNotes.push(
      `Primer flash-off requires a mandatory 12 to 24-hour cure window before fiber blowing can commence.`
    );
  }

  // Weather & Climate Advisories
  const weatherAdvisories: string[] = [];
  if (input.ambientCondition === 'cold-unheated') {
    weatherAdvisories.push(
      'CRITICAL: Ambient air and substrate temperature must be maintained at 40°F (4°C) or above during application and for 48 hours post-spray. Indirect-fired temporary heaters and air circulation fans are mandatory.'
    );
  } else if (input.ambientCondition === 'high-humidity') {
    weatherAdvisories.push(
      'ATTENTION: High ambient relative humidity (>80% RH) will extend water evaporation drying times. Mechanical air movers or industrial dehumidification are strongly recommended to meet schedule.'
    );
  } else {
    weatherAdvisories.push(
      'OPTIMAL: Ambient jobsite conditions (60°F - 80°F, 40-60% RH) provide rapid 24-48 hour fiber cure time.'
    );
  }

  // Crew & Resource Optimization Recommendations
  const crewRecommendations: string[] = [];
  if (input.crewCount === 1 && planAreaSqFt >= 25000) {
    const twoCrewDays = Math.ceil(totalSprayDays / 2);
    crewRecommendations.push(
      `SCHEDULE ACCELERATION TIP: Adding a second certified spray rig and 3-person crew reduces active spraying from ${totalSprayDays} days down to approx. ${twoCrewDays} days, saving ${
        totalSprayDays - twoCrewDays
      } working days.`
    );
  }

  if (input.shiftType === 'standard-8h' && totalWorkingDays > 10) {
    crewRecommendations.push(
      `OVERTIME SHIFTS: Transitioning from standard 8-hour to 10-hour extended shifts increases daily net spray output by 36%, shortening total site occupancy.`
    );
  }

  if (input.accessEquipment === 'highbay-swing-stage' || input.ceilingHeightFt > 35) {
    crewRecommendations.push(
      `HIGH-BAY SAFETY: Elevated spray access (>35 ft) requires certified 100% tie-off lifelines and safety spotters on ground level to manage supply hoses.`
    );
  }

  // Equipment Fleet requirements
  const equipmentRequirements = [
    {
      item: 'Monoglass Certified Spray Machine & Hopper',
      quantity: `${input.crewCount} Unit${input.crewCount > 1 ? 's' : ''}`,
      notes: 'High-volume pneumatic fiber blower with variable air-lock feed',
    },
    {
      item: 'Liquid Adhesive Injection Pump & Nozzle Assembly',
      quantity: `${input.crewCount} Set${input.crewCount > 1 ? 's' : ''}`,
      notes: 'Calibrated 4-jet liquid atomization ring with inline pressure regulator',
    },
    {
      item: 'Access Machinery',
      quantity: `${input.crewCount * 2} Units`,
      notes:
        input.accessEquipment === 'boom-lift'
          ? 'Articulating boom lifts with platform hose brackets'
          : input.accessEquipment === 'scissor-lift'
          ? 'Electric scissor lifts with non-marking tires'
          : 'Heavy-duty rolling staging towers / bakers scaffold',
    },
    {
      item: 'Air Exchange Fans / Exhaust Movers',
      quantity: `${input.crewCount * 2} Industrial Blowers`,
      notes: 'Continuous negative air or cross-flow ventilation for drying',
    },
    {
      item: 'Pin-Gauge Depth & Quality Verification Kit',
      quantity: '1 Set per Crew',
      notes: 'ASTM E605 calibrated depth probes and density balance scale',
    },
  ];

  return {
    totalCalendarDays,
    totalWorkingDays,
    totalSprayDays,
    totalPrepDays,
    totalCureDays,
    totalCrewManHours,
    dailyProductionSqFt,
    dailyProductionBoardFt,
    boardFeetTotal,
    effectiveAreaSqFt,
    estimatedBags,
    estimatedAdhesivePails,
    estimatedSonoglazePails,
    estimatedTruckloads,
    subsequentTradeReEntryDay,
    calculatedEndDate,
    tradeReEntryDate,
    phases,
    criticalPathNotes,
    weatherAdvisories,
    crewRecommendations,
    equipmentRequirements,
  };
}
