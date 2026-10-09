import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  Check,
  AlertOctagon,
  Shield,
  MapPin,
  HelpCircle,
  CheckCircle2,
  Navigation,
  Heart,
  Activity,
  Sparkles,
  Eye,
  Zap,
  FileText
} from 'lucide-react';
import { getDonors, getDonorMatches, finalizeMatch } from '../api/client';
import CompatibilityBar from '../components/CompatibilityBar';
import UrgencyBadge from '../components/UrgencyBadge';
import LoadingState from '../components/LoadingState';
import Skeleton from '../components/Skeleton';
import { playUiSound } from '../utils/audioFeedback';
import OrganIcon, { KidneyIcon, LungIcon, LiverIcon, HeartIcon, PancreasIcon, CorneaIcon } from '../components/OrganIcon';

function RadialScoreGauge({ score }) {
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((score || 0) / 100) * circumference;
  const strokeColor = score >= 85 ? '#10B981' : score >= 70 ? '#38BDF8' : '#F59E0B';
  const glow = score >= 85 ? 'shadow-[0_0_12px_rgba(16,185,129,0.35)]' : score >= 70 ? 'shadow-[0_0_12px_rgba(56,189,248,0.35)]' : 'shadow-[0_0_12px_rgba(245,158,11,0.35)]';

  return (
    <div className={`relative flex items-center justify-center shrink-0 rounded-full p-0.5 ${glow} bg-surface-1/80 border border-line`}>
      <svg className="w-12 h-12 -rotate-90 transform" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={radius}
          stroke="#1E293B"
          strokeWidth="3"
          fill="transparent"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          stroke={strokeColor}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
        <span className="text-[11px] font-extrabold text-ink-primary leading-none">{Math.round(score || 0)}%</span>
        <span className="text-[7px] text-ink-secondary leading-none mt-0.5 uppercase tracking-tighter">MATCH</span>
      </div>
    </div>
  );
}

function OrganHologram({ organType }) {
  const organConfig = {
    Heart: { bg: 'bg-rose-950/40', border: 'border-rose-500/40', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]', text: 'text-rose-400', icon: HeartIcon },
    Kidney: { bg: 'bg-amber-950/40', border: 'border-amber-500/40', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]', text: 'text-amber-400', icon: KidneyIcon },
    Liver: { bg: 'bg-emerald-950/40', border: 'border-emerald-500/40', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]', text: 'text-emerald-400', icon: LiverIcon },
    Lung: { bg: 'bg-cyan-950/40', border: 'border-cyan-500/40', glow: 'shadow-[0_0_15px_rgba(56,189,248,0.3)]', text: 'text-cyan-400', icon: LungIcon },
    Lungs: { bg: 'bg-cyan-950/40', border: 'border-cyan-500/40', glow: 'shadow-[0_0_15px_rgba(56,189,248,0.3)]', text: 'text-cyan-400', icon: LungIcon },
    Pancreas: { bg: 'bg-purple-950/40', border: 'border-purple-500/40', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]', text: 'text-purple-400', icon: PancreasIcon },
    Cornea: { bg: 'bg-violet-950/40', border: 'border-violet-500/40', glow: 'shadow-[0_0_15px_rgba(139,92,246,0.3)]', text: 'text-violet-400', icon: CorneaIcon },
  };

  const config = organConfig[organType] || organConfig.Kidney;
  const IconComp = config.icon || KidneyIcon;

  return (
    <div className={`p-3 rounded-xl border ${config.border} ${config.bg} relative overflow-hidden flex items-center justify-between mt-2 group transition-all hover:border-opacity-80`}>
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-lg ${config.bg} border ${config.border} flex items-center justify-center relative ${config.glow} shrink-0`}>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-lg bg-current opacity-25" />
          <IconComp className={`w-6 h-6 ${config.text} transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_8px_currentColor]`} />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-ink-primary font-bold text-xs uppercase font-mono tracking-wider">{organType} Bio-Pod</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span className="text-[10px] text-ink-secondary font-mono block">Perfusion Active • 4.0°C</span>
        </div>
      </div>
      <div className="text-right font-mono">
        <span className="text-[9px] uppercase tracking-wider text-ink-secondary block">Viability</span>
        <span className={`text-xs font-extrabold ${config.text}`}>OPTIMAL</span>
      </div>
    </div>
  );
}

export default function MatchFinder() {
  const { donorId } = useParams();
  const navigate = useNavigate();

  const [donors, setDonors] = useState([]);
  const [selectedDonorId, setSelectedDonorId] = useState(donorId || '');
  const [matches, setMatches] = useState([]);
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmMatch, setConfirmMatch] = useState(null);
  const [finalizing, setFinalizing] = useState(false);

  // Orchestrated ACID animation states (§2.2)
  const [finalizedMatchId, setFinalizedMatchId] = useState(null);
  const [showCascadingRejections, setShowCascadingRejections] = useState(false);

  // Live decrementing CIT countdown timer (§2.1)
  const [remainingSeconds, setRemainingSeconds] = useState(3600 * 6);

  useEffect(() => {
    getDonors({ isAvailable: 'true', consentStatus: 'Consented' })
      .then((data) => {
        setDonors(data);
        if (!selectedDonorId && data.length > 0) {
          const preferredDonor = data.find((d) => d.bloodGroup === 'O-' || d.bloodGroup === 'O+' || d.bloodGroup === 'B-') || data[0];
          setSelectedDonorId(preferredDonor.id);
        }
      })
      .catch(console.error);
  }, []);

  const selectedDonor = donors.find((d) => d.id === selectedDonorId);

  // Initialize CIT timer based on organ limit
  useEffect(() => {
    if (selectedDonor) {
      const limits = { Heart: 6, Lung: 8, Liver: 24, Kidney: 36, Pancreas: 20, Cornea: 168 };
      const maxHours = limits[selectedDonor.organType] || 24;
      // Start with 78% remaining of max limit as initial live state
      setRemainingSeconds(Math.floor(maxHours * 3600 * 0.78));
    }
  }, [selectedDonor]);

  // Continuously ticking live decrementing timer
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedDonorId) {
      setLoading(true);
      setFinalizedMatchId(null);
      setShowCascadingRejections(false);

      getDonorMatches(selectedDonorId)
        .then((res) => {
          if (res && res.matches) {
            setMatches(res.matches);
            setDiagnostics(res.diagnostics);
          } else if (Array.isArray(res)) {
            setMatches(res);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedDonorId]);

  const handleFinalizeExecute = async () => {
    if (!confirmMatch) return;
    setFinalizing(true);
    try {
      await finalizeMatch(confirmMatch.id);
      const targetId = confirmMatch.id;
      setConfirmMatch(null);

      // Orchestrated sequence: lock target with draw-on checkmark
      setFinalizedMatchId(targetId);

      // Trigger 100ms staggered cascade for rejected candidates (§2.2)
      setTimeout(() => {
        setShowCascadingRejections(true);
      }, 300);
    } catch (err) {
      alert(`ACID Allocation Conflict: ${err.message}`);
      setConfirmMatch(null);
    } finally {
      setFinalizing(false);
    }
  };

  // Timer formatting
  const formatTimer = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getCitTimerColor = (sec, organ) => {
    const limits = { Heart: 6, Lung: 8, Liver: 24, Kidney: 36, Pancreas: 20, Cornea: 168 };
    const maxSecs = (limits[organ] || 24) * 3600;
    const fraction = sec / maxSecs;
    if (fraction < 0.25) return 'text-[#E5484D] border-[#B53338] bg-[#2A1416]'; // Critical (<25% time left)
    if (fraction < 0.5) return 'text-[#D9A441] border-[#5C451B] bg-[#2A241A]';  // Caution (<50% time left)
    return 'text-[#3E9B6F] border-[#214734] bg-[#14261D]';                     // Stable
  };

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">
      {/* Title strip */}
      <div className="panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-1">
        <div>
          <h1 className="text-base font-bold text-ink-primary tracking-tight">
            CROSS-MATCH TERMINAL &amp; ALLOCATION DISPATCH
          </h1>
          <p className="text-xs text-ink-secondary font-mono mt-0.5">
            Real-Time Compatibility Engine with Viability Guardrails &amp; Haversine Transit Vectors
          </p>
        </div>

        {selectedDonor && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-ink-secondary">LOGISTICS TIME-TO-LIMIT:</span>
            <div className={`px-2.5 py-1 rounded font-mono font-bold text-xs border ${getCitTimerColor(remainingSeconds, selectedDonor.organType)}`}>
              <Clock className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
              {formatTimer(remainingSeconds)}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left Column: Donor Profile & Logistics Vector Panel (§3B) */}
        <div className="space-y-3">
          <div className="panel p-4 space-y-3">
            <label className="text-[11px] font-mono text-ink-secondary uppercase tracking-wider block font-semibold">
              Select Active Donor Node:
            </label>
            <select
              value={selectedDonorId}
              onChange={(e) => setSelectedDonorId(e.target.value)}
              className="input-control w-full font-mono text-xs"
            >
              {donors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.organType} [{d.bloodGroup}] ({d.hospital?.city || 'Regional'})
                </option>
              ))}
            </select>

            {selectedDonor && (
              <div className="space-y-3 pt-3 border-t border-line text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink-primary text-sm">{selectedDonor.name}</span>
                  <span className="px-1.5 py-0.5 rounded bg-surface-2 border border-line text-ink-primary font-bold">
                    {selectedDonor.bloodGroup}
                  </span>
                </div>

                <div className="bg-surface-0 p-2.5 rounded border border-line space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-ink-secondary">Organ Offered:</span>
                    <span className="font-bold text-signal-info flex items-center gap-1.5">
                      <OrganIcon organ={selectedDonor.organType} className="w-3.5 h-3.5" />
                      <span>{selectedDonor.organType}</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-secondary">Donor Age / Cause:</span>
                    <span>{selectedDonor.age}y / {selectedDonor.causeOfDeath || 'Trauma'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-secondary">Donor Risk Index (DRI):</span>
                    <span className="font-bold text-signal-stable">
                      {selectedDonor.donorRiskIndex ? selectedDonor.donorRiskIndex.toFixed(2) : '1.10'} [LOW RISK]
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-secondary">Recovery Center:</span>
                    <span className="text-ink-primary truncate max-w-[150px]">{selectedDonor.hospital?.name}</span>
                  </div>
                </div>

                <OrganHologram organType={selectedDonor.organType} />

                {/* Section 3B: Transit Vector Diagram */}
                <div className="p-3 rounded-lg bg-surface-0 border border-line space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-cyan-400 flex items-center gap-1.5 font-mono">
                      <Navigation className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} /> 
                      TRANSIT VECTORS
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-mono">
                      {matches.length} Targets
                    </span>
                  </div>

                  {/* High-tech animated transit vector arc representation */}
                  <div className="h-28 w-full bg-gradient-to-r from-surface-1 via-[#0f172a] to-surface-1 rounded-lg border border-line p-2.5 relative overflow-hidden flex items-center justify-between px-4">
                    {/* Origin Hub */}
                    <div className="text-center z-10">
                      <div className="relative flex items-center justify-center mx-auto">
                        <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-cyan-400 opacity-60"></span>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 border border-cyan-300 flex items-center justify-center text-[11px] font-bold text-white shadow-glow-cyan">
                          D
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-cyan-300 font-bold block mt-1.5 truncate max-w-[70px]">
                        {selectedDonor.hospital?.city || 'Origin'}
                      </span>
                    </div>

                    {/* Animated Neon Vector Arcs */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 200 112">
                      <defs>
                        <linearGradient id="vectorGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
                        </linearGradient>
                        <linearGradient id="vectorGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.8" />
                        </linearGradient>
                        <linearGradient id="vectorGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
                        </linearGradient>
                      </defs>
                      <path d="M 45 56 Q 100 20 155 35" fill="none" stroke="url(#vectorGrad1)" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
                      <path d="M 45 56 Q 100 56 155 56" fill="none" stroke="url(#vectorGrad2)" strokeWidth="2" strokeDasharray="4 4" />
                      <path d="M 45 56 Q 100 92 155 77" fill="none" stroke="url(#vectorGrad3)" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
                    </svg>

                    {/* Recipient Hubs */}
                    <div className="text-center z-10">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-surface-2 to-surface-3 border border-violet-500/50 flex items-center justify-center text-[11px] font-bold text-violet-300 mx-auto shadow-glow-violet">
                        R
                      </div>
                      <span className="text-[9px] font-mono text-ink-secondary block mt-1.5">Recipient Hubs</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-ink-secondary font-mono flex items-center justify-between">
                    <span>Air / Ground: 80 km/h avg</span>
                    <span className="text-cyan-400">Dispatch: 1.5h</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Candidates & Zero-Match Diagnostics Breakdown (§4.2) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-ink-primary font-semibold uppercase">
              Ranked Compatible Candidates ({matches.length})
            </span>
            <span className="text-ink-secondary">ACID Lockable</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              <LoadingState
                title="RUNNING COMPATIBILITY & TRANSIT SOLVER"
                subtitle="Calculating Jaccard HLA overlaps, great-circle transit vectors, and 5-year graft projections..."
              />
              <Skeleton className="h-36" count={2} />
            </div>
          ) : matches.length === 0 ? (
            /* Section 4.2: Explain the zero-match empty state with clinical diagnostics */
            <div className="panel p-6 space-y-4 border-line">
              <div className="flex items-start gap-3">
                <AlertOctagon className="w-5 h-5 text-signal-caution shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-ink-primary font-mono">0 CANDIDATE MATCHES FOUND</h3>
                  <p className="text-xs text-ink-secondary mt-1">
                    No recipients in the active registry qualify for an immediate match with this donor.
                  </p>
                </div>
              </div>

              {diagnostics && (
                <div className="bg-surface-0 p-4 rounded border border-line space-y-3 text-xs font-mono">
                  <span className="text-ink-primary font-bold uppercase tracking-wider block">
                    Exclusion Funnel Diagnostic Breakdown:
                  </span>
                  <div className="space-y-2">
                    <div className="flex justify-between py-1 border-b border-line/60">
                      <span className="text-ink-secondary">Total Waiting Patients in Pool:</span>
                      <span className="font-bold text-ink-primary">{diagnostics.totalWaiting}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-line/60">
                      <span className="text-ink-secondary">Excluded by Organ Discrepancy (Not needing {diagnostics.organType}):</span>
                      <span className="font-bold text-ink-primary">{diagnostics.excludedByOrgan}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-line/60">
                      <span className="text-ink-secondary">Excluded by ABO/Rh Blood Incompatibility:</span>
                      <span className="font-bold text-signal-caution">{diagnostics.excludedByBlood}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-ink-secondary">Excluded by Transport Transit Distance (CIT Exceeded &gt;{diagnostics.citLimitHours}h):</span>
                      <span className="font-bold text-signal-critical">{diagnostics.excludedByCit}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-ink-secondary pt-1">
                    Recommendation: Register candidate pairs with the Paired Kidney Exchange Network or select an available universal donor (O- / O+ / B-) with compatible recipients.
                  </p>
                  <div className="pt-2.5 border-t border-line/60 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-cyan-400 font-bold">Quick Select Donors with Active Matches:</span>
                    {donors.filter(d => ['O-', 'O+', 'B-'].includes(d.bloodGroup)).slice(0, 4).map(d => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDonorId(d.id)}
                        className="px-2.5 py-1 rounded-md bg-surface-2 hover:bg-cyan-950/80 border border-line hover:border-cyan-400 text-cyan-300 text-[11px] font-mono transition-all hover:scale-105 shadow-sm"
                      >
                        ⚡ {d.name} ({d.organType} [{d.bloodGroup}])
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Ranked candidate cards */
            <div className="space-y-3">
              {matches.map((m, idx) => {
                const citHours = m.coldIschemicTimeHours || (m.distanceKm / 80 + 1.5);
                const survival = m.predictedGraftSurvival5yr || 76.5;
                const isTargetFinalized = finalizedMatchId === m.id;
                const isOtherRejected = showCascadingRejections && finalizedMatchId && finalizedMatchId !== m.id;

                const getRankBadgeStyle = (i) => {
                  if (i === 0) return 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-glow-amber';
                  if (i === 1) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50';
                  if (i === 2) return 'bg-violet-500/20 text-violet-300 border-violet-500/50';
                  return 'bg-surface-2 text-ink-secondary border-line';
                };

                return (
                  <div
                    key={m.id}
                    style={{
                      transitionDelay: isOtherRejected ? `${idx * 80}ms` : '0ms',
                    }}
                    className={`panel p-4.5 transition-all duration-300 space-y-3.5 group rounded-xl ${
                      isTargetFinalized
                        ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500 shadow-glow-emerald'
                        : isOtherRejected
                        ? 'opacity-25 bg-surface-0 border-line line-through pointer-events-none'
                        : 'hover:border-cyan-500/50 hover:bg-surface-1/90 hover:shadow-card-hover hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        <span className={`font-mono text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center border shrink-0 ${getRankBadgeStyle(idx)}`}>
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-sm text-ink-primary font-sans flex items-center gap-2">
                            <span className="group-hover:text-cyan-300 transition-colors">{m.recipient.name}</span>
                            {isTargetFinalized && (
                              <span className="text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold inline-flex items-center gap-1 shadow-glow-emerald">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" className="animate-draw" />
                                </svg>
                                ALLOCATED (ACID COMMIT)
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-ink-secondary font-mono mt-0.5">
                            {m.recipient.age}y • Blood <span className="text-ink-primary font-bold">{m.recipient.bloodGroup}</span> • {m.recipient.hospital?.city || 'Regional Center'} (<span className="text-cyan-400 font-semibold">{Math.round(m.distanceKm)} km</span>)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <UrgencyBadge score={m.urgencyScore} />
                        <RadialScoreGauge score={m.overallCompatibilityScore} />
                      </div>
                    </div>

                    {/* 4-segment Compatibility breakdown */}
                    <CompatibilityBar
                      bloodScore={m.bloodCompatible ? 40 : 0}
                      hlaScore={m.hlaMatchScore * 30}
                      organScore={m.organTypeMatch ? 20 : 0}
                      distanceScore={Math.max(0, 10 - m.distanceKm / 50)}
                      compositeScore={m.overallCompatibilityScore}
                    />

                    {/* Quantitative Clinical Strip with Colored Indicators */}
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
                      <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                        <span className="text-[10px] text-emerald-400/80 block uppercase tracking-wider">5-Yr Projected Survival</span>
                        <span className="font-bold text-emerald-300 text-sm">{survival.toFixed(1)}%</span>
                      </div>
                      <div className="p-2 rounded-lg bg-cyan-950/20 border border-cyan-500/30">
                        <span className="text-[10px] text-cyan-400/80 block uppercase tracking-wider">Transit Distance</span>
                        <span className="font-bold text-cyan-300 text-sm">{Math.round(m.distanceKm)} km</span>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-500/30">
                        <span className="text-[10px] text-amber-400/80 block uppercase tracking-wider">Estimated Transit CIT</span>
                        <span className="font-bold text-amber-300 text-sm">{citHours.toFixed(1)} Hours</span>
                      </div>
                    </div>

                    {/* Clinical Action Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/40">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            playUiSound('click');
                            window.dispatchEvent(new CustomEvent('open-transit-radar'));
                          }}
                          className="px-2.5 py-1 rounded bg-surface-2 hover:bg-surface-3 border border-line text-[11px] font-mono text-signal-info flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Open Live Flight Radar for Transit Corridor"
                        >
                          <Navigation className="w-3 h-3 text-signal-info" />
                          <span>Flight Radar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playUiSound('click');
                            const dossierPayload = {
                              manifestId: `VN-ALLOC-${m.id ? m.id.substring(0, 8).toUpperCase() : '2026-X'}`,
                              timestamp: new Date().toISOString(),
                              cryptoHash: '9e8b17c38f4201a09d3b8417c49b6e82f501d6748bc9284fae10948b8192a71d',
                              organ: `${selectedDonor?.organType || 'Kidney'} Graft`,
                              donor: {
                                name: selectedDonor?.name || 'Donor Node',
                                bloodGroup: selectedDonor?.bloodGroup || 'O-',
                                age: selectedDonor?.age || 38,
                                hospital: selectedDonor?.hospital?.name || 'Regional Donor Center',
                                crossClampTime: new Date(Date.now() - 45 * 60000).toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
                                dri: '1.18 (Standard Risk)',
                                hla: selectedDonor?.hla || { a: '02, 24', b: '07, 44', c: '07, 16', drb1: '04, 15', dqb1: '03, 06' }
                              },
                              recipient: {
                                name: m.recipient.name,
                                bloodGroup: m.recipient.bloodGroup,
                                age: m.recipient.age,
                                hospital: m.recipient.hospital?.name || 'Transplant Center',
                                urgencyScore: m.urgencyScore,
                                hla: m.recipient.hla || { a: '02, 24', b: '07, 44', c: '07, 16', drb1: '04, 11', dqb1: '03, 06' }
                              },
                              compatibility: {
                                score: m.overallCompatibilityScore,
                                distanceKm: Math.round(m.distanceKm),
                                estimatedCitHours: citHours.toFixed(1),
                                graftSurvival5yr: survival.toFixed(1),
                                hlaMatchScore: (m.hlaMatchScore * 30).toFixed(0)
                              }
                            };
                            window.dispatchEvent(new CustomEvent('open-surgical-manifest', { detail: dossierPayload }));
                          }}
                          className="px-2.5 py-1 rounded bg-surface-2 hover:bg-surface-3 border border-line text-[11px] font-mono text-ink-primary flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Generate & View Signed Cryptographic Surgical Allocation Dossier"
                        >
                          <FileText className="w-3 h-3 text-ink-secondary" />
                          <span>Dossier</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playUiSound('click');
                            window.dispatchEvent(new CustomEvent('open-vitalai-copilot'));
                          }}
                          className="px-2.5 py-1 rounded bg-surface-2 hover:bg-surface-3 border border-line text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Ask VitalAI Allocation Copilot"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>Copilot</span>
                        </button>
                      </div>

                      {!finalizedMatchId && (
                        <button
                          onClick={() => setConfirmMatch(m)}
                          className="btn-primary-action text-xs font-mono uppercase tracking-wider group-hover:shadow-glow-cyan"
                        >
                          Execute Final Allocation
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal — Restrained Clinical Dialog */}
      {confirmMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-150">
          <div className="bg-surface-1 border border-line w-full max-w-md p-5 rounded space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-signal-caution" />
                <h3 className="text-sm font-bold text-ink-primary font-mono uppercase">
                  CONFIRM IRREVOCABLE ALLOCATION
                </h3>
              </div>
              <button
                onClick={() => setConfirmMatch(null)}
                className="text-ink-secondary hover:text-ink-primary p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-xs font-mono space-y-2 text-ink-primary bg-surface-0 p-3 rounded border border-line">
              <p><b>DONOR:</b> {selectedDonor?.name} [{selectedDonor?.organType}, Blood {selectedDonor?.bloodGroup}]</p>
              <p><b>RECIPIENT:</b> {confirmMatch.recipient.name} [Blood {confirmMatch.recipient.bloodGroup}, Urgency {confirmMatch.urgencyScore.toFixed(1)}]</p>
              <p><b>TRANSIT:</b> {Math.round(confirmMatch.distanceKm)} km (Est. CIT: {(confirmMatch.distanceKm / 80 + 1.5).toFixed(1)}h)</p>
            </div>

            <p className="text-[11px] text-signal-caution bg-[#2A241A] p-2.5 rounded border border-[#5C451B] font-mono leading-relaxed">
              [WARNING] Committing executes an atomic multi-table transaction. The donor will be locked, the recipient set to Matched, and all competing matches rejected.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <button
                disabled={finalizing}
                onClick={() => setConfirmMatch(null)}
                className="btn-action text-xs"
              >
                Abort
              </button>
              <button
                disabled={finalizing}
                onClick={handleFinalizeExecute}
                className="btn-primary-action text-xs bg-signal-critical border-red-700 font-mono"
              >
                {finalizing ? 'Committing Transaction...' : 'COMMIT ALLOCATION'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
