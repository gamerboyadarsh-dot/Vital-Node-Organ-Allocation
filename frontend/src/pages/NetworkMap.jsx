import React from 'react';
import NetworkWorldMap from '../components/NetworkWorldMap';
import { Globe, MapPin, Building2, Navigation, Activity } from 'lucide-react';

export default function NetworkMap() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 page-enter">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-signal-info/10 text-signal-info rounded-xl border border-signal-info/30">
              <Globe className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink-primary tracking-tight">
                Geographic Organ Allocation & Logistics Map
              </h1>
              <p className="text-xs text-ink-secondary font-mono mt-0.5">
                Real-World Relational GIS Topology • 15 Regional Hospital Hubs • Active Transit Vectors
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="augen-tag">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-stable animate-ping" />
            LIVE POSTGIS / HAVERSINE TOPOLOGY
          </span>
        </div>
      </div>

      {/* ── Interactive Leaflet World & Regional Map ─────────────────── */}
      <NetworkWorldMap height="72vh" />
    </div>
  );
}
