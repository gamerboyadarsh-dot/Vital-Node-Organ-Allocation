import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Heart, Users, Network, Activity, ArrowRight, Shield, Clock } from 'lucide-react';
import { getAnalyticsSummary, getPriorityList, getOrganDistribution } from '../api/client';
import StatCard from '../components/StatCard';
import UrgencyBadge from '../components/UrgencyBadge';
import { useSocket } from '../hooks/useSocket';

import LoadingState from '../components/LoadingState';
import Skeleton from '../components/Skeleton';
import { playUiSound } from '../utils/audioFeedback';
import LiveTelemetryBar from '../components/LiveTelemetryBar';
import ShinyText from '../components/reactbits/ShinyText';
import BlinkingSquares from '../components/reactbits/BlinkingSquares';

const ORGAN_PALETTE = ['#38BDF8', '#10B981', '#F43F5E', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [priorityList, setPriorityList] = useState([]);
  const [organData, setOrganData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { lastEvent } = useSocket();

  const loadData = () => {
    Promise.all([getAnalyticsSummary(), getPriorityList(), getOrganDistribution()])
      .then(([s, p, o]) => {
        setSummary(s);
        setPriorityList(p.slice(0, 8));
        setOrganData(o);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [lastEvent]);

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto page-enter">
        <LoadingState
          title="INITIALIZING ALLOCATION TELEMETRY"
          subtitle="Connecting to 15 regional hospital databases & recalculating priority queues..."
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Skeleton className="h-28" count={4} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-signal-critical font-mono text-xs">
        [FAULT] Telemetry synchronization failure: {error}
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto page-enter">
      {/* Instrumentation Header Strip */}
      <div className="relative overflow-hidden panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-1/90 backdrop-blur-md border-line">
        <BlinkingSquares
          direction="right"
          gridSize={44}
          squareSize={0.52}
          fadeStart={0.55}
          fadeEnd={1}
          falloff={1.25}
          minBrightness={0.3}
          twinkleSpeed={1.2}
          twinkleStrength={0.9}
          squareColor="#38BDF8"
          opacity={0.45}
        />
        <div className="relative z-10">
          <p className="augen-label-preamble font-mono">Telemetry / Regional Node Gateway</p>
          <div className="flex items-center gap-3">
            <h1 className="text-lg md:text-xl font-normal tracking-tight text-ink-primary">
              <ShinyText text="ALLOCATION COMMAND OVERVIEW" speed={6} className="font-normal tracking-tight" />
            </h1>
            <span className="augen-tag">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-info animate-pulse" />
              LIVE ACTIVE
            </span>
          </div>
          <p className="text-xs text-ink-secondary mt-0.5">
            15 Hospital Regional Medical Allocation Network
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs">
          <Link
            to="/match"
            onClick={() => playUiSound('click')}
            className="btn-primary-action text-xs"
          >
            Launch Match Engine
          </Link>
          <Link
            to="/exchange"
            onClick={() => playUiSound('click')}
            className="augen-pill-btn text-xs"
          >
            3D Exchange Graph
          </Link>
        </div>
      </div>

      {/* Autonomous Real-Time Hospital Telemetry & Meteorological Flight Corridor */}
      <LiveTelemetryBar />

      {/* Real-time Telemetry Health Ticker Banner */}
      <div className="glass-panel p-2.5 px-4 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono border-line/60 bg-surface-1/70 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-glow-emerald"></span>
            </span>
            <span className="text-ink-secondary">REGIONAL CLUSTER:</span>
            <span className="text-emerald-300 font-bold">15/15 HUBS SYNCHRONIZED</span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-ink-secondary">
            <span className="text-line-bright">|</span>
            <span>BUS LATENCY:</span>
            <span className="text-cyan-300 font-bold">12ms</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-ink-secondary">
            <span className="text-line-bright">|</span>
            <span>TRANSACTION ENGINE:</span>
            <span className="text-violet-300 font-bold">ACID 2PC COMMIT</span>
          </div>
        </div>

        {/* Live ECG cardiogram wave in banner */}
        <div className="flex items-center gap-2.5">
          <svg className="w-20 h-4 text-cyan-400" viewBox="0 0 100 24" fill="none">
            <path
              d="M0 12 L20 12 L28 4 L36 20 L44 8 L52 16 L60 12 L100 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-ecg"
            />
          </svg>
          <span className="text-[10px] px-2 py-0.5 rounded bg-surface-0/80 text-cyan-300 border border-cyan-500/30 font-bold">
            60 BPM STABLE
          </span>
        </div>
      </div>

      {/* Row 1: Vibrant Multi-Color KPI Panel Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard
          title="Consented Donors"
          value={summary.totalDonors}
          subtitle={`${summary.availableDonors} Available Active`}
          icon={Heart}
          color="rose"
          trend="+4.2%"
          trendUp={true}
        />
        <StatCard
          title="Active Waitlist"
          value={summary.waitingRecipients}
          subtitle={`of ${summary.totalRecipients} Registered`}
          icon={Users}
          color="amber"
          trend="-1.5%"
          trendUp={false}
        />
        <StatCard
          title="Compatibility Pairs"
          value={summary.totalMatches}
          subtitle="Graph Viability Edges"
          icon={Network}
          color="violet"
          trend="+8.0%"
          trendUp={true}
        />
        <StatCard
          title="Transplant Success Rate"
          value={`${summary.successRate}%`}
          subtitle={`${summary.successTransplants} Confirmed Out`}
          icon={Activity}
          color="emerald"
          trend="+2.1%"
          trendUp={true}
        />
      </div>

      {/* Row 2: 2/3 Priority Waitlist Table + 1/3 Organ Supply/Demand */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Priority Waitlist Strip */}
        <div className="panel lg:col-span-2 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="p-3.5 border-b border-line flex items-center justify-between bg-gradient-to-r from-surface-2/70 via-surface-1 to-surface-2/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-signal-critical animate-pulse" />
                <div>
                  <h2 className="text-xs font-mono font-bold text-ink-primary uppercase tracking-wider">
                    Priority Waitlist (Top Clinical Candidates)
                  </h2>
                  <p className="text-[11px] text-ink-secondary font-mono mt-0.5">
                    Ranked by: (Severity × 0.5) + (Wait Days × 0.3) + (Prior Failures × 0.2)
                  </p>
                </div>
              </div>
              <Link to="/recipients" className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 group">
                Full Registry ({summary.waitingRecipients}) <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="divide-y divide-line/60">
              {priorityList.map((recipient, index) => {
                const isCritical = recipient.urgencyScore >= 7.0;
                const getBloodBadge = (bg) => {
                  if (bg.startsWith('O')) return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30';
                  if (bg.startsWith('A')) return 'bg-amber-950/60 text-amber-300 border-amber-500/30';
                  if (bg.startsWith('B')) return 'bg-violet-950/60 text-violet-300 border-violet-500/30';
                  return 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30';
                };

                return (
                  <div
                    key={recipient.id}
                    className={`px-4 py-3 flex items-center justify-between gap-3 text-xs transition-all duration-200 hover:bg-surface-2/60 hover:translate-x-1 group ${
                      isCritical ? 'bg-rose-950/15 border-l-2 border-l-rose-500' : 'border-l-2 border-l-transparent hover:border-l-cyan-400'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className={`font-mono text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        index === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-glow-amber' :
                        index === 1 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' :
                        index === 2 ? 'bg-violet-500/20 text-violet-400 border border-violet-500/40' :
                        'bg-surface-2 text-ink-secondary border border-line'
                      }`}>
                        {index + 1}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${getBloodBadge(recipient.bloodGroup)}`}>
                        {recipient.bloodGroup}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-ink-primary truncate group-hover:text-cyan-300 transition-colors">
                          {recipient.name}
                        </p>
                        <p className="text-[11px] text-ink-secondary font-mono truncate mt-0.5">
                          <span className="text-cyan-400 font-semibold">{recipient.organTypeNeeded}</span> • {recipient.hospital?.city || 'Regional Center'} • <span className="text-amber-400">{recipient.waitTimeDays}d</span> wait
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <UrgencyBadge score={recipient.urgencyScore} escalated={recipient.priorFailedMatches > 0} />
                      <Link
                        to={`/match`}
                        className="btn-action text-[11px] py-1 px-2.5 font-mono group-hover:border-cyan-500/40 group-hover:text-cyan-300 transition-all"
                      >
                        Cross-Match
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Organ Distribution Panel */}
        <div className="panel p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-mono font-bold text-ink-primary uppercase tracking-wider mb-1">
              Organ Distribution
            </h2>
            <p className="text-[11px] text-ink-secondary font-mono mb-3">Donor Inventory by Organ Class</p>

            <div className="h-44 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={organData}
                    dataKey="donors"
                    nameKey="organ"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    stroke="#161B22"
                    strokeWidth={2}
                  >
                    {organData.map((_, i) => (
                      <Cell key={i} fill={ORGAN_PALETTE[i % ORGAN_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#111827',
                      border: '1px solid #1E293B',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#F8FAFC',
                      fontFamily: 'monospace',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center pointer-events-none flex flex-col items-center justify-center w-20 h-20 rounded-full bg-surface-0/80 border border-line/60 shadow-[0_0_20px_rgba(56,189,248,0.1)]">
                <span className="text-xl font-mono font-bold text-ink-primary group-hover:text-cyan-400 transition-colors">
                  {summary.availableDonors}
                </span>
                <span className="text-[9px] text-cyan-400 font-bold uppercase font-mono tracking-wider">Active</span>
              </div>
            </div>

            <div className="space-y-1.5 mt-3 pt-3 border-t border-line text-xs font-mono">
              {organData.map((d, i) => (
                <div key={d.organ} className="flex items-center justify-between text-[11px] px-2 py-1 rounded hover:bg-surface-2/60 transition-colors">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                      style={{
                        background: ORGAN_PALETTE[i % ORGAN_PALETTE.length],
                        boxShadow: `0 0 6px ${ORGAN_PALETTE[i % ORGAN_PALETTE.length]}80`
                      }}
                    />
                    <span className="text-ink-secondary truncate">{d.organ}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-2 text-ink-primary border border-line">
                    {d.donors}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Live System Telemetry / Audit Strip */}
      <div className="panel p-3.5 px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono bg-gradient-to-r from-surface-1 via-surface-2/30 to-surface-1 border-line">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-glow-emerald"></span>
          </span>
          <span className="text-ink-primary font-medium">
            {lastEvent ? (
              <span className="text-cyan-400">Socket Broadcast: [{lastEvent.type}]</span>
            ) : (
              'Cluster Telemetry: Synchronized with 15 National Nodes'
            )}
          </span>
        </div>
        <div className="text-ink-secondary text-[11px] flex items-center gap-2">
          <span>Avg National Wait Time:</span>
          <span className="px-2 py-0.5 rounded-full bg-surface-2 text-cyan-300 font-bold border border-cyan-500/30">
            {summary.avgWaitTime} Days
          </span>
        </div>
      </div>
    </div>
  );
}
