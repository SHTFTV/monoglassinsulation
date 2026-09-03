import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Truck,
  HardHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  Share2,
  Download,
  Filter,
  Plus,
  Search,
  Layers,
  Sparkles,
  ShieldAlert,
  Info,
  CalendarCheck,
  PackageCheck,
  Check,
  Copy,
  Printer,
  SlidersHorizontal,
  ArrowRight,
  X,
  ExternalLink,
  Flame,
  Droplets,
  Wind,
  Trash2,
  Edit3,
} from 'lucide-react';
import {
  ScheduleInput,
  ScheduleEstimateResult,
  TimelineCalendarEvent,
  TimelineEventCategory,
  TimelineEventPriority,
} from '../types';
import {
  generateTimelineEvents,
  exportToIcs,
  getCalendarMonthGrid,
  addDays,
  toIsoDateString,
  CalendarGridDay,
} from '../utils/calendarUtils';
import { SCHEDULE_PRESETS, calculateProjectSchedule } from '../utils/scheduleUtils';
import { useSettings } from '../context/SettingsContext';

interface ProjectTimelineCalendarProps {
  initialInput?: ScheduleInput;
  initialResult?: ScheduleEstimateResult;
  onNavigateToScheduleEstimator?: () => void;
  onSendToQuote?: (data: any) => void;
  className?: string;
  isEmbedded?: boolean;
}

const STORAGE_CUSTOM_EVENTS_KEY = 'monoglass_timeline_custom_events_v1';

export const ProjectTimelineCalendar: React.FC<ProjectTimelineCalendarProps> = ({
  initialInput,
  initialResult,
  onNavigateToScheduleEstimator,
  onSendToQuote,
  className = '',
  isEmbedded = false,
}) => {
  const { unitSystem, isMetric } = useSettings();

  // Active Schedule Input (synced or fallback to default preset)
  const defaultPreset = SCHEDULE_PRESETS[0];
  const [scheduleInput, setScheduleInput] = useState<ScheduleInput>(
    initialInput || {
      projectName: defaultPreset.defaults.projectName || 'Metro Plaza Soffit Installation',
      targetArea: defaultPreset.defaults.targetArea || 35000,
      unitSystem: unitSystem || 'imperial',
      targetThicknessInches: defaultPreset.defaults.targetThicknessInches || 3.5,
      substrateType: defaultPreset.defaults.substrateType || 'flat-concrete',
      ceilingHeightFt: defaultPreset.defaults.ceilingHeightFt || 12,
      accessEquipment: defaultPreset.defaults.accessEquipment || 'ground-scaffold',
      mepDensity: defaultPreset.defaults.mepDensity || 'moderate',
      maskingLevel: defaultPreset.defaults.maskingLevel || 'standard',
      primerRequired: defaultPreset.defaults.primerRequired || false,
      finishType: defaultPreset.defaults.finishType || 'Natural White',
      ambientCondition: defaultPreset.defaults.ambientCondition || 'cold-unheated',
      crewCount: defaultPreset.defaults.crewCount || 1,
      shiftType: defaultPreset.defaults.shiftType || 'standard-8h',
      workDaysPerWeek: defaultPreset.defaults.workDaysPerWeek || 5,
      startDate: toIsoDateString(new Date()),
    }
  );

  // Compute live schedule result
  const calculatedResult = useMemo(() => {
    return initialResult && initialInput && JSON.stringify(initialInput) === JSON.stringify(scheduleInput)
      ? initialResult
      : calculateProjectSchedule(scheduleInput);
  }, [scheduleInput, initialResult, initialInput]);

  // Custom User-Created Milestones / Notes
  const [customEvents, setCustomEvents] = useState<TimelineCalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_EVENTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveCustomEvents = (events: TimelineCalendarEvent[]) => {
    setCustomEvents(events);
    try {
      localStorage.setItem(STORAGE_CUSTOM_EVENTS_KEY, JSON.stringify(events));
    } catch (e) {
      console.warn('Unable to persist custom events', e);
    }
  };

  // Calendar View State
  const [viewMode, setViewMode] = useState<'month' | 'agenda' | 'sprint' | 'gantt'>('month');

  // Month navigation: parse from schedule startDate
  const startYear = parseInt(scheduleInput.startDate.split('-')[0], 10) || new Date().getFullYear();
  const startMonthIndex = (parseInt(scheduleInput.startDate.split('-')[1], 10) || (new Date().getMonth() + 1)) - 1;

  const [currentYear, setCurrentYear] = useState<number>(startYear);
  const [currentMonth, setCurrentMonth] = useState<number>(startMonthIndex);

  // Filter State
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Drawers
  const [selectedEvent, setSelectedEvent] = useState<TimelineCalendarEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarGridDay | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // New Custom Event Form State
  const [newEvent, setNewEvent] = useState<{
    title: string;
    date: string;
    category: TimelineEventCategory;
    priority: TimelineEventPriority;
    description: string;
    deliverables: string;
  }>({
    title: '',
    date: scheduleInput.startDate,
    category: 'milestone',
    priority: 'high',
    description: '',
    deliverables: '',
  });

  // Generate All Synced Events
  const allEvents = useMemo(() => {
    return generateTimelineEvents(scheduleInput, calculatedResult, customEvents);
  }, [scheduleInput, calculatedResult, customEvents]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((evt) => {
      if (categoryFilter !== 'all' && evt.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = evt.title.toLowerCase().includes(q);
        const matchDesc = evt.description.toLowerCase().includes(q);
        const matchDeliverable = evt.details?.deliverables?.some((d) => d.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchDeliverable) return false;
      }
      return true;
    });
  }, [allEvents, categoryFilter, searchQuery]);

  // Calendar Grid Days for Current Month
  const monthGridDays = useMemo(() => {
    return getCalendarMonthGrid(currentYear, currentMonth, filteredEvents);
  }, [currentYear, currentMonth, filteredEvents]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToStart = () => {
    const [y, m] = scheduleInput.startDate.split('-').map(Number);
    if (y && m) {
      setCurrentYear(y);
      setCurrentMonth(m - 1);
    }
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // Month Display Name
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // iCal Export Trigger
  const handleDownloadIcs = () => {
    exportToIcs(allEvents, scheduleInput.projectName);
  };

  // Copy plain-text schedule
  const handleCopySchedule = () => {
    const lines = [
      `=============================================================`,
      `MONOGLASS PROJECT TIMELINE & MILESTONE SCHEDULE`,
      `Project: ${scheduleInput.projectName}`,
      `Area: ${scheduleInput.targetArea.toLocaleString()} ${isMetric ? 'm²' : 'sq ft'} • Thickness: ${scheduleInput.targetThicknessInches}"`,
      `Proposed Start: ${scheduleInput.startDate} | Trade Re-Entry: ${calculatedResult.tradeReEntryDate}`,
      `Total Working Days: ${calculatedResult.totalWorkingDays} | Calendar Days: ${calculatedResult.totalCalendarDays}`,
      `=============================================================`,
      '',
      'KEY MILESTONES & LOGISTICS CHRONOLOGY:',
      ...allEvents.map(
        (e) =>
          `[${e.date}] ${e.title}\n   Category: ${e.category.toUpperCase()} | Priority: ${e.priority.toUpperCase()}\n   Summary: ${e.description}\n   ${e.details?.deliverables ? `Deliverables: ${e.details.deliverables.join('; ')}` : ''}\n`
      ),
      '=============================================================',
      'Generated by Monoglass Technical Portal & Schedule Estimator',
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // Add Custom Event
  const handleAddCustomEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

    const created: TimelineCalendarEvent = {
      id: `custom-evt-${Date.now()}`,
      title: newEvent.title,
      date: newEvent.date,
      category: newEvent.category,
      priority: newEvent.priority,
      description: newEvent.description || 'Custom project milestone.',
      color:
        newEvent.category === 'delivery'
          ? '#d97706'
          : newEvent.category === 'inspection'
          ? '#059669'
          : newEvent.category === 'cure'
          ? '#8b5cf6'
          : '#4f46e5',
      badge: 'Custom Note',
      isCustom: true,
      details: {
        deliverables: newEvent.deliverables
          ? newEvent.deliverables.split('\n').filter((d) => d.trim().length > 0)
          : undefined,
      },
    };

    saveCustomEvents([...customEvents, created]);
    setIsAddEventOpen(false);
    setNewEvent({
      title: '',
      date: scheduleInput.startDate,
      category: 'milestone',
      priority: 'high',
      description: '',
      deliverables: '',
    });
  };

  const handleDeleteCustomEvent = (id: string) => {
    saveCustomEvents(customEvents.filter((e) => e.id !== id));
    if (selectedEvent?.id === id) {
      setSelectedEvent(null);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <CalendarIcon className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 font-mono">
                Interactive Schedule & Delivery Matrix
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex flex-wrap items-center gap-3">
              <span>Project Timeline Calendar</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                CSI 07 21 29
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Synchronized multi-phase visual timeline detailing equipment freight arrivals, Monoglass fiber pallet deliveries, active spray shifts, depth testing inspections, and subsequent trade re-entry gates.
            </p>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadIcs}
              className="px-3.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-sky-600/20 active:scale-95"
              title="Download standard .ics file for Google Calendar, Outlook, and Apple Calendar"
            >
              <Download className="w-4 h-4" />
              <span>Export .ICS Calendar</span>
            </button>

            <button
              type="button"
              onClick={handleCopySchedule}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
              title="Copy formatted schedule digest to clipboard"
            >
              {copiedNotification ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Schedule Digest</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsAddEventOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Milestone</span>
            </button>

            {onNavigateToScheduleEstimator && (
              <button
                type="button"
                onClick={onNavigateToScheduleEstimator}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Adjust Parameters</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Project Parameter Strip */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Proposed Start</span>
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="date"
                value={scheduleInput.startDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setScheduleInput((p) => ({ ...p, startDate: newDate }));
                  const [y, m] = newDate.split('-').map(Number);
                  if (y && m) {
                    setCurrentYear(y);
                    setCurrentMonth(m - 1);
                  }
                }}
                className="bg-transparent text-xs font-black font-mono text-white focus:outline-none focus:ring-1 focus:ring-sky-500 rounded px-1 -ml-1 cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Spray Span</span>
            <span className="text-sm font-black font-mono text-sky-400 block mt-1">
              {calculatedResult.totalWorkingDays} Active Working Days
            </span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Cure & Drying</span>
            <span className="text-sm font-black font-mono text-purple-400 block mt-1">
              {calculatedResult.totalCureDays} Days ({scheduleInput.ambientCondition})
            </span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Trade Re-Entry</span>
            <span className="text-sm font-black font-mono text-emerald-300 block mt-1">
              {calculatedResult.tradeReEntryDate}
            </span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Material Demand</span>
            <span className="text-sm font-black font-mono text-amber-400 block mt-1">
              {calculatedResult.estimatedBags.toLocaleString()} Bags ({calculatedResult.estimatedTruckloads} Loads)
            </span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Crew Rig Setup</span>
            <span className="text-sm font-black font-mono text-slate-200 block mt-1">
              {scheduleInput.crewCount} Rig{scheduleInput.crewCount > 1 ? 's' : ''} • {scheduleInput.shiftType.replace('-8h', ' (8h)').replace('-10h', ' (10h)').replace('double-shift', ' (16h)')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Controls & Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* View Modes Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-sky-600" />
              <span>Month Grid</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('sprint')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                viewMode === 'sprint'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>Weekly Sprints</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                viewMode === 'agenda'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Milestones & Deliveries Feed</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('gantt')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                viewMode === 'gantt'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              <span>Phased Timeline Track</span>
            </button>
          </div>

          {/* Month Steppers & Quick Jump */}
          {viewMode === 'month' && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl overflow-hidden p-0.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-xs font-bold font-mono text-slate-800 min-w-[130px] text-center">
                  {monthNames[currentMonth]} {currentYear}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleJumpToStart}
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 transition-all"
              >
                Project Start
              </button>

              <button
                type="button"
                onClick={handleJumpToToday}
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 transition-all"
              >
                Today
              </button>
            </div>
          )}
        </div>

        {/* Category Filters & Search Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <span className="text-slate-400 font-bold text-[11px] uppercase mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>

            {[
              { id: 'all', label: 'All Events', count: allEvents.length },
              { id: 'delivery', label: '🚚 Deliveries', count: allEvents.filter((e) => e.category === 'delivery').length },
              { id: 'labor', label: '👷 Spray Labor', count: allEvents.filter((e) => e.category === 'labor').length },
              { id: 'inspection', label: '🔍 QA Testing', count: allEvents.filter((e) => e.category === 'inspection').length },
              { id: 'cure', label: '⏳ Cure Window', count: allEvents.filter((e) => e.category === 'cure').length },
              { id: 'milestone', label: '🔓 Trade Re-Entry', count: allEvents.filter((e) => e.category === 'milestone').length },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap text-xs flex items-center gap-1 ${
                  categoryFilter === cat.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({cat.count})</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search deliverables, specs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VIEW 1: Interactive 7-Column Month Calendar Grid */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => (
              <div
                key={day}
                className={`py-2.5 text-xs font-bold uppercase tracking-wider ${
                  idx === 0 || idx === 6 ? 'text-slate-400 bg-slate-100/50' : 'text-slate-700'
                }`}
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.slice(0, 3)}</span>
              </div>
            ))}
          </div>

          {/* Days Grid (35 or 42 cells) */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
            {monthGridDays.map((gridDay, idx) => {
              const isSelected = selectedDay?.date === gridDay.date;
              const hasEvents = gridDay.events.length > 0;

              return (
                <div
                  key={`${gridDay.date}-${idx}`}
                  onClick={() => setSelectedDay(gridDay)}
                  className={`min-h-[110px] sm:min-h-[135px] p-1.5 sm:p-2 flex flex-col transition-all cursor-pointer relative group ${
                    gridDay.isCurrentMonth ? 'bg-white' : 'bg-slate-50/60 text-slate-400'
                  } ${gridDay.isWeekend ? 'bg-slate-50/40' : ''} ${
                    gridDay.isToday ? 'ring-2 ring-inset ring-sky-500' : ''
                  } ${isSelected ? 'bg-sky-50/50 ring-2 ring-inset ring-sky-600' : 'hover:bg-slate-50'}`}
                >
                  {/* Top Day Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-mono font-black w-6 h-6 rounded-full flex items-center justify-center ${
                        gridDay.isToday
                          ? 'bg-sky-600 text-white shadow-sm'
                          : gridDay.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {gridDay.dayNumber}
                    </span>

                    {/* Indicators */}
                    {hasEvents && (
                      <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-slate-700">
                        {gridDay.events.length} evt{gridDay.events.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Event Chips List */}
                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] sm:max-h-[100px] pr-0.5 no-scrollbar">
                    {gridDay.events.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(evt);
                        }}
                        style={{
                          backgroundColor: `${evt.color}15`,
                          borderColor: `${evt.color}40`,
                          color: evt.color,
                        }}
                        className="px-1.5 py-0.5 rounded-md border text-[10px] sm:text-[11px] font-bold truncate leading-tight flex items-center gap-1 hover:opacity-90 hover:scale-[1.02] transition-transform cursor-pointer shadow-2xs"
                        title={`${evt.title}: ${evt.description}`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: evt.color }}
                        />
                        <span className="truncate">{evt.title.replace(/^[^\w\s]+/, '').trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Weekly Sprints & Daily Production Output */}
      {viewMode === 'sprint' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sprint Cards grouped by working week */}
            {[1, 2, 3, 4].map((weekNum) => {
              const weekStartDay = (weekNum - 1) * 7;
              const weekStartDate = addDays(scheduleInput.startDate, weekStartDay);
              const weekEndDate = addDays(scheduleInput.startDate, weekStartDay + 6);

              const weekEvents = allEvents.filter((e) => {
                if (e.date >= weekStartDate && e.date <= weekEndDate) return true;
                if (e.endDate && e.endDate >= weekStartDate && e.date <= weekEndDate) return true;
                return false;
              });

              if (weekEvents.length === 0 && weekNum > 2) return null;

              return (
                <div
                  key={weekNum}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                        W{weekNum}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Sprint Week {weekNum}</h3>
                        <span className="text-xs font-mono text-slate-500">
                          {weekStartDate} → {weekEndDate}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg">
                      {weekEvents.length} Milestone{weekEvents.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {weekEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEvent(evt)}
                        className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-100/80 cursor-pointer transition-all flex items-start justify-between gap-2"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: evt.color }}
                            />
                            <span className="text-xs font-bold text-slate-900">{evt.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 pl-4">{evt.description}</p>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                          {evt.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: Chronological Milestones & Deliveries Feed (Agenda) */}
      {viewMode === 'agenda' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-emerald-600" />
                Chronological Milestone & Logistics Feed
              </h3>
              <p className="text-xs text-slate-500">
                Detailed action items, deliverable checklists, and CSI spec references by date.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
              {filteredEvents.length} Events Total
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredEvents.map((evt, idx) => (
              <div
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className="py-4 hover:bg-slate-50/80 transition-colors rounded-xl px-3 cursor-pointer space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      style={{ backgroundColor: evt.color }}
                      className="w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center shrink-0 shadow-sm"
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>{evt.title}</span>
                        {evt.badge && (
                          <span
                            style={{ backgroundColor: `${evt.color}20`, color: evt.color }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md font-mono"
                          >
                            {evt.badge}
                          </span>
                        )}
                      </h4>
                      <span className="text-xs font-mono text-slate-500">
                        Date: {evt.date} {evt.endDate ? `through ${evt.endDate}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        evt.priority === 'critical'
                          ? 'bg-rose-100 text-rose-700'
                          : evt.priority === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {evt.priority} Priority
                    </span>

                    {evt.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomEvent(evt.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Delete custom milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 pl-10 leading-relaxed">{evt.description}</p>

                {evt.details?.deliverables && evt.details.deliverables.length > 0 && (
                  <div className="pl-10 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                      Verification Deliverables:
                    </span>
                    <ul className="space-y-1">
                      {evt.details.deliverables.map((item, dIdx) => (
                        <li key={dIdx} className="text-xs text-slate-600 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: Phased Timeline Gantt Horizontal Track */}
      {viewMode === 'gantt' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              Full Calendar Span & Overlap Track
            </h3>
            <p className="text-xs text-slate-500">
              Total calendar duration from equipment staging through drying window and trade release ({calculatedResult.totalCalendarDays} Total Days).
            </p>
          </div>

          {/* Visual Track */}
          <div className="space-y-3">
            <div className="w-full h-10 bg-slate-100 rounded-2xl overflow-hidden flex border border-slate-200 p-1 gap-1">
              {calculatedResult.phases.map((phase) => {
                const totalSpan = calculatedResult.phases.reduce((a, b) => a + b.durationDays, 0);
                const widthPct = Math.max(12, (phase.durationDays / totalSpan) * 100);

                return (
                  <div
                    key={phase.id}
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: phase.color,
                    }}
                    className="h-full rounded-xl flex items-center justify-center px-2 text-white text-xs font-bold truncate transition-all cursor-pointer hover:opacity-90 shadow-sm"
                    title={`${phase.name}: ${phase.durationDays} Days`}
                    onClick={() => {
                      const matchingEvt = allEvents.find((e) => e.id.includes(phase.id));
                      if (matchingEvt) setSelectedEvent(matchingEvt);
                    }}
                  >
                    <span className="truncate">{phase.durationDays}d: {phase.name.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>

            {/* Timeline Day Markers */}
            <div className="flex justify-between text-[11px] font-mono font-bold text-slate-500 px-1">
              <span>Day 1 ({scheduleInput.startDate})</span>
              <span>Day {Math.round(calculatedResult.totalWorkingDays / 2)} (Mid-Spray)</span>
              <span>Day {calculatedResult.totalWorkingDays} (Spray Complete)</span>
              <span className="text-emerald-600 font-bold">Day {calculatedResult.subsequentTradeReEntryDay} (Trade Clearance)</span>
            </div>
          </div>

          {/* Sequential Phases List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {calculatedResult.phases.map((phase, idx) => (
              <div
                key={phase.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: phase.color }}
                      className="w-5 h-5 rounded-md text-white text-[10px] font-black flex items-center justify-center"
                    >
                      {idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{phase.name}</h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {phase.durationDays} Day{phase.durationDays > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{phase.description}</p>
                <div className="text-[10px] font-mono text-slate-400">
                  Labor: {phase.crewManHours} man-hours • Window: Day {phase.startDay} – Day {phase.endDay}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EVENT DETAILS MODAL / DRAWER */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span
                  style={{ backgroundColor: selectedEvent.color }}
                  className="w-9 h-9 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-sm"
                >
                  <CalendarIcon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{selectedEvent.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono font-bold text-slate-500">
                      📅 {selectedEvent.date} {selectedEvent.endDate ? `→ ${selectedEvent.endDate}` : ''}
                    </span>
                    <span
                      style={{ backgroundColor: `${selectedEvent.color}20`, color: selectedEvent.color }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded font-mono"
                    >
                      {selectedEvent.category.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Description & Operational Scope
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">{selectedEvent.description}</p>
              </div>

              {selectedEvent.details?.quantity && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Material / Man-Hour Scale:</span>
                  <span className="text-xs font-bold font-mono text-slate-900">{selectedEvent.details.quantity}</span>
                </div>
              )}

              {selectedEvent.details?.specRef && (
                <div className="bg-sky-50 p-3 rounded-xl border border-sky-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                    CSI 07 21 29 Specification Reference
                  </span>
                  <span className="text-xs font-semibold text-sky-950 font-mono mt-0.5 block">
                    {selectedEvent.details.specRef}
                  </span>
                </div>
              )}

              {selectedEvent.details?.deliverables && selectedEvent.details.deliverables.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Verification Checklist & Deliverables
                  </span>
                  <div className="space-y-1.5">
                    {selectedEvent.details.deliverables.map((d, i) => (
                      <div key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-700 leading-snug">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEvent.details?.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold block mb-0.5">Jobsite Advisory Note:</span>
                  {selectedEvent.details.notes}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {selectedEvent.isCustom ? (
                <button
                  type="button"
                  onClick={() => handleDeleteCustomEvent(selectedEvent.id)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Custom Event
                </button>
              ) : (
                <span className="text-[11px] text-slate-400">Synced from Project Schedule Estimator</span>
              )}

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOM EVENT MODAL */}
      {isAddEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <form
            onSubmit={handleAddCustomEvent}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-sm text-slate-900">Add Custom Jobsite Milestone</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEventOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Milestone Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., GC Pre-Con Walkthrough, Owner Mockup Review"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Event Date</label>
                  <input
                    type="date"
                    required
                    value={newEvent.date}
                    onChange={(e) => setNewEvent((p) => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Category</label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent((p) => ({ ...p, category: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="milestone">🚩 Milestone Gate</option>
                    <option value="delivery">🚚 Material Delivery</option>
                    <option value="inspection">🔍 QA / Inspection</option>
                    <option value="labor">👷 Labor / Shift</option>
                    <option value="cure">⏳ Cure Window</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description & Notes</label>
                <textarea
                  rows={2}
                  placeholder="Operational details, required subcontractors, or inspection requirements..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Deliverables (One per line)</label>
                <textarea
                  rows={2}
                  placeholder="Sign pre-con check&#10;Verify power drop"
                  value={newEvent.deliverables}
                  onChange={(e) => setNewEvent((p) => ({ ...p, deliverables: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddEventOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm"
              >
                Save Milestone
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
