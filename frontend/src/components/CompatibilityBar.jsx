export default function CompatibilityBar({
  bloodScore = 40,
  hlaScore = 20,
  organScore = 20,
  distanceScore = 8,
  compositeScore = 88,
  className = ""
}) {
  const getScoreStyle = (score) => {
    if (score >= 75) {
      return 'text-emerald-300 border-emerald-500/50 bg-gradient-to-r from-emerald-950/80 to-teal-950/80 shadow-glow-emerald';
    }
    if (score >= 50) {
      return 'text-amber-300 border-amber-500/50 bg-gradient-to-r from-amber-950/80 to-orange-950/80 shadow-glow-amber';
    }
    return 'text-rose-300 border-rose-500/50 bg-gradient-to-r from-rose-950/80 to-red-950/80 shadow-glow-rose';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 4 Segmented Score Breakdown in vibrant clinical strip format */}
      <div className="grid grid-cols-4 gap-1.5">
        {/* ABO/Rh */}
        <div className="bg-surface-2/80 hover:bg-surface-2 p-2 rounded-lg border border-line hover:border-cyan-500/40 transition-all duration-200 group/bar">
          <div className="flex justify-between items-center text-[10px] font-mono mb-1">
            <span className="text-cyan-400 font-semibold group-hover/bar:text-cyan-300">ABO/Rh</span>
            <span className="text-ink-primary font-bold">{Math.round(bloodScore)}/40</span>
          </div>
          <div className="h-1.5 w-full bg-surface-0 rounded-full overflow-hidden p-0.5 border border-line/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(56,189,248,0.5)]"
              style={{ width: `${Math.min(100, (bloodScore / 40) * 100)}%` }}
            />
          </div>
        </div>

        {/* HLA */}
        <div className="bg-surface-2/80 hover:bg-surface-2 p-2 rounded-lg border border-line hover:border-violet-500/40 transition-all duration-200 group/bar">
          <div className="flex justify-between items-center text-[10px] font-mono mb-1">
            <span className="text-violet-400 font-semibold group-hover/bar:text-violet-300">HLA Match</span>
            <span className="text-ink-primary font-bold">{Math.round(hlaScore)}/30</span>
          </div>
          <div className="h-1.5 w-full bg-surface-0 rounded-full overflow-hidden p-0.5 border border-line/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(139,92,246,0.5)]"
              style={{ width: `${Math.min(100, (hlaScore / 30) * 100)}%` }}
            />
          </div>
        </div>

        {/* Organ Spec */}
        <div className="bg-surface-2/80 hover:bg-surface-2 p-2 rounded-lg border border-line hover:border-emerald-500/40 transition-all duration-200 group/bar">
          <div className="flex justify-between items-center text-[10px] font-mono mb-1">
            <span className="text-emerald-400 font-semibold group-hover/bar:text-emerald-300">Organ Fit</span>
            <span className="text-ink-primary font-bold">{Math.round(organScore)}/20</span>
          </div>
          <div className="h-1.5 w-full bg-surface-0 rounded-full overflow-hidden p-0.5 border border-line/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              style={{ width: `${Math.min(100, (organScore / 20) * 100)}%` }}
            />
          </div>
        </div>

        {/* Distance Vector */}
        <div className="bg-surface-2/80 hover:bg-surface-2 p-2 rounded-lg border border-line hover:border-amber-500/40 transition-all duration-200 group/bar">
          <div className="flex justify-between items-center text-[10px] font-mono mb-1">
            <span className="text-amber-400 font-semibold group-hover/bar:text-amber-300">Logistics</span>
            <span className="text-ink-primary font-bold">{Math.round(distanceScore)}/10</span>
          </div>
          <div className="h-1.5 w-full bg-surface-0 rounded-full overflow-hidden p-0.5 border border-line/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(245,158,11,0.5)]"
              style={{ width: `${Math.min(100, (distanceScore / 10) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Composite score indicator */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] font-mono text-ink-secondary flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-signal-info animate-pulse" />
          Multi-Factor Viability Index
        </span>
        <div className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border transition-all duration-200 ${getScoreStyle(compositeScore)}`}>
          {compositeScore.toFixed(1)} <span className="text-[10px] font-normal opacity-80">/ 100.0</span>
        </div>
      </div>
    </div>
  );
}

