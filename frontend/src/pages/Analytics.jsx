import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  getAnalyticsByHospital,
  getOrganDistribution,
  getTransplantOutcomes,
  getSurvivalDistribution,
  getCitRisk
} from '../api/client';
import LoadingState from '../components/LoadingState';
import Skeleton from '../components/Skeleton';

const THEME_TOOLTIP = {
  contentStyle: {
    background: '#111827',
    border: '1px solid #1E293B',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
    fontSize: '11px',
    color: '#F8FAFC',
    fontFamily: 'monospace',
  },
};

export default function Analytics() {
  const [hospitalData, setHospitalData] = useState([]);
  const [organData, setOrganData] = useState([]);
  const [outcomeData, setOutcomeData] = useState([]);
  const [survivalData, setSurvivalData] = useState([]);
  const [citData, setCitData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAnalyticsByHospital(),
      getOrganDistribution(),
      getTransplantOutcomes(),
      getSurvivalDistribution(),
      getCitRisk()
    ])
      .then(([hosp, org, out, surv, cit]) => {
        setHospitalData(hosp);
        setOrganData(org);
        setOutcomeData(out);
        setSurvivalData(surv);
        setCitData(cit);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto page-enter">
        <LoadingState
          title="COMPILING MULTI-CENTER BIO-ANALYTICS"
          subtitle="Querying graft survival histograms, cold ischemic thresholds, and recipient queues..."
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Skeleton className="h-64" count={4} />
        </div>
      </div>
    );
  }

  const successOutcome = outcomeData.find((o) => o.name === 'Success')?.value || 0;
  const totalOutcomes = outcomeData.reduce((acc, o) => acc + o.value, 0);
  const successRate = totalOutcomes > 0 ? Math.round((successOutcome / totalOutcomes) * 100) : 0;

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto page-enter">
      {/* Title */}
      <div className="panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-ink-primary tracking-tight">
              CLINICAL TELEMETRY &amp; OUTCOME PROJECTIONS
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
              BIO-STAT ENGINE
            </span>
          </div>
          <p className="text-xs text-ink-secondary font-mono mt-0.5">
            Survival Curve Distributions, Ischemic Viability Thresholds, &amp; Inter-Hospital Balance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* 1. 5-Year Graft Survival Distribution */}
        <div className="panel p-4 space-y-3">
          <div>
            <h2 className="text-xs font-mono font-bold text-ink-primary uppercase tracking-wider">
              5-Year Graft Survival Histogram
            </h2>
            <p className="text-[11px] text-ink-secondary font-mono">
              Deterministic Multi-Factor Projections (HLA Overlap, CIT Decay, Age, Sensitization)
            </p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={survivalData}>
                <defs>
                  <linearGradient id="survivalAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="band" tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }} stroke="#1E293B" />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }} stroke="#1E293B" />
                <Tooltip {...THEME_TOOLTIP} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  fill="url(#survivalAreaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. CIT Risk Thermometer Gauges */}
        <div className="panel p-4 space-y-3">
          <div>
            <h2 className="text-xs font-mono font-bold text-ink-primary uppercase tracking-wider">
              Cold Ischemic Time Viability Status
            </h2>
            <p className="text-[11px] text-ink-secondary font-mono">
              Organ Viability vs. Hard Ceilings (Heart 6h, Lung 8h, Liver 24h, Kidney 36h)
            </p>
          </div>
          <div className="space-y-2.5 pt-1">
            {citData.map((item) => {
              const isCritical = item.warningPct > 35;
              return (
                <div key={item.organ} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-ink-primary font-medium">{item.organ}</span>
                    <span className={isCritical ? 'text-signal-critical font-bold' : 'text-ink-secondary'}>
                      Avg: {item.avgCit}h / {item.limit}h [{item.warningPct}% in Warning Zone]
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-0 border border-line rounded-none overflow-hidden">
                    <div
                      className={`h-full ${isCritical ? 'bg-signal-critical' : 'bg-signal-info'}`}
                      style={{ width: `${Math.min(100, (item.avgCit / item.limit) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Organ Supply vs Demand */}
        <div className="panel p-4 space-y-3">
          <div>
            <h2 className="text-xs font-mono font-bold text-ink-primary uppercase tracking-wider">
              Organ Supply vs Demand Balance
            </h2>
            <p className="text-[11px] text-ink-secondary font-mono">Available Consented Donors vs. Active Registry Demand</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={organData}>
                <XAxis dataKey="organ" tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }} stroke="#1E293B" />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }} stroke="#1E293B" />
                <Tooltip {...THEME_TOOLTIP} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }} />
                <Bar dataKey="donors" name="Supply (Donors)" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recipients" name="Demand (Waitlist)" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Clinical Outcomes Distribution */}
        <div className="panel p-4 space-y-3 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-mono font-bold text-ink-primary uppercase tracking-wider">
              Post-Transplant Clinical Outcomes
            </h2>
            <p className="text-[11px] text-ink-secondary font-mono">Confirmed Patient Outcomes on Finalized Allocations</p>
          </div>
          <div className="h-44 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={70}
                  stroke="#111827"
                  strokeWidth={3}
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#F43F5E" />
                  <Cell fill="#F59E0B" />
                </Pie>
                <Tooltip {...THEME_TOOLTIP} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center pointer-events-none font-mono flex flex-col items-center justify-center w-20 h-20 rounded-full bg-surface-0/80 border border-line shadow-glow-emerald">
              <span className="text-xl font-bold text-emerald-300">{successRate}%</span>
              <span className="text-[9px] text-ink-secondary uppercase tracking-wider">Success</span>
            </div>
          </div>
          <div className="flex justify-center gap-6 text-xs font-mono pt-2.5 border-t border-line text-[11px]">
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Success
            </span>
            <span className="text-rose-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> Failure
            </span>
            <span className="text-amber-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Observation
            </span>
          </div>
        </div>

        {/* 5. Hospital Center Activity */}
        <div className="panel p-4 space-y-3 lg:col-span-2">
          <div>
            <h2 className="text-xs font-mono font-bold text-ink-primary uppercase tracking-wider">
              Regional Center Activity Volume
            </h2>
            <p className="text-[11px] text-ink-secondary font-mono">Active Donors and Waitlist Registrations Grouped by City</p>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hospitalData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }} stroke="#1E293B" />
                <YAxis dataKey="city" type="category" tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }} stroke="#1E293B" />
                <Tooltip {...THEME_TOOLTIP} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }} />
                <Bar dataKey="donors" name="Donors Registered" fill="#10B981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="recipients" name="Waitlist Listed" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
