import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Contractor } from '../types';
import {
  MapPin,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Star,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface ContractorMapProps {
  contractors: Contractor[];
  selectedContractorId: string | null;
  onSelectContractor: (contractor: Contractor) => void;
  onRequestQuote: (contractor: Contractor) => void;
  searchCenter?: { lat: number; lng: number; label: string; radiusMiles?: number } | null;
}

// Map Tile Layer Providers
const TILE_LAYERS = {
  dark: {
    name: 'High-Contrast Dark',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; <a href="https://openstreetmap.org">OSM</a>',
    subdomains: 'abcd',
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abc',
  },
  light: {
    name: 'Positron Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
  },
};

// Custom SVG Leaflet Pin Generator
const createCustomMarkerIcon = (isSelected: boolean, rating: number) => {
  const size = isSelected ? 44 : 36;
  const pinColor = isSelected ? '#0284c7' : '#0369a1';
  const pulseHtml = isSelected
    ? `<div class="absolute -inset-2 rounded-full bg-sky-400/40 animate-ping"></div>`
    : '';

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110" style="width: ${size}px; height: ${size}px;">
      ${pulseHtml}
      <div class="relative z-10 w-full h-full rounded-2xl shadow-xl flex items-center justify-center border-2 ${
        isSelected
          ? 'bg-sky-500 border-white text-slate-950 ring-4 ring-sky-400/50 scale-110'
          : 'bg-slate-900 border-sky-400/80 text-sky-400 shadow-slate-950/80'
      }">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div class="absolute -bottom-1 w-2 h-2 rotate-45 ${isSelected ? 'bg-sky-500' : 'bg-slate-900 border-r border-b border-sky-400/80'}"></div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-contractor-marker',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size + 2],
    popupAnchor: [0, -size - 4],
  });
};

export const ContractorMap: React.FC<ContractorMapProps> = ({
  contractors,
  selectedContractorId,
  onSelectContractor,
  onRequestQuote,
  searchCenter,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<'dark' | 'osm' | 'light'>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePopupContractor, setActivePopupContractor] = useState<Contractor | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center: Center of North America (approx 44.0, -98.0)
      const map = L.map(mapContainerRef.current, {
        center: [42.0, -96.0],
        zoom: 4,
        zoomControl: false,
      });

      const tileConfig = TILE_LAYERS[selectedTheme];
      const tileLayer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        subdomains: tileConfig.subdomains,
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      // Keep map alive unless unmounted
    };
  }, []);

  // Update Tile Layer when theme changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const tileConfig = TILE_LAYERS[selectedTheme];
    tileLayerRef.current.setUrl(tileConfig.url);
  }, [selectedTheme]);

  // Update Markers when contractors change or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((m: L.Marker) => {
      m.remove();
    });
    markersRef.current = {};

    const validContractors = contractors.filter((c) => c.coordinates && c.coordinates.lat && c.coordinates.lng);

    if (validContractors.length === 0) return;

    const bounds = L.latLngBounds([]);

    validContractors.forEach((contractor) => {
      const isSelected = contractor.id === selectedContractorId;
      const { lat, lng } = contractor.coordinates!;
      const marker = L.marker([lat, lng], {
        icon: createCustomMarkerIcon(isSelected, contractor.rating),
        title: contractor.companyName,
      });

      marker.on('click', () => {
        onSelectContractor(contractor);
        setActivePopupContractor(contractor);
      });

      marker.addTo(map);
      markersRef.current[contractor.id] = marker;
      bounds.extend([lat, lng]);
    });

    // If search center is provided, draw radius circle
    if (searchCenter && searchCenter.lat && searchCenter.lng) {
      if (radiusCircleRef.current) {
        radiusCircleRef.current.remove();
      }
      const radiusMeters = (searchCenter.radiusMiles || 150) * 1609.34;
      const circle = L.circle([searchCenter.lat, searchCenter.lng], {
        color: '#38bdf8',
        fillColor: '#0284c7',
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '6, 6',
      }).addTo(map);
      radiusCircleRef.current = circle;
      bounds.extend([searchCenter.lat, searchCenter.lng]);
    } else if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
      radiusCircleRef.current = null;
    }

    // Auto-fit bounds if no specific contractor is selected
    if (!selectedContractorId && validContractors.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
    }
  }, [contractors, searchCenter]);

  // Pan to selected contractor
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedContractorId) return;

    const contractor = contractors.find((c) => c.id === selectedContractorId);
    if (contractor && contractor.coordinates) {
      map.flyTo([contractor.coordinates.lat, contractor.coordinates.lng], 10, {
        duration: 1.2,
      });
      setActivePopupContractor(contractor);
    }
  }, [selectedContractorId, contractors]);

  // Controls Handlers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    const validContractors = contractors.filter((c) => c.coordinates);
    if (validContractors.length > 0) {
      const bounds = L.latLngBounds(validContractors.map((c) => [c.coordinates!.lat, c.coordinates!.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else {
      mapInstanceRef.current.setView([42.0, -96.0], 4);
    }
    setActivePopupContractor(null);
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-2xl' : 'h-[440px] sm:h-[500px]'
      }`}
    >
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Control Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {/* Layer Selector */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-xl flex items-center gap-1">
          <button
            onClick={() => setSelectedTheme('dark')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedTheme === 'dark'
                ? 'bg-sky-500 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Voyager
          </button>
          <button
            onClick={() => setSelectedTheme('osm')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedTheme === 'osm'
                ? 'bg-sky-500 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Street
          </button>
          <button
            onClick={() => setSelectedTheme('light')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedTheme === 'light'
                ? 'bg-sky-500 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Positron
          </button>
        </div>

        {/* Contractor Count Badge */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium">
            <strong className="text-white font-bold">{contractors.length}</strong> Applicators on Map
          </span>
        </div>
      </div>

      {/* Top Right Map Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-xl flex flex-col gap-1">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-800 my-0.5" />
          <button
            onClick={handleResetView}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset to Fit All Applicators"
          >
            <Compass className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsFullscreen(!isFullscreen);
              setTimeout(() => mapInstanceRef.current?.invalidateSize(), 300);
            }}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Active Contractor Floating Drawer / Bottom Card */}
      {activePopupContractor && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-30 animate-scaleUp">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-sky-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold uppercase">
                    Certified Spray Contractor
                  </span>
                  {activePopupContractor.verified && (
                    <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white mt-1 leading-snug">
                  {activePopupContractor.companyName}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    {activePopupContractor.city}, {activePopupContractor.stateOrProvince} ({activePopupContractor.country})
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {activePopupContractor.rating.toFixed(1)} ({activePopupContractor.reviewCount})
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActivePopupContractor(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Specialties */}
            <div className="flex flex-wrap gap-1">
              {activePopupContractor.specialties.slice(0, 3).map((spec, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700"
                >
                  {spec}
                </span>
              ))}
              {activePopupContractor.specialties.length > 3 && (
                <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                  +{activePopupContractor.specialties.length - 3}
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${activePopupContractor.phone}`}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Call Contractor"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <a
                  href={`mailto:${activePopupContractor.email}`}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Email Contractor"
                >
                  <Mail className="w-4 h-4" />
                </a>
                {activePopupContractor.website && (
                  <a
                    href={activePopupContractor.website}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    title="Visit Website"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              <button
                onClick={() => onRequestQuote(activePopupContractor)}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-sky-500/20 active:scale-95 flex items-center gap-1.5"
              >
                <span>Request Bid</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
