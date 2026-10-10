import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Dna,
  GitCompare,
  HeartPulse,
  Users,
  Building2,
  FileSpreadsheet,
  BarChart3,
  ArrowRight,
  Sparkles,
  Command,
  Navigation,
  Bot,
  FileText,
  Database
} from 'lucide-react';
import { getDonors, getRecipients } from '../api/client';

const STATIC_ACTIONS = [
  { id: 'dash', title: 'Allocation Command Overview', category: 'Pages', to: '/', icon: LayoutDashboard, tag: 'Dashboard' },
  { id: 'match', title: 'Launch Match Engine & Transit Solver', category: 'Pages', to: '/match', icon: Dna, tag: 'Cross-Match' },
  { id: 'sql', title: '🗄️ Open Live SQL & Relational Query Inspector (Joins, Aggregates, Views)', category: 'Pages', to: '/sql', icon: Database, tag: 'SQL Console' },
  { id: 'radar', title: '🛸 Open Real-Time Organ Flight Radar & Medevac Tracker', category: 'Diagnostics', isRadar: true, icon: Navigation, tag: 'Radar' },
  { id: 'copilot', title: '🤖 Open VitalAI Clinical Allocation Copilot', category: 'Diagnostics', isCopilot: true, icon: Bot, tag: 'VitalAI' },
  { id: 'manifest', title: '📄 View Cryptographic Surgical Allocation Dossier', category: 'Diagnostics', isManifest: true, icon: FileText, tag: 'Dossier' },
  { id: 'exchange', title: '3D Paired Kidney Exchange Network', category: 'Pages', to: '/exchange', icon: GitCompare, tag: '3D Graph' },
  { id: 'donors', title: 'Deceased & Living Donor Registry', category: 'Pages', to: '/donors', icon: HeartPulse, tag: 'Donors' },
  { id: 'recipients', title: 'Active Waitlist & Priority Queue', category: 'Pages', to: '/recipients', icon: Users, tag: 'Waitlist' },
  { id: 'hospitals', title: 'Hospital Nodes & Center Command', category: 'Pages', to: '/hospitals', icon: Building2, tag: 'Hospitals' },
  { id: 'audit', title: 'Immutable Regulatory Audit Ledger', category: 'Pages', to: '/audit', icon: FileSpreadsheet, tag: 'Compliance' },
  { id: 'analytics', title: 'Clinical Telemetry & Predictive Analytics', category: 'Pages', to: '/analytics', icon: BarChart3, tag: 'Telemetry' },
  { id: 'entrance-reveal', title: '⚡ Play Cinematic Entrance Reveal Sequence', category: 'Diagnostics', isEntranceReveal: true, icon: Sparkles, tag: 'Cinematic' },
  { id: 'hamster-engine', title: '🐹 Inspect ACID Hamster Compute Core (420 RPM)', category: 'Diagnostics', isHamster: true, icon: Sparkles, tag: 'Compute Core' },
];

export default function CommandPalette({
  isOpen,
  onClose,
  onOpenHamsterModal,
  onTriggerEntranceReveal,
  onOpenRadarModal,
  onOpenCopilotDrawer,
  onOpenManifestModal
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [donors, setDonors] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      getDonors({ isAvailable: 'true' }).then(setDonors).catch(() => {});
      getRecipients({ status: 'Waiting' }).then(setRecipients).catch(() => {});
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(false, true); // toggle
      }
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter actions
  const filteredPages = STATIC_ACTIONS.filter(a =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.tag.toLowerCase().includes(query.toLowerCase())
  );

  const filteredDonors = query.trim().length > 1
    ? donors.filter(d => d.name.toLowerCase().includes(query.toLowerCase()) || d.organType.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 4)
      .map(d => ({
        id: `d-${d.id}`,
        title: `${d.name} (${d.organType} [${d.bloodGroup}])`,
        category: 'Donors',
        to: `/match/${d.id}`,
        icon: HeartPulse,
        tag: d.hospital?.city || 'Recovery Node'
      }))
    : [];

  const filteredRecipients = query.trim().length > 1
    ? recipients.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.organTypeNeeded.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 4)
      .map(r => ({
        id: `r-${r.id}`,
        title: `${r.name} (Waiting: ${r.organTypeNeeded} [${r.bloodGroup}])`,
        category: 'Patients',
        to: `/recipients`,
        icon: Users,
        tag: `Score: ${r.severityScore}/10`
      }))
    : [];

  const allItems = [...filteredPages, ...filteredDonors, ...filteredRecipients];

  const handleSelect = (item) => {
    if (!item) return;
    if (item.isHamster) {
      onOpenHamsterModal?.();
    } else if (item.isEntranceReveal) {
      onTriggerEntranceReveal?.();
    } else if (item.isRadar) {
      onOpenRadarModal?.();
    } else if (item.isCopilot) {
      onOpenCopilotDrawer?.();
    } else if (item.isManifest) {
      onOpenManifestModal?.();
    } else if (item.to) {
      navigate(item.to);
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % Math.max(1, allItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(allItems[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-surface-1/95 border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden shadow-glow-cyan flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line bg-surface-0/60">
          <Search className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, donor name, patient, or organ class..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none outline-none text-ink-primary text-sm font-mono w-full placeholder:text-ink-secondary/60"
          />
          <kbd className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 border border-line text-ink-secondary flex items-center gap-0.5">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 divide-y divide-line/40">
          {allItems.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-ink-secondary">
              No matching clinical terminal actions found for "{query}".
            </div>
          ) : (
            allItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 text-xs font-mono group ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-950/70 to-blue-950/40 border-l-2 border-l-cyan-400 text-cyan-200 shadow-sm'
                      : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-2/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded border ${isSelected ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' : 'bg-surface-2 border-line text-ink-secondary'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className={`truncate font-medium ${isSelected ? 'text-ink-primary font-semibold' : 'text-ink-primary'}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-ink-secondary/80 block uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-2 border border-line text-ink-secondary group-hover:text-cyan-300">
                      {item.tag}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-1 text-cyan-400' : 'opacity-0'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info strip */}
        <div className="px-4 py-2 border-t border-line bg-surface-0 flex items-center justify-between text-[11px] font-mono text-ink-secondary">
          <div className="flex items-center gap-3">
            <span><kbd className="bg-surface-2 px-1 rounded border border-line">↑</kbd> <kbd className="bg-surface-2 px-1 rounded border border-line">↓</kbd> to navigate</span>
            <span><kbd className="bg-surface-2 px-1 rounded border border-line">↵</kbd> to select</span>
          </div>
          <span className="text-cyan-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> VitalNode Telemetry Omnibar
          </span>
        </div>
      </div>
    </div>
  );
}
