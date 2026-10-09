import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Bot,
  X,
  Send,
  RotateCw,
  Navigation,
  Brain,
  Shield,
  Clock,
  Zap,
  ChevronDown
} from 'lucide-react';
import { playUiSound } from '../utils/audioFeedback';

const PRESET_QUERIES = [
  'Why was David Miller prioritized over Elena Rostova?',
  'Simulate a 4-hour air transit delay on 5-yr graft survival',
  'Find backup emergency recipient in Region 2 (Northeast)',
  'Explain Paired Kidney 3-Way Exchange cycle logic',
];

// ---------- Deterministic AI response engine ----------
function generateResponse(q) {
  const ql = q.toLowerCase();

  if (ql.includes('david') || ql.includes('prioritized') || ql.includes('elena') || ql.includes('rostova')) {
    return {
      text: `David Miller (Urgency Score: 9.4) ranked ahead of Elena Rostova (Urgency Score: 8.8) based on a weighted 4-factor objective clinical matrix:

1. HLA Antigen Match: 6/6 complete HLA locus match (HLA-A, B, DRB1), granting +30.0 pts.
2. Cold Ischemia Feasibility: Proximity (18 km vs 142 km) limits predicted CIT to 1.4h vs 3.2h (+12.4 pts).
3. Medical Urgency: Status 1A priority with cardiac support (+35.0 pts).

Composite Score: 94.2/100 (Optimal graft survival probability: 84.6% @ 5yr).`,
      scenario: {
        title: 'Explainable AI Factor Attribution',
        factors: [
          { name: 'HLA Tissue Compatibility', weight: '35%', score: '98/100', color: 'text-emerald-400' },
          { name: 'Medical Severity Status', weight: '30%', score: '94/100', color: 'text-signal-info' },
          { name: 'Cold Ischemia Travel Feasibility', weight: '20%', score: '91/100', color: 'text-amber-400' },
          { name: 'Waitlist Time Accrued', weight: '15%', score: '78/100', color: 'text-violet-400' },
        ],
      },
    };
  }

  if (ql.includes('delay') || ql.includes('transit') || ql.includes('simulate') || ql.includes('4-hour') || ql.includes('4 hour') || ql.includes('ischemia')) {
    return {
      text: `⚠️ SIMULATION ANALYSIS — 4-HOUR ADVERSE WEATHER TRANSIT DELAY:
- Projected Cold Ischemia Time increases from 2.1h → 6.1h.
- 5-Year Predicted Graft Survival decreases from 81.2% → 71.8% (−9.4% drop).
- Ischemia-Reperfusion Injury Risk: Moderate (DRI elevated from 1.12 → 1.38).

RECOMMENDATION: If delay exceeds 5.5 hours, automatic failover protocol recommends secondary regional candidate at Mount Sinai (CIT 1.1h, Survival est. 79.3%).`,
      scenario: {
        title: 'Ischemia Sensitivity Analysis',
        metrics: [
          { label: 'Baseline CIT', val: '2.1 Hours' },
          { label: 'Delayed CIT', val: '6.1 Hours (+4h)' },
          { label: 'Baseline Graft 5-Yr', val: '81.2%', highlight: true },
          { label: 'Delayed Graft 5-Yr', val: '71.8% ⚠️', highlight: true, warn: true },
        ],
      },
    };
  }

  if (ql.includes('backup') || ql.includes('emergency') || ql.includes('region 2') || ql.includes('northeast')) {
    return {
      text: `Backup candidate registry scanned across Region 2 (Northeast Network). 3 validated contingency recipients ready for immediate crossmatch:

1. Marcus Vance (ID: REC-1082) • Blood: O- • Transit: 12 km (20 min) • Viability: 89%
2. Sarah Chen (ID: REC-2041) • Blood: O+ • Transit: 28 km (38 min) • Viability: 86%
3. Elena Diaz (ID: REC-3094) • Blood: O- • Transit: 44 km (55 min) • Viability: 82%

All 3 centers have verified operating room stand-by clearance. Recommend activating REC-1082 as primary backup.`,
      scenario: null,
    };
  }

  if (ql.includes('kidney') || ql.includes('exchange') || ql.includes('paired') || ql.includes('3-way') || ql.includes('cycle')) {
    return {
      text: `Paired Kidney Exchange (PKE) 3-Way Cycle Logic:

Donor A → Recipient B (incompatible with their own donor)
Donor B → Recipient C (incompatible with their own donor)
Donor C → Recipient A (incompatible with their own donor)

All 3 transplants execute simultaneously under ACID 2-phase commit consensus — if any operating room aborts, all 3 transactions rollback to protect the chain. Current network has 12 viable 3-way cycles in the exchange graph.`,
      scenario: null,
    };
  }

  if (ql.includes('hla') || ql.includes('match') || ql.includes('crossmatch')) {
    return {
      text: `HLA compatibility is assessed across 5 loci: HLA-A, HLA-B, HLA-C, DRB1, and DQB1. A 6/6 antigen match (0MM) yields maximum OPTN allocation points (+20 pts) and correlates with a projected graft survival improvement of 12–18% at 5 years compared to a 0/6 match.

Virtual crossmatch (VXM) using recipient Donor-Specific Antibody (DSA) panel screens for pre-formed antibodies. Flow cytometry T/B-cell crossmatch is required before any deceased donor transplant.`,
      scenario: null,
    };
  }

  if (ql.includes('urgency') || ql.includes('score') || ql.includes('rank') || ql.includes('waitlist')) {
    return {
      text: `Allocation Priority Score is computed as:

Score = (Severity × 0.5) + (Wait Days × 0.3) + (Prior Failed Matches × 0.2)

Status 1A (life support or acute failure) receives highest severity weighting. Recipients with prior failed matches receive additional priority credit to prevent perpetual deferral. Scores are recalculated every 20 seconds via the live telemetry engine.`,
      scenario: null,
    };
  }

  // Generic fallback
  return {
    text: `Clinical protocol verified against OPTN/UNOS policy bylaws. Current network telemetry indicates 15 synchronized hospital nodes operating within nominal cold-ischemia limits (<4.0h heart, <12.0h liver, <24.0h kidney).

Multi-tier cross-matching algorithm active with ACID consensus ledger logging all allocation decisions immutably.

You can ask me about: candidate ranking, HLA compatibility, ischemia risk simulation, backup recipient search, or kidney exchange cycle logic.`,
    scenario: null,
  };
}
// -------------------------------------------------------

let moduleSavedMessages = null;

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    text: 'Greetings Coordinator. I am VitalAI Copilot — trained on UNOS/OPTN allocation protocols, HLA allele frequencies, and multivariable graft survival models.\n\nHow can I assist with your active allocation decisions today?',
    timestamp: 'System',
    scenario: null,
  },
];

export default function VitalAICopilotDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState(() => moduleSavedMessages || INITIAL_MESSAGES);
  const [inputQuery, setInputQuery] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    moduleSavedMessages = messages;
  }, [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isSimulating]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const handleSendQuery = useCallback((queryText) => {
    const q = (queryText || inputQuery).trim();
    if (!q || isSimulating) return;

    playUiSound('click');

    const userMsg = {
      role: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      scenario: null,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsSimulating(true);

    // Simulate AI "thinking" delay (600–900ms)
    const delay = 600 + Math.random() * 300;
    setTimeout(() => {
      const { text, scenario } = generateResponse(q);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text,
          scenario,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsSimulating(false);
      playUiSound('success');
    }, delay);
  }, [inputQuery, isSimulating]);

  // If not open, completely remove from DOM to prevent layout shifts or click blocking
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-surface-1 border-l border-line w-full max-w-lg h-full shadow-2xl flex flex-col font-sans animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-surface-0/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Brain className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-medium text-ink-primary tracking-tight">
                  VitalAI Clinical Copilot
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>
              <p className="text-[11px] text-ink-secondary font-mono mt-0.5">
                Explainable Decision Support • Ischemia Risk Simulator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMessages(INITIAL_MESSAGES)}
              className="p-2 rounded-full hover:bg-surface-2 text-ink-secondary hover:text-signal-caution transition-all"
              title="Clear chat history"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-2 text-ink-secondary hover:text-ink-primary transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preset Quick-Query Pills */}
        <div className="p-3 border-b border-line bg-surface-0/40 overflow-x-auto flex items-center gap-2 shrink-0" style={{ scrollbarWidth: 'none' }}>
          {PRESET_QUERIES.map((pq, idx) => {
            const icons = [Sparkles, Navigation, Shield, Zap];
            const IconComp = icons[idx % icons.length];
            return (
              <button
                key={idx}
                onClick={() => handleSendQuery(pq)}
                disabled={isSimulating}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-surface-1 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-[11px] font-mono text-ink-secondary hover:text-emerald-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <IconComp className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[160px]">{pq}</span>
              </button>
            );
          })}
        </div>

        {/* Message Thread */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5 bg-surface-1">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Sender / time label */}
              <div className="flex items-center gap-1.5 px-1 text-[10px] font-mono text-ink-muted">
                {m.role === 'assistant' && <Brain className="w-3 h-3 text-emerald-400" />}
                <span>{m.role === 'user' ? 'Coordinator' : 'VitalAI'}</span>
                <span className="opacity-60">• {m.timestamp}</span>
              </div>

              {/* Bubble */}
              <div
                className={`p-3.5 rounded-2xl max-w-[92%] text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-signal-info text-white rounded-br-none shadow-md'
                    : 'bg-surface-0 border border-line text-ink-primary rounded-bl-none font-mono shadow-sm'
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>

                {/* Scenario cards */}
                {m.scenario && (
                  <div className="mt-3 pt-3 border-t border-line/60 space-y-2">
                    <span className="text-[11px] font-bold text-emerald-400 block uppercase tracking-wider">
                      {m.scenario.title}
                    </span>

                    {m.scenario.factors && (
                      <div className="space-y-1.5">
                        {m.scenario.factors.map((f, i) => (
                          <div key={i} className="flex items-center justify-between text-[11px] gap-2">
                            <span className="text-ink-secondary">
                              {f.name} <span className="text-ink-muted">({f.weight})</span>:
                            </span>
                            <span className={`font-bold tabular-nums ${f.color || 'text-emerald-400'}`}>
                              {f.score}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {m.scenario.metrics && (
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {m.scenario.metrics.map((met, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded-lg border text-[10px] ${
                              met.warn
                                ? 'bg-amber-950/30 border-amber-500/40'
                                : met.highlight
                                ? 'bg-emerald-950/20 border-emerald-500/30'
                                : 'bg-surface-2 border-line'
                            }`}
                          >
                            <span className="text-ink-secondary block mb-0.5">{met.label}</span>
                            <span className={`font-bold ${met.warn ? 'text-amber-400' : met.highlight ? 'text-emerald-300' : 'text-ink-primary'}`}>
                              {met.val}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isSimulating && (
            <div className="flex items-start gap-2">
              <div className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-bl-none bg-surface-0 border border-line font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '120ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '240ms' }} />
              </div>
              <span className="self-center text-[10px] font-mono text-ink-muted">Synthesizing…</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-line bg-surface-0 flex items-center gap-2 shrink-0">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask about candidate scoring, HLA match, transit delay..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isSimulating && inputQuery.trim()) {
                e.preventDefault();
                handleSendQuery();
              }
            }}
            disabled={isSimulating}
            className="input-control flex-1 text-xs font-mono disabled:opacity-50"
          />
          <button
            onClick={() => handleSendQuery()}
            disabled={!inputQuery.trim() || isSimulating}
            className="btn-primary-action px-3 py-2 rounded-full shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Send (Enter)"
          >
            {isSimulating ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
