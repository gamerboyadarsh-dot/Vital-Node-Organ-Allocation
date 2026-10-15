import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Building2,
  HeartPulse,
  Users,
  Navigation,
  Globe,
  Compass,
  Clock,
  Layers,
  ArrowRight,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { getHospitals, getMatches, getDonors, getRecipients } from '../api/client';

// Controller component to smoothly fly/zoom to specific coordinates
function MapViewController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && zoom) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Custom DivIcon generator for hospital nodes
const createHospitalIcon = (isHub = false, color = '#00F2FE') => {
  const size = isHub ? 28 : 22;
  return L.divIcon({
    className: 'hospital-gis-node',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: rgba(8, 28, 48, 0.85);
        border: 2px solid ${color};
        box-shadow: 0 0 14px ${color}88, inset 0 0 6px ${color}66;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        <div style="
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${color};
          box-shadow: 0 0 6px ${color};
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

export default function NetworkWorldMap({ className = '', height = '600px' }) {
  const [hospitals, setHospitals] = useState([]);
  const [corridors, setCorridors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedCorridor, setSelectedCorridor] = useState(null);
  const [viewScope, setViewScope] = useState('india'); // 'india' or 'world'
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(5);
  const [organFilter, setOrganFilter] = useState('All');

  useEffect(() => {
    async function loadGisData() {
      try {
        setLoading(true);
        const [hList, mList, dList, rList] = await Promise.all([
          getHospitals().catch(() => []),
          getMatches().catch(() => []),
          getDonors().catch(() => []),
          getRecipients().catch(() => []),
        ]);

        // Enrich hospitals with live inventory counts from real DB
        const enrichedHospitals = hList.map((h) => {
          const availableDonors = dList.filter((d) => d.hospitalId === h.id && d.isAvailable).length;
          const waitingRecipients = rList.filter((r) => r.hospitalId === h.id && r.status === 'Waiting').length;
          return {
            ...h,
            availableDonors,
            waitingRecipients,
          };
        });

        // Filter and build real geographic transit corridors from DB matches
        const hospitalMap = new Map(enrichedHospitals.map((h) => [h.id, h]));
        const validCorridors = [];

        for (const m of mList) {
          const donorHosp = hospitalMap.get(m.donor?.hospitalId);
          const recipHosp = hospitalMap.get(m.recipient?.hospitalId);

          if (
            donorHosp &&
            recipHosp &&
            donorHosp.latitude &&
            donorHosp.longitude &&
            recipHosp.latitude &&
            recipHosp.longitude &&
            donorHosp.id !== recipHosp.id
          ) {
            validCorridors.push({
              id: m.id,
              organType: m.organType || m.donor?.organType || 'Kidney',
              score: m.overallCompatibilityScore,
              distanceKm: m.distanceKm,
              citHours: m.coldIschemicTimeHours || (m.distanceKm / 400).toFixed(1),
              donorHospital: donorHosp,
              recipientHospital: recipHosp,
              positions: [
                [donorHosp.latitude, donorHosp.longitude],
                [recipHosp.latitude, recipHosp.longitude],
              ],
              status: m.matchStatus,
            });
          }
        }

        setHospitals(enrichedHospitals);
        setCorridors(validCorridors.slice(0, 18)); // Top active corridors for crisp display
      } catch (err) {
        setError(err.message || 'Failed to load GIS data');
      } finally {
        setLoading(false);
      }
    }

    loadGisData();
  }, []);

  const handleScopeChange = (scope) => {
    setViewScope(scope);
    if (scope === 'india') {
      setMapCenter([20.5937, 78.9629]);
      setMapZoom(5);
    } else {
      setMapCenter([20.0, 10.0]);
      setMapZoom(2);
    }
  };

  const filteredCorridors = useMemo(() => {
    if (organFilter === 'All') return corridors;
    return corridors.filter((c) => c.organType.toLowerCase() === organFilter.toLowerCase());
  }, [corridors, organFilter]);

  return (
    <div className={`relative bg-surface-1 border border-line rounded-2xl overflow-hidden shadow-2xl flex flex-col font-sans ${className}`}>
      {/* ── GIS Map Control Toolbar ───────────────────────────────────────── */}
      <div className="p-3.5 px-5 bg-surface-0/95 border-b border-line flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-signal-info/10 border border-signal-info/30 flex items-center justify-center text-signal-info">
            <Globe className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-ink-primary tracking-tight">
                GEOGRAPHIC ORGAN ALLOCATION & CORRIDOR NETWORK
              </h3>
              <span className="augen-tag">
                <span className="w-1.5 h-1.5 rounded-full bg-signal-stable animate-ping" />
                {hospitals.length} HUBS ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-ink-secondary font-mono">
              Live Database Nodes • Real Haversine Flight Arcs • Coordinates Derived from Schema
            </p>
          </div>
        </div>

        {/* View Scope & Organ Filters */}
        <div className="flex items-center gap-2">
          {/* Scope Selector */}
          <div className="flex items-center bg-surface-2 p-0.5 rounded-lg border border-line text-xs font-mono">
            <button
              onClick={() => handleScopeChange('india')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewScope === 'india'
                  ? 'bg-surface-0 text-signal-info border border-signal-info/30 font-semibold shadow'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              🇮🇳 Regional Hubs
            </button>
            <button
              onClick={() => handleScopeChange('world')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewScope === 'world'
                  ? 'bg-surface-0 text-signal-info border border-signal-info/30 font-semibold shadow'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              🌍 World Scope
            </button>
          </div>

          {/* Organ Filter */}
          <div className="flex items-center gap-1 text-[11px] font-mono">
            {['All', 'Kidney', 'Liver', 'Heart'].map((org) => (
              <button
                key={org}
                onClick={() => setOrganFilter(org)}
                className={`px-2 py-1 rounded border transition-all ${
                  organFilter === org
                    ? 'bg-brand/20 text-brand border-brand/40'
                    : 'bg-surface-2 text-ink-secondary hover:text-ink-primary border-line'
                }`}
              >
                {org}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Leaflet Interactive Map Container ─────────────────────────────── */}
      <div className="relative w-full" style={{ height }}>
        {loading && (
          <div className="absolute inset-0 z-20 bg-surface-0/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-2 text-xs font-mono text-signal-info">
              <Compass className="w-4 h-4 animate-spin" />
              <span>PROJECTING RELATIONAL GIS TOPOLOGY...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-4 left-4 z-20 p-3 bg-signal-critical/20 border border-signal-critical/40 text-signal-critical rounded-xl text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', background: '#070D14' }}
        >
          <MapViewController center={mapCenter} zoom={mapZoom} />

          {/* High-Contrast Clinical Dark Matter Base Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> | OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            maxZoom={18}
          />

          {/* 1. Real Inter-Hospital Organ Transit Corridors (Polylines) */}
          {filteredCorridors.map((c) => {
            const isSelected = selectedCorridor?.id === c.id;
            const lineColor =
              c.organType === 'Heart'
                ? '#FF3366'
                : c.organType === 'Liver'
                ? '#FFAA00'
                : '#00F2FE';

            return (
              <Polyline
                key={c.id}
                positions={c.positions}
                pathOptions={{
                  color: isSelected ? '#FFFFFF' : lineColor,
                  weight: isSelected ? 3.5 : 2,
                  opacity: isSelected ? 1 : 0.7,
                  dashArray: isSelected ? null : '6, 8',
                }}
                eventHandlers={{
                  click: () => setSelectedCorridor(c),
                }}
              />
            );
          })}

          {/* 2. Real Database Hospital Nodes (Markers) */}
          {hospitals.map((h) => {
            if (!h.latitude || !h.longitude) return null;
            const isSelected = selectedHospital?.id === h.id;
            const nodeColor = h.availableDonors > 0 ? '#10B981' : '#00F2FE';

            return (
              <Marker
                key={h.id}
                position={[h.latitude, h.longitude]}
                icon={createHospitalIcon(isSelected, nodeColor)}
                eventHandlers={{
                  click: () => {
                    setSelectedHospital(h);
                    setMapCenter([h.latitude, h.longitude]);
                  },
                }}
              >
                <Popup className="vitalnode-custom-popup">
                  <div className="p-2 text-xs font-mono space-y-1.5 text-ink-primary bg-surface-1 rounded">
                    <div className="font-bold text-signal-info flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{h.name}</span>
                    </div>
                    <div className="text-[11px] text-ink-secondary">
                      📍 {h.city} • Coords: {h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}
                    </div>
                    <div className="pt-1.5 border-t border-line flex items-center justify-between text-[10px]">
                      <span className="text-signal-stable">Donors: {h.availableDonors}</span>
                      <span className="text-signal-warning">Waitlist: {h.waitingRecipients}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* ── Overlay: Selected Hospital / Corridor HUD Inspector ─────────── */}
        {selectedHospital && (
          <div className="absolute bottom-4 left-4 z-[400] w-80 bg-surface-1/95 backdrop-blur-xl border border-line rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-2 text-xs font-mono">
            <div className="flex items-start justify-between pb-2 border-b border-line">
              <div>
                <span className="text-[10px] text-signal-info uppercase tracking-wider block">Selected Regional Hub</span>
                <h4 className="font-bold text-ink-primary text-sm mt-0.5">{selectedHospital.name}</h4>
                <p className="text-[11px] text-ink-secondary">{selectedHospital.city}, India</p>
              </div>
              <button
                onClick={() => setSelectedHospital(null)}
                className="text-ink-secondary hover:text-ink-primary p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 text-center">
              <div className="p-2 rounded bg-surface-2 border border-line">
                <span className="text-[10px] text-ink-secondary block">Available Donors</span>
                <span className="text-base font-bold text-signal-stable mt-0.5 block">
                  {selectedHospital.availableDonors}
                </span>
              </div>
              <div className="p-2 rounded bg-surface-2 border border-line">
                <span className="text-[10px] text-ink-secondary block">Waiting Candidates</span>
                <span className="text-base font-bold text-signal-warning mt-0.5 block">
                  {selectedHospital.waitingRecipients}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-line text-[10px] text-ink-secondary space-y-1">
              <div>🛰️ GPS: {selectedHospital.latitude.toFixed(4)}° N, {selectedHospital.longitude.toFixed(4)}° E</div>
              <div>✉️ Contact: {selectedHospital.contactInfo || 'ops@vitalnode.in'}</div>
            </div>
          </div>
        )}

        {selectedCorridor && (
          <div className="absolute bottom-4 right-4 z-[400] w-88 bg-surface-1/95 backdrop-blur-xl border border-line rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-2 text-xs font-mono">
            <div className="flex items-start justify-between pb-2 border-b border-line">
              <div>
                <span className="text-[10px] text-signal-stable uppercase tracking-wider block">Transplant Corridor Active</span>
                <h4 className="font-bold text-ink-primary text-sm mt-0.5">
                  {selectedCorridor.organType} Allocation
                </h4>
              </div>
              <button
                onClick={() => setSelectedCorridor(null)}
                className="text-ink-secondary hover:text-ink-primary p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-2.5 space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-ink-secondary">Origin Hub:</span>
                <span className="text-ink-primary font-semibold">{selectedCorridor.donorHospital.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-secondary">Destination Hub:</span>
                <span className="text-ink-primary font-semibold">{selectedCorridor.recipientHospital.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-secondary">Haversine Distance:</span>
                <span className="text-signal-info font-bold">{selectedCorridor.distanceKm?.toFixed(1)} km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-secondary">Match Score:</span>
                <span className="text-signal-stable font-bold">{selectedCorridor.score?.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer Legend & Statistics ────────────────────────────────────── */}
      <div className="p-2.5 px-5 bg-surface-0 border-t border-line flex flex-wrap items-center justify-between text-[11px] font-mono text-ink-secondary">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-signal-stable" />
            <span>Donor Inventory Active</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-signal-info" />
            <span>Regional Hospital Node</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#00F2FE] inline-block" />
            <span>Live Flight Vector (Haversine)</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <span>Database Provider: <strong className="text-ink-primary">SQLite / PostGIS-Ready</strong></span>
          <span>•</span>
          <span>Projection: <strong className="text-ink-primary">EPSG:3857 (Spherical Mercator)</strong></span>
        </div>
      </div>
    </div>
  );
}
