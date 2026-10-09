import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDonor, getHospitals } from '../api/client';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ORGAN_TYPES = ['Kidney', 'Liver', 'Heart', 'Lung', 'Pancreas', 'Cornea'];
const CAUSES_OF_DEATH = ['Trauma', 'Stroke', 'CardiacArrest', 'Other'];

export default function DonorForm() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [form, setForm] = useState({
    name: '', age: '', bloodGroup: 'O+', organType: 'Kidney',
    hlaType: 'A1, B8, DR3', hospitalId: '', consentStatus: 'Consented',
    causeOfDeath: 'Trauma',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getHospitals().then((h) => {
      setHospitals(h);
      if (h.length > 0) setForm(f => ({ ...f, hospitalId: h[0].id }));
    }).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const hlaArr = form.hlaType ? form.hlaType.split(',').map(s => s.trim()).filter(Boolean) : [];
      await createDonor({ ...form, hlaType: hlaArr, age: parseInt(form.age) });
      setSuccess(true);
      setTimeout(() => navigate('/donors'), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5 max-w-2xl mx-auto space-y-5">
      <div className="panel p-4 bg-surface-1">
        <h1 className="text-base font-bold text-ink-primary tracking-tight">
          ONBOARD DONOR RECORD TO NATIONAL POOL
        </h1>
        <p className="text-xs text-ink-secondary font-mono mt-0.5">
          Registers recovery hospital, organ viability profile, and triggers DRI risk calculation
        </p>
      </div>

      {success && (
        <div className="p-3 bg-[#14261D] text-signal-stable text-xs font-mono rounded border border-[#214734]">
          [CONFIRMED] Donor registered successfully into atomic allocation registry. Redirecting...
        </div>
      )}
      {error && (
        <div className="p-3 bg-[#2A1416] text-signal-critical text-xs font-mono rounded border border-[#5C1B1E]">
          [ERROR] {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="panel p-5 space-y-4 bg-surface-1 text-xs font-mono">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-ink-secondary block mb-1">Full Legal Name</label>
            <input required className="input-control w-full" value={form.name} onChange={set('name')} placeholder="e.g. Patient 1042" />
          </div>
          <div>
            <label className="text-ink-secondary block mb-1">Donor Age (Years)</label>
            <input required type="number" min="1" max="99" className="input-control w-full" value={form.age} onChange={set('age')} placeholder="e.g. 42" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-ink-secondary block mb-1">ABO / Rh Blood Group</label>
            <select className="input-control w-full" value={form.bloodGroup} onChange={set('bloodGroup')}>
              {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="text-ink-secondary block mb-1">Harvested Organ Class</label>
            <select className="input-control w-full" value={form.organType} onChange={set('organType')}>
              {ORGAN_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-ink-secondary block mb-1">Cause of Death (DRI Weight)</label>
            <select className="input-control w-full" value={form.causeOfDeath} onChange={set('causeOfDeath')}>
              {CAUSES_OF_DEATH.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-ink-secondary block mb-1">Harvesting Center Hospital</label>
            <select required className="input-control w-full" value={form.hospitalId} onChange={set('hospitalId')}>
              {hospitals.map(h => <option key={h.id} value={h.id}>{h.name} — {h.city}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-ink-secondary block mb-1">HLA Allele Types (Comma-Separated)</label>
          <input className="input-control w-full" value={form.hlaType} onChange={set('hlaType')} placeholder="A1, A2, B8, DR3" />
          <span className="text-[10px] text-ink-secondary block mt-1">Normalized into 3NF join table upon registration.</span>
        </div>

        <div>
          <label className="text-ink-secondary block mb-1">Verified Consent Status</label>
          <select className="input-control w-full" value={form.consentStatus} onChange={set('consentStatus')}>
            <option value="Consented">Consented (Immediate Candidate)</option>
            <option value="Pending">Pending Family Verification</option>
            <option value="Revoked">Revoked</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-line">
          <button type="button" onClick={() => navigate('/donors')} className="btn-action text-xs">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary-action text-xs">
            {submitting ? 'Registering...' : 'Certify & Register Donor'}
          </button>
        </div>
      </form>
    </div>
  );
}
