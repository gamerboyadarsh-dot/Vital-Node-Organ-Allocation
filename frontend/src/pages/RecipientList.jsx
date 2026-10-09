import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRecipients } from '../api/client';
import UrgencyBadge from '../components/UrgencyBadge';
import LoadingState from '../components/LoadingState';
import GlowSearchBar from '../components/GlowSearchBar';
import { Plus, Users } from 'lucide-react';

const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ORGAN_TYPES = ['', 'Kidney', 'Liver', 'Heart', 'Lung', 'Pancreas', 'Cornea'];

export default function RecipientList() {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ bloodGroup: '', organTypeNeeded: '', status: 'Waiting', search: '' });

  const loadRecipients = () => {
    setLoading(true);
    getRecipients(filters)
      .then(setRecipients)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRecipients(); }, [filters]);

  const getStatusBadge = (status) => {
    if (status === 'Waiting') return 'bg-amber-950/60 text-amber-300 border-amber-500/40 shadow-glow-amber';
    if (status === 'Matched') return 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 shadow-glow-cyan';
    if (status === 'Transplanted') return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-glow-emerald';
    return 'bg-rose-950/60 text-rose-300 border-rose-500/40';
  };

  const getBloodBadge = (bg) => {
    if (bg.startsWith('O')) return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
    if (bg.startsWith('A')) return 'bg-amber-950/60 text-amber-300 border-amber-500/40';
    if (bg.startsWith('B')) return 'bg-violet-950/60 text-violet-300 border-violet-500/40';
    return 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40';
  };

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto page-enter">
      {/* Header */}
      <div className="panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-1">
        <div>
          <p className="augen-label-preamble font-mono">Waitlist / Organ Candidate Pool</p>
          <div className="flex items-center gap-3">
            <h1 className="text-lg md:text-xl font-normal text-ink-primary tracking-tight">
              ACTIVE WAITLIST &amp; RECIPIENT REGISTRY
            </h1>
            <span className="augen-tag">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-info animate-pulse" />
              PRIORITIZED
            </span>
          </div>
          <p className="text-xs text-ink-secondary mt-0.5">
            Verified Queue Prioritized by Objective Clinical Severity, Days Accrued, &amp; Prior Failed Allocations
          </p>
        </div>
        <Link to="/recipients/new" className="btn-primary-action text-xs font-mono">
          <Plus className="w-3.5 h-3.5" /> Onboard Recipient Node
        </Link>
      </div>

      {/* Filters */}
      <div className="panel p-3 flex flex-wrap items-center gap-2 text-xs font-mono bg-surface-1">
        <div className="flex-1 min-w-56 max-w-md">
          <GlowSearchBar
            placeholder="Search waitlist patient by name or ID..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            onClear={() => setFilters(f => ({ ...f, search: '' }))}
          />
        </div>
        <select className="input-control text-xs" value={filters.bloodGroup} onChange={e => setFilters(f => ({ ...f, bloodGroup: e.target.value }))}>
          {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g || 'All Blood Groups'}</option>)}
        </select>
        <select className="input-control text-xs" value={filters.organTypeNeeded} onChange={e => setFilters(f => ({ ...f, organTypeNeeded: e.target.value }))}>
          {ORGAN_TYPES.map(o => <option key={o} value={o}>{o || 'All Organ Classes'}</option>)}
        </select>
        <select className="input-control text-xs" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          <option value="Waiting">Waiting</option>
          <option value="Matched">Matched</option>
          <option value="Transplanted">Transplanted</option>
          <option value="Deceased">Deceased</option>
        </select>
        <button className="btn-action text-xs" onClick={() => setFilters({ bloodGroup: '', organTypeNeeded: '', status: 'Waiting', search: '' })}>
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="panel overflow-hidden">
        <div className="p-3 border-b border-line flex items-center justify-between bg-surface-2/40 text-xs font-mono">
          <span className="font-bold text-ink-primary">INDEXED WAITLIST QUEUE</span>
          <span className="text-ink-secondary">{recipients.length} Records</span>
        </div>

        {loading ? (
          <div className="p-6">
            <LoadingState
              title="CALCULATING WAITLIST PRIORITY QUEUE"
              subtitle="Evaluating waiting time accruals, patient severity indices, and antibodies..."
            />
          </div>
        ) : recipients.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-ink-secondary">No patients found matching filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface-0 text-ink-secondary text-[11px]">
                  <th className="p-2.5 px-3">PATIENT</th>
                  <th className="p-2.5 px-3">AGE</th>
                  <th className="p-2.5 px-3">ABO/Rh</th>
                  <th className="p-2.5 px-3">ORGAN NEEDED</th>
                  <th className="p-2.5 px-3">SEVERITY</th>
                  <th className="p-2.5 px-3">WAIT (DAYS)</th>
                  <th className="p-2.5 px-3">PRIOR FAILS</th>
                  <th className="p-2.5 px-3">URGENCY TIER</th>
                  <th className="p-2.5 px-3">HOSPITAL HUB</th>
                  <th className="p-2.5 px-3 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {recipients.map(r => (
                  <tr key={r.id} className="hover:bg-surface-2/70 transition-all border-l-2 border-l-transparent hover:border-l-cyan-400 group">
                    <td className="p-2.5 px-3 font-semibold text-ink-primary group-hover:text-cyan-300 transition-colors">{r.name}</td>
                    <td className="p-2.5 px-3 text-ink-secondary">{r.age}y</td>
                    <td className="p-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getBloodBadge(r.bloodGroup)}`}>
                        {r.bloodGroup}
                      </span>
                    </td>
                    <td className="p-2.5 px-3 font-semibold text-cyan-400">{r.organTypeNeeded}</td>
                    <td className="p-2.5 px-3 font-bold text-ink-primary">{r.severityScore}/10</td>
                    <td className="p-2.5 px-3 text-amber-400 font-bold">{r.waitTimeDays}d</td>
                    <td className="p-2.5 px-3 text-ink-secondary">{r.priorFailedMatches}</td>
                    <td className="p-2.5 px-3">
                      <UrgencyBadge score={r.urgencyScore} escalated={r.priorFailedMatches > 0} />
                    </td>
                    <td className="p-2.5 px-3 text-ink-secondary">{r.hospital?.city}</td>
                    <td className="p-2.5 px-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
