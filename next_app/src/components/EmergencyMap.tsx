'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Incident, MapMarker, LocationRecord } from '../types';
import {
  MapPin,
  Crosshair,
  Compass,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Construction,
  Layers,
  RefreshCw,
  Info,
  Radio,
  X
} from 'lucide-react';

export interface EmergencyMapProps {
  incident: Incident | null;
  markers: MapMarker[];
  onLocationRecorded?: (loc: Partial<LocationRecord>) => void;
}

export type LocationStatus =
  | 'LOCATION NOT ENABLED'
  | 'REQUESTING PERMISSION'
  | 'LOCATION AVAILABLE'
  | 'LOCATION PERMISSION DENIED'
  | 'LOCATION UNAVAILABLE'
  | 'LOCATION TRACKING STOPPED'
  | 'SIMULATED LOCATION';

type MapLayerType = 'DARK_TACTICAL' | 'SATELLITE' | 'STREET_MAP';

interface LayerConfig {
  id: MapLayerType;
  name: string;
  baseUrl: string;
  refUrl?: string; // Optional labels overlay layer
  attribution: string;
  maxZoom: number;
  maxNativeZoom?: number;
}

// 100% Free, licensed, watermark-free providers
// Custom provider can be configured via NEXT_PUBLIC_MAP_TILE_URL & NEXT_PUBLIC_MAP_API_KEY
const getLayerConfigs = (): Record<MapLayerType, LayerConfig> => {
  const customTileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL;
  const customApiKey = process.env.NEXT_PUBLIC_MAP_API_KEY || '';
  const customAttribution =
    process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || '&copy; Map Provider &copy; OpenStreetMap contributors';

  let darkUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
  let darkRefUrl: string | undefined = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}';
  let darkAttr = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, OpenStreetMap contributors';

  if (customTileUrl) {
    darkUrl = customTileUrl.replace('{apiKey}', customApiKey).replace('{key}', customApiKey);
    darkRefUrl = undefined;
    darkAttr = customAttribution;
  }

  return {
    DARK_TACTICAL: {
      id: 'DARK_TACTICAL',
      name: 'Dark Tactical',
      baseUrl: darkUrl,
      refUrl: darkRefUrl,
      attribution: darkAttr,
      maxZoom: 19,
      maxNativeZoom: customTileUrl ? 19 : 16,
    },
    SATELLITE: {
      id: 'SATELLITE',
      name: 'Satellite Recon',
      baseUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, GIS User Community',
      maxZoom: 19,
    },
    STREET_MAP: {
      id: 'STREET_MAP',
      name: 'Street Vector',
      baseUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    },
  };
};

export const EmergencyMap: React.FC<EmergencyMapProps> = ({
  incident,
  markers,
  onLocationRecorded,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const baseTileLayerRef = useRef<any>(null);
  const refTileLayerRef = useRef<any>(null);
  const leafletMarkersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);
  const bufferCircleRef = useRef<any>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('DARK_TACTICAL');
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('LOCATION NOT ENABLED');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [isSimulatedLocation, setIsSimulatedLocation] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [tileErrorWarning, setTileErrorWarning] = useState(false);
  const [geoErrorMessage, setGeoErrorMessage] = useState<string | null>(null);

  // Set up base and reference tile layers cleanly
  const applyTileLayer = useCallback((layerKey: MapLayerType, map: any, L: any) => {
    const configs = getLayerConfigs();
    const config = configs[layerKey];

    // Remove existing tile layers
    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
      baseTileLayerRef.current = null;
    }
    if (refTileLayerRef.current) {
      map.removeLayer(refTileLayerRef.current);
      refTileLayerRef.current = null;
    }

    setTileErrorWarning(false);
    let errorCount = 0;

    const baseLayer = L.tileLayer(config.baseUrl, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      maxNativeZoom: config.maxNativeZoom || config.maxZoom,
      subdomains: ['a', 'b', 'c'],
    });

    baseLayer.on('tileerror', () => {
      errorCount++;
      if (errorCount > 4) {
        setTileErrorWarning(true);
      }
    });

    baseLayer.addTo(map);
    baseTileLayerRef.current = baseLayer;

    // Optional reference overlay layer for high-contrast highway/city labels
    if (config.refUrl) {
      const refLayer = L.tileLayer(config.refUrl, {
        maxZoom: config.maxZoom,
        maxNativeZoom: config.maxNativeZoom || config.maxZoom,
        opacity: 0.95,
      });
      refLayer.addTo(map);
      refTileLayerRef.current = refLayer;
    }
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const leafletModule = await import('leaflet');
      const L = (leafletModule as any).default || leafletModule;

      if (!L || !L.Icon) return;

      // Fix default Leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current && isMounted && mapContainerRef.current) {
        if ((mapContainerRef.current as any)._leaflet_id) {
          delete (mapContainerRef.current as any)._leaflet_id;
        }

        const initialLat = incident ? incident.latitude : 37.7749;
        const initialLng = incident ? incident.longitude : -122.4194;

        try {
          const map = L.map(mapContainerRef.current, {
            center: [initialLat, initialLng],
            zoom: 14,
            zoomControl: true,
            fadeAnimation: true,
          });

          applyTileLayer(activeLayer, map, L);

          mapInstanceRef.current = map;
          setMapLoaded(true);

          // Immediate size adjustment to avoid grey tile glitches
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
            }
          }, 250);
        } catch (mapErr) {
          console.warn('[EmergencyMap] Leaflet initialization notice:', mapErr);
        }
      }
    };

    initMap();

    // Auto-resize on window / container dimension changes
    const currentContainer = mapContainerRef.current;
    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== 'undefined' && currentContainer) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(currentContainer);
    }

    return () => {
      isMounted = false;
      if (resizeObserver && currentContainer) {
        resizeObserver.unobserve(currentContainer);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (currentContainer && (currentContainer as any)._leaflet_id) {
        delete (currentContainer as any)._leaflet_id;
      }
    };
  }, []);

  // Handle Layer Switching
  const handleSwitchLayer = async (layerKey: MapLayerType) => {
    setActiveLayer(layerKey);
    if (!mapInstanceRef.current || typeof window === 'undefined') return;
    const leafletModule = await import('leaflet');
    const L = (leafletModule as any).default || leafletModule;
    if (!L) return;
    applyTileLayer(layerKey, mapInstanceRef.current, L);
  };

  // Update Markers & Buffers on Map
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined' || !mapLoaded) return;

    import('leaflet').then((LModule) => {
      const L = (LModule as any).default || LModule;
      const map = mapInstanceRef.current;
      if (!map || !L) return;

      // Clear existing incident markers
      leafletMarkersRef.current.forEach((m) => map.removeLayer(m));
      leafletMarkersRef.current = [];

      // Clear existing buffer circle
      if (bufferCircleRef.current) {
        map.removeLayer(bufferCircleRef.current);
        bufferCircleRef.current = null;
      }

      // Add Tactical Safety Buffer Circle around Epicenter
      const centerLat = incident ? incident.latitude : 37.7749;
      const centerLng = incident ? incident.longitude : -122.4194;

      const bufferCircle = L.circle([centerLat, centerLng], {
        radius: 350,
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '5, 5',
      }).addTo(map);

      bufferCircle.bindTooltip('Tactical Safety Buffer (350m Cordon)', {
        permanent: false,
        direction: 'top',
        className: 'bg-slate-950 text-red-300 text-[10px] font-mono border border-red-800 rounded px-1.5 py-0.5',
      });
      bufferCircleRef.current = bufferCircle;

      // Render Incident Markers
      markers.forEach((marker) => {
        let iconHtml = `
          <div class="relative flex items-center justify-center">
            <span class="w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow"></span>
          </div>`;

        if (marker.type === 'INCIDENT') {
          iconHtml = `
            <div class="relative flex items-center justify-center cursor-pointer">
              <span class="absolute inline-flex h-10 w-10 animate-ping rounded-full bg-red-500 opacity-50"></span>
              <span class="relative inline-flex rounded-full h-7 w-7 bg-red-600 border-2 border-white shadow-xl items-center justify-center text-white text-xs font-black">
                !
              </span>
            </div>`;
        } else if (marker.type === 'HAZARD') {
          iconHtml = `
            <div class="relative flex items-center justify-center cursor-pointer">
              <span class="absolute inline-flex h-7 w-7 animate-pulse rounded-full bg-amber-500 opacity-40"></span>
              <span class="relative inline-flex rounded-full h-6 w-6 bg-gradient-to-br from-amber-500 to-orange-600 border-2 border-white shadow-lg items-center justify-center text-white text-[11px]">
                🔥
              </span>
            </div>`;
        } else if (marker.type === 'ROAD_BLOCK') {
          iconHtml = `
            <div class="relative flex items-center justify-center cursor-pointer">
              <span class="relative inline-flex rounded-full h-6 w-6 bg-rose-700 border-2 border-white shadow-lg items-center justify-center text-white text-[11px] font-bold">
                ⛔
              </span>
            </div>`;
        } else if (marker.type === 'STAGING_AREA') {
          iconHtml = `
            <div class="relative flex items-center justify-center cursor-pointer">
              <span class="relative inline-flex rounded-full h-6 w-6 bg-teal-600 border-2 border-white shadow-lg items-center justify-center text-white text-[11px] font-bold">
                🛡️
              </span>
            </div>`;
        } else if (marker.type === 'USER_LOCATION') {
          iconHtml = `
            <div class="relative flex items-center justify-center cursor-pointer">
              <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-cyan-400 opacity-60"></span>
              <span class="relative inline-flex rounded-full h-6 w-6 bg-cyan-500 border-2 border-white shadow-lg items-center justify-center text-white text-[10px] font-bold">
                ●
              </span>
            </div>`;
        }

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'tactical-marker-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const m = L.marker([marker.latitude, marker.longitude], { icon: customIcon }).addTo(map);

        const typeColor =
          marker.type === 'INCIDENT'
            ? '#ef4444'
            : marker.type === 'HAZARD'
            ? '#f59e0b'
            : marker.type === 'ROAD_BLOCK'
            ? '#e11d48'
            : '#0d9488';

        const popupContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; padding: 4px; min-width: 210px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${typeColor}; letter-spacing: 0.5px;">
                ${marker.type.replace('_', ' ')}
              </span>
              <span style="font-size: 9px; background: rgba(255,255,255,0.1); padding: 1px 5px; border-radius: 4px; color: #cbd5e1;">
                ${marker.status || 'ACTIVE'}
              </span>
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #ffffff; margin-bottom: 3px;">
              ${marker.title}
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px; line-height: 1.35;">
              ${marker.description || 'Active incident telemetry point.'}
            </div>
            <div style="border-top: 1px solid #1e293b; padding-top: 4px; font-size: 10px; color: #64748b; font-family: monospace;">
              Coordinates: ${marker.latitude != null ? marker.latitude.toFixed(4) : ''}, ${marker.longitude != null ? marker.longitude.toFixed(4) : ''}
            </div>
          </div>
        `;

        m.bindPopup(popupContent);
        leafletMarkersRef.current.push(m);
      });
    });
  }, [markers, incident, mapLoaded]);

  // Update Live or Simulated User Coordinates & Accuracy Circle
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined' || !mapLoaded) return;

    import('leaflet').then((LModule) => {
      const L = (LModule as any).default || LModule;
      const map = mapInstanceRef.current;
      if (!map || !L) return;

      // Clean up previous user marker and accuracy circle
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      if (accuracyCircleRef.current) {
        map.removeLayer(accuracyCircleRef.current);
        accuracyCircleRef.current = null;
      }

      if (userCoords) {
        // Accuracy Circle
        if (userCoords.accuracy && userCoords.accuracy > 0) {
          const accCircle = L.circle([userCoords.lat, userCoords.lng], {
            radius: Math.min(userCoords.accuracy, 200),
            color: isSimulatedLocation ? '#a855f7' : '#3b82f6',
            fillColor: isSimulatedLocation ? '#a855f7' : '#3b82f6',
            fillOpacity: 0.15,
            weight: 1.5,
          }).addTo(map);
          accuracyCircleRef.current = accCircle;
        }

        // Distinct User Pin
        const labelText = isSimulatedLocation ? 'SIM' : 'YOU';
        const pingColor = isSimulatedLocation ? 'bg-purple-400' : 'bg-blue-400';
        const badgeColor = isSimulatedLocation ? 'bg-purple-600' : 'bg-blue-600';

        const userIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center cursor-pointer">
              <span class="absolute inline-flex h-9 w-9 animate-ping rounded-full ${pingColor} opacity-70"></span>
              <span class="relative inline-flex rounded-full h-6 w-6 ${badgeColor} border-2 border-white shadow-xl items-center justify-center text-white text-[9px] font-black tracking-wider">
                ${labelText}
              </span>
            </div>`,
          className: 'user-live-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const userMarker = L.marker([userCoords.lat, userCoords.lng], {
          icon: userIcon,
          zIndexOffset: 1000,
        }).addTo(map);

        const locationTitle = isSimulatedLocation ? 'SIMULATED RESPONDER GPS' : 'YOUR LIVE LOCATION';
        const locationBadge = isSimulatedLocation ? 'Simulated Test Coordinates' : 'Browser Verified Geolocation';

        userMarker.bindPopup(`
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; padding: 4px; min-width: 190px;">
            <div style="font-size: 11px; font-weight: 800; color: ${isSimulatedLocation ? '#c084fc' : '#60a5fa'}; letter-spacing: 0.5px;">
              ${locationTitle}
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin: 3px 0;">
              ${locationBadge}
            </div>
            <div style="font-size: 10px; color: #64748b; font-family: monospace; border-top: 1px solid #1e293b; padding-top: 4px;">
              Lat/Lng: ${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}<br/>
              Precision: ±${userCoords.accuracy ? Math.round(userCoords.accuracy) : 15}m
            </div>
          </div>
        `);

        userMarkerRef.current = userMarker;
      }
    });
  }, [userCoords, isSimulatedLocation, mapLoaded]);

  // Recenter map on Incident
  const centerOnIncident = () => {
    if (mapInstanceRef.current && incident) {
      mapInstanceRef.current.setView([incident.latitude, incident.longitude], 15, { animate: true });
    }
  };

  // Browser Geolocation Request (Only requested upon explicit user click)
  const handleUseMyLocation = () => {
    setGeoErrorMessage(null);

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('LOCATION UNAVAILABLE');
      setGeoErrorMessage('Browser Geolocation is not supported in this environment.');
      return;
    }

    setLocationStatus('REQUESTING PERMISSION');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        setUserCoords({ lat, lng, accuracy });
        setLocationStatus('LOCATION AVAILABLE');
        setIsSimulatedLocation(false);
        setGeoErrorMessage(null);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 15, { animate: true });
        }

        if (onLocationRecorded && incident) {
          onLocationRecorded({
            latitude: lat,
            longitude: lng,
            accuracy,
            source: 'BROWSER_GEOLOCATION',
            isSimulated: false,
          });
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('LOCATION PERMISSION DENIED');
          setGeoErrorMessage('Location permission was denied. You can enable it in browser site settings.');
        } else if (error.code === error.TIMEOUT) {
          setLocationStatus('LOCATION UNAVAILABLE');
          setGeoErrorMessage('GPS request timed out. Please try again or use Simulated GPS.');
        } else {
          setLocationStatus('LOCATION UNAVAILABLE');
          setGeoErrorMessage('Unable to obtain GPS position from device.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Simulated GPS (Explicitly labeled as simulated)
  const handleUseSimulatedLocation = () => {
    setGeoErrorMessage(null);
    const simLat = incident ? incident.latitude + 0.0042 : 37.7780;
    const simLng = incident ? incident.longitude + 0.0035 : -122.4150;

    setUserCoords({ lat: simLat, lng: simLng, accuracy: 20 });
    setLocationStatus('SIMULATED LOCATION');
    setIsSimulatedLocation(true);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([simLat, simLng], 15, { animate: true });
    }

    if (onLocationRecorded && incident) {
      onLocationRecorded({
        latitude: simLat,
        longitude: simLng,
        accuracy: 20,
        source: 'SIMULATED',
        isSimulated: true,
      });
    }
  };

  // Stop Tracking
  const handleStopTracking = () => {
    setUserCoords(null);
    setIsSimulatedLocation(false);
    setLocationStatus('LOCATION TRACKING STOPPED');
    setGeoErrorMessage(null);
  };

  const configs = getLayerConfigs();

  return (
    <div className="flex flex-col h-full bg-[#0b0f17] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Top Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between px-3.5 py-2.5 bg-slate-900/95 border-b border-slate-800 text-xs backdrop-blur-md gap-2.5 z-10">
        <div className="flex items-center space-x-2.5">
          <div className="p-1 rounded bg-orange-500/10 border border-orange-500/30">
            <MapPin className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-100 tracking-wide font-mono text-xs">
                TACTICAL INCIDENT MAP
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                VERIFIED TILES
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Center: {incident && incident.latitude != null && incident.longitude != null ? `${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}` : 'No incident loaded'}
            </div>
          </div>
        </div>

        {/* Map Layer Selector */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
          {(Object.keys(configs) as MapLayerType[]).map((key) => (
            <button
              key={key}
              onClick={() => handleSwitchLayer(key)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                activeLayer === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={`Switch basemap to ${configs[key].name}`}
            >
              {configs[key].name}
            </button>
          ))}
        </div>

        {/* Location Status & Actions */}
        <div className="flex flex-wrap items-center space-x-2">
          {/* Status Badge */}
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider flex items-center space-x-1.5 ${
              locationStatus === 'LOCATION AVAILABLE'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : locationStatus === 'REQUESTING PERMISSION'
                ? 'bg-amber-950 text-amber-300 border border-amber-700 animate-pulse'
                : locationStatus === 'LOCATION PERMISSION DENIED'
                ? 'bg-red-950 text-red-300 border border-red-700'
                : locationStatus === 'SIMULATED LOCATION'
                ? 'bg-purple-950 text-purple-300 border border-purple-700'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            <span>{locationStatus}</span>
          </span>

          {userCoords && (
            <button
              onClick={handleStopTracking}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono transition border border-slate-700 cursor-pointer"
              title="Stop Location Tracking"
            >
              Stop Tracking
            </button>
          )}

          <button
            onClick={centerOnIncident}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium transition border border-slate-700 cursor-pointer"
            title="Recenter view on incident epicenter"
          >
            <Crosshair className="w-3.5 h-3.5 text-orange-400" />
            <span>Center Incident</span>
          </button>

          <button
            onClick={handleUseMyLocation}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold transition shadow-md shadow-blue-900/30 cursor-pointer"
            title="Request browser GPS location (zero secret API keys required)"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Use My Live Location</span>
          </button>

          <button
            onClick={handleUseSimulatedLocation}
            className="flex items-center space-x-1 px-2.5 py-1 bg-purple-950 hover:bg-purple-900 text-purple-300 rounded text-[11px] font-medium transition border border-purple-800/60 cursor-pointer"
            title="Simulate responder GPS telemetry for demonstration"
          >
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>Simulated GPS</span>
          </button>
        </div>
      </div>

      {/* Geolocation Notice / Error Banner */}
      {geoErrorMessage && (
        <div className="px-4 py-1.5 bg-amber-950/80 border-b border-amber-800/60 text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{geoErrorMessage}</span>
          </div>
          <button
            onClick={() => setGeoErrorMessage(null)}
            className="text-amber-400 hover:text-amber-100 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Map Tile Network Warning Fallback */}
      {tileErrorWarning && (
        <div className="px-4 py-1.5 bg-rose-950/80 border-b border-rose-800/60 text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-rose-400 shrink-0" />
            <span>External tile layer connectivity limited. Vector grid fallback active.</span>
          </div>
          <button
            onClick={() => handleSwitchLayer('STREET_MAP')}
            className="underline text-rose-300 hover:text-white font-mono text-[11px] cursor-pointer"
          >
            Switch to Street Vector
          </button>
        </div>
      )}

      {/* Map Canvas Container */}
      <div className="relative flex-1 w-full min-h-[380px] bg-[#090d16] tactical-map-grid">
        <div ref={mapContainerRef} className="absolute inset-0 z-0" />

        {/* Tactical Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-[11px] text-slate-300 shadow-2xl backdrop-blur-md max-w-xs pointer-events-auto">
          <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-800">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] font-mono">
              MAP LEGEND
            </span>
            <span className="text-[9px] text-blue-400 font-mono font-bold">
              {configs[activeLayer].name}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px]">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white inline-block"></span>
              <span>Incident Epicenter</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white inline-block"></span>
              <span>Your Location</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white inline-block"></span>
              <span>Thermal / Smoke</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-white inline-block"></span>
              <span>Road Closure</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 border border-white inline-block"></span>
              <span>Staging Area</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-red-500/80 bg-red-500/20 inline-block"></span>
              <span>350m Cordon</span>
            </div>
          </div>
        </div>

        {/* Location Privacy & Source Notice */}
        <div className="absolute top-3 right-3 z-[400] bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 text-[10px] text-slate-400 shadow-xl backdrop-blur-md max-w-sm pointer-events-auto font-mono">
          <span className="text-orange-400 font-semibold">Location Privacy: </span>
          Zero-watermark licensed maps. Browser GPS requires explicit user action.
        </div>
      </div>
    </div>
  );
};
