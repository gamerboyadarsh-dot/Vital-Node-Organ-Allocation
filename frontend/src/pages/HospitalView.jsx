import { useEffect, useState } from 'react';
import { Building2, Users, HeartPulse, Activity, MapPin, Phone, Shield } from 'lucide-react';
import { getHospitals, getHospitalOverview } from '../api/client';
import UrgencyBadge from '../components/UrgencyBadge';
import { Link } from 'react-router-dom';

export default function HospitalView() {
  const [hospitals, setHospitals] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHospitals()
      .then((data) => {
        setHospitals(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedId) {
      setLoading(true);
      getHospitalOverview(selectedId)
        .then(setOverview)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedId]);

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-1">
        <div>
          <h1 className="text-base font-bold text-ink-primary tracking-tight">
            HOSPITAL CENTER COMMAND &amp; LOCAL REGISTRY SCOPE
          </h1>
          <p className="text-xs text-ink-secondary font-mono mt-0.5">
            Scoped Regional Node View for Hospital-Level Transplant Coordinators
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-ink-secondary uppercase">Select Center:</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="input-control text-xs font-mono"
          >
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} — {h.city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="panel p-8 text-center text-xs font-mono text-ink-secondary">
          Synchronizing hospital telemetry and inventory...
        </div>
      ) : !overview ? null : (
        <div className="space-y-4">
          {/* Hospital Stat Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="panel p-3.5 bg-surface-1">
              <span className="text-[10px] font-mono text-ink-secondary uppercase block">Center City &amp; Hub</span>
              <span className="text-sm font-mono font-bold text-ink-primary flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-signal-info" /> {overview.hospital.city}
              </span>
            </div>

            <div className="panel p-3.5 bg-surface-1">
              <span className="text-[10px] font-mono text-ink-secondary uppercase block">Available Donors</span>
              <span className="text-lg font-mono font-bold text-signal-stable mt-1 block">
                {overview.stats.availableDonors} / {overview.stats.totalDonors}
              </span>
            </div>

            <div className="panel p-3.5 bg-surface-1">
              <span className="text-[10px] font-mono text-ink-secondary uppercase block">Waiting Patients</span>
              <span className="text-lg font-mono font-bold text-signal-caution mt-1 block">
                {overview.stats.waitingRecipients} / {overview.stats.totalRecipients}
              </span>
            </div>

            <div className="panel p-3.5 bg-surface-1">
              <span className="text-[10px] font-mono text-ink-secondary uppercase block">Confirmed Transplants</span>
              <span className="text-lg font-mono font-bold text-signal-info mt-1 block">
                {overview.stats.transplantCount}
              </span>
            </div>
          </div>

          {/* 2-Column Split: Local Donors vs Local Waitlist */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Center Donors */}
            <div className="panel flex flex-col justify-between">
              <div>
                <div className="p-3 border-b border-line flex items-center justify-between bg-surface-2/40 text-xs font-mono">
                  <span className="font-bold text-ink-primary">LOCAL REGISTERED DONORS</span>
                  <span className="text-ink-secondary">{overview.hospital.donors.length} Nodes</span>
                </div>

                <div className="divide-y divide-line text-xs font-mono">
                  {overview.hospital.donors.length === 0 ? (
                    <div className="p-6 text-center text-ink-secondary">No donors registered at this center.</div>
                  ) : (
                    overview.hospital.donors.map((d) => (
                      <div key={d.id} className="p-3 flex items-center justify-between gap-2 hover:bg-surface-2/40">
                        <div>
                          <p className="font-semibold text-ink-primary">{d.name}</p>
                          <p className="text-[11px] text-ink-secondary">
                            {d.organType} • Blood {d.bloodGroup} • Age {d.age} • DRI {d.donorRiskIndex || '1.10'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              d.isAvailable
                                ? 'bg-[#14261D] text-signal-stable border border-[#214734]'
                                : 'bg-[#2A1416] text-signal-critical border border-[#5C1B1E]'
                            }`}
                          >
                            {d.isAvailable ? 'AVAILABLE' : 'ALLOCATED'}
                          </span>
                          <Link
                            to={`/match/${d.id}`}
                            className="btn-action text-[11px] py-0.5 px-2"
                          >
                            Match
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Center Waiting Patients */}
            <div className="panel flex flex-col justify-between">
              <div>
                <div className="p-3 border-b border-line flex items-center justify-between bg-surface-2/40 text-xs font-mono">
                  <span className="font-bold text-ink-primary">LOCAL WAITING PATIENTS</span>
                  <span className="text-ink-secondary">{overview.hospital.recipients.length} Nodes</span>
                </div>

                <div className="divide-y divide-line text-xs font-mono">
                  {overview.hospital.recipients.length === 0 ? (
                    <div className="p-6 text-center text-ink-secondary">No patients registered at this center.</div>
                  ) : (
                    overview.hospital.recipients.map((r) => (
                      <div key={r.id} className="p-3 flex items-center justify-between gap-2 hover:bg-surface-2/40">
                        <div>
                          <p className="font-semibold text-ink-primary">{r.name}</p>
                          <p className="text-[11px] text-ink-secondary">
                            Needing {r.organTypeNeeded} • Blood {r.bloodGroup} • {r.waitTimeDays}d on list
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <UrgencyBadge score={r.severityScore} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
