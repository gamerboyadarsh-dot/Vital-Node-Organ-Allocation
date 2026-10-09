import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRecipient, getHospitals } from '../api/client';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ORGAN_TYPES = ['Kidney', 'Liver', 'Heart', 'Lung', 'Pancreas', 'Cornea'];

export default function RecipientForm() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [form, setForm] = useState({
    name: '', age: '', bloodGroup: 'O+', organTypeNeeded: 'Kidney',
    hlaType: 'A1, B8, DR3', hospitalId: '', severityScore: '6', waitTimeDays: '30', priorFailedMatches: '0'
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
      await createRecipient({
        ...form,
        hlaType: hlaArr,
        age: parseInt(form.age),
        severityScore: parseInt(form.severityScore),
        waitTimeDays: parseInt(form.waitTimeDays),
        priorFailedMatches: parseInt(form.priorFailedMatches),
      });
      setSuccess(true);
      setTimeout(() => navigate('/recipients'), 1200);
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
          ONBOARD RECIPIENT TO REGIONAL WAITLIST
        </h1>
        <p className="text-xs text-ink-secondary font-mono mt-0.5">
          Establishes baseline severity score, organ requirements, and calculates priority ranking
        </p>
      </div>

      {success && (
        <div className="p-3 bg-[#14261D] text-signal-stable text-xs font-mono rounded border border-[#214734]">
          [CONFIRMED] Patient registered and placed into active waitlist priority queue. Redirecting...
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
            <input required className="input-control w-full" value={form.name} onChange={set('name')} placeholder="e.g. Patient 2049" />
          </div>
          <div>
            <label className="text-ink-secondary block mb-1">Patient Age</label>
            <input required type="number" min="1" max="99" className="input-control w-full" value={form.age} onChange={set('age')} placeholder="e.g. 54" />
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
            <label className="text-ink-secondary block mb-1">Required Organ Class</label>
            <select className="input-control w-full" value={form.organTypeNeeded} onChange={set('organTypeNeeded')}>
              {ORGAN_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-ink-secondary block mb-1">Severity (1-10 Scale)</label>
            <input required type="number" min="1" max="10" className="input-control w-full" value={form.severityScore} onChange={set('severityScore')} />
          </div>
          <div>
            <label className="text-ink-secondary block mb-1">Days on Waitlist</label>
            <input required type="number" min="0" className="input-control w-full" value={form.waitTimeDays} onChange={set('waitTimeDays')} />
          </div>
          <div>
            <label className="text-ink-secondary block mb-1">Prior Failed Matches</label>
            <input required type="number" min="0" className="input-control w-full" value={form.priorFailedMatches} onChange={set('priorFailedMatches')} />
          </div>
        </div>

        <div>
          <label className="text-ink-secondary block mb-1">Attending Hospital Center</label>
          <select required className="input-control w-full" value={form.hospitalId} onChange={set('hospitalId')}>
            {hospitals.map(h => <option key={h.id} value={h.id}>{h.name} — {h.city}</option>)}
          </select>
        </div>

        <div>
          <label className="text-ink-secondary block mb-1">HLA Allele Profile (Comma-Separated)</label>
          <input className="input-control w-full" value={form.hlaType} onChange={set('hlaType')} placeholder="A1, B8, DR3" />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-line">
          <button type="button" onClick={() => navigate('/recipients')} className="btn-action text-xs">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary-action text-xs">
            {submitting ? 'Onboarding...' : 'Onboard to Priority Queue'}
          </button>
        </div>
      </form>
    </div>
  );
}
