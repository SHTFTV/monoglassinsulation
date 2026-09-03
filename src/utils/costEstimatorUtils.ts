import {
  CostEstimatorInput,
  CostEstimatorResult,
  CostLineItem,
  RegionalLaborPreset,
  SavedProjectCostEstimate,
  ProjectRoomItem,
  MultiRoomProject,
} from '../types';
import { SUBSTRATE_PROFILES } from './estimatorUtils';

export const SAVED_COST_ESTIMATES_KEY = 'monoglass_saved_cost_estimates_v1';

export const REGIONAL_LABOR_PRESETS: RegionalLaborPreset[] = [
  {
    id: 'pnw',
    name: 'Pacific Northwest (Seattle, Portland, Vancouver)',
    region: 'Pacific Northwest',
    currency: 'USD',
    baseHourlyRate: 75,
    burdenPercentage: 53.3,
    loadedHourlyRate: 115,
    defaultCrewSize: 3,
    unionStatus: 'Union / Prevailing Wage',
    notes: 'Standard certified spray insulator loaded rate including union benefits, workers comp & liability.',
  },
  {
    id: 'california',
    name: 'California & Metro West (SF, LA, San Diego)',
    region: 'California / West Coast',
    currency: 'USD',
    baseHourlyRate: 85,
    burdenPercentage: 52.9,
    loadedHourlyRate: 130,
    defaultCrewSize: 3,
    unionStatus: 'Union / Prevailing Wage',
    notes: 'High-cost metro prevailing wage rate for commercial mechanical and structural soffit insulation.',
  },
  {
    id: 'northeast',
    name: 'Northeast & Mid-Atlantic (NY, Boston, NJ, Philly)',
    region: 'Northeast / Mid-Atlantic',
    currency: 'USD',
    baseHourlyRate: 90,
    burdenPercentage: 53.3,
    loadedHourlyRate: 138,
    defaultCrewSize: 3,
    unionStatus: 'Union / Prevailing Wage',
    notes: 'Urban commercial and public works prevailing wage with required certified applicator certifications.',
  },
  {
    id: 'midwest',
    name: 'Midwest & Great Lakes (Chicago, Detroit, Minneapolis)',
    region: 'Midwest / Central',
    currency: 'USD',
    baseHourlyRate: 68,
    burdenPercentage: 50.0,
    loadedHourlyRate: 102,
    defaultCrewSize: 3,
    unionStatus: 'Standard Commercial',
    notes: 'Midwestern industrial and commercial parkade/arena spray insulation contractor rate.',
  },
  {
    id: 'south',
    name: 'Southeast & Texas (Dallas, Houston, Atlanta, Phoenix)',
    region: 'South & Mountain West',
    currency: 'USD',
    baseHourlyRate: 58,
    burdenPercentage: 51.7,
    loadedHourlyRate: 88,
    defaultCrewSize: 3,
    unionStatus: 'Open Shop / Non-Union',
    notes: 'Open shop / commercial subcontract rate across Southern high-growth construction markets.',
  },
  {
    id: 'canada',
    name: 'Canadian Metro (Toronto, Montreal, Calgary, Edmonton)',
    region: 'Canada',
    currency: 'CAD',
    baseHourlyRate: 78,
    burdenPercentage: 51.3,
    loadedHourlyRate: 118,
    defaultCrewSize: 3,
    unionStatus: 'Standard Commercial',
    notes: 'Canadian provincial commercial construction loaded labor rate (CAD).',
  },
  {
    id: 'custom',
    name: 'Custom Contractor Rate / Bidder Specific',
    region: 'Custom',
    currency: 'USD',
    baseHourlyRate: 65,
    burdenPercentage: 50.0,
    loadedHourlyRate: 98,
    defaultCrewSize: 3,
    unionStatus: 'Open Shop / Non-Union',
    notes: 'User-specified hourly labor rate and custom crew composition.',
  },
];

export const DEFAULT_COST_INPUT: CostEstimatorInput = {
  projectName: 'Downtown Commercial High-Rise Parkade & Pool',
  clientOrArchitect: 'Apex Architecture & Engineering',
  location: 'Seattle, WA',
  unitSystem: 'imperial',
  planArea: 15000,
  effectiveArea: 15000,
  targetThicknessInches: 4.0,
  targetRValue: 16.0,
  substrateType: 'flat-concrete',
  finishType: 'Natural White',
  wastagePercent: 8,
  primerRequired: false,

  // Material rates
  fiberBagCost: 42.5, // $42.50 per 30 lb bag
  fiberColor: 'white',
  adhesivePailCost: 145.0, // $145.00 per 5-gal pail
  sonoglazePailCost: 210.0, // $210.00 per 5-gal pail
  primerPailCost: 185.0, // $185.00 per 5-gal pail ($37/gal)
  maskingPolyCostPerSqFt: 0.15, // $0.15 / sq ft

  // Labor rates
  selectedRegionId: 'pnw',
  loadedLaborRatePerHour: 115,
  crewSize: 3,
  productionRateBdFtPerHour: 1000, // standard 3-man crew produces ~1000 board ft/hr
  setupCleanupHoursPerDay: 1.5, // 1.5 hrs per day for rig prep, masking, nozzle cleanup

  // Equipment & logistics
  sprayRigDailyRate: 350.0,
  liftDailyRate: 280.0,
  freightAndDeliveryCost: 650.0,
  mobilizationFee: 850.0,

  // Markups & Taxes
  overheadProfitPercent: 15.0,
  contingencyPercent: 5.0,
  salesTaxPercent: 7.5,
};

/**
 * Calculates a complete Project Cost Estimate based on inputs
 */
export function calculateCostEstimate(
  input: CostEstimatorInput,
  multiRoomProject?: MultiRoomProject | null
): CostEstimatorResult {
  const isMetric = input.unitSystem === 'metric';

  let planAreaSqFt = 0;
  let planAreaSqM = 0;
  let effectiveAreaSqFt = 0;
  let effectiveAreaSqM = 0;
  let boardFeetTotal = 0;
  let cubicMetersTotal = 0;
  let totalBags = 0;
  let totalAdhesivePails = 0;
  let totalSonoglazePails = 0;
  let totalPrimerPails = 0;

  // Check if we are aggregating from multiRoomProject
  if (multiRoomProject && multiRoomProject.rooms && multiRoomProject.rooms.length > 0) {
    const activeRooms = multiRoomProject.rooms.filter((r) => r.enabled);
    activeRooms.forEach((room) => {
      const substrate = SUBSTRATE_PROFILES[room.substrateType] || SUBSTRATE_PROFILES['flat-concrete'];
      const multiplier = substrate.multiplier;

      const roomPlanSqFt = isMetric ? room.planArea * 10.7639 : room.planArea;
      const roomPlanSqM = isMetric ? room.planArea : room.planArea * 0.092903;
      const roomEffSqFt = roomPlanSqFt * multiplier;
      const roomEffSqM = roomPlanSqM * multiplier;

      let thickInches = 4.0;
      if (room.targetMode === 'thermal') {
        thickInches = room.targetRValue / 4.0;
      } else {
        thickInches = room.targetThicknessInches;
      }

      const wastageFactor = 1 + (room.wastagePercent || 8) / 100;
      const roomBdFt = roomEffSqFt * thickInches * wastageFactor;
      const roomBags = Math.ceil(roomBdFt / 28);
      const roomAdhGal = roomBags * 0.55;
      const roomAdhPails = Math.ceil(roomAdhGal / 5);

      let roomSonoPails = 0;
      if (room.finishType === 'Sonoglaze Hard-Coat') {
        const sonoGal = Math.ceil((roomEffSqFt * wastageFactor) / 75);
        roomSonoPails = Math.ceil(sonoGal / 5);
      }

      planAreaSqFt += roomPlanSqFt;
      planAreaSqM += roomPlanSqM;
      effectiveAreaSqFt += roomEffSqFt;
      effectiveAreaSqM += roomEffSqM;
      boardFeetTotal += roomBdFt;
      cubicMetersTotal += roomEffSqM * (thickInches * 0.0254) * wastageFactor;
      totalBags += roomBags;
      totalAdhesivePails += roomAdhPails;
      totalSonoglazePails += roomSonoPails;
    });
  } else {
    // Single area computation
    planAreaSqFt = isMetric ? input.planArea * 10.7639 : input.planArea;
    planAreaSqM = isMetric ? input.planArea : input.planArea * 0.092903;

    const substrate = SUBSTRATE_PROFILES[input.substrateType] || SUBSTRATE_PROFILES['flat-concrete'];
    const multiplier = substrate.multiplier;

    effectiveAreaSqFt = planAreaSqFt * multiplier;
    effectiveAreaSqM = planAreaSqM * multiplier;

    let thickInches = input.targetThicknessInches;
    if (input.targetRValue && (!thickInches || thickInches <= 0)) {
      thickInches = input.targetRValue / 4.0;
    }

    const wastageFactor = 1 + (input.wastagePercent || 8) / 100;
    boardFeetTotal = effectiveAreaSqFt * thickInches * wastageFactor;
    cubicMetersTotal = effectiveAreaSqM * (thickInches * 0.0254) * wastageFactor;

    totalBags = Math.ceil(boardFeetTotal / 28);
    const adhesiveGallons = totalBags * 0.55;
    totalAdhesivePails = Math.ceil(adhesiveGallons / 5);

    if (input.finishType === 'Sonoglaze Hard-Coat') {
      const sonoGal = Math.ceil((effectiveAreaSqFt * wastageFactor) / 75);
      totalSonoglazePails = Math.ceil(sonoGal / 5);
    }

    if (input.primerRequired) {
      // Primer coverage ~250 sq ft / gallon = 1250 sq ft per 5-gal pail
      totalPrimerPails = Math.ceil(effectiveAreaSqFt / 1250);
    }
  }

  // Ensure minimums
  planAreaSqFt = Math.max(1, Math.round(planAreaSqFt));
  planAreaSqM = Math.max(1, Math.round(planAreaSqM));
  effectiveAreaSqFt = Math.max(1, Math.round(effectiveAreaSqFt));
  effectiveAreaSqM = Math.max(1, Math.round(effectiveAreaSqM));
  boardFeetTotal = Math.max(1, Math.round(boardFeetTotal));
  totalBags = Math.max(1, totalBags);
  totalAdhesivePails = Math.max(1, totalAdhesivePails);

  // 1. MATERIAL COSTS
  const bagUnitPrice = input.fiberColor === 'black' ? (input.fiberBagCost * 1.22) : input.fiberBagCost;
  const fiberMaterialsCost = totalBags * bagUnitPrice;
  const adhesiveMaterialsCost = totalAdhesivePails * input.adhesivePailCost;
  const sonoglazeMaterialsCost = totalSonoglazePails * input.sonoglazePailCost;
  const primerMaterialsCost = totalPrimerPails * input.primerPailCost;
  const maskingSuppliesCost = Math.round(effectiveAreaSqFt * input.maskingPolyCostPerSqFt);

  const materialsCost = Math.round(
    fiberMaterialsCost + adhesiveMaterialsCost + sonoglazeMaterialsCost + primerMaterialsCost
  );
  const maskingPrepCost = maskingSuppliesCost;

  // 2. LABOR PRODUCTION & HOURS
  const prodRate = Math.max(200, input.productionRateBdFtPerHour || 1000);
  const estimatedSprayHours = Number((boardFeetTotal / prodRate).toFixed(1));
  const workHoursPerDay = 8;
  const estimatedRigDays = Math.max(1, Math.ceil(estimatedSprayHours / (workHoursPerDay - input.setupCleanupHoursPerDay)));

  const totalSetupCleanupHours = estimatedRigDays * input.setupCleanupHoursPerDay;
  const totalSprayAndPrepRigHours = estimatedSprayHours + totalSetupCleanupHours;
  const crewCount = Math.max(1, input.crewSize || 3);
  const totalCrewManHours = Number((totalSprayAndPrepRigHours * crewCount).toFixed(1));

  const laborCost = Math.round(totalCrewManHours * input.loadedLaborRatePerHour);

  // 3. EQUIPMENT & LOGISTICS
  const rigRentalCost = estimatedRigDays * input.sprayRigDailyRate;
  const liftRentalCost = estimatedRigDays * input.liftDailyRate;
  const equipmentCost = Math.round(rigRentalCost + liftRentalCost);
  const logisticsCost = Math.round(input.freightAndDeliveryCost + input.mobilizationFee);

  // 4. SUBTOTAL DIRECT COSTS
  const directCostSubtotal = materialsCost + maskingPrepCost + laborCost + equipmentCost + logisticsCost;

  // 5. MARKUPS & TAXES
  const contingencyCost = Math.round(directCostSubtotal * ((input.contingencyPercent || 0) / 100));
  const baseForMarkup = directCostSubtotal + contingencyCost;
  const overheadProfitCost = Math.round(baseForMarkup * ((input.overheadProfitPercent || 0) / 100));
  
  // Tax on tangible materials and supplies
  const taxableMaterials = materialsCost + maskingPrepCost;
  const salesTaxCost = Math.round(taxableMaterials * ((input.salesTaxPercent || 0) / 100));

  const grandTotalCost = directCostSubtotal + contingencyCost + overheadProfitCost + salesTaxCost;

  // 6. UNIT METRICS
  const costPerSqFt = Number((grandTotalCost / planAreaSqFt).toFixed(2));
  const costPerSqM = Number((grandTotalCost / planAreaSqM).toFixed(2));
  const costPerBoardFt = Number((grandTotalCost / boardFeetTotal).toFixed(2));
  const costPerBagInstalled = Number((grandTotalCost / totalBags).toFixed(2));
  const avgRValue = input.targetRValue || (input.targetThicknessInches * 4.0) || 16.0;
  const costPerRValuePointSqFt = Number((costPerSqFt / avgRValue).toFixed(3));

  // 7. LINE ITEMS
  const lineItems: CostLineItem[] = [
    {
      id: 'mat-fiber',
      category: 'Materials',
      name: `Monoglass® Insulation Fiber (${input.fiberColor === 'black' ? 'Black Dyed' : 'Natural White'})`,
      description: `ASTM E84 0/0 non-combustible glass fiber (30 lb bags, ~28 bd ft/bag)`,
      quantity: totalBags,
      unit: 'Bags',
      unitRate: bagUnitPrice,
      totalCost: Math.round(fiberMaterialsCost),
      percentOfSubtotal: Number(((fiberMaterialsCost / directCostSubtotal) * 100).toFixed(1)),
    },
    {
      id: 'mat-adhesive',
      category: 'Materials',
      name: 'Monoglass Adhesive Concentrate',
      description: 'Polymer bonding emulsion (5-gal pails, 1:1 water dilution on-site)',
      quantity: totalAdhesivePails,
      unit: 'Pails (5 gal)',
      unitRate: input.adhesivePailCost,
      totalCost: Math.round(adhesiveMaterialsCost),
      percentOfSubtotal: Number(((adhesiveMaterialsCost / directCostSubtotal) * 100).toFixed(1)),
    },
  ];

  if (totalSonoglazePails > 0) {
    lineItems.push({
      id: 'mat-sono',
      category: 'Materials',
      name: 'Sonoglaze® Polymer Protective Hard-Coat',
      description: 'Impact & washdown protective overspray coat for high-velocity / natatorium zones',
      quantity: totalSonoglazePails,
      unit: 'Pails (5 gal)',
      unitRate: input.sonoglazePailCost,
      totalCost: Math.round(sonoglazeMaterialsCost),
      percentOfSubtotal: Number(((sonoglazeMaterialsCost / directCostSubtotal) * 100).toFixed(1)),
    });
  }

  if (totalPrimerPails > 0) {
    lineItems.push({
      id: 'mat-primer',
      category: 'Materials',
      name: 'Substrate Bonding Primer',
      description: 'Surface primer for challenging or questionable substrate adhesion',
      quantity: totalPrimerPails,
      unit: 'Pails (5 gal)',
      unitRate: input.primerPailCost,
      totalCost: Math.round(primerMaterialsCost),
      percentOfSubtotal: Number(((primerMaterialsCost / directCostSubtotal) * 100).toFixed(1)),
    });
  }

  lineItems.push(
    {
      id: 'prep-masking',
      category: 'Preparation & Masking',
      name: 'Jobsite Protection & Poly Containment Masking',
      description: 'Floor poly, duct/conduit masking tape, overspray containment barriers',
      quantity: effectiveAreaSqFt,
      unit: 'Sq Ft Surface',
      unitRate: input.maskingPolyCostPerSqFt,
      totalCost: maskingSuppliesCost,
      percentOfSubtotal: Number(((maskingSuppliesCost / directCostSubtotal) * 100).toFixed(1)),
    },
    {
      id: 'lab-spray',
      category: 'Labor',
      name: `Certified Applicator Spray & Application Crew (${crewCount}-Man Crew)`,
      description: `Direct spray rig operation, machine feeding, scaffolding movement (${estimatedSprayHours} machine hrs)`,
      quantity: Math.round(estimatedSprayHours * crewCount),
      unit: 'Man-Hours',
      unitRate: input.loadedLaborRatePerHour,
      totalCost: Math.round(estimatedSprayHours * crewCount * input.loadedLaborRatePerHour),
      percentOfSubtotal: Number((((estimatedSprayHours * crewCount * input.loadedLaborRatePerHour) / directCostSubtotal) * 100).toFixed(1)),
    },
    {
      id: 'lab-setup',
      category: 'Labor',
      name: 'Daily Jobsite Rig Setup, Masking & Machine Cleanout Labor',
      description: `Daily setup, hose purging, safety inspections & cleanout (${totalSetupCleanupHours.toFixed(1)} hrs over ${estimatedRigDays} days)`,
      quantity: Math.round(totalSetupCleanupHours * crewCount),
      unit: 'Man-Hours',
      unitRate: input.loadedLaborRatePerHour,
      totalCost: Math.round(totalSetupCleanupHours * crewCount * input.loadedLaborRatePerHour),
      percentOfSubtotal: Number((((totalSetupCleanupHours * crewCount * input.loadedLaborRatePerHour) / directCostSubtotal) * 100).toFixed(1)),
    },
    {
      id: 'eq-rig',
      category: 'Equipment',
      name: 'High-Volume Monoglass Spray Rig & Compressor',
      description: `Pneumatic fiber feeder, high-pressure liquid pumps & delivery hose sets`,
      quantity: estimatedRigDays,
      unit: 'Rig Days',
      unitRate: input.sprayRigDailyRate,
      totalCost: Math.round(rigRentalCost),
      percentOfSubtotal: Number(((rigRentalCost / directCostSubtotal) * 100).toFixed(1)),
    },
    {
      id: 'eq-lift',
      category: 'Equipment',
      name: 'Scissor Lift / Electric Boom Lift Access',
      description: 'Elevated work platform access for ceiling spray & inspection',
      quantity: estimatedRigDays,
      unit: 'Days',
      unitRate: input.liftDailyRate,
      totalCost: Math.round(liftRentalCost),
      percentOfSubtotal: Number(((liftRentalCost / directCostSubtotal) * 100).toFixed(1)),
    },
    {
      id: 'log-freight',
      category: 'Logistics',
      name: 'Material Freight & Palletized Transport',
      description: 'Factory-to-jobsite dedicated freight shipping and offloading allowance',
      quantity: 1,
      unit: 'Lump Sum',
      unitRate: input.freightAndDeliveryCost,
      totalCost: Math.round(input.freightAndDeliveryCost),
      percentOfSubtotal: Number(((input.freightAndDeliveryCost / directCostSubtotal) * 100).toFixed(1)),
    },
    {
      id: 'log-mob',
      category: 'Logistics',
      name: 'Applicator Mobilization & Staging Fee',
      description: 'Crew mobilization, site walkthrough, substrate testing and QA setup',
      quantity: 1,
      unit: 'Lump Sum',
      unitRate: input.mobilizationFee,
      totalCost: Math.round(input.mobilizationFee),
      percentOfSubtotal: Number(((input.mobilizationFee / directCostSubtotal) * 100).toFixed(1)),
    }
  );

  return {
    planAreaSqFt,
    planAreaSqM,
    effectiveAreaSqFt,
    effectiveAreaSqM,
    boardFeetTotal,
    cubicMetersTotal,
    totalBags,
    totalAdhesivePails,
    totalSonoglazePails,
    totalPrimerPails,
    estimatedSprayHours,
    estimatedRigDays,
    totalCrewManHours,

    materialsCost,
    laborCost,
    equipmentCost,
    maskingPrepCost,
    logisticsCost,
    directCostSubtotal,

    contingencyCost,
    overheadProfitCost,
    salesTaxCost,
    grandTotalCost,

    costPerSqFt,
    costPerSqM,
    costPerBoardFt,
    costPerBagInstalled,
    costPerRValuePointSqFt,

    lineItems,
  };
}

/**
 * Storage helpers for Saved Project Cost Summaries
 */
export function getSavedCostEstimates(): SavedProjectCostEstimate[] {
  try {
    const raw = localStorage.getItem(SAVED_COST_ESTIMATES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse saved cost estimates:', err);
  }
  return [];
}

export function saveCostEstimateToStorage(estimate: SavedProjectCostEstimate): SavedProjectCostEstimate[] {
  const existing = getSavedCostEstimates();
  const index = existing.findIndex((e) => e.id === estimate.id);
  let updated: SavedProjectCostEstimate[];
  if (index >= 0) {
    updated = [...existing];
    updated[index] = estimate;
  } else {
    updated = [estimate, ...existing];
  }
  try {
    localStorage.setItem(SAVED_COST_ESTIMATES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save cost estimate to storage:', err);
  }
  return updated;
}

export function deleteSavedCostEstimate(id: string): SavedProjectCostEstimate[] {
  const existing = getSavedCostEstimates();
  const updated = existing.filter((e) => e.id !== id);
  try {
    localStorage.setItem(SAVED_COST_ESTIMATES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to delete cost estimate from storage:', err);
  }
  return updated;
}
