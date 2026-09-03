import React, { useState, useMemo, useRef } from 'react';
import { CONTRACTORS_DATABASE } from '../data/monoglassData';
import { Contractor, MaterialSampleRequest } from '../types';
import { ContractorMap } from './ContractorMap';
import { MaterialSampleRequestModal } from './MaterialSampleRequestModal';
import {
  Search,
  MapPin,
  Phone,
  Mail,
  Globe,
  Award,
  CheckCircle2,
  Filter,
  ShieldCheck,
  Star,
  Building2,
  Layers,
  Sparkles,
  UserCheck,
  ExternalLink,
  PlusCircle,
  Package,
  Map as MapIcon,
  LayoutGrid,
  Columns,
  Navigation,
  Check,
  ChevronRight,
  Info,
  Clock,
} from 'lucide-react';

interface ContractorDirectoryViewProps {
  onSelectContractorForQuote: (contractor: Contractor) => void;
  onOpenRegisterModal: () => void;
}

// Known coordinates for postal codes and cities to support distance calculation
const KNOWN_GEO_LOOKUP: Record<string, { lat: number; lng: number; name: string }> = {
  // Postal / Zip codes
  '98101': { lat: 47.6062, lng: -122.3321, name: 'Seattle, WA' },
  'v6b 1a1': { lat: 49.2827, lng: -123.1207, name: 'Vancouver, BC' },
  '10001': { lat: 40.7128, lng: -74.006, name: 'New York, NY' },
  '60606': { lat: 41.8781, lng: -87.6298, name: 'Chicago, IL' },
  '75201': { lat: 32.7767, lng: -96.797, name: 'Dallas, TX' },
  'h2y 1c6': { lat: 45.5017, lng: -73.5673, name: 'Montreal, QC' },
  '90012': { lat: 34.0522, lng: -118.2437, name: 'Los Angeles, CA' },
  '19103': { lat: 39.9526, lng: -75.1652, name: 'Philadelphia, PA' },
  'ec1a 1bb': { lat: 51.5074, lng: -0.1278, name: 'London, UK' },
  'm5j 2n8': { lat: 43.6532, lng: -79.3832, name: 'Toronto, ON' },
  '80202': { lat: 39.7392, lng: -104.9903, name: 'Denver, CO' },
  '30303': { lat: 33.749, lng: -84.388, name: 'Atlanta, GA' },
  't2p 1j9': { lat: 51.0447, lng: -114.0719, name: 'Calgary, AB' },
  '94105': { lat: 37.7749, lng: -122.4194, name: 'San Francisco, CA' },
  '33101': { lat: 25.7617, lng: -80.1918, name: 'Miami, FL' },
  '02108': { lat: 42.3601, lng: -71.0589, name: 'Boston, MA' },
  '77002': { lat: 29.7604, lng: -95.3698, name: 'Houston, TX' },
  '78701': { lat: 30.2672, lng: -97.7431, name: 'Austin, TX' },
  '85001': { lat: 33.4484, lng: -112.074, name: 'Phoenix, AZ' },
  '97201': { lat: 45.5152, lng: -122.6784, name: 'Portland, OR' },
  '20001': { lat: 38.9072, lng: -77.0369, name: 'Washington, DC' },
  '55401': { lat: 44.9778, lng: -93.265, name: 'Minneapolis, MN' },
  '48226': { lat: 42.3314, lng: -83.0458, name: 'Detroit, MI' },
  't5j 0n3': { lat: 53.5461, lng: -113.4938, name: 'Edmonton, AB' },
  'k1p 1j1': { lat: 45.4215, lng: -75.6972, name: 'Ottawa, ON' },

  // Cities
  seattle: { lat: 47.6062, lng: -122.3321, name: 'Seattle, WA' },
  vancouver: { lat: 49.2827, lng: -123.1207, name: 'Vancouver, BC' },
  'new york': { lat: 40.7128, lng: -74.006, name: 'New York, NY' },
  nyc: { lat: 40.7128, lng: -74.006, name: 'New York, NY' },
  chicago: { lat: 41.8781, lng: -87.6298, name: 'Chicago, IL' },
  dallas: { lat: 32.7767, lng: -96.797, name: 'Dallas, TX' },
  montreal: { lat: 45.5017, lng: -73.5673, name: 'Montreal, QC' },
  'los angeles': { lat: 34.0522, lng: -118.2437, name: 'Los Angeles, CA' },
  la: { lat: 34.0522, lng: -118.2437, name: 'Los Angeles, CA' },
  philadelphia: { lat: 39.9526, lng: -75.1652, name: 'Philadelphia, PA' },
  philly: { lat: 39.9526, lng: -75.1652, name: 'Philadelphia, PA' },
  london: { lat: 51.5074, lng: -0.1278, name: 'London, UK' },
  toronto: { lat: 43.6532, lng: -79.3832, name: 'Toronto, ON' },
  denver: { lat: 39.7392, lng: -104.9903, name: 'Denver, CO' },
  atlanta: { lat: 33.749, lng: -84.388, name: 'Atlanta, GA' },
  calgary: { lat: 51.0447, lng: -114.0719, name: 'Calgary, AB' },
  'san francisco': { lat: 37.7749, lng: -122.4194, name: 'San Francisco, CA' },
  sf: { lat: 37.7749, lng: -122.4194, name: 'San Francisco, CA' },
};

// Haversine formula to compute great-circle distance in miles
function calculateDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const ContractorDirectoryView: React.FC<ContractorDirectoryViewProps> = ({
  onSelectContractorForQuote,
  onOpenRegisterModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('ALL');
  const [radiusMiles, setRadiusMiles] = useState<number>(0); // 0 = Any distance
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null);
  const [selectedContractorModal, setSelectedContractorModal] = useState<Contractor | null>(null);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);

  const cardListRef = useRef<HTMLDivElement>(null);

  const specialtiesList = [
    'ALL',
    'Parking Garages',
    'Acoustics & Theaters',
    'Commercial High-Rise',
    'Arenas & Ice Rinks',
    'Mechanical Rooms',
    'Industrial & Retrofit',
  ];

  // Detect if search query matches a known location for geographic distance computation
  const activeGeoCenter = useMemo(() => {
    const clean = searchQuery.trim().toLowerCase();
    if (!clean) return null;
    const lookup = KNOWN_GEO_LOOKUP[clean];
    if (lookup) {
      return {
        lat: lookup.lat,
        lng: lookup.lng,
        label: lookup.name,
        radiusMiles: radiusMiles > 0 ? radiusMiles : 150,
      };
    }
    return null;
  }, [searchQuery, radiusMiles]);

  // Compute filtered contractors list with distance metrics
  const filteredContractorsWithDistance = useMemo(() => {
    const list = CONTRACTORS_DATABASE.map((contractor) => {
      let distance: number | undefined = undefined;
      if (activeGeoCenter && contractor.coordinates) {
        distance = calculateDistanceMiles(
          activeGeoCenter.lat,
          activeGeoCenter.lng,
          contractor.coordinates.lat,
          contractor.coordinates.lng
        );
      }
      return {
        ...contractor,
        distanceMiles: distance,
      };
    });

    const filtered = list.filter((c) => {
      // Country match
      if (selectedCountry !== 'ALL' && c.country !== selectedCountry) {
        return false;
      }
      // Specialty match
      if (selectedSpecialty !== 'ALL' && !c.specialties.includes(selectedSpecialty as any)) {
        return false;
      }
      // Radius filter if activeGeoCenter and radius > 0
      if (activeGeoCenter && radiusMiles > 0 && c.distanceMiles !== undefined) {
        if (c.distanceMiles > radiusMiles) {
          return false;
        }
      }

      // Search query match (name, company, city, state, zip, regions)
      if (searchQuery.trim() !== '' && !activeGeoCenter) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesCompany = c.companyName.toLowerCase().includes(q);
        const matchesCity = c.city.toLowerCase().includes(q);
        const matchesState = c.stateOrProvince.toLowerCase().includes(q);
        const matchesZip = c.zipPostal.toLowerCase().includes(q);
        const matchesRegions = c.regionsServed.some((r) => r.toLowerCase().includes(q));
        if (!matchesName && !matchesCompany && !matchesCity && !matchesState && !matchesZip && !matchesRegions) {
          return false;
        }
      }
      return true;
    });

    // If geocoded, sort by closest distance first
    if (activeGeoCenter) {
      filtered.sort((a, b) => (a.distanceMiles || 9999) - (b.distanceMiles || 9999));
    }

    return filtered;
  }, [searchQuery, selectedCountry, selectedSpecialty, activeGeoCenter, radiusMiles]);

  const handleContractorSelect = (contractor: Contractor) => {
    setSelectedContractorId(contractor.id);
    const element = document.getElementById(`contractor-card-${contractor.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Directory Hero Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider">
              <UserCheck className="w-4 h-4" /> Certified Applicator Network & Map
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Find Certified Monoglass Spray Insulation Contractors
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Geographically search verified commercial spray insulation contractors across North America & Europe equipped with high-output pneumatic spray rigs, quality control depth testing, and factory certification.
            </p>
          </div>

          {/* Action CTAs in Hero */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            {/* MATERIAL SAMPLE REQUEST BUTTON */}
            <button
              onClick={() => setIsSampleModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
            >
              <Package className="w-4 h-4" />
              <span>Request Physical Sample Kit</span>
            </button>

            <button
              onClick={onOpenRegisterModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold transition-all"
            >
              <PlusCircle className="w-4 h-4 text-sky-400" />
              <span>List Your Spray Company</span>
            </button>
          </div>
        </div>
      </section>

      {/* Search & Geographic Filtering Controls */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Main Search / Postal Code Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by postal code (e.g. 98101, V6B 1A1), city, or name..."
              className="w-full pl-10 pr-16 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
              >
                Clear
              </button>
            )}
          </div>

          {/* Country Selector */}
          <div className="md:col-span-2">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="ALL">All Countries</option>
              <option value="USA">United States</option>
              <option value="Canada">Canada</option>
              <option value="International">International / UK</option>
            </select>
          </div>

          {/* Specialty Selector */}
          <div className="md:col-span-3">
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition-colors"
            >
              {specialtiesList.map((sp) => (
                <option key={sp} value={sp}>
                  {sp === 'ALL' ? 'All Application Types' : sp}
                </option>
              ))}
            </select>
          </div>

          {/* Search Radius (when geocoded) */}
          <div className="md:col-span-2">
            <select
              value={radiusMiles}
              onChange={(e) => setRadiusMiles(Number(e.target.value))}
              disabled={!activeGeoCenter}
              className={`w-full py-2.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition-colors ${
                !activeGeoCenter ? 'text-slate-500 opacity-60 cursor-not-allowed' : 'text-slate-200'
              }`}
            >
              <option value="0">Any Distance</option>
              <option value="50">Within 50 mi</option>
              <option value="100">Within 100 mi</option>
              <option value="250">Within 250 mi</option>
              <option value="500">Within 500 mi</option>
            </select>
          </div>
        </div>

        {/* Quick Region Filters & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          {/* Quick Filter Tag Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs w-full sm:w-auto">
            <span className="text-slate-400 flex items-center gap-1 shrink-0 font-medium mr-1">
              <Filter className="w-3.5 h-3.5" /> Hubs:
            </span>
            {[
              { label: 'Seattle (98101)', q: '98101' },
              { label: 'Vancouver (V6B 1A1)', q: 'V6B 1A1' },
              { label: 'New York (10001)', q: '10001' },
              { label: 'Chicago (60606)', q: '60606' },
              { label: 'Toronto (M5J 2N8)', q: 'M5J 2N8' },
              { label: 'Dallas (75201)', q: '75201' },
              { label: 'Los Angeles (90012)', q: '90012' },
              { label: 'London (EC1A 1BB)', q: 'EC1A 1BB' },
            ].map((hub) => (
              <button
                key={hub.q}
                onClick={() => setSearchQuery(hub.q)}
                className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-all ${
                  searchQuery.toLowerCase() === hub.q.toLowerCase()
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {hub.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Split / Map / List */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 shrink-0">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'split' ? 'bg-sky-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Split View (Map + Cards)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Split</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'map' ? 'bg-sky-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Map Focus View"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Map</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list' ? 'bg-sky-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="List Focus View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">List</span>
            </button>
          </div>
        </div>

        {/* Geo Alert if Postal Code Search is active */}
        {activeGeoCenter && (
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl px-3.5 py-2 text-xs flex items-center justify-between text-sky-300">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                Searching around <strong>{activeGeoCenter.label}</strong>
                {radiusMiles > 0 ? ` within ${radiusMiles} miles` : ' (sorted by proximity)'}.
              </span>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-white underline text-[11px]"
            >
              Clear Location
            </button>
          </div>
        )}
      </section>

      {/* Main Directory Body: Responsive Map + List Layout */}
      <div className="space-y-6">
        {/* MAP COMPONENT (Shown in Split & Map views) */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                <MapIcon className="w-4 h-4 text-sky-400" />
                Interactive Spray Applicator Geo-Locator
              </span>
              <span>Click pins to view contractor details or send direct bid specs</span>
            </div>

            <ContractorMap
              contractors={filteredContractorsWithDistance}
              selectedContractorId={selectedContractorId}
              onSelectContractor={handleContractorSelect}
              onRequestQuote={onSelectContractorForQuote}
              searchCenter={activeGeoCenter}
            />
          </section>
        )}

        {/* RESULTS HEADER */}
        {viewMode !== 'map' && (
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-2">
            <span>
              Showing <strong className="text-white font-mono">{filteredContractorsWithDistance.length}</strong> certified applicators
            </span>
            <button
              onClick={() => setIsSampleModalOpen(true)}
              className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
            >
              <Package className="w-3.5 h-3.5" /> Order Free Material Samples
            </button>
          </div>
        )}

        {/* CONTRACTOR CARDS GRID (Shown in Split & List views) */}
        {viewMode !== 'map' && (
          <div
            ref={cardListRef}
            className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}
          >
            {filteredContractorsWithDistance.length > 0 ? (
              filteredContractorsWithDistance.map((contractor) => {
                const isSelected = contractor.id === selectedContractorId;
                return (
                  <div
                    key={contractor.id}
                    id={`contractor-card-${contractor.id}`}
                    onClick={() => setSelectedContractorId(contractor.id)}
                    className={`bg-slate-900 border rounded-2xl p-6 space-y-5 transition-all shadow-lg flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-sky-500 ring-2 ring-sky-500/40 bg-slate-900/95 shadow-sky-500/10'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                              {contractor.companyName}
                            </h3>
                            {contractor.verified && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                <CheckCircle2 className="w-3 h-3" /> Certified
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-slate-300 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                              {contractor.city}, {contractor.stateOrProvince} ({contractor.zipPostal})
                            </span>
                            {contractor.distanceMiles !== undefined && (
                              <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] font-mono font-bold">
                                {contractor.distanceMiles} mi away
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-white">{contractor.rating.toFixed(1)}</span>
                          <span className="text-[10px] text-slate-400">({contractor.reviewCount})</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
                        {contractor.description}
                      </p>

                      {/* Specialties */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Project Specialties
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {contractor.specialties.map((spec, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700/80"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Territories */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Territories Covered
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2">
                          {contractor.regionsServed.join(' • ')}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-800 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                        <a
                          href={`tel:${contractor.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 hover:text-sky-400 transition-colors font-mono"
                        >
                          <Phone className="w-3.5 h-3.5 text-sky-400" />
                          <span>{contractor.phone}</span>
                        </a>
                        <a
                          href={`mailto:${contractor.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 hover:text-sky-400 transition-colors truncate max-w-[180px]"
                        >
                          <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span className="truncate">{contractor.email}</span>
                        </a>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedContractorModal(contractor);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors text-center"
                        >
                          View Fleet & History
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectContractorForQuote(contractor);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all text-center shadow-md shadow-sky-500/10"
                        >
                          Request Project Bid
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">No exact contractor match found</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  We have additional regional spray contractor networks. Submit your project details and we will dispatch your specifications to certified contractors in your territory.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCountry('ALL');
                    setSelectedSpecialty('ALL');
                    setRadiusMiles(0);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                >
                  Reset Search & Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SAMPLE KIT PROMOTIONAL BOTTOM BANNER */}
      <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-sky-500/30 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
            <Package className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Need Physical Monoglass System Samples for Submittals?
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Complimentary Kit
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Order physical cured Monoglass White & Black specimens, Sonoglaze hard-coat pucks, substrate adhesion mockups, and bound CSI 07 21 29 submittal binders shipped directly to your architecture or engineering firm.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSampleModalOpen(true)}
          className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-sky-500/20 active:scale-95 transition-all shrink-0 flex items-center gap-2"
        >
          <Package className="w-4 h-4" />
          <span>Request Sample Box</span>
        </button>
      </section>

      {/* MATERIAL SAMPLES REQUEST MODAL */}
      <MaterialSampleRequestModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        defaultLocation={searchQuery}
      />

      {/* Contractor Details Modal */}
      {selectedContractorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative my-8">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">
                    {selectedContractorModal.companyName}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Monoglass Certified
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Primary Estimator: {selectedContractorModal.name} • {selectedContractorModal.city}, {selectedContractorModal.stateOrProvince}
                </div>
              </div>
              <button
                onClick={() => setSelectedContractorModal(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Company Overview
                </h4>
                <p className="leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {selectedContractorModal.description}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Representative Monoglass Spray Projects
                </h4>
                <ul className="space-y-2">
                  {selectedContractorModal.representativeProjects.map((proj, pIdx) => (
                    <li
                      key={pIdx}
                      className="flex items-center gap-2 text-xs text-slate-200 bg-slate-950 p-2.5 rounded-lg border border-slate-800"
                    >
                      <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>{proj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Specialized Machine Fleet & Tooling
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedContractorModal.equipmentFleet.map((eq, eIdx) => (
                    <span
                      key={eIdx}
                      className="text-xs px-3 py-1 bg-slate-800 text-slate-300 rounded-lg border border-slate-700"
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedContractorModal(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const c = selectedContractorModal;
                  setSelectedContractorModal(null);
                  onSelectContractorForQuote(c);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold shadow-md shadow-sky-500/20 transition-all"
              >
                Request Bid From This Contractor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
