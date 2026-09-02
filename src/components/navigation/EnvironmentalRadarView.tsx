'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  ShieldAlert,
  ShieldCheck,
  Navigation,
  Loader2,
  AlertTriangle,
  Flame,
  Droplets,
  Truck,
  Car,
  Bike,
  Activity,
  MapPin,
  CloudRain,
} from 'lucide-react';

interface CriticalHazard {
  id: string;
  type: string;
  severity: string;
  risk: number;
  depth_cm: number;
  heat_c: number;
}

interface EvaluationResult {
  status: string;
  profile: string;
  vehicleType: string;
  telemetry: {
    safetyScore: number;
    hazardCount: number;
    maxRiskLevel: 'CRITICAL' | 'MODERATE' | 'CLEAR';
    criticalPoints: CriticalHazard[];
    liveWeather?: {
      precipitationMmPerHour: number;
      condition: string;
    };
  };
  routingDirective: 'REROUTE_RECOMMENDED' | 'CORRIDOR_SAFE';
}

const PRESET_LOCATIONS = [
  { label: 'Manila Port Hub (Origin)', coords: [120.9650, 14.5830] },
  { label: 'España Blvd Lowland (Hazard Test)', coords: [120.9842, 14.5995] },
  { label: 'Quezon City Central (Destination)', coords: [121.0437, 14.6500] },
  { label: 'Taguig High-Ridge (Safe Corridor)', coords: [121.0509, 14.5300] },
];

const KNOWN_HAZARDS = [
  { name: 'España Blvd Lowland Flood', depth: '35cm', coords: [120.9842, 14.5995] as [number, number] },
  { name: 'Taft Ave Basin Water Pooling', depth: '18cm', coords: [120.9920, 14.5750] as [number, number] },
];

export default function EnvironmentalRadarView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [origin, setOrigin] = useState<[number, number]>([120.9650, 14.5830]);
  const [destination, setDestination] = useState<[number, number]>([121.0437, 14.6500]);
  const [profile, setProfile] = useState<'flood_evasion' | 'thermal_heat' | 'particulate_dust'>('flood_evasion');
  const [vehicleType, setVehicleType] = useState<'motorcycle' | 'sedan' | 'high_clearance'>('sedan');
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_BASE =
    typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5000'
      : (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.miu33archstudio.xyz');

  const refreshMarkers = (m: maplibregl.Map) => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Origin Marker (Cyan A)
    const originEl = document.createElement('div');
    originEl.className =
      'w-6 h-6 rounded-full bg-cyan-500 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-slate-950 shadow-lg shadow-cyan-500/50 cursor-pointer hover:scale-110 transition-transform';
    originEl.innerHTML = 'A';
    const originMarker = new maplibregl.Marker({ element: originEl })
      .setLngLat(origin)
      .setPopup(
        new maplibregl.Popup({ offset: 14, className: 'cyber-map-popup' }).setHTML(`
          <div class="font-mono text-xs">
            <p class="text-[9px] text-cyan-400 font-bold tracking-wider uppercase">CORRIDOR ORIGIN</p>
            <p class="text-slate-200 font-semibold mt-0.5">Point A // Departure Node</p>
          </div>
        `)
      )
      .addTo(m);
    markersRef.current.push(originMarker);

    // Destination Marker (Emerald B)
    const destEl = document.createElement('div');
    destEl.className =
      'w-6 h-6 rounded-full bg-emerald-400 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-slate-950 shadow-lg shadow-emerald-500/50 cursor-pointer hover:scale-110 transition-transform';
    destEl.innerHTML = 'B';
    const destMarker = new maplibregl.Marker({ element: destEl })
      .setLngLat(destination)
      .setPopup(
        new maplibregl.Popup({ offset: 14, className: 'cyber-map-popup' }).setHTML(`
          <div class="font-mono text-xs">
            <p class="text-[9px] text-emerald-400 font-bold tracking-wider uppercase">DESTINATION TARGET</p>
            <p class="text-slate-200 font-semibold mt-0.5">Point B // Arrival Node</p>
          </div>
        `)
      )
      .addTo(m);
    markersRef.current.push(destMarker);

    // Hazard Nodes (Pulsing Red)
    KNOWN_HAZARDS.forEach((hazard) => {
      const hazardEl = document.createElement('div');
      hazardEl.className = 'relative flex items-center justify-center w-6 h-6 cursor-pointer hover:scale-125 transition-transform';
      hazardEl.innerHTML = `
        <span class="absolute w-full h-full rounded-full bg-rose-500/40 animate-ping"></span>
        <span class="relative w-3.5 h-3.5 rounded-full bg-rose-600 border border-white shadow-md shadow-rose-600/80"></span>
      `;
      const hazardMarker = new maplibregl.Marker({ element: hazardEl })
        .setLngLat(hazard.coords)
        .setPopup(
          new maplibregl.Popup({ offset: 14, className: 'cyber-map-popup' }).setHTML(`
            <div class="font-mono text-xs">
              <span class="text-[9px] px-1.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded font-bold uppercase">
                CRITICAL HAZARD
              </span>
              <p class="text-rose-300 font-bold mt-1.5">${hazard.name}</p>
              <p class="text-[10px] text-slate-400 mt-0.5">Inundation Depth: <span class="text-rose-400 font-bold">${hazard.depth}</span></p>
            </div>
          `)
        )
        .addTo(m);
      markersRef.current.push(hazardMarker);
    });
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-base': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-base-tiles',
            type: 'raster',
            source: 'osm-base',
            minzoom: 0,
            maxzoom: 19,
            paint: {
              'raster-saturation': -0.85, // Dims land terrain
              'raster-brightness-max': 0.55,
              'raster-contrast': 0.25,
            },
          },
        ],
      },
      center: [121.0000, 14.6000],
      zoom: 12,
    });

    map.current = mapInstance;
    mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    mapInstance.on('load', () => {
      mapInstance.resize();
      refreshMarkers(mapInstance);
    });

    const timer = setTimeout(() => {
      mapInstance.resize();
    }, 250);

    return () => {
      clearTimeout(timer);
      markersRef.current.forEach((m) => m.remove());
      mapInstance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      refreshMarkers(map.current);
    }
  }, [origin, destination]);

  const handleEvaluateCorridor = async () => {
    setLoading(true);
    setError(null);

    try {
      let coordinates: [number, number][] = [];

      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?overview=full&geometries=geojson`;
        const routeRes = await fetch(osrmUrl);
        const contentType = routeRes.headers.get('content-type') || '';

        if (routeRes.ok && contentType.includes('application/json')) {
          const routeData = await routeRes.json();
          if (routeData.routes && routeData.routes.length > 0) {
            coordinates = routeData.routes[0].geometry.coordinates;
          }
        }
      } catch {
        console.warn('OSRM rate-limited, applying direct path interpolation.');
      }

      if (!coordinates || coordinates.length < 2) {
        const steps = 15;
        coordinates = Array.from({ length: steps + 1 }, (_, i) => [
          origin[0] + ((destination[0] - origin[0]) * i) / steps,
          origin[1] + ((destination[1] - origin[1]) * i) / steps,
        ]);
      }

      const evalRes = await fetch(`${API_BASE}/api/router/evaluate-corridor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates,
          profile,
          vehicleType,
        }),
      });

      const contentType = evalRes.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`API Gateway returned HTTP ${evalRes.status}. Ensure server.js is running.`);
      }

      const evalData: EvaluationResult = await evalRes.json();
      if (!evalRes.ok) throw new Error((evalData as any).error || 'Evaluation failed.');

      setEvaluation(evalData);

      if (map.current) {
        const m = map.current;
        m.resize();

        const isCritical = evalData.routingDirective === 'REROUTE_RECOMMENDED';
        const coreColor = isCritical ? '#ff1744' : '#00e5ff';
        const glowColor = isCritical ? '#f43f5e' : '#06b6d4';

        const geoJsonData = {
          type: 'FeatureCollection' as const,
          features: [
            {
              type: 'Feature' as const,
              properties: {},
              geometry: {
                type: 'LineString' as const,
                coordinates,
              },
            },
          ],
        };

        if (m.getSource('route-path')) {
          (m.getSource('route-path') as maplibregl.GeoJSONSource).setData(geoJsonData);
        } else {
          m.addSource('route-path', { type: 'geojson', data: geoJsonData });
        }

        if (m.getLayer('route-line-glow')) {
          m.setPaintProperty('route-line-glow', 'line-color', glowColor);
        } else {
          m.addLayer({
            id: 'route-line-glow',
            type: 'line',
            source: 'route-path',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': glowColor,
              'line-width': 14,
              'line-opacity': 0.45,
            },
          });
        }

        if (m.getLayer('route-line-core')) {
          m.setPaintProperty('route-line-core', 'line-color', coreColor);
        } else {
          m.addLayer({
            id: 'route-line-core',
            type: 'line',
            source: 'route-path',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': coreColor,
              'line-width': 5,
            },
          });
        }

        refreshMarkers(m);

        const bounds = coordinates.reduce(
          (b, coord) => b.extend(coord as [number, number]),
          new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
        );
        m.fitBounds(bounds, { padding: 60, duration: 900 });
      }
    } catch (err: any) {
      setError(err.message || 'Spatial evaluation pipeline failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs text-slate-200">
      {/* Parameters Controls */}
      <div className="lg:col-span-1 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" /> CORRIDOR TELEMETRY
          </h2>
          <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
            POSTGIS // ACTIVE
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase text-slate-400">Target Profile</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'flood_evasion', label: 'Flood Evasion', icon: Droplets },
              { id: 'thermal_heat', label: 'Solar Heat', icon: Flame },
              { id: 'particulate_dust', label: 'Air Quality', icon: ShieldAlert },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProfile(p.id as any)}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-[10px] ${
                    profile === p.id
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-sm'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase text-slate-400">Vehicle Profile</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'motorcycle', label: 'Motorbike', icon: Bike },
              { id: 'sedan', label: 'Sedan', icon: Car },
              { id: 'high_clearance', label: 'Heavy Truck', icon: Truck },
            ].map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVehicleType(v.id as any)}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-[10px] ${
                    vehicleType === v.id
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-sm'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-slate-900">
          <label className="text-[10px] uppercase text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-cyan-400" /> Origin Coordinate (Point A)
          </label>
          <select
            onChange={(e) => setOrigin(JSON.parse(e.target.value))}
            value={JSON.stringify(origin)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-2 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {PRESET_LOCATIONS.map((loc, i) => (
              <option key={i} value={JSON.stringify(loc.coords)}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-emerald-400" /> Destination Coordinate (Point B)
          </label>
          <select
            onChange={(e) => setDestination(JSON.parse(e.target.value))}
            value={JSON.stringify(destination)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-2 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {PRESET_LOCATIONS.map((loc, i) => (
              <option key={i} value={JSON.stringify(loc.coords)}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleEvaluateCorridor}
          disabled={loading}
          className="w-full py-2.5 mt-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Evaluating Topography & Rain...</span>
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 fill-current" />
              <span>Run Spatial Risk Audit</span>
            </>
          )}
        </button>

        {error && (
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl flex items-center gap-2 text-[11px]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Vector Map Viewport & Metrics */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        {/* Real-time Map Canvas */}
        <div className="relative w-full h-80 min-h-80 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
          <style>{`
            /* Preserves Cyan/Blue for Manila Bay & Pasig River while darkening land & roads */
            .maplibregl-canvas-container canvas {
              filter: invert(96%) hue-rotate(195deg) brightness(85%) contrast(125%) saturate(220%) !important;
            }
            .cyber-map-popup .maplibregl-popup-content {
              background: rgba(2, 6, 23, 0.95) !important;
              border: 1px solid rgba(6, 182, 212, 0.35) !important;
              backdrop-filter: blur(12px) !important;
              color: #f8fafc !important;
              border-radius: 12px !important;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 0 15px rgba(6, 182, 212, 0.15) !important;
              padding: 10px 14px !important;
            }
            .cyber-map-popup .maplibregl-popup-tip {
              border-top-color: rgba(2, 6, 23, 0.95) !important;
              border-bottom-color: rgba(2, 6, 23, 0.95) !important;
            }
            .cyber-map-popup .maplibregl-popup-close-button {
              color: #64748b !important;
              font-size: 14px !important;
              padding: 4px 8px !important;
            }
            .cyber-map-popup .maplibregl-popup-close-button:hover {
              color: #22d3ee !important;
              background: transparent !important;
            }
          `}</style>
          <div
            ref={mapContainer}
            className="absolute inset-0 w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />

          <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 pointer-events-none z-10 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] font-mono text-cyan-300 font-bold tracking-wider">
              MAPLIBRE // SPATIAL RADAR
            </span>
          </div>

          {/* Repositioned Legend (Top-Right under Controls) */}
          <div className="absolute top-3 right-12 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl flex flex-col gap-1.5 z-10 font-mono text-[10px] pointer-events-none shadow-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
              <span className="text-slate-300 font-bold">Impassable / Reroute (Red)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
              <span className="text-slate-300 font-bold">Optimal / Safe Corridor (Cyan)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              <span className="text-slate-400">Hazard Node</span>
            </div>
          </div>
        </div>

        {/* Evaluation Output Details */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-200">CORRIDOR RISK TELEMETRY</h3>
            {evaluation && (
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1.5 ${
                  evaluation.routingDirective === 'CORRIDOR_SAFE'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {evaluation.routingDirective === 'CORRIDOR_SAFE' ? (
                  <ShieldCheck className="w-3.5 h-3.5" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5" />
                )}
                {evaluation.routingDirective}
              </span>
            )}
          </div>

          {!evaluation && !loading && (
            <p className="text-slate-500 text-[11px] py-4 text-center">
              Trigger a spatial audit on the left to calculate road passability and live rain telemetry.
            </p>
          )}

          {evaluation && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-500 uppercase">Safety Score</p>
                  <p
                    className={`text-xl font-bold mt-0.5 ${
                      evaluation.telemetry.safetyScore > 75
                        ? 'text-emerald-400'
                        : evaluation.telemetry.safetyScore > 45
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {evaluation.telemetry.safetyScore}%
                  </p>
                </div>

                <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-500 uppercase">Live Precipitation</p>
                  <p className="text-xl font-bold text-cyan-400 mt-0.5 flex items-center gap-1.5">
                    <CloudRain className="w-4 h-4" />
                    <span>{evaluation.telemetry.liveWeather?.precipitationMmPerHour ?? 0}</span>
                    <span className="text-[10px] font-normal text-slate-500">mm/h</span>
                  </p>
                </div>

                <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-500 uppercase">Hazards Intersected</p>
                  <p className="text-xl font-bold text-slate-100 mt-0.5">
                    {evaluation.telemetry.hazardCount} <span className="text-[10px] font-normal text-slate-500">Nodes</span>
                  </p>
                </div>

                <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-500 uppercase">Max Severity</p>
                  <p
                    className={`text-xl font-bold mt-0.5 ${
                      evaluation.telemetry.maxRiskLevel === 'CRITICAL'
                        ? 'text-rose-400'
                        : evaluation.telemetry.maxRiskLevel === 'MODERATE'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {evaluation.telemetry.maxRiskLevel}
                  </p>
                </div>
              </div>

              {evaluation.telemetry.liveWeather?.condition && (
                <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-between text-[11px] text-cyan-300">
                  <span className="flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-cyan-400" />
                    <strong>METEOROLOGICAL TELEMETRY:</strong> {evaluation.telemetry.liveWeather.condition}
                  </span>
                  <span className="text-[10px] text-slate-400">Open-Meteo Satellite Sync</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}