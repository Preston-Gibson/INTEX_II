import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import UserAvatar from '../../components/UserAvatar';
import { authHeaders, downloadExport } from '../../utils/auth';

const API = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/reports`;
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// --- Types ---
interface PillarData {
  caring: { activeResidents: number; healthVisits: number; mentalHealthSessions: number; dentalCheckups: number };
  healing: { reintegrationsCompleted: number; activeInterventionPlans: number; incidentResponseRate: number; avgLengthOfStayMonths: number };
  teaching: { enrolledStudents: number; avgAttendanceRate: number; avgProgressPercent: number; completedCourses: number };
}

interface DonationMonth { month: number; amount: number }

interface OutcomeMetrics {
  educationProgress: number;
  healthScore: number;
  reintegrationRate: number;
  attendanceRate: number;
}

interface SafehouseRow {
  safehouseId: number;
  name: string;
  country: string;
  residents: number;
  capacity: number;
  reintegrated: number;
  educationRecords: number;
  healthVisits: number;
  utilization: number;
}

interface ReintegrationBreakdown {
  total: number;
  breakdown: { type: string; count: number; percentage: number }[];
}

type ReportYear = '2026' | '2025' | '2024' | '2023' | '2022';

function reintegrationIcon(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('family') || t.includes('reunif')) return 'family_restroom';
  if (t.includes('independent') || t.includes('living')) return 'home';
  if (t.includes('foster')) return 'child_care';
  if (t.includes('community') || t.includes('program')) return 'groups';
  if (t.includes('school') || t.includes('education')) return 'school';
  return 'how_to_reg';
}

export default function ReportsAnalytics() {
  const [year, setYear] = useState<ReportYear>('2026');
  const [pillars, setPillars] = useState<PillarData | null>(null);
  const [donations, setDonations] = useState<DonationMonth[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeMetrics | null>(null);
  const [safehouses, setSafehouses] = useState<SafehouseRow[]>([]);
  const [reintegration, setReintegration] = useState<ReintegrationBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const y = year;
    Promise.all([
      fetch(`${API}/pillars?year=${y}`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/donation-trends?year=${y}`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/outcome-metrics?year=${y}`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/safehouses?year=${y}`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/reintegration?year=${y}`, { headers: authHeaders() }).then(r => r.json()),
    ]).then(([p, d, o, s, ri]) => {
      setPillars(p);
      setDonations(d);
      setOutcomes(o);
      setSafehouses(s);
      setReintegration(ri);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [year]);

  const maxDonation = donations.length ? Math.max(...donations.map(d => d.amount), 1) : 1;
  const totalDonations = donations.reduce((s, d) => s + d.amount, 0);
  const activeSafehouses = safehouses.filter(s => s.residents > 0).length;
  const totalResidents = safehouses.reduce((s, sh) => s + sh.residents, 0);

  return (
    <div className="flex h-screen bg-surface overflow-hidden font-body">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Standard top bar */}
        <header className="flex items-center gap-3 px-6 py-3 bg-surface-container-lowest border-b border-outline-variant/20 flex-shrink-0">
          <div className="flex bg-surface-container-low rounded-xl p-1 gap-1">
            {(['2026', '2025', '2024', '2023', '2022'] as ReportYear[]).map((y) => (
              <button key={y} onClick={() => setYear(y)}
                className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${year === y ? 'aurora-gradient text-white' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                {y}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => downloadExport('/api/export/donations', 'csv', year)}
              className="flex items-center gap-2 bg-surface-container-low text-on-surface text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[16px]">download</span>
              Export CSV
            </button>
            <UserAvatar />
          </div>
        </header>

      <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto">

      {/* Page heading */}
      <div className="mb-8">
        <h1 className="font-manrope text-3xl font-extrabold text-primary tracking-tight mb-2">
          Reports &amp; Analytics
        </h1>
        <p className="text-on-surface-variant text-sm max-w-xl leading-relaxed">
          Aggregated insights across all safehouses, aligned with the Annual Accomplishment Report format — tracking caring, healing, and teaching outcomes.
        </p>
      </div>

      {!loading && (
        <>
          {/* Annual Accomplishment — 3 Service Pillars */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-5 rounded-full bg-secondary"></span>
              <h2 className="font-manrope font-bold text-on-surface">Annual Accomplishment Report — {year}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Caring */}
              <div className="bg-surface-container-low rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary/10 text-secondary">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                  </div>
                  <p className="font-manrope font-extrabold text-on-surface">Caring</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Residents in Active Care', value: pillars?.caring.activeResidents ?? '—' },
                    { label: 'Health Visits Conducted', value: pillars?.caring.healthVisits ?? '—' },
                    { label: 'Mental Health Sessions', value: pillars?.caring.mentalHealthSessions ?? '—' },
                    { label: 'Dental Checkups', value: pillars?.caring.dentalCheckups ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-surface-container-lowest rounded-xl p-3">
                      <p className="font-manrope font-extrabold text-lg text-primary">{value}</p>
                      <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Healing */}
              <div className="bg-surface-container-low rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>healing</span>
                  </div>
                  <p className="font-manrope font-extrabold text-on-surface">Healing</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Reintegrations Completed', value: pillars?.healing.reintegrationsCompleted ?? '—' },
                    { label: 'Intervention Plans Active', value: pillars?.healing.activeInterventionPlans ?? '—' },
                    { label: 'Incident Response Rate', value: pillars ? `${pillars.healing.incidentResponseRate}%` : '—' },
                    { label: 'Avg. Recovery Duration', value: pillars ? `${pillars.healing.avgLengthOfStayMonths} mo` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-surface-container-lowest rounded-xl p-3">
                      <p className="font-manrope font-extrabold text-lg text-primary">{value}</p>
                      <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Teaching */}
              <div className="bg-surface-container-low rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-tertiary/10 text-tertiary">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                  </div>
                  <p className="font-manrope font-extrabold text-on-surface">Teaching</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Students Enrolled', value: pillars?.teaching.enrolledStudents ?? '—' },
                    { label: 'Courses Completed', value: pillars?.teaching.completedCourses ?? '—' },
                    { label: 'Avg. Attendance Rate', value: pillars ? `${pillars.teaching.avgAttendanceRate}%` : '—' },
                    { label: 'Avg. Education Progress', value: pillars ? `${pillars.teaching.avgProgressPercent}%` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-surface-container-lowest rounded-xl p-3">
                      <p className="font-manrope font-extrabold text-lg text-primary">{value}</p>
                      <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Donation Trend + Outcome Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Donation Trend Chart */}
            <div className="md:col-span-2 bg-surface-container-low rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-manrope font-bold text-on-surface">Donation Trends</p>
                  <p className="text-xs text-on-surface-variant">Monthly donation volume — {year}</p>
                </div>
                <div className="text-right">
                  <p className="font-manrope font-extrabold text-xl text-primary">
                    ${totalDonations.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-on-surface-variant font-bold">Total for {year}</p>
                </div>
              </div>
              {donations.length === 0 ? (
                <div className="h-36 flex items-center justify-center text-on-surface-variant text-xs">No donation data for {year}</div>
              ) : (
                <div className="flex items-end gap-1.5 h-36">
                  {donations.map(({ month, amount }) => (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="relative w-full">
                        <div
                          className="w-full bg-primary rounded-t-lg group-hover:opacity-80 transition-opacity"
                          style={{ height: `${Math.max(Math.round((amount / maxDonation) * 136), amount > 0 ? 4 : 0)}px` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-on-surface-variant uppercase">{MONTH_NAMES[month - 1]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outcome Progress */}
            <div className="bg-surface-container-low rounded-2xl p-5">
              <p className="font-manrope font-bold text-on-surface mb-1">Outcome Metrics</p>
              <p className="text-xs text-on-surface-variant mb-5">Program performance indicators</p>
              <div className="space-y-5">
                {outcomes ? [
                  { label: 'Reintegration Success Rate', value: outcomes.reintegrationRate, color: 'bg-secondary' },
                  { label: 'Education Progress', value: outcomes.educationProgress, color: 'bg-primary' },
                  { label: 'Health Score (avg)', value: outcomes.healthScore, color: 'bg-tertiary-fixed-dim' },
                  { label: 'Attendance Rate', value: outcomes.attendanceRate, color: 'bg-outline-variant' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs font-semibold text-on-surface">{label}</span>
                      <span className="text-xs font-extrabold text-on-surface">{value}%</span>
                    </div>
                    <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                      <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${Math.min(value, 100)}%` }}></div>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-on-surface-variant">No data for {year}</p>
                )}
              </div>
            </div>
          </div>

          {/* Safehouse Performance Table */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-5 rounded-full bg-primary"></span>
              <h2 className="font-manrope font-bold text-on-surface">Safehouse Performance Comparison</h2>
            </div>
            <div className="bg-surface-container-low rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-container">
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Safehouse</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Country</th>
                    <th className="text-center px-5 py-3.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Residents</th>
                    <th className="text-center px-5 py-3.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Capacity</th>
                    <th className="text-center px-5 py-3.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Reintegrated</th>
                    <th className="text-center px-5 py-3.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Edu Records</th>
                    <th className="text-center px-5 py-3.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Health Visits</th>
                    <th className="text-center px-5 py-3.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {safehouses.length === 0 ? (
                    <tr><td colSpan={8} className="px-5 py-8 text-center text-xs text-on-surface-variant">No safehouse data available</td></tr>
                  ) : safehouses.map((sh) => (
                    <tr key={sh.safehouseId} className="hover:bg-surface-container transition-colors">
                      <td className="px-5 py-4 font-bold text-on-surface">{sh.name}</td>
                      <td className="px-5 py-4 text-on-surface-variant">{sh.country}</td>
                      <td className="px-5 py-4 text-center font-bold text-on-surface">{sh.residents}</td>
                      <td className="px-5 py-4 text-center text-on-surface-variant">{sh.capacity}</td>
                      <td className="px-5 py-4 text-center">
                        <span className="px-2.5 py-1 bg-secondary/10 text-secondary text-[11px] font-bold rounded-full">{sh.reintegrated}</span>
                      </td>
                      <td className="px-5 py-4 text-center text-on-surface">{sh.educationRecords.toLocaleString()}</td>
                      <td className="px-5 py-4 text-center text-on-surface">{sh.healthVisits}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-surface-container h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${sh.utilization > 85 ? 'bg-error' : sh.utilization > 65 ? 'bg-tertiary-fixed-dim' : 'bg-secondary'}`}
                              style={{ width: `${Math.min(sh.utilization, 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-on-surface w-8">{sh.utilization}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Reintegration Breakdown */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-5 rounded-full bg-tertiary-fixed-dim"></span>
              <h2 className="font-manrope font-bold text-on-surface">Reintegration Success Rates</h2>
            </div>
            {!reintegration || reintegration.breakdown.length === 0 ? (
              <div className="bg-surface-container-low rounded-2xl p-8 text-center text-xs text-on-surface-variant">No reintegration data for {year}</div>
            ) : (
              <div className={`grid gap-4 grid-cols-2 ${reintegration.breakdown.length <= 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                {reintegration.breakdown.map(({ type, count, percentage }) => (
                  <div key={type} className="bg-surface-container-low rounded-2xl p-5 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>{reintegrationIcon(type)}</span>
                    </div>
                    <p className="font-manrope font-extrabold text-2xl text-primary mb-0.5">{percentage}%</p>
                    <p className="text-xs font-bold text-on-surface mb-1">{type}</p>
                    <p className="text-[10px] text-on-surface-variant">{count} cases</p>
                    <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-3">
                      <div className="bg-secondary h-full rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Beneficiary Summary */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-5 rounded-full bg-secondary"></span>
              <h2 className="font-manrope font-bold text-on-surface">Beneficiary Summary — {year}</h2>
            </div>
            <div className="aurora-gradient rounded-2xl p-6 text-white">
              <div className="grid grid-cols-5 gap-4 mb-6">
                {[
                  { label: 'Total Beneficiaries', value: totalResidents, icon: 'groups' },
                  { label: 'Reintegrations', value: reintegration?.total ?? 0, icon: 'how_to_reg' },
                  { label: 'Health Checkups', value: pillars?.caring.healthVisits ?? 0, icon: 'health_and_safety' },
                  { label: 'Students Enrolled', value: pillars?.teaching.enrolledStudents ?? 0, icon: 'school' },
                  { label: 'Active Safehouses', value: activeSafehouses, icon: 'home_work' },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="text-center">
                    <span className="material-symbols-outlined text-white/60 text-[22px] mb-1 block" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                    <p className="font-manrope font-extrabold text-2xl">{value.toLocaleString()}</p>
                    <p className="text-white/70 text-[11px] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white/10 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold mb-0.5">Annual Report Ready for Export</p>
                  <p className="text-white/60 text-xs">Includes all service pillars, beneficiary counts, and program outcomes.</p>
                </div>
                <button
                  onClick={() => downloadExport('/api/export/tax-report', 'xlsx', year)}
                  className="flex items-center gap-2 bg-white text-primary font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity flex-shrink-0">
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Download Report
                </button>
              </div>
            </div>
          </section>
        </>
      )}
      </div>
    </div>
  </div>
    </div>
  );
}
