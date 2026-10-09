import React, { useState, useEffect, useRef } from 'react';
import { Shield, Sparkles, Volume2, VolumeX, FastForward, Activity } from 'lucide-react';
import { playUiSound } from '../utils/audioFeedback';

/**
 * CrazyEntranceReveal
 * Cinematic Apple Keynote & Cyber-Clinical Entrance Reveal Sequence.
 * Features:
 * - Multi-phase biometric handshake & telemetry sync
 * - Holographic laser sweep & concentric aperture rings
 * - Synthesized Web Audio sound cues
 * - Shockwave blast & radial iris curtain wipe into the main application
 * - Can be re-triggered anytime via Command Palette (⌘K) or Sidebar button
 */
export default function CrazyEntranceReveal({ onComplete, forceStart = false }) {
  const [phase, setPhase] = useState(0); // 0: Handshake, 1: Core Acceleration, 2: Shockwave, 3: Wipe/Exit, 4: Done
  const [progress, setProgress] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeLog, setActiveLog] = useState('INITIALIZING VITALNODE PROTOCOL v4.9');
  const [visible, setVisible] = useState(true);
  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  useEffect(() => {
    // Check if already shown in this session (unless forced)
    if (!forceStart && sessionStorage.getItem('vn_entrance_shown')) {
      setVisible(false);
      onComplete?.();
      return;
    }

    sessionStorage.setItem('vn_entrance_shown', 'true');

    if (soundRef.current) {
      playUiSound('revealLaser');
    }

    // Phase 0: Initial Scan & Handshake (0 -> 1200ms)
    const p1 = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 45) {
          clearInterval(p1);
          return 45;
        }
        return prev + 3;
      });
    }, 50);

    const timer1 = setTimeout(() => {
      setPhase(1);
      setActiveLog('15 REGIONAL HUBS SYNCHRONIZED • LATENCY 12ms');
      if (soundRef.current) {
        playUiSound('scan');
      }

      // Phase 1: Rapid Acceleration (1200 -> 2400ms)
      const p2 = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(p2);
            return 100;
          }
          return prev + 4;
        });
      }, 40);

      const timer2 = setTimeout(() => {
        setPhase(2);
        setActiveLog('SECURITY ENCLAVE UNLOCKED • DECRYPTING FEED');
        if (soundRef.current) {
          playUiSound('shutterUnlock');
        }

        // Phase 2: Shockwave & Blast (2400 -> 2900ms)
        const timer3 = setTimeout(() => {
          setPhase(3);
          if (soundRef.current) {
            playUiSound('whooshReveal');
          }

          // Phase 3: Iris Wipe Exit (2900 -> 3600ms)
          const timer4 = setTimeout(() => {
            setPhase(4);
            setVisible(false);
            onComplete?.();
          }, 700);

          return () => clearTimeout(timer4);
        }, 500);

        return () => clearTimeout(timer3);
      }, 1200);

      return () => clearTimeout(timer2);
    }, 1200);

    return () => {
      clearInterval(p1);
      clearTimeout(timer1);
    };
  }, [forceStart]);

  // Handle ESC key to skip
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        skipIntro();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const skipIntro = () => {
    setVisible(false);
    onComplete?.();
  };

  if (!visible || phase === 4) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden transition-all duration-700 select-none ${
        phase === 3 ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.98) 0%, rgba(2, 2, 4, 1) 100%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* 3D Cyber Perspective Laser Grid Floor */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(0, 113, 227, 0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 113, 227, 0.25) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          transform: 'perspective(500px) rotateX(60deg) translateY(80px)',
          transformOrigin: 'bottom center',
        }}
      />

      {/* Sweeping Laser Beam */}
      <div
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#0071e3] to-transparent pointer-events-none shadow-[0_0_20px_#0071e3]"
        style={{
          animation: 'laserSweep 2.2s infinite ease-in-out',
        }}
      />

      {/* Top Utility Controls: Sound Toggle & Skip */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all font-mono text-xs flex items-center gap-1.5 backdrop-blur-md"
          title={soundEnabled ? 'Mute audio' : 'Enable audio'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#0071e3]" /> : <VolumeX className="w-3.5 h-3.5 text-white/40" />}
          <span className="hidden sm:inline text-[10px]">{soundEnabled ? 'SFX ON' : 'MUTED'}</span>
        </button>

        <button
          onClick={skipIntro}
          className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all font-mono text-xs flex items-center gap-1.5 backdrop-blur-md hover:scale-105"
          title="Skip Reveal Sequence (ESC)"
        >
          <span className="text-[11px] font-medium">SKIP INTRO</span>
          <FastForward className="w-3.5 h-3.5 text-[#0071e3]" />
        </button>
      </div>

      {/* Shockwave Rings during phase 2 detonation */}
      {phase >= 2 && (
        <>
          <div className="absolute w-32 h-32 rounded-full border-2 border-[#0071e3] animate-ping pointer-events-none" style={{ animationDuration: '0.8s' }} />
          <div className="absolute w-64 h-64 rounded-full border border-cyan-400 animate-ping pointer-events-none" style={{ animationDuration: '1.2s' }} />
          <div className="absolute w-96 h-96 rounded-full border border-emerald-400 opacity-60 animate-ping pointer-events-none" style={{ animationDuration: '1.6s' }} />
        </>
      )}

      {/* Central Cyber-Biometric Aperture Core */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-lg px-6">
        {/* Rotating Concentric Aperture Rings */}
        <div className="relative w-44 h-44 flex items-center justify-center mb-6">
          {/* Outer Calibration Ring with Ticks */}
          <svg
            className={`absolute inset-0 w-full h-full transform transition-transform duration-1000 ${
              phase === 1 ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: '6s' }}
            viewBox="0 0 160 160"
          >
            <circle cx="80" cy="80" r="74" fill="none" stroke="rgba(0, 113, 227, 0.25)" strokeWidth="1" strokeDasharray="4 6" />
            <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="0.5" />
            <circle cx="80" cy="80" r="62" fill="none" stroke="#0071e3" strokeWidth="2" strokeDasharray="30 90" strokeLinecap="round" />
          </svg>

          {/* Reverse Counter-Rotating Segment Ring */}
          <svg
            className="absolute inset-3 w-38 h-38 transform animate-spin"
            style={{ animationDuration: '9s', animationDirection: 'reverse' }}
            viewBox="0 0 140 140"
          >
            <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.5" strokeDasharray="18 45" />
            <circle cx="70" cy="70" r="46" fill="none" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" strokeDasharray="8 20" />
          </svg>

          {/* Central VitalNode Hex-Core Emblem */}
          <div
            className={`w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-950/80 via-[#0071e3]/30 to-blue-900/60 border border-[#0071e3] flex items-center justify-center relative shadow-[0_0_35px_rgba(0,113,227,0.5)] backdrop-blur-xl transition-all duration-500 ${
              phase >= 2 ? 'scale-125 border-cyan-300 shadow-[0_0_60px_#0071e3]' : 'scale-100'
            }`}
          >
            <Shield className="w-10 h-10 text-cyan-300 drop-shadow-[0_0_12px_#38bdf8] animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping" />
          </div>

          {/* HUD Brackets */}
          <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#0071e3]" />
          <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-[#0071e3]" />
          <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-[#0071e3]" />
          <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#0071e3]" />
        </div>

        {/* Title and Telemetry Preamble */}
        <div className="space-y-2 mb-6">
          <p className="text-[11px] font-mono uppercase tracking-widest text-[#0071e3] flex items-center justify-center gap-2 font-semibold">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>BIO-DYNAMIC ALLOCATION KERNEL</span>
          </p>
          <h1 className="text-2xl md:text-3xl font-light tracking-tight text-white font-sans flex items-center justify-center gap-2">
            <span>VITAL</span>
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-[#0071e3] to-blue-400">
              NODE
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full border border-[#0071e3]/60 text-cyan-300 font-mono">
              v4.9
            </span>
          </h1>
          <p className="text-xs font-mono text-white/50 h-5 transition-all">
            {activeLog}
          </p>
        </div>

        {/* Precision Progress Bar */}
        <div className="w-72 bg-white/10 rounded-full h-1.5 p-0.5 overflow-hidden border border-white/15 relative mb-4">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-[#0071e3] to-emerald-400 rounded-full transition-all duration-150 ease-out shadow-[0_0_10px_#0071e3]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Telemetry Metric Badges */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-white/60">
          <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
            SYSTEM: <strong className="text-emerald-400 font-semibold">OPTIMAL</strong>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
            PROGRESS: <strong className="text-cyan-300 font-semibold">{progress}%</strong>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
            CIT: <strong className="text-amber-400 font-semibold">&lt;4.0h</strong>
          </span>
        </div>
      </div>

      {/* Inset Vignette Shadow */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.85)]" />
    </div>
  );
}
