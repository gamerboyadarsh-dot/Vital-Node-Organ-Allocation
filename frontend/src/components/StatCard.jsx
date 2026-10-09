import { useRef } from 'react';

const COLOR_MAP = {
  cyan: {
    spotlight: 'rgba(56, 189, 248, 0.16)',
    topLine: 'from-cyan-500/80 via-blue-500/50 to-transparent',
    iconBox: 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:border-cyan-400/60 group-hover:text-cyan-300 group-hover:shadow-[0_0_12px_rgba(56,189,248,0.4)]',
    valueHover: 'group-hover:text-cyan-300',
    borderHover: 'hover:border-cyan-500/50',
  },
  rose: {
    spotlight: 'rgba(244, 63, 94, 0.16)',
    topLine: 'from-rose-500/80 via-red-500/50 to-transparent',
    iconBox: 'bg-rose-950/40 border-rose-500/30 text-rose-400 group-hover:bg-rose-500/20 group-hover:border-rose-400/60 group-hover:text-rose-300 group-hover:shadow-[0_0_12px_rgba(244,63,94,0.4)]',
    valueHover: 'group-hover:text-rose-300',
    borderHover: 'hover:border-rose-500/50',
  },
  amber: {
    spotlight: 'rgba(245, 158, 11, 0.16)',
    topLine: 'from-amber-500/80 via-orange-500/50 to-transparent',
    iconBox: 'bg-amber-950/40 border-amber-500/30 text-amber-400 group-hover:bg-amber-500/20 group-hover:border-amber-400/60 group-hover:text-amber-300 group-hover:shadow-[0_0_12px_rgba(245,158,11,0.4)]',
    valueHover: 'group-hover:text-amber-300',
    borderHover: 'hover:border-amber-500/50',
  },
  violet: {
    spotlight: 'rgba(139, 92, 246, 0.16)',
    topLine: 'from-violet-500/80 via-purple-500/50 to-transparent',
    iconBox: 'bg-violet-950/40 border-violet-500/30 text-violet-400 group-hover:bg-violet-500/20 group-hover:border-violet-400/60 group-hover:text-violet-300 group-hover:shadow-[0_0_12px_rgba(139,92,246,0.4)]',
    valueHover: 'group-hover:text-violet-300',
    borderHover: 'hover:border-violet-500/50',
  },
  emerald: {
    spotlight: 'rgba(16, 185, 129, 0.16)',
    topLine: 'from-emerald-500/80 via-teal-500/50 to-transparent',
    iconBox: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:border-emerald-400/60 group-hover:text-emerald-300 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.4)]',
    valueHover: 'group-hover:text-emerald-300',
    borderHover: 'hover:border-emerald-500/50',
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp = true,
  color = 'cyan',
  className = ""
}) {
  const cardRef = useRef(null);
  const theme = COLOR_MAP[color] || COLOR_MAP.cyan;

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`panel panel-interactive p-4 flex flex-col justify-between border-line relative overflow-hidden group ${theme.borderHover} ${className}`}
    >
      {/* Top illuminated edge line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${theme.topLine} opacity-50 group-hover:opacity-100 transition-opacity duration-300`} />

      {/* Interactive pointer spotlight layer */}
      <div
        className="spotlight-glow"
        style={{
          background: `radial-gradient(450px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${theme.spotlight}, transparent 65%)`
        }}
      />

      <div className="flex items-start justify-between gap-2 relative z-10">
        <div className="min-w-0">
          <p className="text-[11px] font-mono text-ink-secondary uppercase tracking-wider font-semibold">
            {title}
          </p>
          <p className={`text-2xl font-mono font-bold text-ink-primary mt-1 tracking-tight ${theme.valueHover} transition-colors duration-200`}>
            {value}
          </p>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg border shrink-0 transition-all duration-300 group-hover:scale-110 ${theme.iconBox}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-line text-[11px] font-mono relative z-10">
        <span className="text-ink-secondary truncate">{subtitle}</span>
        {trend && (
          <span className={`font-semibold flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] ${trendUp ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-500/30' : 'text-amber-300 bg-amber-950/60 border border-amber-500/30'}`}>
            {trendUp ? '▲' : '▼'} {trend}
          </span>
        )}
      </div>
    </div>
  );
}
