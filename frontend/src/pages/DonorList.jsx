import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDonors, updateDonorConsent } from '../api/client';
import { HeartPulse, Plus, Search, Filter } from 'lucide-react';
import LoadingState from '../components/LoadingState';
import GlowSearchBar from '../components/GlowSearchBar';

const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ORGAN_TYPES = ['', 'Kidney', 'Liver', 'Heart', 'Lung', 'Pancreas', 'Cornea'];

export default function DonorList() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ bloodGroup: '', organType: '', isAvailable: '', search: '' });
  const [toast, setToast] = useState(null);

  const loadDonors = () => {
    setLoading(true);
    getDonors(filters)
      .then(setDonors)
      .catch(e => showToast(e.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDonors(); }, [filters]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleConsent = async (donor, status) => {
    try {
      await updateDonorConsent(donor.id, status, 'ClinicalCoordinator');
      showToast(`Consent updated to ${status}`);
      loadDonors();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const getBloodBadge = (bg) => {
    if (bg.startsWith('O')) return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
    if (bg.startsWith('A')) return 'bg-amber-950/60 text-amber-300 border-amber-500/40';
    if (bg.startsWith('B')) return 'bg-violet-950/60 text-violet-300 border-violet-500/40';
    return 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40';
  };

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto page-enter">
      {toast && (
        <div className="fixed top-4 right-4 z-50 panel p-3 bg-surface-1 border-cyan-500/50 shadow-glow-cyan text-xs font-mono text-cyan-300">
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-1">
        <div>
          <p className="augen-label-preamble font-mono">Registry / Organ Donor Nodes</p>
          <div className="flex items-center gap-3">
            <h1 className="text-lg md:text-xl font-normal text-ink-primary tracking-tight">
              DECEASED &amp; LIVING DONOR REGISTRY
            </h1>
            <span className="augen-tag">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-info animate-pulse" />
              VERIFIED DONORS
            </span>
          </div>
          <p className="text-xs text-ink-secondary mt-0.5">
            Active Verified Donor Nodes, Consent Certificates, &amp; Donor Risk Indices (DRI)
          </p>
        </div>
        <Link to="/donors/new" className="btn-primary-action text-xs font-mono">
          <Plus className="w-3.5 h-3.5" /> Register Donor Node
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="panel p-3 flex flex-wrap items-center gap-2 text-xs font-mono bg-surface-1">
        <div className="flex-1 min-w-56 max-w-md">
          <GlowSearchBar
            placeholder="Search donor node by name or ID..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            onClear={() => setFilters(f => ({ ...f, search: '' }))}
          />
        </div>
        <select className="input-control text-xs" value={filters.bloodGroup} onChange={e => setFilters(f => ({ ...f, bloodGroup: e.target.value }))}>
          {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g || 'All Blood Groups'}</option>)}
        </select>
        <select className="input-control text-xs" value={filters.organType} onChange={e => setFilters(f => ({ ...f, organType: e.target.value }))}>
          {ORGAN_TYPES.map(o => <option key={o} value={o}>{o || 'All Organ Classes'}</option>)}
        </select>
        <select className="input-control text-xs" value={filters.isAvailable} onChange={e => setFilters(f => ({ ...f, isAvailable: e.target.value }))}>
          <option value="">All Statuses</option>
          <option value="true">Available for Match</option>
          <option value="false">Allocated / Inactive</option>
        </select>
        <button className="btn-action text-xs" onClick={() => setFilters({ bloodGroup: '', organType: '', isAvailable: '', search: '' })}>
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="panel overflow-hidden">
        <div className="p-3 border-b border-line flex items-center justify-between bg-surface-2/40 text-xs font-mono">
          <span className="font-bold text-ink-primary">VERIFIED DONOR RECORDS</span>
          <span className="text-ink-secondary">{donors.length} Nodes Indexed</span>
        </div>

        {loading ? (
          <div className="p-6">
            <LoadingState
              title="SYNCHRONIZING DONOR LEDGER"
              subtitle="Querying regional procurement organizations, organ health telemetry, and consent certificates..."
            />
          </div>
        ) : donors.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-ink-secondary">No donors found matching active filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface-0 text-ink-secondary text-[11px]">
                  <th className="p-2.5 px-3">DONOR</th>
                  <th className="p-2.5 px-3">AGE / CAUSE</th>
                  <th className="p-2.5 px-3">ABO/Rh</th>
                  <th className="p-2.5 px-3">ORGAN</th>
                  <th className="p-2.5 px-3">DRI</th>
                  <th className="p-2.5 px-3">HLA ALLELES</th>
                  <th className="p-2.5 px-3">RECOVERY CENTER</th>
                  <th className="p-2.5 px-3">CONSENT</th>
                  <th className="p-2.5 px-3">STATUS</th>
                  <th className="p-2.5 px-3 text-right">DISPATCH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {donors.map(d => (
                  <tr key={d.id} className="hover:bg-surface-2/70 transition-all border-l-2 border-l-transparent hover:border-l-cyan-400 group">
                    <td className="p-2.5 px-3 font-semibold text-ink-primary group-hover:text-cyan-300 transition-colors">{d.name}</td>
                    <td className="p-2.5 px-3 text-ink-secondary">{d.age}y / {d.causeOfDeath || 'Trauma'}</td>
                    <td className="p-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getBloodBadge(d.bloodGroup)}`}>
                        {d.bloodGroup}
                      </span>
                    </td>
                    <td className="p-2.5 px-3 font-semibold text-cyan-400">{d.organType}</td>
                    <td className="p-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 font-bold border border-emerald-500/30">
                        {d.donorRiskIndex ? d.donorRiskIndex.toFixed(2) : '1.10'}
                      </span>
                    </td>
                    <td className="p-2.5 px-3 text-ink-secondary text-[11px] max-w-xs truncate" title={d.hlaType}>
                      {(() => { try { return JSON.parse(d.hlaType).join(', '); } catch { return d.hlaType; } })()}
                    </td>
                    <td className="p-2.5 px-3 text-ink-secondary">{d.hospital?.city}</td>
                    <td className="p-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        d.consentStatus === 'Consented'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-glow-emerald'
                          : d.consentStatus === 'Pending'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-500/40 shadow-glow-amber'
                          : 'bg-rose-950/60 text-rose-300 border-rose-500/40 shadow-glow-rose'
                      }`}>
                        {d.consentStatus}
                      </span>
                    </td>
                    <td className="p-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        d.isAvailable
                          ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 shadow-glow-cyan'
                          : 'bg-surface-2 text-ink-secondary border-line'
                      }`}>
                        {d.isAvailable ? 'AVAILABLE' : 'ALLOCATED'}
                      </span>
                    </td>
                    <td className="p-2.5 px-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        {d.isAvailable && d.consentStatus === 'Consented' && (
                          <Link to={`/match/${d.id}`} className="btn-primary-action text-[11px] py-0.5 px-2.5">
                            Cross-Match
                          </Link>
                        )}
                        {d.consentStatus === 'Pending' && (
                          <button onClick={() => handleConsent(d, 'Consented')} className="btn-action text-[11px] py-0.5 px-2 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/50">
                            Certify
                          </button>
                        )}
                        {d.consentStatus === 'Consented' && d.isAvailable && (
                          <button onClick={() => handleConsent(d, 'Revoked')} className="btn-action text-[11px] py-0.5 px-2 text-rose-400 hover:text-rose-300 hover:border-rose-500/50">
                            Revoke
                          </button>
                        )}
                      </div>
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
