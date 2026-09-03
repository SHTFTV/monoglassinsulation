import { MultiRoomProject, ConsolidatedBom } from '../types';
import { SUBSTRATE_PROFILES } from './estimatorUtils';

export interface TenderSummaryOptions {
  includeCsiSpecs?: boolean;
  includeInstallationGuidelines?: boolean;
  includeQaChecklist?: boolean;
  contractorName?: string;
  tenderReferenceNumber?: string;
  bidSubmissionDeadline?: string;
}

/**
 * Generates an engineering-grade "Site Conditions and Specification Summary"
 * plain text document specifically formatted for inclusion in formal tender documents,
 * RFP attachments, specification addenda, and subcontractor bid packages.
 */
export function generateTenderSummaryText(
  project: MultiRoomProject,
  bom: ConsolidatedBom,
  options: TenderSummaryOptions = {}
): string {
  const isMetric = project.unitSystem === 'metric';
  const unitArea = isMetric ? 'm²' : 'sq ft';
  const unitThickness = isMetric ? 'mm' : 'in';
  const unitWeight = isMetric ? 'kg' : 'lbs';
  const activeRooms = project.rooms.filter((r) => r.enabled);
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const dividerDouble = '='.repeat(78);
  const dividerSingle = '-'.repeat(78);
  const dividerSub = '~'.repeat(78);

  const lines: string[] = [];

  // 1. FORMAL DOCUMENT HEADER
  lines.push(dividerDouble);
  lines.push('MONOGLASS® SPRAYED THERMAL & ACOUSTICAL GLASS FIBER INSULATION');
  lines.push('SITE CONDITIONS, SUBSTRATE ASSUMPTIONS & SPECIFICATION SUMMARY');
  lines.push('TECHNICAL ADDENDUM FOR FORMAL TENDER & BID SOLICITATION DOCUMENTS');
  lines.push(dividerDouble);
  lines.push('');

  // 2. PROJECT IDENTIFICATION & METADATA
  lines.push('1. PROJECT IDENTIFICATION & TENDER REFERENCE');
  lines.push(dividerSingle);
  lines.push(`Project Name:             ${project.name || 'Untitled Project'}`);
  lines.push(`Facility / Building Type: ${project.projectType || 'Commercial / Mixed-Use'}`);
  lines.push(`Jobsite Location:         ${project.location || 'Not Specified'}`);
  lines.push(`Architect / Engineer:     ${project.clientOrArchitect || 'Not Specified'}`);
  if (options.tenderReferenceNumber) {
    lines.push(`Tender / RFP Ref #:       ${options.tenderReferenceNumber}`);
  }
  if (options.contractorName) {
    lines.push(`Preparing Contractor:     ${options.contractorName}`);
  }
  if (options.bidSubmissionDeadline) {
    lines.push(`Bid Closing Date:         ${options.bidSubmissionDeadline}`);
  }
  lines.push(`Document Generated:       ${dateFormatted} at ${timeFormatted}`);
  lines.push(`Measurement Standard:     ${isMetric ? 'Metric (SI - m², mm, RSI)' : 'Imperial (US Customary - sq ft, in, R-Value)'}`);
  lines.push(`Specification Sections:   CSI MasterFormat™ 07 21 29 (Sprayed Insulation)`);
  lines.push(`                          CSI MasterFormat™ 09 81 00 (Acoustical Insulation)`);
  lines.push('');

  // 3. EXECUTIVE PROJECT SCOPE & CONSOLIDATED BILL OF QUANTITIES
  lines.push('2. CONSOLIDATED SCOPE & SUMMARY BILL OF QUANTITIES (BOQ)');
  lines.push(dividerSingle);
  lines.push(`Total Active Zones/Rooms: ${activeRooms.length} distinct project areas`);
  lines.push(`Total Plan Footprint:     ${isMetric ? `${bom.totalPlanAreaSqM.toLocaleString()} m²` : `${bom.totalPlanAreaSqFt.toLocaleString()} sq ft`}`);
  lines.push(`Total Effective Surface:  ${isMetric ? `${bom.totalEffectiveAreaSqM.toLocaleString()} m²` : `${bom.totalEffectiveAreaSqFt.toLocaleString()} sq ft`} (accounts for corrugations & profiles)`);
  lines.push(`Blended Thermal Rating:   ${isMetric ? `RSI ${bom.blendedRsi.toFixed(2)} (${(bom.blendedRValue).toFixed(1)} R-Value eq)` : `R-${bom.blendedRValue.toFixed(1)} (RSI ${bom.blendedRsi.toFixed(2)})`}`);
  lines.push(`Blended Acoustic Rating:  NRC ${bom.blendedNrc.toFixed(2)} (ASTM C423 Reverberation Room Test)`);
  lines.push(`Monoglass White Fiber:    ${bom.totalBagsFiber.toLocaleString()} bags (30 lbs / 13.6 kg per bag)`);
  lines.push(`Dry Fiber Mass:           ${isMetric ? `${bom.totalFiberWeightKg.toLocaleString()} kg (${(bom.totalFiberWeightKg / 1000).toFixed(2)} tonnes)` : `${bom.totalFiberWeightLbs.toLocaleString()} lbs (${(bom.totalFiberWeightLbs / 2000).toFixed(2)} short tons)`}`);
  lines.push(`Adhesive Concentrate:     ${bom.totalAdhesivePails.toLocaleString()} pails (${bom.totalAdhesiveConcentrateGallons} gal / ${bom.totalAdhesiveConcentrateLiters} L) [5-gal pails]`);
  lines.push(`Adhesive Dilution Ratio:  1:1 with clean potable water (${bom.totalWaterGallons} gal water required)`);
  if (bom.totalSonoglazeGallons > 0) {
    lines.push(`Sonoglaze Hard-Coat:      ${bom.totalSonoglazePails.toLocaleString()} pails (${bom.totalSonoglazeGallons} gal) for high-abuse / natatorium zones`);
  } else {
    lines.push(`Sonoglaze Protective Top: None specified (standard monolithic textured finish)`);
  }
  lines.push(`Dead Load Imposed:        ${isMetric ? `${bom.totalDeadLoadTonnes} metric tonnes (${bom.totalDeadLoadKg.toLocaleString()} kg)` : `${bom.totalDeadLoadLbs.toLocaleString()} lbs dry applied mass`}`);
  lines.push(`Estimated Machine Hours:  ~${bom.totalSprayHours} spray hours (~${bom.totalRigDays} standard 8-hr rig shifts)`);
  lines.push('');

  // 4. DETAILED ITEMIZED BREAKDOWN BY ZONE / ROOM
  lines.push('3. ITEMIZED SCHEDULE OF AREAS, SUBSTRATES & SPECIFIED RATINGS');
  lines.push(dividerSingle);

  if (activeRooms.length === 0) {
    lines.push('No active rooms enabled in this takeoff schedule.');
  } else {
    activeRooms.forEach((room, idx) => {
      const line = bom.roomBreakdowns.find((b) => b.room.id === room.id);
      const subProfile = SUBSTRATE_PROFILES[room.substrateType] || SUBSTRATE_PROFILES['flat-concrete'];
      const planAreaStr = isMetric
        ? `${room.planArea.toLocaleString()} m²`
        : `${room.planArea.toLocaleString()} sq ft`;
      const effAreaStr = line
        ? (isMetric ? `${line.effectiveAreaSqM.toLocaleString()} m²` : `${line.effectiveAreaSqFt.toLocaleString()} sq ft`)
        : 'N/A';
      const thickStr = line
        ? (isMetric ? `${line.thicknessMm} mm (${line.thicknessInches.toFixed(2)} in)` : `${line.thicknessInches.toFixed(2)} in (${line.thicknessMm} mm)`)
        : (isMetric ? `${Math.round(room.targetThicknessInches * 25.4)} mm` : `${room.targetThicknessInches} in`);
      const rValStr = line
        ? (isMetric ? `RSI ${line.rsi.toFixed(2)} (R-${line.rValue.toFixed(1)})` : `R-${line.rValue.toFixed(1)} (RSI ${line.rsi.toFixed(2)})`)
        : (room.targetMode === 'thermal' ? `R-${room.targetRValue}` : `${room.targetThicknessInches}" thick`);
      const nrcStr = line ? `NRC ${line.nrc.toFixed(2)}` : 'NRC 0.85';
      const bagsStr = line ? `${line.bags.toLocaleString()} bags` : '—';
      const adhStr = line ? `${line.adhesiveGallons} gal` : '—';

      lines.push(`ZONE ${idx + 1}: ${room.name.toUpperCase()}`);
      lines.push(`  • Substrate Type:           ${subProfile.name} (Surface Flute Multiplier: ${subProfile.multiplier}x)`);
      lines.push(`  • Plan Footprint Area:      ${planAreaStr}`);
      lines.push(`  • Effective Spray Surface:  ${effAreaStr} (including corrugations & flute profiles)`);
      lines.push(`  • Specified Target Rating:  ${rValStr} | ${nrcStr}`);
      lines.push(`  • Installed Thickness:      ${thickStr}`);
      lines.push(`  • Surface Finish / Color:   ${room.finishType}`);
      lines.push(`  • Wastage / Overspray:      ${room.wastagePercent}% allowance`);
      if (room.ceilingHeightFt) {
        const heightM = (room.ceilingHeightFt * 0.3048).toFixed(1);
        lines.push(`  • Deck / Ceiling Height:    ${room.ceilingHeightFt} ft (${heightM} m) AFF`);
      }
      lines.push(`  • Material Allocation:      ${bagsStr} fiber | ${adhStr} adhesive concentrate`);
      if (line && line.sonoglazeGallons > 0) {
        lines.push(`  • Sonoglaze Hard-Coat:      ${line.sonoglazeGallons} gallons (coverage @ 75 sq ft/gal)`);
      }
      if (room.siteConditionNotes && room.siteConditionNotes.trim()) {
        lines.push(`  • Site Notes & Conditions:  ${room.siteConditionNotes.trim()}`);
      } else {
        lines.push(`  • Site Notes & Conditions:  Standard dry interior conditions; clean dry substrate assumed.`);
      }
      lines.push('');
    });
  }

  // 5. SUBSTRATE ASSUMPTIONS & PRE-INSTALLATION SITE REQUIREMENTS
  lines.push('4. SUBSTRATE ASSUMPTIONS & MANDATORY JOBSITE PRECONDITIONS');
  lines.push(dividerSingle);
  lines.push('The quantities and installation assumptions summarized herein are predicated upon the');
  lines.push('following mandatory site prerequisites in accordance with Monoglass Manufacturer');
  lines.push('Specifications and AWCI Technical Manual 12-A:');
  lines.push('');
  lines.push('A. SUBSTRATE CLEANLINESS & INTEGRITY:');
  lines.push('   1. Substrates (concrete, corrugated metal deck, steel beams, gypsum board) must be clean,');
  lines.push('      dry, structurally sound, and free from oil, grease, loose rust, mill scale, release');
  lines.push('      agents, dirt, efflorescence, and any foreign contaminants detrimental to adhesion.');
  lines.push('   2. New roll-formed metal decking with residual manufacturing lubricants must be wiped or');
  lines.push('      power-washed with a degreasing surfactant prior to adhesive prime-spray.');
  lines.push('   3. Unpainted galvanized decking must be inspected for white rust (zinc hydroxide) and');
  lines.push('      passivated surfaces. Test patches are mandatory per ASTM E736.');
  lines.push('');
  lines.push('B. TEMPERATURE & ENVIRONMENTAL CLIMATE CONTROLS:');
  lines.push('   1. Ambient air and substrate surface temperatures MUST be maintained at a minimum of');
  lines.push('      40°F (4.5°C) continuously for 24 hours prior to application, during the spray process,');
  lines.push('      and for a minimum of 72 hours post-application until fully cured.');
  lines.push('   2. Continuous mechanical or natural ventilation providing a minimum of 4 complete air');
  lines.push('      exchanges per 24-hour cycle must be provided by the General Contractor to evacuate');
  lines.push('      evaporative moisture and prevent elevated relative humidity.');
  lines.push('');
  lines.push('C. WATER & POWER UTILITY PROVISIONS:');
  lines.push('   1. The General Contractor / Owner shall furnish potable water at a constant dynamic');
  lines.push('      pressure of 40 to 60 PSI within 100 ft (30 m) of the spray machine staging area.');
  lines.push('   2. Electrical power (110V/220V single/three-phase depending on commercial rig spec) must');
  lines.push('      be provided within 100 ft of the equipment staging location.');
  lines.push('');
  lines.push('D. ADHESIVE PRIMING & MULTI-PASS APPLICATION THICKNESS:');
  lines.push('   1. All substrates shall receive an atomized prime coat of Monoglass Liquid Adhesive diluted');
  lines.push('      1:1 with clean potable water prior to fiber deposition.');
  lines.push('   2. Monoglass may be applied up to 5.0 inches (127 mm) in a single monolithic pass without');
  lines.push('      mechanical supports or pins. For thicknesses exceeding 5.0 inches, application must');
  lines.push('      proceed in two sequential lifts with a 24-hour inter-pass dry time.');
  lines.push('');

  // 6. FORMAL TESTING COMPLIANCE & STANDARDS
  lines.push('5. MATERIAL SPECIFICATION & REGULATORY STANDARDS COMPLIANCE');
  lines.push(dividerSingle);
  lines.push('Monoglass® Sprayed Thermal & Acoustical Fiber is tested and certified to the');
  lines.push('following international standards:');
  lines.push('');
  lines.push('• ASTM C518 / C177:      Thermal Resistance k = 0.250 BTU·in/hr·ft²·°F (R-4.00/inch, RSI 0.70/25mm)');
  lines.push('• ASTM E84 / UL 723:      Surface Burning: Flame Spread Index = 0, Smoke Developed Index = 0 (Class 1 / Class A)');
  lines.push('• ASTM E136:              Assessing Combustibility - 100% Non-Combustible Inorganic Glass Fiber');
  lines.push('• CAN/ULC S102:           Canadian Surface Burning Test: Flame Spread = 0, Smoke Developed = 0');
  lines.push('• ASTM C423:              Sound Absorption (Reverberation Room): NRC 0.75 @ 1.0", NRC 0.95-1.00 @ 2.5"-3.0"');
  lines.push('• ASTM E736:              Cohesion/Adhesion: > 200 lbs/sq ft (9.6 kPa) to primed steel & concrete');
  lines.push('• ASTM E859:              Air Erosion: 0.000 g/ft² loss @ air velocities up to 10,000 FPM (114 mph)');
  lines.push('• ASTM C739 / C1149:      Corrosion Resistance: Non-corrosive to steel, copper, and aluminum');
  lines.push('• ASTM C1338 / C665:      Fungi / Mold Resistance: Zero growth (passes inorganic glass fiber rating)');
  lines.push('');

  // 7. PROJECT NOTES & USER-ENTERED SPECIFIER REMARKS
  lines.push('6. PROJECT SPECIFIER REMARKS & GENERAL CONTRACTOR NOTES');
  lines.push(dividerSingle);
  if (project.notes && project.notes.trim()) {
    lines.push(project.notes.trim());
  } else {
    lines.push('No special general contractor remarks noted. Standard CSI 07 21 29 guidelines apply.');
  }
  lines.push('');

  // 8. TURNKEY BUDGET ESTIMATE (IF ATTACHED)
  if (project.costEstimate) {
    const ce = project.costEstimate;
    lines.push('7. ATTACHED TURNKEY BUDGET & PRICING ESTIMATE');
    lines.push(dividerSingle);
    lines.push(`Estimate Baseline:        ${ce.name || 'Integrated Cost Model'}`);
    lines.push(`Loaded Labor Rate:        $${ce.loadedHourlyRate}/hr (${ce.laborRatePreset || 'Custom'})`);
    lines.push(`Fiber Bag Price:          $${ce.fiberBagPrice}/bag (30-lb bag)`);
    lines.push(`Adhesive Pail Price:      $${ce.adhesivePailPrice}/pail (5-gal pail)`);
    lines.push(`Crew Size:                ${ce.crewSize}-man crew`);
    lines.push(`Materials Subtotal:       $${ce.materialsTotal.toLocaleString()} USD`);
    lines.push(`Labor Subtotal:           $${ce.laborTotal.toLocaleString()} USD`);
    lines.push(`Equipment / Lifts:        $${ce.equipmentTotal.toLocaleString()} USD`);
    lines.push(`Direct Cost Subtotal:     $${ce.directCostSubtotal.toLocaleString()} USD`);
    lines.push(`Overhead & Profit (O&P):  ${ce.overheadProfitPercent}%`);
    lines.push(`GRAND TOTAL TURNKEY:      $${ce.grandTotal.toLocaleString()} USD ($${ce.costPerSqFt}/sq ft effective)`);
    lines.push('');
  }

  // 9. FORMAL TENDER BID COMPLIANCE CLAUSE & SIGN-OFF
  lines.push('8. TENDER SUBMISSION & QUALITY ASSURANCE SIGN-OFF');
  lines.push(dividerSingle);
  lines.push('The executing spray-applied insulation subcontractor shall be licensed and certified by');
  lines.push('Monoglass Incorporated. All applicators must hold valid manufacturer accreditation');
  lines.push('cards. Field quality control thickness testing shall be verified using certified pin-gauges');
  lines.push('at a frequency of no less than 1 test per 1,000 sq ft (100 m²) per AWCI Technical Manual 12-A.');
  lines.push('');
  lines.push('SUBMITTED BY:');
  lines.push('Contractor Company:       ________________________________________________________');
  lines.push('Authorized Representative: ________________________________________________________');
  lines.push('Title / Designation:      ________________________________________________________');
  lines.push('Signature & Stamp:        ________________________________  Date: ________________');
  lines.push('');
  lines.push(dividerDouble);
  lines.push('END OF SITE CONDITIONS AND SPECIFICATION SUMMARY - MONOGLASS INCORPORATED');
  lines.push(dividerDouble);

  return lines.join('\n');
}

/**
 * Utility to trigger browser file download of the summary as a UTF-8 .txt document
 */
export function downloadTenderSummaryTextFile(
  project: MultiRoomProject,
  bom: ConsolidatedBom,
  options: TenderSummaryOptions = {}
): void {
  const textContent = generateTenderSummaryText(project, bom, options);
  const cleanProjectName = (project.name || 'Project')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');
  const filename = `${cleanProjectName}_Site_Conditions_and_Specification_Summary.txt`;

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(downloadUrl);
}
