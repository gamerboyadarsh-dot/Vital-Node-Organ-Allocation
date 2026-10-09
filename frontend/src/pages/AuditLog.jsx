import { useEffect, useState } from 'react';
import { FileSpreadsheet, Download, Filter, Search, Calendar } from 'lucide-react';
import { getAuditLog } from '../api/client';
import LoadingState from '../components/LoadingState';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters (§4.4)
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = () => {
    setLoading(true);
    getAuditLog({
      action: actionFilter,
      actor: actorFilter,
      startDate,
      endDate,
      limit: 100,
    })
      .then((res) => {
        setLogs(res.logs || []);
        setTotal(res.pagination?.total || (res.logs || []).length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleExport = (format) => {
    const params = new URLSearchParams();
    params.set('format', format);
    if (actionFilter) params.set('action', actionFilter);
    if (actorFilter) params.set('actor', actorFilter);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    window.open(`/api/audit-log/export?${params.toString()}`, '_blank');
  };

  const getActionBadge = (action) => {
    if (action.includes('FINALIZED') || action.includes('COMPLETED') || action.includes('ACTIVATED')) {
      return 'text-emerald-300 bg-emerald-950/60 border-emerald-500/40 shadow-glow-emerald';
    }
    if (action.includes('REJECTED') || action.includes('CIT_EXCEEDED') || action.includes('FAILED')) {
      return 'text-rose-300 bg-rose-950/60 border-rose-500/40 shadow-glow-rose';
    }
    if (action.includes('PROPOSED') || action.includes('ESCALATED')) {
      return 'text-amber-300 bg-amber-950/60 border-amber-500/40 shadow-glow-amber';
    }
    return 'text-cyan-300 bg-cyan-950/60 border-cyan-500/40';
  };

  return (
    <div className="p-5 space-y-5 max-w-6xl mx-auto page-enter">
      {/* Title */}
      <div className="panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-ink-primary tracking-tight">
              APPEND-ONLY REGULATORY AUDIT LEDGER
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
              IMMUTABLE
            </span>
          </div>
          <p className="text-xs text-ink-secondary font-mono mt-0.5">
            Cryptographic Chain of Custody for Match Allocations, Consents, &amp; Clinical Transitions
          </p>
        </div>

        {/* Section 4.4: Export ledger CSV and JSON */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="btn-action text-xs font-mono"
            title="Download CSV Regulatory Ledger"
          >
            <Download className="w-3.5 h-3.5 text-signal-info" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="btn-action text-xs font-mono"
            title="Download JSON Machine Record"
          >
            <Download className="w-3.5 h-3.5 text-signal-info" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Filter and Search Bar (§4.4) */}
      <form onSubmit={handleApplyFilter} className="panel p-3.5 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-mono bg-surface-1">
        <div>
          <label className="text-ink-secondary block text-[10px] uppercase mb-1">Action Type:</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input-control w-full text-xs"
          >
            <option value="">All Action Types</option>
            <option value="MATCH_FINALIZED">MATCH_FINALIZED</option>
            <option value="MATCH_REJECTED">MATCH_REJECTED</option>
            <option value="CIT_EXCEEDED">CIT_EXCEEDED</option>
            <option value="EXCHANGE_ACTIVATED">EXCHANGE_ACTIVATED</option>
            <option value="DONOR_REGISTERED">DONOR_REGISTERED</option>
            <option value="RECIPIENT_REGISTERED">RECIPIENT_REGISTERED</option>
          </select>
        </div>

        <div>
          <label className="text-ink-secondary block text-[10px] uppercase mb-1">Actor / Identity:</label>
          <input
            type="text"
            placeholder="e.g. coordinator, System"
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="input-control w-full text-xs"
          />
        </div>

        <div>
          <label className="text-ink-secondary block text-[10px] uppercase mb-1">Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-control w-full text-xs"
          />
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-ink-secondary block text-[10px] uppercase mb-1">End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-control w-full text-xs"
            />
          </div>
          <button type="submit" className="btn-primary-action text-xs h-[31px]">
            Filter
          </button>
        </div>
      </form>

      {/* Ledger Table — Ink-on-record metaphor (§2.4) */}
      <div className="panel overflow-hidden">
        <div className="p-3 border-b border-line flex items-center justify-between bg-surface-2/40 text-xs font-mono">
          <span className="text-ink-primary font-bold">CHRONOLOGICAL AUDIT SEQUENCE</span>
          <span className="text-ink-secondary">{total} Verified Ledger Records</span>
        </div>

        {loading ? (
          <div className="p-6">
            <LoadingState
              title="VERIFYING AUDIT CHAIN LEDGER"
              subtitle="Validating SHA-256 block signatures and retrieving immutable clinical logs..."
            />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-ink-secondary">
            No audit records found matching active query parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface-0 text-ink-secondary text-[11px]">
                  <th className="p-2.5 px-3">RECORD ID</th>
                  <th className="p-2.5 px-3">TIMESTAMP</th>
                  <th className="p-2.5 px-3">ACTION</th>
                  <th className="p-2.5 px-3">ENTITY</th>
                  <th className="p-2.5 px-3">ACTOR</th>
                  <th className="p-2.5 px-3">RECORD SUMMARY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-2/70 transition-all border-l-2 border-l-transparent hover:border-l-cyan-400 group">
                    <td className="p-2.5 px-3 text-cyan-400/80 font-bold text-[11px]">
                      {log.id.slice(0, 8)}
                    </td>
                    <td className="p-2.5 px-3 text-ink-primary whitespace-nowrap text-[11px]">
                      {new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="p-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-2.5 px-3 text-ink-secondary text-[11px]">
                      {log.entityType}
                    </td>
                    <td className="p-2.5 px-3 text-ink-primary font-medium text-[11px]">
                      {log.actor || 'System'}
                    </td>
                    <td className="p-2.5 px-3 text-ink-secondary max-w-md truncate text-[11px] group-hover:text-ink-primary transition-colors" title={log.details}>
                      {log.details}
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
