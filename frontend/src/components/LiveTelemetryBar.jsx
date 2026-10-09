import { useState, useEffect } from 'react';
import { 
  Radio, 
  Play, 
  Pause, 
  Zap, 
  Plane, 
  Wind, 
  CloudSun, 
  TrendingUp, 
  RefreshCw,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { getSimulationStatus, toggleSimulation, triggerSimulationEvent, getHubWeather } from '../api/client';
import { useSocket } from '../hooks/useSocket';

export default function LiveTelemetryBar() {
  const [status, setStatus] = useState({ isRunning: true, intervalMs: 20000, lastEvent: null });
  const [weatherData, setWeatherData] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showWeatherPanel, setShowWeatherPanel] = useState(false);
  const { lastEvent } = useSocket();

  const fetchStatus = () => {
    getSimulationStatus().then(setStatus).catch(console.error);
  };

  const fetchWeather = () => {
    setWeatherLoading(true);
    getHubWeather()
      .then((res) => {
        if (res.hubs) setWeatherData(res.hubs);
      })
      .catch(console.error)
      .finally(() => setWeatherLoading(false));
  };

  useEffect(() => {
    fetchStatus();
    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 120000); // 2 minutes
    return () => clearInterval(weatherInterval);
  }, []);

  useEffect(() => {
    if (lastEvent?.type === 'simulation:event' || lastEvent?.type === 'donor:registered' || lastEvent?.type === 'recipient:escalated') {
      fetchStatus();
    }
  }, [lastEvent]);

  const handleToggle = async () => {
    setActionLoading(true);
    try {
      const res = await toggleSimulation({ running: !status.isRunning });
      setStatus(res);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTrigger = async (type = 'DONOR_DECLARED') => {
    setActionLoading(true);
    try {
      await triggerSimulationEvent(type);
      fetchStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Primary Real-Time Ticker & Control Bar */}
      <div className="panel p-3 bg-surface-1/90 border-line backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-sm font-mono text-xs">
        {/* Left: Live Status & Autonomous Beacon */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {status.isRunning && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${status.isRunning ? 'bg-rose-500' : 'bg-ink-secondary'}`}></span>
            </span>
            <span className="font-bold text-ink-primary tracking-tight">
              {status.isRunning ? 'LIVE HOSPITAL TELEMETRY' : 'TELEMETRY PAUSED'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-line text-cyan-400 hidden sm:inline">
              15 HUBS SYNCED
            </span>
          </div>

          {/* Last Live Broadcast Ticker */}
          {status.lastEvent && (
            <div className="hidden md:flex items-center gap-2 text-ink-secondary border-l border-line pl-3 max-w-md truncate">
              <span className="text-[10px] text-cyan-400 font-bold uppercase truncate">
                ⚡ {status.lastEvent.title}:
              </span>
              <span className="text-[11px] text-ink-primary truncate">
                {status.lastEvent.message}
              </span>
            </div>
          )}
        </div>

        {/* Right: Interactive Command Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowWeatherPanel(!showWeatherPanel)}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 border transition-all ${
              showWeatherPanel 
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-glow-cyan' 
                : 'bg-surface-2 hover:bg-surface-3 text-ink-primary border-line'
            }`}
          >
            <CloudSun className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Aviation Corridors</span> ({weatherData.length})
          </button>

          <button
            disabled={actionLoading}
            onClick={() => handleTrigger('DONOR_DECLARED')}
            className="px-2.5 py-1 rounded text-[11px] font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 hover:border-rose-400 transition-all flex items-center gap-1 shadow-sm active:scale-95"
            title="Simulate sudden brain death organ declaration at random hospital"
          >
            <Zap className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Simulate</span> Donor
          </button>

          <button
            disabled={actionLoading}
            onClick={() => handleTrigger('URGENCY_ESCALATION')}
            className="px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40 hover:border-amber-400 transition-all flex items-center gap-1 shadow-sm active:scale-95"
            title="Simulate clinical MELD deterioration for a waiting patient"
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Simulate</span> Escalation
          </button>

          <button
            disabled={actionLoading}
            onClick={handleToggle}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold border flex items-center gap-1 transition-all ${
              status.isRunning
                ? 'bg-surface-2 hover:bg-surface-3 text-ink-secondary border-line'
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
            }`}
          >
            {status.isRunning ? (
              <>
                <Pause className="w-3 h-3 text-amber-400" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-emerald-400" />
                <span>Resume Feed</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Real-World Aviation & Weather Telemetry Strip */}
      {showWeatherPanel && (
        <div className="panel p-3.5 bg-surface-1/95 border-line rounded-xl space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200 font-mono">
          <div className="flex items-center justify-between border-b border-line pb-2 text-xs">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-ink-primary uppercase tracking-wider">
                Real-World Meteorological &amp; Transit Corridor Telemetry (Open-Meteo)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-ink-secondary">
              <span>Live Conditions Grounded in GPS Coordinates</span>
              <button 
                onClick={fetchWeather}
                className="hover:text-cyan-400 p-1 rounded transition-colors"
                title="Refresh meteorological feeds"
              >
                <RefreshCw className={`w-3 h-3 ${weatherLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {weatherData.map((hub) => {
              const isClear = hub.transitStatus === 'AIR_CORRIDOR_CLEAR';
              return (
                <div 
                  key={hub.city} 
                  className={`p-2 rounded-lg border text-[11px] space-y-1 transition-all ${
                    isClear 
                      ? 'bg-surface-0/90 border-line hover:border-cyan-500/40' 
                      : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-ink-primary truncate">{hub.city}</span>
                    <span className="text-cyan-400">{hub.temperature.toFixed(0)}°C</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-ink-secondary">
                    <span className="flex items-center gap-0.5">
                      <Wind className="w-2.5 h-2.5" /> {hub.windSpeed} km/h
                    </span>
                    <span className={`px-1 rounded text-[9px] font-bold ${
                      isClear ? 'text-emerald-400 bg-emerald-950/60' : 'text-amber-400 bg-amber-950/60'
                    }`}>
                      {isClear ? 'CLEAR' : 'ATC WARN'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-ink-secondary flex items-center justify-between pt-1">
            <span>Aviation Corridor Status: All 15 transplant flight corridors authorized for organ transit.</span>
            <span className="text-emerald-400">CAT-I / CAT-II VFR Ready</span>
          </p>
        </div>
      )}
    </div>
  );
}
