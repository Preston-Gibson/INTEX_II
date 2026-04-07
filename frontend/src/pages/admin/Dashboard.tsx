import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';

// ─── Config ───────────────────────────────────────────────────────────────────
// Backend: GET /api/admin-dashboard/{stats|weekly-activity|upcoming-visits|recent-activity}
const API_BASE = import.meta.env.VITE_API_URL ?? 'https://localhost:7001';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommandCenterStats {
  activeResidents: number;
  activeResidentsWeekDelta: number;
  recentDonationsTotal: number;
  topDonorName: string;
  pendingCaseLogs: number;
  urgentCaseLogs: number;
  homeVisitsToday: number;
  nextVisitTime: string;
  nextVisitLocation: string;
}

interface WeeklyActivity {
  day: string;
  shortDay: string;
  value: number;
}

interface ScheduledVisit {
  visitationId: number;
  residentCaseNo: string;
  visitDate: string;
  visitType: string;
  locationVisited: string;
  socialWorker: string;
  status: 'assigned' | 'pending';
}

interface ActivityItem {
  id: number;
  type: 'case' | 'donation' | 'visit' | 'alert';
  description: string;
  timeAgo: string;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error(path);
  return res.json();
}

// ─── Sidebar nav ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/admin-dashboard', icon: 'dashboard', label: 'Admin Dashboard' },
  { to: '/admin-caseload-inventory', icon: 'folder_shared', label: 'Caseload' },
  { to: '/admin-donors-contributions', icon: 'volunteer_activism', label: 'Donors' },
  { to: '/admin-process-recording', icon: 'history_edu', label: 'Recordings' },
  { to: '/admin-home-visitation-case-conference', icon: 'home_pin', label: 'Visits' },
  { to: '/admin-reports-analytics', icon: 'analytics', label: 'Analytics' },
];

// ─── Activity icon config ─────────────────────────────────────────────────────

const ACTIVITY_CFG = {
  case:     { icon: 'description', bg: 'bg-primary-fixed',      color: 'text-primary' },
  donation: { icon: 'payments',    bg: 'bg-[#93f2f2]',          color: 'text-[#006a6a]' },
  visit:    { icon: 'home_pin',    bg: 'bg-[#ffdeac]',          color: 'text-[#593c00]' },
  alert:    { icon: 'warning',     bg: 'bg-error-container',    color: 'text-error' },
} as const;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-surface-container-high rounded-lg ${className}`} />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminCommandCenter() {
  const navigate = useNavigate();

  const [stats, setStats]                 = useState<CommandCenterStats | null>(null);
  const [weeklyData, setWeeklyData]       = useState<WeeklyActivity[]>([]);
  const [visits, setVisits]               = useState<ScheduledVisit[]>([]);
  const [activity, setActivity]           = useState<ActivityItem[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [s, w, v, a] = await Promise.all([
          apiFetch<CommandCenterStats>('/api/admin-dashboard/stats'),
          apiFetch<WeeklyActivity[]>('/api/admin-dashboard/weekly-activity'),
          apiFetch<ScheduledVisit[]>('/api/admin-dashboard/upcoming-visits'),
          apiFetch<ActivityItem[]>('/api/admin-dashboard/recent-activity'),
        ]);
        if (!cancelled) { setStats(s); setWeeklyData(w); setVisits(v); setActivity(a); }
      } catch {
        if (!cancelled) setError('Unable to load dashboard data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Bar chart – normalise to max value; fall back to placeholder proportions
  const maxVal = Math.max(...weeklyData.map(d => d.value), 1);
  const chartBars = weeklyData.length > 0
    ? weeklyData.map(d => ({ label: d.shortDay, pct: Math.round((d.value / maxVal) * 100), peak: d.value === maxVal }))
    : [
        { label: 'Mon', pct: 40,  peak: false },
        { label: 'Tue', pct: 65,  peak: false },
        { label: 'Wed', pct: 45,  peak: false },
        { label: 'Thu', pct: 90,  peak: true  },
        { label: 'Fri', pct: 60,  peak: false },
        { label: 'Sat', pct: 30,  peak: false },
        { label: 'Sun', pct: 75,  peak: false },
      ];

  function fmtDate(iso: string) {
    const d = new Date(iso);
    return { month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(), day: d.getDate() };
  }

  return (
    <div className="flex h-screen bg-surface overflow-hidden font-body">

      {/* ── Sidebar ── matching donor dashboard layout & style ── */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-surface-container-lowest border-r border-outline-variant/20 py-6 px-4 relative z-10">

        <div className="mb-8 px-2">
          <p className="text-primary font-headline font-extrabold text-lg leading-tight">Lucero Admin</p>
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mt-0.5">Santa Rosa de Copán</p>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin-dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Yellow / amber create button */}
        <button
          onClick={() => navigate('/admin-caseload-inventory')}
          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mb-2 shadow-sm"
          style={{ backgroundColor: '#ffba38', color: '#281900' }}
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            add_circle
          </span>
          New Case
        </button>

        <Link
          to="/"
          className="flex items-center justify-center gap-2 text-on-surface-variant text-xs font-semibold py-2 rounded-xl hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Home
        </Link>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Slim top bar – search + page label + user (mirrors donor dashboard) */}
        <header className="flex items-center gap-4 px-6 py-3 bg-surface-container-lowest border-b border-outline-variant/20 flex-shrink-0">
          <div className="flex items-center gap-2 bg-surface-container-low rounded-xl px-3 py-2 flex-1 max-w-xs">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
            <input
              className="bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant outline-none w-full"
              placeholder="Search cases, visits…"
            />
          </div>

          <p className="flex-1 text-center text-sm font-bold text-on-surface">Admin Dashboard — Operational Oversight</p>

          <div className="flex items-center gap-3">
            <button className="relative" aria-label="Notifications">
              <span className="material-symbols-outlined text-on-surface-variant text-[22px]">notifications</span>
            </button>
            <button aria-label="Help">
              <span className="material-symbols-outlined text-on-surface-variant text-[22px]">help</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-white">
                AS
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-on-surface leading-tight">Admin Staff</p>
                <p className="text-[10px] text-secondary font-semibold">Lucera Portal</p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Scrollable content ── */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Error banner */}
          {error && (
            <div className="bg-error-container text-on-error-container px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-3">
              <span className="material-symbols-outlined text-lg">warning</span>
              {error} Showing cached layout while backend initialises.
            </div>
          )}

          {/* Page greeting + action buttons */}
          <section className="flex flex-col md:flex-row items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-primary tracking-tight font-headline">
                Good morning, Guardian
              </h2>
              <p className="text-on-surface-variant max-w-md mt-1 leading-relaxed text-sm">
                Your overview for Santa Rosa de Copán is ready. Here are the core metrics for today's operations.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={() => navigate('/admin-donors-contributions')}
                className="bg-secondary-container text-on-secondary-container px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-lg">edit_note</span>
                Log Donation
              </button>
              <button
                onClick={() => navigate('/admin-caseload-inventory')}
                className="aurora-gradient text-white px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                Add New Case
              </button>
            </div>
          </section>

          {/* Metric cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Active Residents */}
            <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border-l-4 border-primary relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity select-none">
                <span className="material-symbols-outlined text-5xl">groups</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Active Residents</p>
              {loading ? <Skeleton className="h-9 w-20 mt-1" /> : (
                <h3 className="text-4xl font-extrabold text-primary font-headline">{stats?.activeResidents ?? '—'}</h3>
              )}
              <div className="mt-3">
                {loading ? <Skeleton className="h-4 w-28" /> : (
                  <div className="flex items-center gap-1.5 text-[#006a6a] text-xs font-bold">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    <span>+{stats?.activeResidentsWeekDelta ?? 0} this week</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Donations */}
            <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border-l-4 border-[#ffba38] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity select-none">
                <span className="material-symbols-outlined text-5xl">volunteer_activism</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Recent Donations</p>
              {loading ? <Skeleton className="h-9 w-28 mt-1" /> : (
                <h3 className="text-4xl font-extrabold text-primary font-headline">
                  ${(stats?.recentDonationsTotal ?? 0).toLocaleString()}
                </h3>
              )}
              <div className="mt-3">
                {loading ? <Skeleton className="h-4 w-32" /> : (
                  <p className="text-on-surface-variant text-xs">
                    Primary source: <span className="font-bold text-[#593c00]">{stats?.topDonorName ?? '—'}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Pending Case Logs */}
            <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border-l-4 border-error relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity select-none">
                <span className="material-symbols-outlined text-5xl">assignment_late</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Pending Case Logs</p>
              {loading ? <Skeleton className="h-9 w-16 mt-1" /> : (
                <h3 className="text-4xl font-extrabold text-primary font-headline">{stats?.pendingCaseLogs ?? '—'}</h3>
              )}
              <div className="mt-3">
                {loading ? <Skeleton className="h-4 w-36" /> : (
                  <div className="flex items-center gap-1.5 text-error text-xs font-bold">
                    <span className="material-symbols-outlined text-sm">priority_high</span>
                    <span>{stats?.urgentCaseLogs ?? 0} require urgent review</span>
                  </div>
                )}
              </div>
            </div>

            {/* Home Visits Today */}
            <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border-l-4 border-[#006a6a] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity select-none">
                <span className="material-symbols-outlined text-5xl">calendar_month</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Home Visits Today</p>
              {loading ? <Skeleton className="h-9 w-16 mt-1" /> : (
                <h3 className="text-4xl font-extrabold text-primary font-headline">{stats?.homeVisitsToday ?? '—'}</h3>
              )}
              <div className="mt-3">
                {loading ? <Skeleton className="h-4 w-40" /> : (
                  <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-medium">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span>Next: {stats?.nextVisitTime ?? '—'} ({stats?.nextVisitLocation ?? '—'})</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Bottom grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left col: chart + visits */}
            <div className="lg:col-span-2 space-y-5">

              {/* Operational velocity chart */}
              <div className="bg-surface-container-low p-6 rounded-xl">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-bold text-primary font-headline">Operational Velocity</h3>
                  <span className="px-3 py-1 bg-surface-container-lowest text-[10px] font-bold rounded-full text-[#006a6a]">
                    WEEKLY VIEW
                  </span>
                </div>
                {loading ? (
                  <div className="h-48 flex items-end gap-2 px-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <Skeleton key={i} className="w-full rounded-t-lg" style={{ height: `${30 + i * 8}%` } as React.CSSProperties} />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="h-48 flex items-end justify-between gap-2 px-2">
                      {chartBars.map((bar, i) => (
                        <div
                          key={i}
                          className={`w-full rounded-t-lg relative group/bar transition-all duration-500 ${bar.peak ? 'bg-primary-container' : 'bg-primary-container/20'}`}
                          style={{ height: `${bar.pct}%` }}
                        >
                          {bar.peak && (
                            <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] px-2 py-1 rounded hidden group-hover/bar:block whitespace-nowrap">
                              Peak: {bar.pct}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">
                      {chartBars.map((b, i) => <span key={i}>{b.label}</span>)}
                    </div>
                  </>
                )}
              </div>

              {/* Scheduled visits */}
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-bold text-primary font-headline">Scheduled Visits</h3>
                  <NavLink to="/admin-home-visitation-case-conference" className="text-primary text-sm font-bold hover:underline">
                    View Calendar
                  </NavLink>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-18 w-full rounded-xl" />
                    <Skeleton className="h-18 w-full rounded-xl" />
                  </div>
                ) : visits.length === 0 ? (
                  <p className="text-on-surface-variant text-sm text-center py-8">No visits scheduled.</p>
                ) : (
                  <div className="space-y-3">
                    {visits.slice(0, 4).map(v => {
                      const { month, day } = fmtDate(v.visitDate);
                      const assigned = v.status === 'assigned';
                      return (
                        <div key={v.visitationId}
                          className={`flex items-center justify-between p-4 bg-surface-container-low rounded-xl border-l-4 ${assigned ? 'border-[#ffba38]' : 'border-primary'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-surface-container-lowest w-11 h-11 rounded-xl flex flex-col items-center justify-center shadow-sm flex-shrink-0">
                              <span className="text-[9px] font-bold text-on-surface-variant">{month}</span>
                              <span className="text-base font-bold text-primary leading-none">{day}</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-on-surface text-sm">Case #{v.residentCaseNo}</h4>
                              <p className="text-xs text-on-surface-variant">{v.visitType} • {v.locationVisited}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-sm font-bold text-primary">{v.socialWorker}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              assigned ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-white'
                            }`}>
                              {assigned ? 'ASSIGNED' : 'PENDING'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right col: activity feed */}
            <div className="space-y-5">
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-primary font-headline">Recent Updates</h3>
                  <button
                    onClick={() => window.location.reload()}
                    aria-label="Refresh"
                    className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors text-xl cursor-pointer"
                  >
                    sync
                  </button>
                </div>

                {loading ? (
                  <div className="space-y-5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activity.length === 0 ? (
                  <p className="text-on-surface-variant text-sm text-center py-6">No recent activity.</p>
                ) : (
                  <div className="space-y-5">
                    {activity.slice(0, 4).map((item, idx) => {
                      const cfg = ACTIVITY_CFG[item.type];
                      const isLast = idx === Math.min(activity.length, 4) - 1;
                      return (
                        <div key={item.id} className="flex gap-3 relative">
                          {!isLast && (
                            <div className="absolute left-4 top-9 bottom-[-1.25rem] w-0.5 bg-outline-variant/20" />
                          )}
                          <div className={`relative z-10 w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                            <span
                              className={`material-symbols-outlined ${cfg.color} text-sm`}
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              {cfg.icon}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-on-surface leading-snug"
                              dangerouslySetInnerHTML={{ __html: item.description }} />
                            <span className="text-[10px] text-on-surface-variant uppercase font-bold">{item.timeAgo}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <NavLink
                  to="/admin-reports-analytics"
                  className="block w-full mt-6 py-2.5 text-sm font-bold text-primary bg-surface-container hover:bg-surface-container-high rounded-xl transition-colors text-center"
                >
                  View All Activity
                </NavLink>
              </div>

              {/* Local Focus card – contains the Lucero mascot/creature */}
              <div className="rounded-xl overflow-hidden relative h-48 group">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhWQ0gFZC0R2VZPlGnMYQjFlvE67DEcUSFpycBGy0xR3FFTwUPR8v9bj5SlkoBOmBRdlVSZbypzPSm0r1NENqOJ1K5fJ_kLiO7OWJuRdClUdHZYsVnMU_L2uA3HaDgmX5Ti6JU-ZQgg-hpSlWREdPRs4yytDbImwG514-44p-_5GfeX6pAppSUOEqrTng-8QWos_a9G-1ZmnKBTNtwCx6ixV-LOPT6U2s4pjBmx9FFr90KAcUfyg99ro5aGjgdB0oj1ahfOnChVA"
                  alt="Santa Rosa de Copán — Lucero community"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback: hide broken image so the gradient shows through
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 aurora-gradient opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-5 flex flex-col justify-end">
                  <span className="text-[10px] text-white/70 uppercase font-bold tracking-widest mb-1">
                    Local Focus
                  </span>
                  <h4 className="text-white font-bold text-lg font-headline">Santa Rosa de Copán</h4>
                  <p className="text-white/80 text-xs">Current conditions: Sunny, 24°C</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
