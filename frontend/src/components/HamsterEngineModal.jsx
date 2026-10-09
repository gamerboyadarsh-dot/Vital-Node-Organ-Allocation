import { useState, useEffect } from 'react';
import { X, Zap, Activity, Award, Sparkles, RefreshCw } from 'lucide-react';
import HamsterLoader from './HamsterLoader';
import { playUiSound } from '../utils/audioFeedback';

export default function HamsterEngineModal({ isOpen, onClose }) {
  const [speedMode, setSpeedMode] = useState('normal'); // 'eco', 'normal', 'turbo', 'ludicrous'
  const [seedsFed, setSeedsFed] = useState(0);
  const [rpm, setRpm] = useState(420);
  const [isEating, setIsEating] = useState(false);

  const speedMap = {
    eco: { dur: '1.6s', rpm: 260, label: 'Eco Tread', power: '0.45 kW' },
    normal: { dur: '1s', rpm: 420, label: 'Standard Run', power: '1.20 kW' },
    turbo: { dur: '0.6s', rpm: 750, label: 'Turbo Allocation', power: '3.80 kW' },
    ludicrous: { dur: '0.35s', rpm: 1250, label: 'Ludicrous Speed', power: '9.99 kW' },
  };

  useEffect(() => {
    const baseRpm = speedMap[speedMode].rpm;
    const interval = setInterval(() => {
      setRpm(baseRpm + Math.floor(Math.random() * 25 - 12) + seedsFed * 5);
    }, 600);
    return () => clearInterval(interval);
  }, [speedMode, seedsFed]);

  if (!isOpen) return null;

  const handleFeed = () => {
    try {
      playUiSound('success');
    } catch {
      // ignore
    }
    setSeedsFed((prev) => prev + 1);
    setIsEating(true);
    setTimeout(() => setIsEating(false), 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-surface-1 border border-line rounded-xl shadow-2xl overflow-hidden page-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between p-4 border-b border-line bg-surface-0/60">
          <div className="flex items-center gap-2">
            <span className="text-lg">🐹</span>
            <div>
              <h2 className="text-sm font-bold text-ink-primary font-mono tracking-wide">
                ACID HAMSTER COMPUTE CORE
              </h2>
              <p className="text-[10px] font-mono text-ink-secondary">
                VitalNode Biological Proof-of-Work Accelerator v2.4
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playUiSound('click');
              onClose();
            }}
            className="p-1 rounded text-ink-secondary hover:text-ink-primary hover:bg-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Visualizer */}
        <div className="p-6 flex flex-col items-center justify-center bg-gradient-to-b from-surface-0/90 to-surface-1/90 border-b border-line relative">
          <div className="relative p-6 rounded-full bg-surface-2/40 border border-line/60 shadow-inner">
            <HamsterLoader
              size="lg"
              speed={speedMap[speedMode].dur}
            />
          </div>

          {/* Floating Snack Alert */}
          {isEating && (
            <div className="absolute top-4 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono text-xs animate-bounce shadow-glow-amber">
              🌻 +1 Sunflower Seed Fed! (+5 RPM)
            </div>
          )}

          {/* Live RPM & Power Badges */}
          <div className="mt-5 flex items-center gap-3">
            <div className="px-3 py-1 rounded bg-surface-0 border border-line text-center">
              <div className="text-[10px] font-mono text-ink-secondary uppercase">WHEEL VELOCITY</div>
              <div className="text-sm font-mono font-extrabold text-signal-info">{rpm} RPM</div>
            </div>
            <div className="px-3 py-1 rounded bg-surface-0 border border-line text-center">
              <div className="text-[10px] font-mono text-ink-secondary uppercase">ENERGY OUTPUT</div>
              <div className="text-sm font-mono font-extrabold text-emerald-400">{speedMap[speedMode].power}</div>
            </div>
            <div className="px-3 py-1 rounded bg-surface-0 border border-line text-center">
              <div className="text-[10px] font-mono text-ink-secondary uppercase">SEEDS CONSUMED</div>
              <div className="text-sm font-mono font-extrabold text-amber-400">{seedsFed}</div>
            </div>
          </div>
        </div>

        {/* Speed Controls */}
        <div className="p-4 space-y-3 bg-surface-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-ink-secondary uppercase tracking-wider text-[11px] font-semibold">Treadmill Overclock Mode:</span>
            <span className="text-emerald-300 font-bold text-[11px]">{speedMap[speedMode].label}</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
            {['eco', 'normal', 'turbo', 'ludicrous'].map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  playUiSound('click');
                  setSpeedMode(mode);
                }}
                className={`py-1.5 px-2 rounded border text-[11px] font-semibold uppercase transition-all ${
                  speedMode === mode
                    ? 'bg-signal-info/20 border-signal-info text-signal-info shadow-glow-info'
                    : 'bg-surface-0 border-line text-ink-secondary hover:text-ink-primary hover:border-line-bright'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Interactive Action: Feed Sunflower Seed */}
          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              onClick={handleFeed}
              className="btn-action w-full text-xs flex items-center justify-center gap-1.5 border-amber-500/40 hover:border-amber-400 hover:bg-amber-500/10 text-amber-200"
            >
              <span>🌻</span>
              <span>Feed Energy Seed</span>
            </button>
            <button
              onClick={() => {
                playUiSound('click');
                onClose();
              }}
              className="btn-secondary text-xs px-4"
            >
              Resume Ops
            </button>
          </div>
        </div>

        {/* Footer Technical Telemetry */}
        <div className="px-4 py-2 border-t border-line bg-surface-0/60 flex items-center justify-between text-[10px] font-mono text-ink-secondary">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>BIO-PROCESSOR: NOMINAL (37°C)</span>
          </span>
          <span className="text-ink-secondary/60">SOURCE: UIVERSE.IO / NAWSOME</span>
        </div>
      </div>
    </div>
  );
}
