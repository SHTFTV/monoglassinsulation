import { ScheduleInput, ScheduleEstimateResult, TimelineCalendarEvent } from '../types';

/**
 * Formats a Date object or YYYY-MM-DD string into a safe YYYY-MM-DD string
 */
export function toIsoDateString(date: Date | string): string {
  if (typeof date === 'string') {
    if (date.includes('T')) return date.split('T')[0];
    return date;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds days to a date string and returns a YYYY-MM-DD string
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toIsoDateString(date);
}

/**
 * Computes calendar events and milestones synced with the Schedule Estimator
 */
export function generateTimelineEvents(
  input: ScheduleInput,
  result: ScheduleEstimateResult,
  customEvents: TimelineCalendarEvent[] = []
): TimelineCalendarEvent[] {
  const events: TimelineCalendarEvent[] = [];
  const startDate = input.startDate || toIsoDateString(new Date());

  // 1. Pre-Construction Delivery Milestones
  // 1.1 Equipment Rig & Lifts Delivery (1 business day before start)
  const equipDeliveryDate = addDays(startDate, -1);
  events.push({
    id: 'evt-equip-delivery',
    title: '🚚 Equipment Delivery: Spray Rig & Scissor Lifts',
    date: equipDeliveryDate,
    category: 'delivery',
    priority: 'high',
    color: '#d97706', // amber 600
    badge: 'Equipment Arrival',
    description: `Delivery of ${input.crewCount} pneumatic spray rig(s), 200ft high-pressure material hoses, water booster pumps, and ${input.accessEquipment} access equipment.`,
    details: {
      quantity: `${input.crewCount} Spray Rig(s) + ${input.accessEquipment}`,
      location: 'Main Jobsite Staging Bay',
      specRef: 'CSI 07 21 29 - Section 1.06 (Delivery & Handling)',
      deliverables: [
        'Verify 220V/480V 3-phase power or 40kW generator drop',
        'Connect potable water supply (min 5 GPM @ 40 PSI)',
        'Inspect lift certifications and tire protection pads',
      ],
      notes: 'Equipment staging area must be within 150 ft of primary application ceiling zones.',
    },
  });

  // 1.2 Monoglass Fiber & Adhesive Delivery
  events.push({
    id: 'evt-material-delivery',
    title: `📦 Material Delivery: ${result.estimatedBags} Bags Monoglass Fiber`,
    date: equipDeliveryDate,
    category: 'delivery',
    priority: 'critical',
    color: '#0284c7', // sky 600
    badge: 'Materials Arrival',
    description: `Freight arrival of ${result.estimatedBags} bags (30 lbs / 13.6 kg each) Monoglass ${input.finishType} fiber and ${result.estimatedAdhesivePails} pails (5-gal) concentrated adhesive.`,
    details: {
      quantity: `${result.estimatedBags} Bags Fiber • ${result.estimatedAdhesivePails} Pails Adhesive`,
      location: 'Dry Protected Storage Area',
      specRef: 'CSI 07 21 29 - Section 2.01 (Materials)',
      deliverables: [
        'Store bags on raised wooden pallets off direct slab',
        'Maintain adhesive above 40°F (4°C) to prevent freezing',
        'Verify batch lot numbers and quality seal integrity',
      ],
      notes: `Total estimated freight volume: ~${result.estimatedTruckloads} truckload(s). Requires standard loading dock or forklift offload.`,
    },
  });

  // 1.3 Primer Delivery if required
  if (input.primerRequired) {
    events.push({
      id: 'evt-primer-delivery',
      title: '🧪 Primer Delivery: K-Lastic / Metal Bonding Primer',
      date: equipDeliveryDate,
      category: 'delivery',
      priority: 'medium',
      color: '#7c3aed', // purple 600
      badge: 'Primer Staging',
      description: 'Specialty bonding primer pails for non-standard or painted metal/concrete substrate adhesion.',
      details: {
        specRef: 'CSI 07 21 29 - Section 2.02 (Primers & Adhesives)',
        notes: 'Apply in accordance with manufacturer technical bulletin prior to spray fiber application.',
      },
    });
  }

  // 1.4 Sonoglaze Delivery if required
  if (input.finishType === 'Sonoglaze Hard-Coat' && result.estimatedSonoglazePails) {
    events.push({
      id: 'evt-sonoglaze-delivery',
      title: `🛡️ Sonoglaze Hard-Coat Delivery (${result.estimatedSonoglazePails} Pails)`,
      date: addDays(startDate, Math.floor(result.totalPrepDays + result.totalSprayDays * 0.5)),
      category: 'delivery',
      priority: 'medium',
      color: '#ec4899', // pink 600
      badge: 'Protective Topcoat',
      description: `Delivery of ${result.estimatedSonoglazePails} pails of Sonoglaze abuse-resistant protective hard-coat surface sealer.`,
      details: {
        quantity: `${result.estimatedSonoglazePails} Pails (5-gal)`,
        specRef: 'CSI 07 21 29 - Section 2.03 (Surface Protectors)',
        notes: 'To be applied immediately after fiber tamping while substrate matrix is green.',
      },
    });
  }

  // 2. Pre-Application Inspection & Substrate Sign-Off (Day 1)
  events.push({
    id: 'evt-qa-preinspection',
    title: '🔍 Substrate Inspection & QA Pre-Con Sign-Off',
    date: startDate,
    category: 'inspection',
    priority: 'high',
    color: '#059669', // emerald 600
    badge: 'Pre-Con Gate',
    description: 'Joint pre-inspection of ceiling substrate, conduit layout, hanger wires, and masking boundaries with General Contractor.',
    details: {
      location: 'Application Zones A–Z',
      specRef: 'ASTM E605 / ASTM E736 / CSI 07 21 29 Part 3',
      deliverables: [
        'Check substrate cleanliness (free of oil, grease, loose rust, or unbonded paint)',
        'Verify all overhead mechanical, electrical, and plumbing rough-ins are 100% complete',
        'Verify hanger wires and ceiling drop clips installed prior to spray',
      ],
      notes: 'Sign-off required before spray machine operation commences.',
    },
  });

  // 3. Labor Phases Mapped to Calendar Dates
  let accumulatedCalendarDays = 0;

  result.phases.forEach((phase, index) => {
    const phaseStartDate = addDays(startDate, Math.floor(phase.startDay - 1));
    const phaseEndDate = addDays(startDate, Math.ceil(phase.endDay - 1));
    const isMultiDay = phase.durationDays > 1;

    let cat: TimelineCalendarEvent['category'] = 'labor';
    if (phase.phaseCategory === 'prep') cat = 'labor';
    if (phase.phaseCategory === 'cure') cat = 'cure';
    if (phase.phaseCategory === 'inspection') cat = 'inspection';

    events.push({
      id: `evt-phase-${phase.id}`,
      title: `👷 Phase ${index + 1}: ${phase.name}`,
      date: phaseStartDate,
      endDate: isMultiDay ? phaseEndDate : undefined,
      category: cat,
      priority: phase.phaseCategory === 'spray' ? 'critical' : 'medium',
      color: phase.color,
      badge: `${phase.durationDays} Day${phase.durationDays > 1 ? 's' : ''}`,
      description: phase.description,
      details: {
        crewSize: input.crewCount * 3,
        quantity: `${phase.crewManHours} Crew Man-Hours`,
        deliverables: phase.deliverables,
        notes: `Production Window: Day ${phase.startDay} through Day ${phase.endDay}. Working hours: ${input.shiftType}.`,
      },
    });

    accumulatedCalendarDays += phase.durationDays;
  });

  // 4. In-Process Testing & QA Pin Gauge Milestones
  // Mid-way spray check
  const midSprayDay = Math.max(1, Math.floor(result.totalPrepDays + result.totalSprayDays / 2));
  const midSprayDate = addDays(startDate, midSprayDay);
  events.push({
    id: 'evt-qa-midcheck',
    title: `📏 QA Depth Pin Gauge & Density Verification (Target: ${input.targetThicknessInches}")`,
    date: midSprayDate,
    category: 'inspection',
    priority: 'high',
    color: '#0891b2', // cyan 600
    badge: 'Quality Control',
    description: `Randomized core depth measurement using standard 12-pin needle gauges across field areas and beam edges to verify ${input.targetThicknessInches}" minimum thickness.`,
    details: {
      specRef: 'ASTM C518 / ASTM E605 / ASTM E736',
      deliverables: [
        `Record 10 random pin gauge readings per 1,000 sq ft`,
        'Verify adhesive-to-water injection pressure ratios (45–55 PSI atomization)',
        'Check monolithic bond to substrate flanges and flutes',
      ],
      notes: 'Monoglass density target: 2.75 to 3.25 lbs/cu ft (44–52 kg/m³).',
    },
  });

  // 5. Active Curing & Moisture Evaporation Window
  const cureStartDate = addDays(startDate, result.totalWorkingDays);
  const cureEndDate = addDays(startDate, result.subsequentTradeReEntryDay - 1);
  events.push({
    id: 'evt-cure-window',
    title: '⏳ Active Drying & Moisture Evaporation Window',
    date: cureStartDate,
    endDate: cureEndDate,
    category: 'cure',
    priority: 'high',
    color: '#8b5cf6', // violet 500
    badge: `${result.totalCureDays} Days Drying`,
    description: `Critical moisture release period. Maintain ambient temperature above 40°F (4°C) with continuous cross-ventilation or commercial air movers.`,
    details: {
      specRef: 'Monoglass Technical Bulletin - Cold Weather & Drying Protocol',
      deliverables: [
        'Continuous mechanical cross-ventilation (minimum 4 air changes per hour)',
        'Zero direct high-velocity blast heaters aimed directly at freshly applied matrix',
        'Restricted jobsite access to prevent physical abrasion or contact',
      ],
      notes: `Ambient Jobsite Climate Profile: ${input.ambientCondition}. Cure time adjusted accordingly.`,
    },
  });

  // 6. Project Completion & Subsequent Trade Re-Entry Clearance Milestone
  events.push({
    id: 'evt-trade-reentry',
    title: '🔓 SUBSEQUENT TRADE RE-ENTRY CLEARANCE (MEP & Finishes)',
    date: result.tradeReEntryDate,
    category: 'milestone',
    priority: 'critical',
    color: '#10b981', // emerald 500
    badge: 'Trade Release',
    description: 'Monoglass thermal/acoustic envelope is fully set, cured, and released for subsequent trades (HVAC ducting, electrical conduit, fire alarm, ceiling grid).',
    details: {
      location: 'Full Facility Area',
      specRef: 'Project Handover Document & CSI 07 21 29 Warranty Certificate',
      tradeAction: 'All trades permitted to re-enter application bays with standard work precautions.',
      deliverables: [
        'Final contractor visual inspection and thickness certification report',
        'Issue Monoglass manufacturer material warranty',
        'Handover containment cleanup sign-off to General Contractor',
      ],
      notes: 'Trades mounting directly through insulation must seal penetrations in accordance with CSI 07 21 29.',
    },
  });

  // 7. Append any user custom events
  customEvents.forEach((ce) => {
    events.push(ce);
  });

  // Sort events chronologically
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Generate iCalendar RFC 5545 string for calendar subscription / download (.ics)
 */
export function exportToIcs(events: TimelineCalendarEvent[], projectName: string): void {
  const sanitize = (str: string) =>
    str.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

  const nowStr = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Monoglass Spray Insulation//Project Timeline Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Monoglass - ${projectName}`,
    'X-WR-TIMEZONE:UTC',
  ];

  events.forEach((evt) => {
    const startDateClean = evt.date.replace(/-/g, '');
    let endDateClean = startDateClean;
    if (evt.endDate) {
      // iCal DTEND for full days is exclusive, so add 1 day to end date
      endDateClean = addDays(evt.endDate, 1).replace(/-/g, '');
    } else {
      endDateClean = addDays(evt.date, 1).replace(/-/g, '');
    }

    const uid = `${evt.id}-${startDateClean}@monoglass.com`;
    const summary = evt.title.replace(/[^\x20-\x7E]/g, '').trim() || evt.title;
    let description = `${evt.description}\\n\\nCategory: ${evt.category.toUpperCase()}\\nPriority: ${evt.priority.toUpperCase()}`;

    if (evt.details?.deliverables && evt.details.deliverables.length > 0) {
      description += `\\n\\nKey Deliverables:\\n- ${evt.details.deliverables.join('\\n- ')}`;
    }
    if (evt.details?.specRef) {
      description += `\\n\\nSpecification: ${evt.details.specRef}`;
    }
    if (evt.details?.notes) {
      description += `\\n\\nNotes: ${evt.details.notes}`;
    }

    ics.push('BEGIN:VEVENT');
    ics.push(`UID:${uid}`);
    ics.push(`DTSTAMP:${nowStr}`);
    ics.push(`DTSTART;VALUE=DATE:${startDateClean}`);
    ics.push(`DTEND;VALUE=DATE:${endDateClean}`);
    ics.push(`SUMMARY:${sanitize(summary)}`);
    ics.push(`DESCRIPTION:${sanitize(description)}`);
    ics.push(`CATEGORIES:${evt.category.toUpperCase()},MONOGLASS,INSULATION`);
    ics.push('STATUS:CONFIRMED');
    ics.push('END:VEVENT');
  });

  ics.push('END:VCALENDAR');

  const icsContent = ics.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Monoglass_Schedule_${projectName.replace(/\s+/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Calendar Grid Helpers
 */
export interface CalendarGridDay {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  events: TimelineCalendarEvent[];
}

export function getCalendarMonthGrid(
  year: number,
  month: number, // 0-indexed (0 = Jan, 11 = Dec)
  events: TimelineCalendarEvent[]
): CalendarGridDay[] {
  const todayStr = toIsoDateString(new Date());
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
  const totalDaysInMonth = lastDayOfMonth.getDate();

  const grid: CalendarGridDay[] = [];

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, dayNum);
    const dateStr = toIsoDateString(prevDate);
    const dayOfWeek = prevDate.getDay();

    const matchingEvents = events.filter((e) => {
      if (e.date === dateStr) return true;
      if (e.endDate && dateStr >= e.date && dateStr <= e.endDate) return true;
      return false;
    });

    grid.push({
      date: dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      events: matchingEvents,
    });
  }

  // Current month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const curDate = new Date(year, month, d);
    const dateStr = toIsoDateString(curDate);
    const dayOfWeek = curDate.getDay();

    const matchingEvents = events.filter((e) => {
      if (e.date === dateStr) return true;
      if (e.endDate && dateStr >= e.date && dateStr <= e.endDate) return true;
      return false;
    });

    grid.push({
      date: dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      events: matchingEvents,
    });
  }

  // Next month leading days to complete 35 or 42 grid cells (5 or 6 weeks)
  const remainingCells = (7 - (grid.length % 7)) % 7;
  for (let n = 1; n <= remainingCells; n++) {
    const nextDate = new Date(year, month + 1, n);
    const dateStr = toIsoDateString(nextDate);
    const dayOfWeek = nextDate.getDay();

    const matchingEvents = events.filter((e) => {
      if (e.date === dateStr) return true;
      if (e.endDate && dateStr >= e.date && dateStr <= e.endDate) return true;
      return false;
    });

    grid.push({
      date: dateStr,
      dayNumber: n,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      events: matchingEvents,
    });
  }

  return grid;
}
