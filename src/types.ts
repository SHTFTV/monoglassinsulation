export interface AstmTestRecord {
  standard: string;
  title: string;
  result: string;
  ratingCategory: string;
  industrySignificance: string;
}

export interface AcousticFrequencyData {
  thickness: string;
  thicknessMm: number;
  freq125: number;
  freq250: number;
  freq500: number;
  freq1000: number;
  freq2000: number;
  freq4000: number;
  nrc: number;
  mounting: string;
}

export interface SubstrateGuide {
  name: string;
  suitable: boolean;
  surfacePrep: string;
  primerRequired: boolean;
  primerNotes?: string;
  adhesionNotes: string;
  recommendedMaxSinglePass: string;
}

export interface Contractor {
  id: string;
  name: string;
  companyName: string;
  city: string;
  stateOrProvince: string;
  country: 'USA' | 'Canada' | 'International';
  zipPostal: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  phone: string;
  email: string;
  website: string;
  certifiedSinceYear: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  specialties: ('Parking Garages' | 'Acoustics & Theaters' | 'Commercial High-Rise' | 'Arenas & Ice Rinks' | 'Mechanical Rooms' | 'Industrial & Retrofit')[];
  regionsServed: string[];
  description: string;
  representativeProjects: string[];
  equipmentFleet: string[];
}

export interface CaseStudyImage {
  url: string;
  caption: string;
  stage: 'Finished Surface' | 'In-Progress Spray' | 'Substrate Prep' | 'Detail View' | 'Before / Uninsulated';
}

export interface CaseStudyBeforeAfter {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel: string;
  afterLabel: string;
  description: string;
}

export type BuildingCategory =
  | 'all'
  | 'commercial'
  | 'industrial'
  | 'recreational'
  | 'acoustic'
  | 'parking'
  | 'institutional'
  | 'user-submitted';

export interface CaseStudy {
  id: string;
  title: string;
  location: string;
  category: 'commercial' | 'industrial' | 'recreational' | 'acoustic' | 'parking' | 'institutional' | 'user-submitted';
  facilityType: string;
  squareFootage: number;
  thicknessApplied: string;
  thicknessInches?: number;
  rValueAchieved: string;
  rValueNum?: number;
  nrcAchieved: string;
  nrcNum?: number;
  finishType: string;
  substrate: string;
  yearCompleted?: number;
  architectOrEngineer?: string;
  contractorName?: string;
  contractorCompany?: string;
  submitterEmail?: string;
  submitterRole?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  submittedAt?: string;
  jobsiteNotes?: string;
  verifiedBadge?: boolean;
  challenge: string;
  solution: string;
  results: string[];
  keyFeatures?: string[];
  imageUrl?: string;
  images?: CaseStudyImage[];
  beforeAfter?: CaseStudyBeforeAfter;
  energySavingsOrDecibelDrop?: string;
  csiSection?: string;
}

export interface ComparisonProduct {
  name: string;
  materialType: string;
  rValuePerInch: string;
  flameSpreadIndex: string;
  smokeDevelopedIndex: string;
  nonCombustible: boolean;
  maxSinglePassThickness: string;
  typicalBondStrength: string;
  moistureMoldResistance: string;
  colorOptions: string;
  airErosionRating: string;
  installedCostTier: '$' | '$$' | '$$$' | '$$$$';
  pros: string[];
  cons: string[];
}

export interface QuoteRequest {
  fullName: string;
  company: string;
  role: 'Architect' | 'General Contractor' | 'Building Owner' | 'Insulation Contractor' | 'Facility Manager' | 'Other';
  email: string;
  phone: string;
  projectName: string;
  projectCity: string;
  projectState: string;
  projectZip: string;
  squareFootage: number;
  targetThicknessOrRValue: string;
  substrateType: string;
  applicationType: string;
  timeline: string;
  siteConditions?: string;
  notes: string;
}

export interface ContractorRegistration {
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  website: string;
  city: string;
  stateProvince: string;
  country: 'USA' | 'Canada' | 'International';
  yearsExperience: number;
  isMonoglassCertified: boolean;
  specialties: string[];
  statesCovered: string;
  crewCount: number;
  notes: string;
}

export interface ProjectSitePhoto {
  id: string;
  dataUrl: string; // Base64 data URL (compressed)
  thumbnailUrl?: string;
  caption: string;
  category: 'existing-substrate' | 'mep-obstructions' | 'access-staging' | 'completed-spray' | 'substrate-defect' | 'general-site';
  timestamp: string; // ISO string
  fileName?: string;
  fileSizeKb: number;
  roomRefId?: string; // ID of specific room or 'project-level'
  roomName?: string;
  dimensions?: { width: number; height: number };
}

export interface ProjectRoomItem {
  id: string;
  name: string;
  planArea: number; // in current active unit system (sq ft or sq m)
  substrateType: string; // 'flat-concrete' | 'fluted-metal-1.5' | 'fluted-metal-3.0' | 'open-web-joists' | 'gypsum-ceiling'
  targetMode: 'thermal' | 'thickness';
  targetRValue: number;
  targetThicknessInches: number;
  finishType: 'Natural White' | 'Monoglass Black' | 'Tamped Smooth' | 'Sonoglaze Hard-Coat';
  wastagePercent: number; // e.g. 5, 8, 10, 15
  ceilingHeightFt?: number;
  siteConditionNotes?: string;
  sitePhotos?: ProjectSitePhoto[];
  enabled: boolean;
}

export type ProjectArchiveStatus = 'completed' | 'abandoned' | 'on-hold' | 'won-bid';

export interface ArchivedProject {
  id: string;
  originalProjectId: string;
  name: string;
  projectType: string;
  location?: string;
  clientOrArchitect?: string;
  unitSystem: 'imperial' | 'metric';
  status: ProjectArchiveStatus;
  archiveReason?: string;
  archiveNotes?: string;
  archivedAt: string; // ISO timestamp
  lastUpdated?: string;
  finalContractValue?: number;
  totalPlanArea: number;
  totalEffectiveArea: number;
  roomCount: number;
  totalBagsFiber: number;
  totalAdhesivePails: number;
  totalSonoglazePails: number;
  blendedRValue: number;
  blendedNrc: number;
  projectData: MultiRoomProject;
  costEstimateData?: SavedProjectCostEstimate;
}

export interface MultiRoomProject {
  id: string;
  name: string;
  projectType: string;
  location?: string;
  clientOrArchitect?: string;
  unitSystem: 'imperial' | 'metric';
  rooms: ProjectRoomItem[];
  sitePhotos?: ProjectSitePhoto[];
  notes?: string;
  status?: 'active' | 'completed' | 'abandoned' | 'on-hold' | 'won-bid';
  archiveReason?: string;
  archivedAt?: string;
  archiveNotes?: string;
  finalContractValue?: number;
  costEstimate?: SavedProjectCostEstimate;
  lastUpdated: string;
}

export interface RoomBomLine {
  room: ProjectRoomItem;
  effectiveAreaSqFt: number;
  effectiveAreaSqM: number;
  thicknessInches: number;
  thicknessMm: number;
  rValue: number;
  rsi: number;
  nrc: number;
  boardFeet: number;
  cubicMeters: number;
  bags: number;
  adhesiveGallons: number;
  sonoglazeGallons: number;
  deadLoadLbs: number;
  deadLoadKg: number;
  sprayHours: number;
}

export interface ConsolidatedBom {
  totalPlanAreaSqFt: number;
  totalPlanAreaSqM: number;
  totalEffectiveAreaSqFt: number;
  totalEffectiveAreaSqM: number;
  totalBagsFiber: number;
  totalFiberWeightLbs: number;
  totalFiberWeightKg: number;
  totalAdhesiveConcentrateGallons: number;
  totalAdhesiveConcentrateLiters: number;
  totalAdhesivePails: number;
  totalWaterGallons: number;
  totalSonoglazeGallons: number;
  totalSonoglazePails: number;
  blendedRValue: number;
  blendedRsi: number;
  blendedNrc: number;
  totalDeadLoadLbs: number;
  totalDeadLoadKg: number;
  totalDeadLoadTonnes: number;
  totalSprayHours: number;
  totalRigDays: number;
  estimatedMaterialCostLow: number;
  estimatedMaterialCostHigh: number;
  estimatedTurnkeyCostLow: number;
  estimatedTurnkeyCostHigh: number;
  roomBreakdowns: RoomBomLine[];
}

export interface CalculationResult {
  squareFootage: number;
  effectiveArea: number;
  thicknessInches: number;
  thicknessMm: number;
  rValue: number;
  nrcEstimate: number;
  bagsRequired: number;
  adhesiveGallonsRequired: number;
  weightPerSqFtLbs: number;
  totalWeightLbs: number;
  dewPointCondensationRisk: 'Low / Protected' | 'Moderate' | 'High (Vapor Retarder Needed)';
  recommendedPasses: number;
  estimatedSprayHours: number;
}

export type WatermarkPreset =
  | 'AUTO'
  | 'DRAFT - FOR REFERENCE ONLY'
  | 'PROJECT ESTIMATE'
  | 'PRELIMINARY SUBMITTAL'
  | 'NOT FOR CONSTRUCTION'
  | 'CONFIDENTIAL'
  | 'APPROVED BASIS OF DESIGN'
  | 'CUSTOM'
  | 'NONE';

export interface PdfWatermarkOptions {
  preset: WatermarkPreset;
  customText?: string;
  enabled?: boolean;
  opacity?: number;
  color?: [number, number, number];
}

export type FaqCategoryType =
  | 'Installation Best Practices'
  | 'Substrate Requirements & Prep'
  | 'Thermal & Energy Codes'
  | 'Acoustics & Sound Control'
  | 'Fire Ratings & Safety'
  | 'Moisture & Swimming Pools'
  | 'Finishes, Coatings & Maintenance';

export interface FaqItem {
  id: string;
  category: FaqCategoryType;
  question: string;
  shortAnswer: string;
  detailedAnswer: string;
  keyPoints: string[];
  applicableStandards?: string[];
  relatedSpecs?: string[];
  tags: string[];
  difficulty?: 'Essential' | 'Advanced' | 'Contractor Pro';
}

export type ScheduleSubstrateType =
  | 'flat-concrete'
  | 'fluted-metal-1.5'
  | 'fluted-metal-3.0'
  | 'open-web-joists'
  | 'wood-framing'
  | 'curved-vaulted';

export type ScheduleAccessType =
  | 'ground-scaffold'
  | 'scissor-lift'
  | 'boom-lift'
  | 'highbay-swing-stage';

export type ScheduleMepDensity = 'low' | 'moderate' | 'high';
export type ScheduleMaskingLevel = 'minimal' | 'standard' | 'critical';
export type ScheduleShiftType = 'standard-8h' | 'extended-10h' | 'double-shift';
export type ScheduleAmbientClimate = 'ideal' | 'cold-unheated' | 'high-humidity';

export interface ScheduleInput {
  projectName: string;
  targetArea: number;
  unitSystem: 'imperial' | 'metric';
  targetThicknessInches: number;
  substrateType: ScheduleSubstrateType;
  ceilingHeightFt: number;
  accessEquipment: ScheduleAccessType;
  mepDensity: ScheduleMepDensity;
  maskingLevel: ScheduleMaskingLevel;
  primerRequired: boolean;
  finishType: 'Natural White' | 'Monoglass Black' | 'Tamped Smooth' | 'Sonoglaze Hard-Coat';
  ambientCondition: ScheduleAmbientClimate;
  crewCount: number; // 1, 2, 3, 4
  shiftType: ScheduleShiftType;
  workDaysPerWeek: 5 | 6 | 7;
  startDate: string;
}

export interface SchedulePhase {
  id: string;
  name: string;
  phaseCategory: 'prep' | 'primer' | 'spray' | 'finish' | 'cure' | 'inspection';
  startDay: number;
  durationDays: number;
  endDay: number;
  crewManHours: number;
  description: string;
  deliverables: string[];
  color: string;
}

export interface ScheduleEstimateResult {
  totalCalendarDays: number;
  totalWorkingDays: number;
  totalSprayDays: number;
  totalPrepDays: number;
  totalCureDays: number;
  totalCrewManHours: number;
  dailyProductionSqFt: number;
  dailyProductionBoardFt: number;
  boardFeetTotal: number;
  effectiveAreaSqFt: number;
  estimatedBags: number;
  estimatedAdhesivePails: number;
  estimatedSonoglazePails?: number;
  estimatedTruckloads: number;
  subsequentTradeReEntryDay: number;
  calculatedEndDate: string;
  tradeReEntryDate: string;
  phases: SchedulePhase[];
  criticalPathNotes: string[];
  weatherAdvisories: string[];
  crewRecommendations: string[];
  equipmentRequirements: { item: string; quantity: string; notes: string }[];
}

export interface SchedulePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  defaults: Partial<ScheduleInput>;
}

// Project Timeline Calendar Types
export type TimelineEventCategory = 'milestone' | 'delivery' | 'labor' | 'cure' | 'inspection' | 'custom';
export type TimelineEventPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TimelineCalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD for multi-day spans
  category: TimelineEventCategory;
  priority: TimelineEventPriority;
  description: string;
  color: string;
  badge?: string;
  details?: {
    quantity?: string;
    crewSize?: number;
    deliverables?: string[];
    notes?: string;
    location?: string;
    specRef?: string;
    tradeAction?: string;
    contact?: string;
  };
  isCustom?: boolean;
  completed?: boolean;
}

// Cost Estimator Types
export interface RegionalLaborPreset {
  id: string;
  name: string;
  region: string;
  currency: string;
  baseHourlyRate: number;
  burdenPercentage: number;
  loadedHourlyRate: number;
  defaultCrewSize: number;
  unionStatus: 'Union / Prevailing Wage' | 'Open Shop / Non-Union' | 'Standard Commercial';
  notes: string;
}

export interface CostLineItem {
  id: string;
  category: 'Materials' | 'Labor' | 'Equipment' | 'Preparation & Masking' | 'Logistics' | 'Markup & Fees';
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitRate: number;
  totalCost: number;
  percentOfSubtotal: number;
}

export interface CostEstimatorInput {
  projectName: string;
  clientOrArchitect?: string;
  location?: string;
  unitSystem: 'imperial' | 'metric';
  // Area scope
  planArea: number; // sq ft or sq m
  effectiveArea: number;
  targetThicknessInches: number;
  targetRValue: number;
  substrateType: string;
  finishType: 'Natural White' | 'Monoglass Black' | 'Tamped Smooth' | 'Sonoglaze Hard-Coat';
  wastagePercent: number;
  primerRequired: boolean;
  
  // Material rates ($ / unit)
  fiberBagCost: number; // $ per 30 lb bag
  fiberColor: 'white' | 'black';
  adhesivePailCost: number; // $ per 5-gal pail
  sonoglazePailCost: number; // $ per 5-gal pail
  primerPailCost: number; // $ per 5-gal pail
  maskingPolyCostPerSqFt: number; // $ per sq ft protection

  // Labor rates ($ / hr)
  selectedRegionId: string;
  loadedLaborRatePerHour: number; // $ / man-hour loaded
  crewSize: number; // number of workers (2, 3, 4)
  productionRateBdFtPerHour: number; // Board feet sprayed per machine hour
  setupCleanupHoursPerDay: number; // hours per crew per day for prep/clean

  // Equipment & logistics ($)
  sprayRigDailyRate: number;
  liftDailyRate: number;
  freightAndDeliveryCost: number;
  mobilizationFee: number;

  // Markups & Taxes (%)
  overheadProfitPercent: number;
  contingencyPercent: number;
  salesTaxPercent: number;
}

export interface CostEstimatorResult {
  // Quantities
  planAreaSqFt: number;
  planAreaSqM: number;
  effectiveAreaSqFt: number;
  effectiveAreaSqM: number;
  boardFeetTotal: number;
  cubicMetersTotal: number;
  totalBags: number;
  totalAdhesivePails: number;
  totalSonoglazePails: number;
  totalPrimerPails: number;
  estimatedSprayHours: number;
  estimatedRigDays: number;
  totalCrewManHours: number;

  // Cost Aggregations
  materialsCost: number;
  laborCost: number;
  equipmentCost: number;
  maskingPrepCost: number;
  logisticsCost: number;
  directCostSubtotal: number;

  contingencyCost: number;
  overheadProfitCost: number;
  salesTaxCost: number;
  grandTotalCost: number;

  // Unit Metrics
  costPerSqFt: number;
  costPerSqM: number;
  costPerBoardFt: number;
  costPerBagInstalled: number;
  costPerRValuePointSqFt: number;

  // Itemized line items
  lineItems: CostLineItem[];
}

export interface SavedProjectCostEstimate {
  id: string;
  name: string;
  projectName: string;
  projectId?: string;
  timestamp: string;
  unitSystem: 'imperial' | 'metric';
  totalPlanArea: number;
  totalEffectiveArea: number;
  thickness: string;
  rValue: string;
  finishType: string;
  substrateType: string;
  totalBags: number;
  totalAdhesivePails: number;
  totalSonoglazePails: number;
  laborRatePreset: string;
  loadedHourlyRate: number;
  crewSize: number;
  fiberBagPrice: number;
  adhesivePailPrice: number;
  sonoglazePailPrice: number;
  overheadProfitPercent: number;
  contingencyPercent: number;
  
  // Financial metrics
  materialsTotal: number;
  laborTotal: number;
  equipmentTotal: number;
  directCostSubtotal: number;
  grandTotal: number;
  costPerSqFt: number;
  costPerSqM: number;
  costPerBoardFt: number;
  
  lineItems: CostLineItem[];
  roomsBreakdown?: Array<{
    id: string;
    name: string;
    area: number;
    thickness: string;
    rValue: string;
    finish: string;
    bags: number;
    adhesivePails: number;
    sonoglazePails: number;
    estimatedCost: number;
    costPerSqFt: number;
  }>;
  sitePhotos?: ProjectSitePhoto[];
  notes?: string;
}

export type SampleKitType =
  | 'architect-master'
  | 'acoustic-studio'
  | 'thermal-parkade'
  | 'sonoglaze-natatorium'
  | 'custom-selection';

export interface SampleKitSpecimen {
  id: string;
  name: string;
  finish: 'Monoglass White' | 'Monoglass Black' | 'Tamped Smooth White' | 'Sonoglaze Hard-Coat' | 'Bonding Primer Puck';
  thickness: string;
  substrate: string;
  targetApplication: string;
}

export interface MaterialSampleRequest {
  id: string;
  trackingNumber: string;
  requestDate: string; // ISO date string
  status: 'Received' | 'Assembling Kit' | 'Dispatched via Express' | 'Delivered';
  kitType: SampleKitType;
  kitTitle: string;
  requestedSpecimens: string[];
  includePhysicalBinders: boolean; // CSI 07 21 29 binder + test reports
  includeUsbDrive: boolean; // CAD/BIM details & test submittal bundle
  
  // Project Info
  projectName: string;
  projectCity: string;
  projectStateOrProvince: string;
  projectType: string;
  estimatedSqFt?: number;
  
  // Recipient / Shipping Contact
  recipientName: string;
  companyOrFirm: string;
  role: 'Architect / Specifier' | 'General Contractor' | 'Acoustic Consultant' | 'Building Owner / Developer' | 'Insulation Contractor' | 'Other';
  email: string;
  phone: string;
  streetAddress: string;
  suiteOrApt?: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: 'USA' | 'Canada' | 'International';
  shippingNotes?: string;
  urgency: 'Standard Ground (3-5 days)' | 'Priority Express (1-2 days)' | 'Urgent Bid Submittal (Next Day)';
}


