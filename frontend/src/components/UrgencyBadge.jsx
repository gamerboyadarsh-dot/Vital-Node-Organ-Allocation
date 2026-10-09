import { AlertOctagon, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function UrgencyBadge({ score, escalated = false, className = "" }) {
  const numScore = parseFloat(score) || 0;

  if (numScore >= 7.0) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-gradient-to-r from-rose-950/80 via-rose-900/60 to-red-950/80 text-rose-300 border border-rose-500/40 shadow-glow-rose hover:scale-105 transition-transform duration-150 shrink-0 ${className}`}
        title={`Clinical Urgency: ${numScore.toFixed(2)}/10.0 — Critical Condition`}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        <AlertOctagon className="w-3 h-3 text-rose-400 shrink-0 stroke-[2.5]" />
        <span>CRITICAL {numScore.toFixed(1)}</span>
        {escalated && (
          <span className="text-[9px] bg-rose-500/30 text-rose-200 px-1 py-0.2 rounded font-mono uppercase tracking-wider border border-rose-400/30">
            ESCALATED
          </span>
        )}
      </span>
    );
  }

  if (numScore >= 4.0) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-orange-950/80 text-amber-300 border border-amber-500/40 shadow-glow-amber hover:scale-105 transition-transform duration-150 shrink-0 ${className}`}
        title={`Clinical Urgency: ${numScore.toFixed(2)}/10.0 — Elevated Monitoring`}
      >
        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
        <span>ELEVATED {numScore.toFixed(1)}</span>
        {escalated && (
          <span className="text-[9px] text-amber-300 font-mono font-bold bg-amber-500/20 px-1 rounded">
            ↑
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-teal-950/80 text-emerald-300 border border-emerald-500/40 shadow-glow-emerald hover:scale-105 transition-transform duration-150 shrink-0 ${className}`}
      title={`Clinical Urgency: ${numScore.toFixed(2)}/10.0 — Clinically Stable`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
      <span>STABLE {numScore.toFixed(1)}</span>
    </span>
  );
}

