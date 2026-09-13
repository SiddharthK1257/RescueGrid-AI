import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Compass,
  Crosshair,
  Search,
  Layers,
  Wind,
  ShieldAlert,
  Navigation,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { IncidentLocation, EmergencyResource } from '../types';

interface EmergencyMapProps {
  location: IncidentLocation;
  title: string;
  hazards: string[];
  resources: EmergencyResource[];
  primaryBlocked: boolean;
}

type MapLayerType = 'DARK_TACTICAL' | 'SATELLITE' | 'STREET_MAP' | 'TOPO_TERRAIN';

const TILE_LAYERS: Record<MapLayerType, { name: string; url: string; attribution: string; maxZoom: number }> = {
  DARK_TACTICAL: {
    name: 'CartoDB Dark Matter (Free OSM)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 19
  },
  SATELLITE: {
    name: 'Esri World Imagery (Free Satellite)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18
  },
  STREET_MAP: {
    name: 'OpenStreetMap Standard (Free)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  },
  TOPO_TERRAIN: {
    name: 'OpenTopoMap (Free Topography)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
    maxZoom: 17
  }
};

export const EmergencyMap: React.FC<EmergencyMapProps> = ({
  location,
  title,
  hazards,
  resources,
  primaryBlocked
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('DARK_TACTICAL');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Free OpenStreetMap Nominatim Geocoding Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const centerLat = location.lat || 37.7833;
    const centerLng = location.lng || -122.4167;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 14,
        zoomControl: true
      });

      const initialLayerConfig = TILE_LAYERS[activeLayer];
      const tileLayer = L.tileLayer(initialLayerConfig.url, {
        attribution: initialLayerConfig.attribution,
        maxZoom: initialLayerConfig.maxZoom
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([centerLat, centerLng], 14);
    }

    const map = mapInstanceRef.current;

    // Remove existing feature layers, keep tile layer
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // 1. INCIDENT EPICENTER (Radar Pulsing Marker)
    const incidentIcon = L.divIcon({
      className: 'custom-incident-pin',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(239, 68, 68, 0.35); animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite; position: absolute;"></div>
          <div style="width: 28px; height: 28px; border-radius: 50%; background: #ef4444; border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 18px rgba(239,68,68,0.9); z-index: 10;">
            <div style="width: 9px; height: 9px; border-radius: 50%; background: #ffffff;"></div>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    L.marker([centerLat, centerLng], { icon: incidentIcon })
      .addTo(map)
      .bindPopup(
        `<div style="font-family: monospace; font-size: 12px; color: #f8fafc; padding: 4px; min-width: 210px;">
          <div style="font-weight: 900; color: #ef4444; font-size: 13px; margin-bottom: 2px;">🚨 INCIDENT EPICENTER</div>
          <div style="font-weight: bold; font-size: 13px; color: #ffffff;">${title}</div>
          <div style="color: #94a3b8; font-size: 11px; margin-top: 2px;">${location.address}</div>
          <div style="margin-top: 6px; padding: 4px 6px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); border-radius: 4px; color: #fca5a5; font-size: 11px;">
            ⚠️ Active Hazards: ${hazards.length > 0 ? hazards.join(', ') : 'Assessing sector conditions'}
          </div>
        </div>`
      )
      .openPopup();

    // 2. HAZARD SAFETY BUFFER CIRCLE (350m radius)
    L.circle([centerLat, centerLng], {
      radius: 350,
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.14,
      weight: 2,
      dashArray: '6, 6'
    })
      .addTo(map)
      .bindTooltip('Tactical Safety Perimeter (350m buffer)', { permanent: false, direction: 'top' });

    // 3. PRIMARY BLOCKED ROUTE (Red polyline + Roadblock Marker)
    const blockedRouteCoords: [number, number][] = [
      [centerLat + 0.009, centerLng - 0.015],
      [centerLat + 0.005, centerLng - 0.008],
      [centerLat, centerLng]
    ];

    if (primaryBlocked) {
      L.polyline(blockedRouteCoords, {
        color: '#f43f5e',
        weight: 6,
        dashArray: '8, 8',
        opacity: 0.9
      })
        .addTo(map)
        .bindTooltip('⛔ PRIMARY EXPRESSWAY: HARD ROAD CLOSURE (Mile 44)', { permanent: false });

      const roadblockIcon = L.divIcon({
        className: 'custom-roadblock',
        html: `
          <div style="background: #e11d48; color: white; font-family: monospace; font-size: 10px; font-weight: bold; padding: 3px 8px; border-radius: 5px; border: 1.5px solid white; box-shadow: 0 4px 12px rgba(225,29,72,0.8); white-space: nowrap; animation: bounce 2s infinite;">
            ⛔ ROAD CLOSED
          </div>
        `,
        iconAnchor: [38, 12]
      });
      L.marker([centerLat + 0.005, centerLng - 0.008], { icon: roadblockIcon }).addTo(map);
    }

    // 4. RECOMMENDED DETOUR CORRIDOR (Route 4B Bypass - Glowing Emerald)
    const detourCoords: [number, number][] = [
      [centerLat + 0.012, centerLng - 0.018],
      [centerLat + 0.014, centerLng - 0.005],
      [centerLat + 0.007, centerLng + 0.008],
      [centerLat, centerLng + 0.002]
    ];

    L.polyline(detourCoords, {
      color: '#10b981',
      weight: 6,
      opacity: 0.95
    })
      .addTo(map)
      .bindTooltip('✅ DESIGNATED DETOUR: Route 4B North Bypass (Clear - 7m ETA)', { permanent: false });

    // 5. RESPONDER UNITS TELEMETRY
    // ALS Ambulance 01
    const ambIcon = L.divIcon({
      className: 'vehicle-amb',
      html: `<div style="background: #0284c7; border: 2px solid white; color: white; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 0 12px #0284c7; animation: pulse 2s infinite;">🚑</div>`,
      iconSize: [26, 26]
    });
    L.marker([centerLat + 0.008, centerLng - 0.003], { icon: ambIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: monospace; font-size: 12px; color: #f8fafc;">
          <strong style="color: #38bdf8;">🚑 ALS Ambulance 01</strong><br/>
          <span>Callsign: Medic-1</span><br/>
          <span>Route: Bypass 4B</span><br/>
          <span style="color: #34d399;">ETA: 4 mins • Inbound</span>
        </div>
      `);

    // Fire Engine 02
    const fireIcon = L.divIcon({
      className: 'vehicle-fire',
      html: `<div style="background: #ea580c; border: 2px solid white; color: white; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 0 12px #ea580c;">🚒</div>`,
      iconSize: [26, 26]
    });
    L.marker([centerLat + 0.003, centerLng + 0.006], { icon: fireIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: monospace; font-size: 12px; color: #f8fafc;">
          <strong style="color: #fb923c;">🚒 Fire Engine 02</strong><br/>
          <span>Callsign: Engine-2</span><br/>
          <span>Status: On Scene</span><br/>
          <span style="color: #fbbf24;">Action: Class B Foam Thermal Blanket</span>
        </div>
      `);

    // Police Patrol 03
    const policeIcon = L.divIcon({
      className: 'vehicle-police',
      html: `<div style="background: #4f46e5; border: 2px solid white; color: white; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 0 12px #4f46e5;">🚓</div>`,
      iconSize: [26, 26]
    });
    L.marker([centerLat + 0.005, centerLng - 0.009], { icon: policeIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: monospace; font-size: 12px; color: #f8fafc;">
          <strong style="color: #818cf8;">🚓 Police Patrol 03</strong><br/>
          <span>Callsign: Cruiser-3</span><br/>
          <span>Location: Exit 14 Interchange</span><br/>
          <span style="color: #a78bfa;">Task: Traffic Diversion Enforcement</span>
        </div>
      `);

    // Heavy Rescue 01
    const rescueIcon = L.divIcon({
      className: 'vehicle-rescue',
      html: `<div style="background: #059669; border: 2px solid white; color: white; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 0 12px #059669;">🚜</div>`,
      iconSize: [26, 26]
    });
    L.marker([centerLat + 0.002, centerLng - 0.004], { icon: rescueIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: monospace; font-size: 12px; color: #f8fafc;">
          <strong style="color: #34d399;">🚜 Heavy Rescue Squad 01</strong><br/>
          <span>Callsign: Heavy-1</span><br/>
          <span>Equipment: Hydraulic Cutters & Spreaders</span><br/>
          <span style="color: #6ee7b7;">Status: Staged on North Shoulder</span>
        </div>
      `);

    // 6. USER LOCATION PIN (If geolocation active)
    if (userCoords) {
      const userIcon = L.divIcon({
        className: 'user-pin',
        html: `<div style="background: #06b6d4; border: 2px solid white; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 0 16px #06b6d4;">📍</div>`,
        iconSize: [30, 30]
      });

      L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<strong>Current Command Location</strong><br/>Incident Commander Post')
        .openPopup();
    }
  }, [location, title, hazards, resources, primaryBlocked, userCoords]);

  // Handle Layer Switching
  const handleSwitchLayer = (layerKey: MapLayerType) => {
    setActiveLayer(layerKey);
    if (mapInstanceRef.current && tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      const newConfig = TILE_LAYERS[layerKey];
      const newLayer = L.tileLayer(newConfig.url, {
        attribution: newConfig.attribution,
        maxZoom: newConfig.maxZoom
      }).addTo(mapInstanceRef.current);
      tileLayerRef.current = newLayer;
    }
  };

  // Free OpenStreetMap Geocoding Search (Nominatim API)
  const handleGeocodeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await res.json();

      if (data && data.length > 0) {
        setSearchResults(data);
      } else {
        setSearchError('No matching locations found. Try another query.');
      }
    } catch (err: any) {
      setSearchError(`Geocoding search error: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: { display_name: string; lat: string; lon: string }) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.5 });

      // Add target inspection pin
      const searchPin = L.divIcon({
        className: 'search-inspect-pin',
        html: `<div style="background: #f59e0b; border: 2px solid white; color: black; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 0 14px #f59e0b;">🔍</div>`,
        iconSize: [28, 28]
      });

      L.marker([lat, lng], { icon: searchPin })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="font-family: monospace; font-size: 12px; color: #f8fafc;">
            <strong style="color: #fbbf24;">📍 SEARCH TARGET INSPECTED</strong><br/>
            <span>${result.display_name}</span><br/>
            <span style="color: #94a3b8;">Coords: ${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
          </div>
        `)
        .openPopup();
    }
    setSearchResults([]);
  };

  // Browser Geolocation (Zero API Key)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([coords.lat, coords.lng], 15, { duration: 1.5 });
        }
      },
      (err) => {
        setLocating(false);
        setGeoError(`Unable to retrieve GPS: ${err.message}. Defaulting to incident coordinates.`);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleRecenterIncident = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([location.lat, location.lng], 14, { duration: 1.2 });
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1322]/95 backdrop-blur-md p-4 shadow-xl flex flex-col h-full space-y-3">
      {/* Map Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '20s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide font-mono m-0 p-0 flex items-center gap-2">
                TACTICAL INCIDENT MAP
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                100% FREE LIVE MAP API
              </span>
            </div>
            <p className="text-xs text-slate-400 m-0 p-0 font-mono">
              Live telemetry: {location.lat.toFixed(4)}, {location.lng.toFixed(4)} ({location.address})
            </p>
          </div>
        </div>

        {/* Tactical Controls & Layer Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layer Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-xs font-mono">
            {(Object.keys(TILE_LAYERS) as MapLayerType[]).map((layerKey) => (
              <button
                key={layerKey}
                onClick={() => handleSwitchLayer(layerKey)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  activeLayer === layerKey
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {layerKey === 'DARK_TACTICAL' && 'Dark Tactical'}
                {layerKey === 'SATELLITE' && 'Satellite'}
                {layerKey === 'STREET_MAP' && 'Street'}
                {layerKey === 'TOPO_TERRAIN' && 'Topo'}
              </button>
            ))}
          </div>

          {/* Locate Command Post */}
          <button
            onClick={handleLocateMe}
            disabled={locating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium transition-colors cursor-pointer"
            title="Detect GPS coordinates (Free HTML5 Geolocation)"
          >
            <Crosshair className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Locating...' : 'Locate Post'}</span>
          </button>

          {/* Recenter Incident */}
          <button
            onClick={handleRecenterIncident}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-mono font-medium transition-colors cursor-pointer"
            title="Recenter on Incident Epicenter"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>Center Incident</span>
          </button>
        </div>
      </div>

      {/* Free OpenStreetMap Geocoding Search Bar */}
      <div className="relative">
        <form onSubmit={handleGeocodeSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Free OSM Search: Search any location, intersection, or landmark worldwide..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none placeholder:text-slate-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-mono text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>OSM Search</span>
          </button>
        </form>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-11 left-0 right-0 z-[1050] bg-slate-950/95 border border-cyan-500/40 rounded-xl shadow-2xl p-2 max-h-60 overflow-y-auto space-y-1 font-mono text-xs backdrop-blur-md">
            <div className="text-[10px] text-slate-400 font-bold px-2 py-1 uppercase border-b border-slate-800">
              OpenStreetMap Geocoding Results (Free Nominatim API)
            </div>
            {searchResults.map((res, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSearchResult(res)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-cyan-950/40 text-slate-200 hover:text-cyan-300 transition-colors flex items-center justify-between cursor-pointer border border-transparent hover:border-cyan-800"
              >
                <span className="truncate max-w-[85%]">{res.display_name}</span>
                <span className="text-[10px] text-cyan-400 font-bold">Inspect ➔</span>
              </button>
            ))}
          </div>
        )}

        {searchError && (
          <div className="mt-1 text-[11px] font-mono text-amber-300 bg-amber-950/30 border border-amber-800/40 px-3 py-1 rounded-lg">
            ⚠️ {searchError}
          </div>
        )}
      </div>

      {geoError && (
        <div className="text-[11px] font-mono text-amber-300 bg-amber-950/30 border border-amber-800/40 px-3 py-1.5 rounded-lg">
          ⚠️ {geoError}
        </div>
      )}

      {/* Map Canvas */}
      <div className="relative w-full h-[540px] rounded-xl overflow-hidden border border-slate-800 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Environmental Weather / Wind Banner Overlay */}
        <div className="absolute top-3 left-3 z-[1000] bg-slate-950/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-200 flex items-center gap-2 shadow-xl">
          <Wind className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Surface Wind: 14 kts WNW</span>
          <span className="text-emerald-400 font-bold">• Approach Upwind</span>
        </div>

        {/* Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl text-[11px] font-mono space-y-1.5 shadow-2xl">
          <div className="text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>TACTICAL OVERLAYS</span>
            <span className="text-cyan-400 font-mono text-[9px]">{activeLayer.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <span className="w-3 h-3 rounded-full bg-rose-500 border border-white inline-block"></span>
            <span>Incident Epicenter (Pulsing)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-rose-400 inline-block"></span>
            <span>Hard Road Closure (Mile 44)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <span className="w-3 h-0.5 bg-emerald-400 inline-block"></span>
            <span>Route 4B Bypass Corridor (Clear)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <span className="w-3 h-3 rounded-full border border-rose-500/80 bg-rose-500/20 inline-block"></span>
            <span>350m Safety Buffer Perimeter</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <span>🚑 🚒 🚓 🚜</span>
            <span>Live Responding Telemetry</span>
          </div>
        </div>
      </div>
    </div>
  );
};
