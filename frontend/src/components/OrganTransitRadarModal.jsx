import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Plane,
  Radio,
  Clock,
  Thermometer,
  Shield,
  Activity,
  Wind,
  Compass,
  AlertTriangle,
  CheckCircle2,
  X,
  Play,
  RotateCw,
  ExternalLink,
  MapPin,
  Sparkles
} from 'lucide-react';
import { playUiSound } from '../utils/audioFeedback';

// Simulated active transplant transit corridors across the regional network
const INITIAL_FLIGHTS = [
  {
    id: 'VEC-704',
    callsign: 'MEDEVAC-704',
    type: 'Air Medevac (Sikorsky S-76C)',
    organ: 'Heart',
    donorHospital: 'Mount Sinai Hospital',
    recipientHospital: 'Bellevue Medical Center',
    route: 'JFK Corridor -> Manhattan Heliport',
    originCoords: { x: 75, y: 35 },
    destCoords: { x: 38, y: 62 },
    progress: 58, // 0 to 100%
    altitude: '2,400 ft',
    speed: '145 kts',
    citLimitHours: 4.0,
    elapsedMinutes: 42,
    podTemp: 3.8,
    perfusionPressure: 78,
    status: 'EN ROUTE',
    weather: 'Clear (Wind: 8kt NW)',
    headwind: 8,
    urgency: 'CRITICAL',
    donorBlood: 'O-',
    recipientBlood: 'O-',
    etaMinutes: 18,
  },
  {
    id: 'VEC-912',
    callsign: 'AERO-DRONE-9',
    type: 'Autonomous EVTOL Cargo Drone',
    organ: 'Kidney (Left)',
    donorHospital: 'Stanford Health Care',
    recipientHospital: 'UCSF Medical Center',
    route: 'Palo Alto Air Corridor -> Parnassus Pod',
    originCoords: { x: 82, y: 78 },
    destCoords: { x: 28, y: 28 },
    progress: 32,
    altitude: '850 ft',
    speed: '92 kts',
    citLimitHours: 24.0,
    elapsedMinutes: 38,
    podTemp: 4.0,
    perfusionPressure: 64,
    status: 'EN ROUTE',
    weather: 'Light Fog (Wind: 14kt W)',
    headwind: 14,
    urgency: 'STABLE',
    donorBlood: 'A+',
    recipientBlood: 'A+',
    etaMinutes: 26,
  },
  {
    id: 'VEC-418',
    callsign: 'RAPID-GROUND-14',
    type: 'Priority Paramedic Courier',
    organ: 'Liver (Right Lobe)',
    donorHospital: 'Massachusetts General',
    recipientHospital: 'Brigham and Women’s Hospital',
    route: 'Express Emergency Highway Grid',
    originCoords: { x: 30, y: 40 },
    destCoords: { x: 68, y: 80 },
    progress: 84,
    altitude: 'Ground (Level)',
    speed: '58 mph',
    citLimitHours: 12.0,
    elapsedMinutes: 22,
    podTemp: 3.9,
    perfusionPressure: 72,
    status: 'FINAL APPROACH',
    weather: 'Dry (Clear)',
    headwind: 0,
    urgency: 'HIGH',
    donorBlood: 'B+',
    recipientBlood: 'B+',
    etaMinutes: 6,
  },
];

export default function OrganTransitRadarModal({ isOpen, onClose, selectedCorridorId = null }) {
  const [flights, setFlights] = useState(INITIAL_FLIGHTS);
  const [selectedFlightId, setSelectedFlightId] = useState(selectedCorridorId || INITIAL_FLIGHTS[0].id);
  const [radarSweepAngle, setRadarSweepAngle] = useState(0);
  const [isSimulatingLaunch, setIsSimulatingLaunch] = useState(false);
  const [adverseWeather, setAdverseWeather] = useState(false);

  // Radar continuous 360-degree sweep effect
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setRadarSweepAngle((prev) => (prev + 3) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Real-time flight vector telemetry progress simulation
  useEffect(() => {
    if (!isOpen) return;
    const flightTimer = setInterval(() => {
      setFlights((prevFlights) =>
        prevFlights.map((f) => {
          let nextProgress = f.progress + 0.35;
          let nextEta = Math.max(1, Math.round(f.etaMinutes - 0.05));
          if (nextProgress >= 100) {
            nextProgress = 15;
            nextEta = 35;
          }
          // Slight fluctuation in perfusion pod temp (tight 3.7 - 4.1°C bounds)
          const tempDelta = (Math.random() - 0.5) * 0.04;
          const nextTemp = Math.round((f.podTemp + tempDelta) * 10) / 10;
          return {
            ...f,
            progress: nextProgress,
            etaMinutes: nextEta,
            podTemp: Math.min(4.2, Math.max(3.6, nextTemp)),
          };
        })
      );
    }, 1000);
    return () => clearInterval(flightTimer);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentFlight = flights.find((f) => f.id === selectedFlightId) || flights[0];

  const handleSimulateNewLaunch = () => {
    setIsSimulatingLaunch(true);
    playUiSound('scan');
    setTimeout(() => {
      const newVector = {
        id: `VEC-${Math.floor(100 + Math.random() * 899)}`,
        callsign: `MEDEVAC-${Math.floor(100 + Math.random() * 899)}`,
        type: 'Express Air Medevac (Bell 429)',
        organ: 'Lung (Bilateral)',
        donorHospital: 'Cedars-Sinai Medical',
        recipientHospital: 'UCLA Health Ronald Reagan',
        route: 'Westwood Tactical Direct Flight',
        originCoords: { x: 20 + Math.random() * 20, y: 70 + Math.random() * 15 },
        destCoords: { x: 65 + Math.random() * 20, y: 25 + Math.random() * 20 },
        progress: 5,
        altitude: '1,800 ft',
        speed: '138 kts',
        citLimitHours: 6.0,
        elapsedMinutes: 4,
        podTemp: 3.7,
        perfusionPressure: 82,
        status: 'JUST LAUNCHED',
        weather: 'Clear (Optimal)',
        headwind: 5,
        urgency: 'CRITICAL',
        donorBlood: 'O+',
        recipientBlood: 'O+',
        etaMinutes: 14,
      };
      setFlights((prev) => [newVector, ...prev]);
      setSelectedFlightId(newVector.id);
      setIsSimulatingLaunch(false);
      playUiSound('success');
    }, 800);
  };

  const toggleAdverseWeather = () => {
    setAdverseWeather(!adverseWeather);
    playUiSound('click');
    setFlights((prev) =>
      prev.map((f) => ({
        ...f,
        headwind: adverseWeather ? 8 : 28,
        weather: adverseWeather ? 'Clear (Optimal)' : '⚠️ Severe Squall / 28kt Headwind',
        etaMinutes: adverseWeather ? Math.max(5, f.etaMinutes - 8) : f.etaMinutes + 12,
      }))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-1 border border-line w-full max-w-6xl max-h-[92vh] rounded-[28px] overflow-hidden shadow-2xl flex flex-col font-sans">
        {/* Radar Command Header */}
        <div className="p-4 px-6 border-b border-line flex items-center justify-between bg-surface-0/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-signal-info/10 border border-signal-info/30 flex items-center justify-center text-signal-info">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-medium text-ink-primary tracking-tight">
                  ACTIVE ORGAN TRANSIT FLIGHT RADAR
                </h2>
                <span className="augen-tag">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal-stable animate-ping" />
                  3 HUBS TRACKED
                </span>
                {adverseWeather && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-signal-critical/20 text-signal-critical border border-signal-critical/40 animate-pulse">
                    WEATHER DELAY SIMULATED
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-secondary font-mono mt-0.5">
                Real-Time ADS-B Transponder Stream • Cold-Chain Sensor Telemetry • Ischemia Deadlines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleAdverseWeather}
              className={`px-3 py-1.5 rounded-full border text-xs font-mono transition-all flex items-center gap-1.5 ${
                adverseWeather
                  ? 'bg-signal-critical/20 text-signal-critical border-signal-critical/40'
                  : 'bg-surface-2 text-ink-secondary hover:text-ink-primary border-line'
              }`}
              title="Simulate headwind meteorological delays on Cold Ischemia Time"
            >
              <Wind className="w-3.5 h-3.5" />
              <span>{adverseWeather ? 'Clear Storm' : 'Simulate Squall'}</span>
            </button>

            <button
              onClick={handleSimulateNewLaunch}
              disabled={isSimulatingLaunch}
              className="btn-primary-action text-xs font-mono"
            >
              {isSimulatingLaunch ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plane className="w-3.5 h-3.5" />
              )}
              <span>Dispatch Medevac</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-2 text-ink-secondary hover:text-ink-primary transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Radar Main Display Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Tactical GIS Radar Map Canvas (7 cols) */}
          <div className="lg:col-span-7 bg-[#050811] relative p-4 flex flex-col justify-between overflow-hidden min-h-[420px] border-b lg:border-b-0 lg:border-r border-line">
            {/* Holographic Radar Concentric Circles */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[180px] h-[180px] rounded-full border border-signal-info/10" />
              <div className="w-[340px] h-[340px] rounded-full border border-signal-info/15" />
              <div className="w-[500px] h-[500px] rounded-full border border-signal-info/10" />
              <div className="w-[660px] h-[660px] rounded-full border border-signal-info/5" />
              {/* Radar Crosshairs */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-[1px] bg-signal-info/10" />
                <div className="absolute h-full w-[1px] bg-signal-info/10" />
              </div>

              {/* Sweeping Radar Beam */}
              <div
                className="absolute w-[500px] h-[500px] rounded-full pointer-events-none origin-center"
                style={{
                  transform: `rotate(${radarSweepAngle}deg)`,
                  background: 'conic-gradient(from 0deg, rgba(0, 113, 227, 0.25) 0deg, rgba(0, 113, 227, 0) 60deg, transparent 360deg)',
                }}
              />
            </div>

            {/* Top Tactical Telemetry Watermark */}
            <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-cyan-400/80">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 animate-pulse text-signal-info" />
                <span>FREQUENCY: 121.500 MHz (VHF EMERGENCY)</span>
              </div>
              <div className="flex items-center gap-3 text-ink-muted">
                <span>GPS LOCK: 37.7749° N, 122.4194° W</span>
                <span>RANGE: 120 NM</span>
              </div>
            </div>

            {/* Flight Vectors SVG Layer */}
            <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="vectorBeam" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0071e3" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {flights.map((f) => {
                const isSelected = f.id === selectedFlightId;
                // Calculate current plane position along line
                const currX = f.originCoords.x + (f.destCoords.x - f.originCoords.x) * (f.progress / 100);
                const currY = f.originCoords.y + (f.destCoords.y - f.originCoords.y) * (f.progress / 100);

                return (
                  <g key={f.id}>
                    {/* Path Arc */}
                    <line
                      x1={f.originCoords.x}
                      y1={f.originCoords.y}
                      x2={f.destCoords.x}
                      y2={f.destCoords.y}
                      stroke={isSelected ? '#0071e3' : 'rgba(255,255,255,0.18)'}
                      strokeWidth={isSelected ? '0.7' : '0.4'}
                      strokeDasharray={isSelected ? '1 1.5' : '0.8 2'}
                    />

                    {/* Origin Hub */}
                    <circle cx={f.originCoords.x} cy={f.originCoords.y} r="1.4" fill="#0071e3" />
                    {/* Destination Hub */}
                    <circle cx={f.destCoords.x} cy={f.destCoords.y} r="1.6" fill="#10b981" />

                    {/* Progress Marker Plane */}
                    <circle
                      cx={currX}
                      cy={currY}
                      r={isSelected ? '2.4' : '1.8'}
                      fill={isSelected ? '#38bdf8' : '#ffffff'}
                      className="transition-all duration-300"
                    />
                    {isSelected && (
                      <circle
                        cx={currX}
                        cy={currY}
                        r="4.2"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="0.4"
                        className="animate-ping"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Interactive Flight Pins Overlay */}
            <div className="absolute inset-0 z-20 pointer-events-auto">
              {flights.map((f) => {
                const isSelected = f.id === selectedFlightId;
                const currX = f.originCoords.x + (f.destCoords.x - f.originCoords.x) * (f.progress / 100);
                const currY = f.originCoords.y + (f.destCoords.y - f.originCoords.y) * (f.progress / 100);

                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFlightId(f.id);
                      playUiSound('click');
                    }}
                    style={{ left: `${currX}%`, top: `${currY}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full transition-transform hover:scale-125 focus:outline-none ${
                      isSelected
                        ? 'bg-signal-info text-white shadow-[0_0_15px_#0071e3]'
                        : 'bg-slate-900/90 text-cyan-300 border border-cyan-500/40'
                    }`}
                    title={`${f.callsign} (${f.organ})`}
                  >
                    <Plane className="w-3.5 h-3.5 transform -rotate-45" />
                  </button>
                );
              })}
            </div>

            {/* Bottom Radar Status Bar */}
            <div className="relative z-10 flex items-center justify-between text-[11px] font-mono bg-black/60 backdrop-blur-md p-2 px-3 rounded-full border border-white/10 text-white/70">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ADS-B RADAR SCANNER ACTIVE
              </span>
              <span>CLICK ANY VECTOR PIN TO INSPECT TELEMETRY</span>
            </div>
          </div>

          {/* Telemetry Detail Dossier (5 cols) */}
          <div className="lg:col-span-5 p-5 flex flex-col justify-between overflow-y-auto bg-surface-1">
            <div className="space-y-4">
              {/* Flight Vector Select Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-surface-0 rounded-full border border-line">
                {flights.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFlightId(f.id);
                      playUiSound('click');
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-full text-xs font-mono transition-all truncate ${
                      f.id === selectedFlightId
                        ? 'bg-surface-1 text-ink-primary shadow-sm font-semibold border border-line'
                        : 'text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    {f.callsign.split('-')[0]}-{f.id.split('-')[1]}
                  </button>
                ))}
              </div>

              {/* Selected Vector Header */}
              <div className="panel p-4 space-y-3 bg-surface-0 border-line">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="augen-tag mb-1">
                      {currentFlight.organ} BIO-POD TRANSIT
                    </span>
                    <h3 className="text-lg font-medium text-ink-primary font-sans mt-1">
                      {currentFlight.callsign}
                    </h3>
                    <p className="text-xs text-ink-secondary font-mono">
                      {currentFlight.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase text-ink-secondary block">ETA</span>
                    <span className="text-xl font-mono font-bold text-signal-info">
                      {currentFlight.etaMinutes}m
                    </span>
                  </div>
                </div>

                {/* Progress bar to destination */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-ink-secondary">
                    <span>PROGRESS: {Math.round(currentFlight.progress)}%</span>
                    <span className="text-signal-stable font-semibold">{currentFlight.status}</span>
                  </div>
                  <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden border border-line">
                    <div
                      className="bg-gradient-to-r from-signal-info to-signal-stable h-full rounded-full transition-all duration-500"
                      style={{ width: `${currentFlight.progress}%` }}
                    />
                  </div>
                </div>

                {/* Origin -> Destination Route */}
                <div className="pt-2 border-t border-line text-xs font-mono space-y-1.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-signal-info shrink-0" />
                    <span className="text-ink-secondary">Origin:</span>
                    <span className="text-ink-primary font-medium truncate">{currentFlight.donorHospital}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-signal-stable shrink-0" />
                    <span className="text-ink-secondary">Destination:</span>
                    <span className="text-ink-primary font-medium truncate">{currentFlight.recipientHospital}</span>
                  </div>
                </div>
              </div>

              {/* Critical Bio-Pod Telemetry Strip */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {/* Cold-Chain Core Temperature */}
                <div className="panel p-3 bg-surface-0 border-line space-y-1">
                  <div className="flex items-center justify-between text-ink-secondary text-[11px]">
                    <span className="flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                      POD CORE TEMP
                    </span>
                    <span className="text-signal-stable font-bold">NORMAL</span>
                  </div>
                  <p className="text-xl font-bold text-ink-primary">
                    {currentFlight.podTemp.toFixed(1)}°C
                  </p>
                  <p className="text-[10px] text-ink-muted">Target Range: 2.0°C – 4.0°C</p>
                </div>

                {/* Cold Ischemia Time Remaining */}
                <div className="panel p-3 bg-surface-0 border-line space-y-1">
                  <div className="flex items-center justify-between text-ink-secondary text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      CIT DEADLINE
                    </span>
                    <span className="text-amber-500 font-bold">&lt;{currentFlight.citLimitHours}h</span>
                  </div>
                  <p className="text-xl font-bold text-ink-primary">
                    {(currentFlight.citLimitHours - currentFlight.elapsedMinutes / 60).toFixed(1)}h
                  </p>
                  <p className="text-[10px] text-ink-muted">Elapsed: {currentFlight.elapsedMinutes} mins</p>
                </div>

                {/* Perfusion Pulse Pressure */}
                <div className="panel p-3 bg-surface-0 border-line space-y-1">
                  <div className="flex items-center justify-between text-ink-secondary text-[11px]">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-emerald-500" />
                      PERFUSION
                    </span>
                    <span className="text-emerald-500 font-bold">ACTIVE</span>
                  </div>
                  <p className="text-lg font-bold text-ink-primary">
                    {currentFlight.perfusionPressure} <span className="text-xs font-normal text-ink-secondary">mmHg</span>
                  </p>
                  <p className="text-[10px] text-ink-muted">Continuous Pulsatile Perfusion</p>
                </div>

                {/* Airspeed & Altitude */}
                <div className="panel p-3 bg-surface-0 border-line space-y-1">
                  <div className="flex items-center justify-between text-ink-secondary text-[11px]">
                    <span className="flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-blue-500" />
                      AIRSPEED
                    </span>
                    <span className="text-ink-secondary">{currentFlight.altitude}</span>
                  </div>
                  <p className="text-lg font-bold text-ink-primary">
                    {currentFlight.speed}
                  </p>
                  <p className="text-[10px] text-ink-muted">Headwind: {currentFlight.headwind} kts</p>
                </div>
              </div>

              {/* Weather & Meteorological Advisory */}
              <div className="panel p-3 bg-surface-0 border-line text-xs font-mono flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-ink-secondary block text-[10px]">CORRIDOR METEOROLOGY</span>
                    <span className="text-ink-primary font-medium">{currentFlight.weather}</span>
                  </div>
                </div>
                <span className="text-signal-stable font-bold text-[11px]">IFR CLEARANCE</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-line flex items-center justify-between gap-3 text-xs font-mono">
              <span className="text-ink-muted text-[11px]">
                ADS-B Transponder Stream Verified
              </span>
              <button
                onClick={() => {
                  playUiSound('success');
                  onClose();
                }}
                className="btn-primary-action text-xs"
              >
                Confirm Vector Monitor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
