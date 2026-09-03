import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  Layers,
  Package,
  Droplets,
  Scale,
  Sparkles,
  Zap,
  Maximize2,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { MultiRoomProject, ConsolidatedBom, RoomBomLine } from '../types';
import { SUBSTRATE_PROFILES } from '../utils/estimatorUtils';

interface ProjectAnalyticsProps {
  project: MultiRoomProject;
  bom: ConsolidatedBom;
  unitSystem: 'imperial' | 'metric';
}

// Sophisticated palette for multi-room differentiation
const ROOM_COLORS = [
  '#38bdf8', // Sky 400
  '#34d399', // Emerald 400
  '#fbbf24', // Amber 400
  '#a78bfa', // Violet 400
  '#f472b6', // Pink 400
  '#22d3ee', // Cyan 400
  '#fb923c', // Orange 400
  '#818cf8', // Indigo 400
  '#4ade80', // Green 400
  '#e879f9', // Fuchsia 400
];

type AnalyticsMetric = 'bags' | 'area' | 'adhesive' | 'deadLoad' | 'thermal';

export const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({
  project,
  bom,
  unitSystem,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<AnalyticsMetric>('bags');
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'comparison' | 'radar'>('bar');
  const [hoveredRoomIndex, setHoveredRoomIndex] = useState<number | null>(null);

  const activeBreakdowns: RoomBomLine[] = useMemo(() => {
    return bom.roomBreakdowns || [];
  }, [bom]);

  // Prepared data for charts
  const chartData = useMemo(() => {
    return activeBreakdowns.map((line, idx) => {
      const roomName = line.room.name || `Room ${idx + 1}`;
      const shortName = roomName.length > 18 ? `${roomName.substring(0, 16)}...` : roomName;
      const substrateInfo = SUBSTRATE_PROFILES[line.room.substrateType] || { multiplier: 1.0, name: line.room.substrateType };
      
      const areaValue = unitSystem === 'metric' ? line.effectiveAreaSqM : line.effectiveAreaSqFt;
      const planAreaValue = unitSystem === 'metric' ? line.room.planArea : line.room.planArea;
      const flutingExtraArea = Math.max(0, areaValue - planAreaValue);
      const deadLoadVal = unitSystem === 'metric' ? Math.round(line.deadLoadKg) : Math.round(line.deadLoadLbs);

      // Percentage of total bags
      const bagPercentage = bom.totalBagsFiber > 0 ? ((line.bags / bom.totalBagsFiber) * 100) : 0;
      const areaPercentage = (unitSystem === 'metric' ? bom.totalEffectiveAreaSqM : bom.totalEffectiveAreaSqFt) > 0
        ? (areaValue / (unitSystem === 'metric' ? bom.totalEffectiveAreaSqM : bom.totalEffectiveAreaSqFt)) * 100
        : 0;

      return {
        id: line.room.id,
        index: idx,
        fullName: roomName,
        name: shortName,
        bags: line.bags,
        bagPercentage: Number(bagPercentage.toFixed(1)),
        effectiveArea: Math.round(areaValue),
        planArea: Math.round(planAreaValue),
        flutingExtraArea: Math.round(flutingExtraArea),
        areaPercentage: Number(areaPercentage.toFixed(1)),
        adhesiveGallons: Number(line.adhesiveGallons.toFixed(1)),
        sonoglazeGallons: Number(line.sonoglazeGallons.toFixed(1)),
        adhesivePails: Number((line.adhesiveGallons / 5).toFixed(1)),
        thickness: unitSystem === 'metric' ? line.thicknessMm : Number(line.thicknessInches.toFixed(1)),
        rValue: Number(line.rValue.toFixed(1)),
        rsi: Number(line.rsi.toFixed(2)),
        nrc: Number(line.nrc.toFixed(2)),
        deadLoad: deadLoadVal,
        substrateMultiplier: substrateInfo.multiplier,
        substrateName: substrateInfo.name,
        finishType: line.room.finishType,
        color: ROOM_COLORS[idx % ROOM_COLORS.length],
      };
    });
  }, [activeBreakdowns, bom, unitSystem]);

  // Radar data comparing rooms across 5 key performance attributes
  const radarData = useMemo(() => {
    if (chartData.length === 0) return [];
    
    // Normalize metrics 0-100 across rooms
    const maxBags = Math.max(...chartData.map((d) => d.bags), 1);
    const maxArea = Math.max(...chartData.map((d) => d.effectiveArea), 1);
    const maxThickness = Math.max(...chartData.map((d) => d.thickness), 1);
    const maxR = Math.max(...chartData.map((d) => (unitSystem === 'metric' ? d.rsi : d.rValue)), 1);
    const maxNrc = Math.max(...chartData.map((d) => d.nrc), 1);

    const attributes = [
      { attribute: 'Material Volume (Bags)', key: 'bags', max: maxBags },
      { attribute: 'Effective Surface Area', key: 'effectiveArea', max: maxArea },
      { attribute: 'Applied Thickness', key: 'thickness', max: maxThickness },
      { attribute: unitSystem === 'metric' ? 'RSI Thermal Rating' : 'R-Value Thermal', key: unitSystem === 'metric' ? 'rsi' : 'rValue', max: maxR },
      { attribute: 'NRC Acoustic Rating', key: 'nrc', max: maxNrc },
    ];

    return attributes.map((attr) => {
      const item: Record<string, any> = { attribute: attr.attribute };
      chartData.forEach((room) => {
        const rawVal = room[attr.key as keyof typeof room] as number;
        item[room.fullName] = Math.round((rawVal / attr.max) * 100);
        item[`${room.fullName}_raw`] = rawVal;
      });
      return item;
    });
  }, [chartData, unitSystem]);

  // Highlight highest consumer zone
  const highestBagZone = useMemo(() => {
    if (chartData.length === 0) return null;
    return [...chartData].sort((a, b) => b.bags - a.bags)[0];
  }, [chartData]);

  if (activeBreakdowns.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm">No active rooms found in the current project estimate to visualize.</p>
      </div>
    );
  }

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 z-50 min-w-[200px] backdrop-blur-md">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-bold text-white text-sm truncate">{data.fullName || label}</span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-300 pt-1 font-mono">
            <div className="text-slate-400">Monoglass Bags:</div>
            <div className="text-right font-bold text-emerald-400">
              {data.bags} bags ({data.bagPercentage}%)
            </div>

            <div className="text-slate-400">Effective Area:</div>
            <div className="text-right text-sky-300">
              {data.effectiveArea?.toLocaleString()} {unitSystem === 'metric' ? 'm²' : 'sq ft'}
            </div>

            <div className="text-slate-400">Thermal Rating:</div>
            <div className="text-right text-teal-300 font-bold">
              {unitSystem === 'metric' ? `RSI ${data.rsi}` : `R-${data.rValue}`}
            </div>

            <div className="text-slate-400">Adhesive Req:</div>
            <div className="text-right text-amber-300 font-medium">
              {data.adhesiveGallons} gal ({data.adhesivePails} pails)
            </div>

            <div className="text-slate-400">Dead Load:</div>
            <div className="text-right text-purple-300">
              {data.deadLoad?.toLocaleString()} {unitSystem === 'metric' ? 'kg' : 'lbs'}
            </div>

            <div className="text-slate-400">Substrate factor:</div>
            <div className="text-right text-slate-300">
              {data.substrateMultiplier}x ({data.substrateName?.split(' ')[0]})
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-6 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono">
                Multi-Room Analytics
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                {activeBreakdowns.length} Zones Tracked
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Material Volume & Substrate Distribution Visualizer
            </h3>
            <p className="text-xs text-slate-400">
              Interactive distribution analysis of fiber bags, effective fluting coverage, adhesive chemical requirements, and structural dead loads.
            </p>
          </div>
        </div>

        {/* Metric Switcher & Chart View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedMetric('bags')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedMetric === 'bags'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Fiber Bags</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMetric('area')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedMetric === 'area'
                  ? 'bg-sky-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Surface Area</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMetric('adhesive')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedMetric === 'adhesive'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>Adhesive</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMetric('deadLoad')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedMetric === 'deadLoad'
                  ? 'bg-purple-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Dead Load</span>
            </button>
          </div>

          {/* Chart Format Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              title="Bar Chart Distribution"
              className={`p-1.5 rounded-lg text-xs transition-all ${
                chartType === 'bar'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setChartType('pie')}
              title="Donut / Share Breakdown"
              className={`p-1.5 rounded-lg text-xs transition-all ${
                chartType === 'pie'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PieIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setChartType('comparison')}
              title="Substrate Fluting vs Plan Area Comparison"
              className={`p-1.5 rounded-lg text-xs transition-all ${
                chartType === 'comparison'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setChartType('radar')}
              title="Zone Performance Multi-Axis Radar"
              className={`p-1.5 rounded-lg text-xs transition-all ${
                chartType === 'radar'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Canvas & Key Insights Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart View (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">
                {chartType === 'bar' && `${selectedMetric.toUpperCase()} by Room Zone`}
                {chartType === 'pie' && `Share Breakdown: ${selectedMetric.toUpperCase()}`}
                {chartType === 'comparison' && 'Plan Footprint vs. Fluted Surface Area'}
                {chartType === 'radar' && 'Relative Zone Performance Radar (Normalized)'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Hover over bars / slices for granular quantities
            </span>
          </div>

          {/* Chart Rendering Container */}
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey={
                      selectedMetric === 'bags'
                        ? 'bags'
                        : selectedMetric === 'area'
                        ? 'effectiveArea'
                        : selectedMetric === 'adhesive'
                        ? 'adhesiveGallons'
                        : 'deadLoad'
                    }
                    radius={[6, 6, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={hoveredRoomIndex === null || hoveredRoomIndex === index ? 1 : 0.35}
                        onMouseEnter={() => setHoveredRoomIndex(index)}
                        onMouseLeave={() => setHoveredRoomIndex(null)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : chartType === 'pie' ? (
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={chartData}
                    dataKey={
                      selectedMetric === 'bags'
                        ? 'bags'
                        : selectedMetric === 'area'
                        ? 'effectiveArea'
                        : selectedMetric === 'adhesive'
                        ? 'adhesiveGallons'
                        : 'deadLoad'
                    }
                    nameKey="fullName"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={105}
                    paddingAngle={3}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`pie-cell-${index}`}
                        fill={entry.color}
                        stroke="#0f172a"
                        strokeWidth={2}
                        opacity={hoveredRoomIndex === null || hoveredRoomIndex === index ? 1 : 0.35}
                        onMouseEnter={() => setHoveredRoomIndex(index)}
                        onMouseLeave={() => setHoveredRoomIndex(null)}
                      />
                    ))}
                  </Pie>
                </PieChart>
              ) : chartType === 'comparison' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                  />
                  <Bar
                    dataKey="planArea"
                    name={`Base Plan Area (${unitSystem === 'metric' ? 'm²' : 'sq ft'})`}
                    fill="#64748b"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="flutingExtraArea"
                    name={`Fluting & Deck Surcharge (${unitSystem === 'metric' ? 'm²' : 'sq ft'})`}
                    fill="#38bdf8"
                    stackId="a"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="attribute" stroke="#94a3b8" fontSize={10} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                  {chartData.slice(0, 5).map((room) => (
                    <Radar
                      key={room.fullName}
                      name={room.name}
                      dataKey={room.fullName}
                      stroke={room.color}
                      fill={room.color}
                      fillOpacity={0.25}
                    />
                  ))}
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Tooltip />
                </RadarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Summary Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-3 flex flex-col justify-between">
          {/* Top Takeaway Insights Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Key Quantity Drivers
              </h4>
            </div>

            {highestBagZone && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                <div className="text-[11px] text-slate-400">Primary Material Consumer:</div>
                <div className="text-sm font-bold text-white flex items-center justify-between">
                  <span className="truncate pr-2">{highestBagZone.fullName}</span>
                  <span className="text-emerald-400 font-mono text-xs shrink-0">
                    {highestBagZone.bagPercentage}% of Bags
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Consumes <strong>{highestBagZone.bags}</strong> of {bom.totalBagsFiber} total Monoglass bags at{' '}
                  {unitSystem === 'metric' ? `RSI ${highestBagZone.rsi}` : `R-${highestBagZone.rValue}`}.
                </p>
              </div>
            )}

            {/* Substrate Expansion Multiplier Impact */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1 text-xs">
              <div className="text-slate-400 text-[11px]">Substrate Fluting Area Impact:</div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-300">Total Base Plan:</span>
                <span className="text-white font-bold">
                  {unitSystem === 'metric'
                    ? `${bom.totalPlanAreaSqM.toLocaleString()} m²`
                    : `${bom.totalPlanAreaSqFt.toLocaleString()} sq ft`}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono text-sky-400">
                <span>Effective Coated Area:</span>
                <span className="font-bold">
                  {unitSystem === 'metric'
                    ? `${bom.totalEffectiveAreaSqM.toLocaleString()} m²`
                    : `${bom.totalEffectiveAreaSqFt.toLocaleString()} sq ft`}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 pt-0.5">
                +{(
                  (( (unitSystem === 'metric' ? bom.totalEffectiveAreaSqM : bom.totalEffectiveAreaSqFt) -
                    (unitSystem === 'metric' ? bom.totalPlanAreaSqM : bom.totalPlanAreaSqFt)) /
                    Math.max(1, unitSystem === 'metric' ? bom.totalPlanAreaSqM : bom.totalPlanAreaSqFt)) *
                  100
                ).toFixed(1)}% area expansion from metal flutes & joists.
              </div>
            </div>
          </div>

          {/* Interactive Zone List / Legend */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2 max-h-48 overflow-y-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Room Distribution Breakdown
            </span>
            <div className="space-y-1.5">
              {chartData.map((room, idx) => (
                <div
                  key={room.id}
                  onMouseEnter={() => setHoveredRoomIndex(idx)}
                  onMouseLeave={() => setHoveredRoomIndex(null)}
                  className={`p-2 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                    hoveredRoomIndex === idx
                      ? 'bg-slate-800 border-sky-500/50 text-white scale-[1.02]'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: room.color }}
                    />
                    <span className="font-medium truncate text-xs">{room.fullName}</span>
                  </div>

                  <div className="font-mono text-right shrink-0 text-xs">
                    <span className="font-bold text-emerald-400">{room.bags} bags</span>{' '}
                    <span className="text-slate-500 text-[10px]">({room.bagPercentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
