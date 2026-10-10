import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRecipients, updateRecipient, deleteRecipient } from '../api/client';
import UrgencyBadge from '../components/UrgencyBadge';
import LoadingState from '../components/LoadingState';
import GlowSearchBar from '../components/GlowSearchBar';
import { Plus, Users, Edit3, Trash2, X, AlertCircle } from 'lucide-react';

const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ORGAN_TYPES = ['', 'Kidney', 'Liver', 'Heart', 'Lung', 'Pancreas', 'Cornea'];

export default function RecipientList() {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ bloodGroup: '', organTypeNeeded: '', status: 'Waiting', search: '' });
  const [toast, setToast] = useState(null);
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', age: '', severityScore: 5, waitTimeDays: 0, status: 'Waiting' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadRecipients = () => {
    setLoading(true);
    getRecipients(filters)
      .then(setRecipients)
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRecipients(); }, [filters]);

  const handleEditOpen = (recipient) => {
    setEditingRecipient(recipient);
    setEditForm({
      name: recipient.name,
      age: recipient.age,
      severityScore: recipient.severityScore,
      waitTimeDays: recipient.waitTimeDays,
      status: recipient.status,
    });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editingRecipient) return;
    try {
      await updateRecipient(editingRecipient.id, editForm);
      showToast(`Recipient ${editForm.name} updated successfully!`);
      setEditingRecipient(null);
      loadRecipients();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteRecipient = async (recipient) => {
    if (!window.confirm(`Are you sure you want to remove recipient ${recipient.name} (${recipient.organTypeNeeded})?`)) return;
    try {
      await deleteRecipient(recipient.id);
      showToast(`Recipient ${recipient.name} removed successfully!`);
      loadRecipients();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

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
      {toast && (
        <div className={`fixed top-4 right-4 z-50 panel p-3 text-xs font-mono border shadow-lg ${
          toast.type === 'error' ? 'bg-rose-950/80 border-rose-500 text-rose-200' : 'bg-surface-1 border-cyan-500/50 text-cyan-300'
        }`}>
          {toast.msg}
        </div>
      )}

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
                  <th className="p-2.5 px-3">STATUS</th>
                  <th className="p-2.5 px-3 text-right">ACTIONS</th>
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
                    <td className="p-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-2.5 px-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleEditOpen(r)}
                          className="p-1 px-1.5 rounded hover:bg-surface-3 text-ink-secondary hover:text-cyan-400 border border-line text-[11px] flex items-center gap-1 transition-colors"
                          title="Edit Recipient (UPDATE operation)"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteRecipient(r)}
                          className="p-1 px-1.5 rounded hover:bg-rose-950/40 text-ink-secondary hover:text-rose-400 border border-line hover:border-rose-500/40 text-[11px] flex items-center gap-1 transition-colors"
                          title="Delete Recipient (DELETE operation)"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live UPDATE Modal for Recipient */}
      {editingRecipient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-surface-1 border border-line rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div>
                <h3 className="font-semibold text-sm text-ink-primary">Live Database UPDATE: Recipient</h3>
                <p className="text-[11px] font-mono text-ink-secondary">ID: {editingRecipient.id.slice(0, 12)}...</p>
              </div>
              <button onClick={() => setEditingRecipient(null)} className="p-1.5 rounded-full hover:bg-surface-2 text-ink-secondary hover:text-ink-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-ink-secondary block mb-1">Patient Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="input-control w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-ink-secondary block mb-1">Age</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                    className="input-control w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-ink-secondary block mb-1">Severity Score (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={editForm.severityScore}
                    onChange={(e) => setEditForm({ ...editForm, severityScore: e.target.value })}
                    className="input-control w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-ink-secondary block mb-1">Wait Time (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.waitTimeDays}
                    onChange={(e) => setEditForm({ ...editForm, waitTimeDays: e.target.value })}
                    className="input-control w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-ink-secondary block mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="input-control w-full text-xs bg-surface-1"
                  >
                    <option value="Waiting">Waiting</option>
                    <option value="Matched">Matched</option>
                    <option value="Transplanted">Transplanted</option>
                    <option value="Removed">Removed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEditingRecipient(null)}
                  className="btn-action text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action text-xs font-mono"
                >
                  Save Changes (UPDATE)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
