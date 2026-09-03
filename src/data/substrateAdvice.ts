import { SubstrateGuide } from '../types';
import { SUBSTRATE_GUIDES } from './monoglassData';

export interface SubstrateProTip {
  id: string;
  name: string;
  metricName: string;
  category: 'mineral-porous' | 'metal-fluted' | 'structural-steel' | 'gypsum-paper' | 'organic-wood' | 'vitreous-glass';
  categoryLabel: string;
  multiplier: number;
  adhesionRating: string;
  adhesionScoreLbs: number;
  adhesionScoreKpa: number;
  maxSinglePassInches: number;
  maxSinglePassMm: number;
  recommendedDilution: string;
  concentratePerBagGal: number;
  concentratePerBagL: number;
  waterPerBagGal: number;
  waterPerBagL: number;
  atomizationPressurePsi: string;
  sprayStandoffDistance: string;
  optimalSprayAngle: string;
  porosityType: string;
  whyRatioMatters: string;
  applicatorDynamics: string[];
  surfacePrepChecklist: string[];
  primerRequired: boolean;
  primerGuidance: string;
  fieldPitfallsToAvoid: string[];
  fluteAdjustmentExplanation?: string;
  caseStudyRef?: string;
}

export const SUBSTRATE_PRO_TIPS: Record<string, SubstrateProTip> = {
  'flat-concrete': {
    id: 'flat-concrete',
    name: 'Flat Concrete Slab / Post-Tensioned Soffit',
    metricName: 'Dalle de béton plane / Sous-face post-tendue',
    category: 'mineral-porous',
    categoryLabel: 'Porous Mineral Substrate',
    multiplier: 1.0,
    adhesionRating: '> 250 lbs/sq ft (> 12.0 kPa) ASTM E736',
    adhesionScoreLbs: 250,
    adhesionScoreKpa: 12.0,
    maxSinglePassInches: 5.0,
    maxSinglePassMm: 127,
    recommendedDilution: '1:1 by volume with clean potable water',
    concentratePerBagGal: 0.55,
    concentratePerBagL: 2.08,
    waterPerBagGal: 0.55,
    waterPerBagL: 2.08,
    atomizationPressurePsi: '45 – 55 PSI',
    sprayStandoffDistance: '24" – 30" (60 – 75 cm)',
    optimalSprayAngle: '90° perpendicular to slab',
    porosityType: 'High Capillary Suction (Mineral Pores)',
    whyRatioMatters:
      'Concrete is naturally porous and exerts strong capillary suction that pulls moisture out of freshly sprayed slurry. If the adhesive is over-diluted (>1:1), the liquid carrier wicks into concrete pores before the polymer cross-links, starving the fiber matrix of binder. In hot (>80°F / 27°C) or arid conditions, applicators should lightly mist the concrete with diluted adhesive 15–30 seconds prior to spray to satisfy capillary thirst and guarantee maximum tensile bond.',
    applicatorDynamics: [
      'Maintain continuous 90° spray angle to ensure uniform fiber alignment without rebound shadowing.',
      'Can build up to 5.0" (127 mm) / R-20 continuous depth in a single monolithic pass without support pins.',
      'If tamping to a smooth architectural finish, wait 15–25 minutes for initial tack set before roller or trowel contact.',
      'Verify concrete has cured a minimum of 28 days and moisture emissions are within acceptable limits.',
    ],
    surfacePrepChecklist: [
      'Remove all oil-based form-release agents, waxes, and curing compounds using high-pressure wash or degreaser.',
      'Wire-brush or grind away any loose efflorescence, laitances, or honeycombing.',
      'Ensure slab surface temperature is at or above 40°F (4.5°C) and maintained throughout 48h cure cycle.',
      'Surface must be visually dry with no active water leaks, seepage, or condensation puddles.',
    ],
    primerRequired: false,
    primerGuidance:
      'No primer required on clean, unsealed, bare concrete. If concrete is pre-painted, treated with unknown silane/siloxane sealers, or exceptionally smooth steel-troweled, apply Monoglass Water-Based Primer.',
    fieldPitfallsToAvoid: [
      'Never spray over oil-slicked form release areas; petroleum oils destroy polymer cross-linking.',
      'Avoid spraying onto frozen concrete slabs (below 40°F / 4.5°C) where ice crystals prevent binder penetration.',
      'Do not allow ambient heaters to blow hot direct exhaust gases on uncured spray, which causes flash drying.',
    ],
    caseStudyRef: 'Vancouver Cantilevered Plaza Soffit (5.0" R-20 Monolithic)',
  },

  'fluted-metal-1.5': {
    id: 'fluted-metal-1.5',
    name: '1.5" Corrugated Metal Deck (Standard Rib)',
    metricName: 'Bac acier nervuré 38 mm (profil standard)',
    category: 'metal-fluted',
    categoryLabel: 'Smooth Galvanized Profile Deck',
    multiplier: 1.25,
    adhesionRating: '> 200 lbs/sq ft (> 9.6 kPa) ASTM E736',
    adhesionScoreLbs: 200,
    adhesionScoreKpa: 9.6,
    maxSinglePassInches: 5.0,
    maxSinglePassMm: 127,
    recommendedDilution: '1:1 by volume with clean potable water (+25% volume factor)',
    concentratePerBagGal: 0.55,
    concentratePerBagL: 2.08,
    waterPerBagGal: 0.55,
    waterPerBagL: 2.08,
    atomizationPressurePsi: '50 – 60 PSI',
    sprayStandoffDistance: '20" – 26" (50 – 65 cm)',
    optimalSprayAngle: '45° angled upward into high flutes, then 90° across pans',
    porosityType: 'Zero Porosity (Non-Absorbent Galvanized Steel)',
    whyRatioMatters:
      'Galvanized steel has zero porosity, meaning all adhesion relies entirely on the surface tack and polymer cohesion of the acrylic adhesive matrix. Furthermore, 1.5" flutes expand true surface area by +25%. If the adhesive volume is calculated only on flat plan area without the 1.25x flute factor, the high flutes and vertical rib walls will receive inadequate binder, leading to dry fiber fallout and "bridging" across valleys instead of monolithic conformal contact.',
    fluteAdjustmentExplanation:
      'The 1.25x area multiplier automatically scales both your bag count and adhesive concentrate order so every square inch of vertical rib wall receives the certified 0.55 gal/bag binder proportion.',
    applicatorDynamics: [
      'Begin pass by aiming nozzle upward at 45° directly into the upper flutes to coat the top valleys and vertical side ribs first.',
      'Follow with a continuous leveling pass across lower deck pans to achieve uniform planar thickness across the deck profile.',
      'Operate adhesive liquid pump at 50–60 PSI to maintain ultra-fine atomization that wets high flutes without dripping.',
      'Check depth in both the top flute and bottom pan using a calibrated depth pin to verify uniform thermal R-value.',
    ],
    surfacePrepChecklist: [
      'Inspect metal deck for factory mill rolling oils or shipping rust preventatives; solvent-wipe or pressure-wash if present.',
      'Ensure roof membrane installation above is complete and watertight before spraying underside.',
      'Check for condensation on cold steel deck; deck must be dry and tempered to min 40°F (4.5°C).',
      'Remove metal filings, drill shavings, and loose roofing screw burrs.',
    ],
    primerRequired: false,
    primerGuidance:
      'Adheres directly to clean G60/G90 galvanized steel decking without primer. On oily factory decking or aged pre-painted steel decks with alkyd enamel, apply Monoglass Water-Based Primer.',
    fieldPitfallsToAvoid: [
      'Do not spray horizontally across flutes from a distance; this causes dry "bridging" voids behind ribs.',
      'Never spray on cold steel decks experiencing active dew-point sweating or frost buildup.',
      'Avoid running adhesive pump pressure too low (<40 PSI), which results in coarse droplets instead of an enveloping adhesive mist.',
    ],
    caseStudyRef: 'Seattle University Arena Roof Deck (3.0" NRC 1.00 & Thermal)',
  },

  'fluted-metal-3.0': {
    id: 'fluted-metal-3.0',
    name: '3.0" Deep Rib Corrugated Metal Deck',
    metricName: 'Bac acier nervuré profond 75 mm',
    category: 'metal-fluted',
    categoryLabel: 'Deep Flute Non-Porous Profile Deck',
    multiplier: 1.45,
    adhesionRating: '> 200 lbs/sq ft (> 9.6 kPa) ASTM E736',
    adhesionScoreLbs: 200,
    adhesionScoreKpa: 9.6,
    maxSinglePassInches: 5.0,
    maxSinglePassMm: 127,
    recommendedDilution: '1:1 by volume with clean potable water (+45% volume factor)',
    concentratePerBagGal: 0.55,
    concentratePerBagL: 2.08,
    waterPerBagGal: 0.55,
    waterPerBagL: 2.08,
    atomizationPressurePsi: '52 – 62 PSI',
    sprayStandoffDistance: '18" – 24" (45 – 60 cm)',
    optimalSprayAngle: 'Dual-pass angle: 35° into left rib face, 35° into right rib face, then 90°',
    porosityType: 'Zero Porosity with Deep Geometric Shadowing',
    whyRatioMatters:
      'Deep 3.0" ribs produce a massive +45% increase in surface area along with deep geometric shadows. Because the cantilevered mass of wet fiber inside 3" flutes is substantial, the adhesive-to-fiber cohesion must be strictly maintained at 1:1 dilution. An under-bonded mix will cause heavy wet fiber inside deep flutes to sag under gravitational shear stress before initial set occurs.',
    fluteAdjustmentExplanation:
      'A 10,000 sq ft floor plan with 3.0" deep deck equals 14,500 sq ft of actual steel surface. The 1.45x multiplier ensures 45% more adhesive concentrate is on site to coat deep vertical ribs thoroughly.',
    applicatorDynamics: [
      'Utilize a dual-directional sweep: spray left-facing flute walls, reverse sweep for right-facing walls, then finish lower flats.',
      'Hold nozzle slightly closer (18"–24") to overcome airflow turbulence created within deep flute pockets.',
      'Ensure adhesive nozzles surrounding the main fiber stream are completely clear of dry buildup to maintain 360° spray cone.',
      'Allow first 1.5" layer inside deep flutes to grab for 60 seconds if building thick 5.0" assemblies.',
    ],
    surfacePrepChecklist: [
      'Wipe down galvanizing mill oils and degrease factory steel coatings.',
      'Inspect roof fastener penetrations through top flutes; ensure no roof leaks.',
      'Ensure substrate temperature is ≥ 40°F (4.5°C) and air circulation is adequate.',
      'Verify clean access for spray operators to reach high deck flutes without extreme over-reach.',
    ],
    primerRequired: false,
    primerGuidance:
      'Direct monolithic bond to clean galvanized metal deck. If bare steel exhibits light flash oxidation or unknown paint, prime with Monoglass Primer.',
    fieldPitfallsToAvoid: [
      'Never attempt to fill 3.0" flutes with a single high-speed horizontal blast; deep ribs require sweeping angles.',
      'Do not allow overspray to accumulate on unprimed electrical conduits without scheduled masking.',
      'Never skimp on adhesive concentrate volume; under-gluing deep flutes creates delamination risk.',
    ],
    caseStudyRef: 'Burbank Production Soundstage 4 & 5 (2.5" Monoglass Black)',
  },

  'open-web-joists': {
    id: 'open-web-joists',
    name: 'Exposed Steel Bar Joists & Decking',
    metricName: 'Poutrelles ajourées en acier et platelage',
    category: 'structural-steel',
    categoryLabel: 'Structural Steel Complex 3D Geometry',
    multiplier: 1.35,
    adhesionRating: '> 200 lbs/sq ft (> 9.6 kPa) ASTM E736',
    adhesionScoreLbs: 200,
    adhesionScoreKpa: 9.6,
    maxSinglePassInches: 4.0,
    maxSinglePassMm: 100,
    recommendedDilution: '1:1 by volume with clean potable water (+35% area factor)',
    concentratePerBagGal: 0.55,
    concentratePerBagL: 2.08,
    waterPerBagGal: 0.55,
    waterPerBagL: 2.08,
    atomizationPressurePsi: '45 – 55 PSI',
    sprayStandoffDistance: '20" – 28" (50 – 70 cm)',
    optimalSprayAngle: 'Tri-directional wrap: 45° left, 45° right, 90° bottom chord',
    porosityType: 'Non-Porous Primed / Structural Steel Geometry',
    whyRatioMatters:
      'Open-web steel joists present narrow structural angles (top and bottom chords, round web bars, and bridging angles) surrounded by open air. Airflow from the spray gun tends to blow dry fiber around narrow steel members. A precise 1:1 adhesive dilution with fine atomization creates a high-tack spray stream that instantly wraps and clings around steel edges without dry overspray blow-by.',
    fluteAdjustmentExplanation:
      'The 1.35x multiplier accounts for all 4 sides of angle iron chords, web bars, gusset plates, and overlapping deck flanges.',
    applicatorDynamics: [
      'Execute a 3-pass wrap technique around each bar joist panel point to envelop web bars on all 360° sides.',
      'Maintain steady trigger cadence to avoid heavy buildup in joist bearing seats.',
      'Ensure atomization ring nozzles are aimed inward to encapsulate fiber stream before it hits narrow steel chords.',
      'Coordinate with MEP trades to ensure fire dampers and sprinkler head deflectors remain cleanly masked.',
    ],
    surfacePrepChecklist: [
      'Scrape off loose mill scale, weld slag, and heavy rust flakes with wire brush.',
      'Check compatibility of structural shop primer (zinc chromate, epoxy, or waterborne acrylic primers).',
      'Remove oil, grease, or diesel soot from construction equipment exhaust.',
      'Ensure joist steel temperature is ≥ 40°F (4.5°C).',
    ],
    primerRequired: false,
    primerGuidance:
      'Bonds directly over standard standard red-oxide or gray shop primers and galvanized chords. If shop primer is chalking or failing, apply Monoglass Primer.',
    fieldPitfallsToAvoid: [
      'Avoid single-direction spraying which leaves uninsulated "shadow strips" on the backside of joist angles.',
      'Do not coat sprinkler pipe heads, fire alarm strobes, or electrical disconnects.',
      'Never use low air pressure that produces heavy wet clumps on narrow truss webs.',
    ],
    caseStudyRef: 'Whistler Mountain Peak Maintenance Hangar (4.0" Thermal Envelope)',
  },

  'gypsum-ceiling': {
    id: 'gypsum-ceiling',
    name: 'Gypsum Board & Plaster Ceilings',
    metricName: 'Plafond en plaques de plâtre / Enduit',
    category: 'gypsum-paper',
    categoryLabel: 'Absorbent Paper Face / Drywall Assembly',
    multiplier: 1.0,
    adhesionRating: '> 180 lbs/sq ft (> 8.6 kPa) ASTM E736',
    adhesionScoreLbs: 180,
    adhesionScoreKpa: 8.6,
    maxSinglePassInches: 3.0,
    maxSinglePassMm: 75,
    recommendedDilution: '1:1 by volume with clean potable water (Pre-Spray mandatory)',
    concentratePerBagGal: 0.55,
    concentratePerBagL: 2.08,
    waterPerBagGal: 0.55,
    waterPerBagL: 2.08,
    atomizationPressurePsi: '55 – 65 PSI',
    sprayStandoffDistance: '24" – 32" (60 – 80 cm)',
    optimalSprayAngle: '90° perpendicular with rapid sweeping passes',
    porosityType: 'Cellulose Paper Face Vulnerable to Over-Saturation',
    whyRatioMatters:
      'Drywall presents a unique challenge: the cellulose paper facing will absorb water rapidly, but if over-saturated with excess water, the paper can delaminate from the gypsum core, compromising structural ceiling integrity. Conversely, if under-glued, dry fibers will shed. The solution is applying a mandatory PVA primer or Monoglass Adhesive Pre-Spray to seal and reinforce the paper fibers, followed by controlled 1:1 slurry application limited to 3.0" (75 mm) single-pass depth.',
    applicatorDynamics: [
      'Apply an initial light pre-spray mist of Monoglass adhesive 60 seconds prior to main fiber application.',
      'Limit single-pass depth to maximum 3.0" (75 mm) / R-12 to prevent excessive wet dead-load on suspended drywall grids.',
      'Use high atomization pressure (55–65 PSI) for a feather-light spray pattern that distributes moisture evenly.',
      'If specified for acoustic theater ceilings, hand-tamp or leave natural texture for high NRC absorption.',
    ],
    surfacePrepChecklist: [
      'Ensure drywall screws are countersunk and board is securely fastened to framing on 16" or 24" centers.',
      'Tape and mud joints to standard Level 2 or Level 3 finish; wipe off excess joint compound dust.',
      'Ensure drywall is dry, structurally sound, and free of sagging or previous water damage.',
      'Room ambient temperature must be maintained above 50°F (10°C) with good ventilation for drywall safety.',
    ],
    primerRequired: true,
    primerGuidance:
      'MANDATORY: Apply standard quality PVA primer / sealer or a dedicated Monoglass Adhesive pre-mist coat to lock the drywall paper facing before applying fiber.',
    fieldPitfallsToAvoid: [
      'NEVER apply without priming; raw drywall paper wicks water and risks paper delamination from the gypsum core.',
      'Do not exceed 3.0" single pass on drywall ceilings to prevent overloaded drywall fasteners.',
      'Avoid poor ventilation in enclosed rooms which prolongs drying time and stresses paper facing.',
    ],
    caseStudyRef: 'Bellevue Performing Arts Theatre (2.5" NRC 0.95 Acoustic)',
  },
};

export const ALL_SUBSTRATE_KEYS = Object.keys(SUBSTRATE_PRO_TIPS);

export function getSubstrateProTip(key: string): SubstrateProTip {
  return SUBSTRATE_PRO_TIPS[key] || SUBSTRATE_PRO_TIPS['flat-concrete'];
}
