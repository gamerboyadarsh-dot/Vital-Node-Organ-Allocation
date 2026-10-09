import { useState } from 'react';
import HamsterLoader from './HamsterLoader';

export default function LoadingState({
  title = "Synchronizing Allocation Ledger",
  subtitle = "Querying live regional node registry and transit constraints...",
  type = "hamster", // default to the delightful hamster loader
  className = "",
  size = "md",
}) {
  const [activeType, setActiveType] = useState(() => {
    return localStorage.getItem('vn_loader_mode') || type;
  });

  const toggleType = () => {
    const next = activeType === 'hamster' ? 'ecg' : 'hamster';
    setActiveType(next);
    localStorage.setItem('vn_loader_mode', next);
  };

  return (
    <div className={`panel p-8 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden ${className}`}>
      {/* Visual Loader */}
      {activeType === 'hamster' ? (
        <div className="relative py-2 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center p-3 rounded-full bg-surface-0/60 border border-line shadow-inner">
            <HamsterLoader size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'} speed="0.9s" />
          </div>
          <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-300 font-semibold shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>HAMSTER COMPUTE CORE • 420 RPM</span>
          </div>
        </div>
      ) : (
        /* Animated Medical ECG Telemetry Scanner */
        <div className="relative w-48 h-12 flex items-center justify-center">
          <svg
            viewBox="0 0 160 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Background Grid Line */}
            <line x1="0" y1="20" x2="160" y2="20" stroke="#283240" strokeWidth="1.5" />

            {/* Animated Sweeping ECG Trace */}
            <path
              d="M 0,20 L 40,20 L 48,10 L 56,32 L 64,4 L 72,36 L 80,18 L 88,20 L 160,20"
              fill="none"
              stroke="#4C8BF5"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-ecg"
            />
          </svg>

          {/* Ambient pulse glow */}
          <div className="absolute inset-x-12 inset-y-2 bg-signal-info/15 blur-md pointer-events-none rounded-full animate-pulse" />
        </div>
      )}

      <div className="space-y-1 z-10">
        <p className="text-xs font-mono font-bold text-ink-primary uppercase tracking-wider">
          {title}
        </p>
        <p className="text-[11px] font-mono text-ink-secondary max-w-sm">
          {subtitle}
        </p>
      </div>

      {/* Mode toggle button in corner */}
      <button
        type="button"
        onClick={toggleType}
        title={`Switch to ${activeType === 'hamster' ? 'Medical ECG' : 'Hamster Wheel'} visualizer`}
        className="text-[10px] font-mono text-ink-secondary/70 hover:text-ink-primary px-2 py-0.5 rounded border border-line/40 hover:border-line hover:bg-surface-2 transition-all mt-1"
      >
        {activeType === 'hamster' ? '⚡ Switch to ECG Trace' : '🐹 Switch to Hamster Wheel'}
      </button>
    </div>
  );
}
