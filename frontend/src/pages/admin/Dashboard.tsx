import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

// ─── Config ──────────────────────────────────────────────────────────────────
// Requires a new backend controller: GET /api/admin-dashboard/{stats|weekly-activity|upcoming-visits|recent-activity}
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

async function fetchStats(): Promise<CommandCenterStats> {
  const res = await fetch(`${API_BASE}/api/admin-dashboard/stats`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('stats');
  return res.json();
}

async function fetchWeeklyActivity(): Promise<WeeklyActivity[]> {
  const res = await fetch(`${API_BASE}/api/admin-dashboard/weekly-activity`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('weekly-activity');
  return res.json();
}

async function fetchUpcomingVisits(): Promise<ScheduledVisit[]> {
  const res = await fetch(`${API_BASE}/api/admin-dashboard/upcoming-visits`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('upcoming-visits');
  return res.json();
}

async function fetchRecentActivity(): Promise<ActivityItem[]> {
  const res = await fetch(`${API_BASE}/api/admin-dashboard/recent-activity`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('recent-activity');
  return res.json();
}

// ─── Sidebar nav items ────────────────────────────────────────────────────────

const sidebarNav = [
  { to: '/admin-dashboard', icon: 'dashboard', label: 'Command Center' },
  { to: '/admin-caseload-inventory', icon: 'folder_shared', label: 'Caseload' },
  { to: '/admin-donors-contributions', icon: 'volunteer_activism', label: 'Donors' },
  { to: '/admin-process-recording', icon: 'history_edu', label: 'Recordings' },
  { to: '/admin-home-visitation-case-conference', icon: 'home_pin', label: 'Visits' },
  { to: '/admin-reports-analytics', icon: 'analytics', label: 'Analytics' },
];

// ─── Activity icon config ──────────────────────────────────────────────────────

const activityConfig = {
  case: { icon: 'description', bg: 'bg-primary-fixed', color: 'text-primary' },
  donation: { icon: 'payments', bg: 'bg-[#93f2f2]', color: 'text-[#006a6a]' },
  visit: { icon: 'home_pin', bg: 'bg-[#ffdeac]', color: 'text-[#593c00]' },
  alert: { icon: 'warning', bg: 'bg-error-container', color: 'text-error' },
};

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-surface-container-high rounded-lg ${className}`} />
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  borderColor: string;
  loading: boolean;
  children?: React.ReactNode;
}

function StatCard({ label, value, icon, borderColor, loading, children }: StatCardProps) {
  return (
    <div
      className={`bg-surface-container-lowest p-6 rounded-xl shadow-sm border-l-4 ${borderColor} relative overflow-hidden group`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity select-none">
        <span className="material-symbols-outlined text-6xl">{icon}</span>
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
        {label}
      </p>
      {loading ? (
        <Skeleton className="h-10 w-24 mt-1" />
      ) : (
        <h3 className="text-4xl font-extrabold text-primary font-headline">{value}</h3>
      )}
      <div className="mt-4">
        {loading ? <Skeleton className="h-4 w-32" /> : children}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminCommandCenter() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<CommandCenterStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyActivity[]>([]);
  const [upcomingVisits, setUpcomingVisits] = useState<ScheduledVisit[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [s, w, v, a] = await Promise.all([
          fetchStats(),
          fetchWeeklyActivity(),
          fetchUpcomingVisits(),
          fetchRecentActivity(),
        ]);
        if (!cancelled) {
          setStats(s);
          setWeeklyData(w);
          setUpcomingVisits(v);
          setRecentActivity(a);
        }
      } catch {
        if (!cancelled) setError('Unable to load dashboard data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Normalize weekly chart bars to percentage of max value
  const maxActivity = Math.max(...weeklyData.map((d) => d.value), 1);
  const chartBars: Array<{ shortDay: string; pct: number; isMax: boolean }> =
    weeklyData.length > 0
      ? weeklyData.map((d) => ({
          shortDay: d.shortDay,
          pct: Math.round((d.value / maxActivity) * 100),
          isMax: d.value === maxActivity,
        }))
      : [
          { shortDay: 'Mon', pct: 40, isMax: false },
          { shortDay: 'Tue', pct: 65, isMax: false },
          { shortDay: 'Wed', pct: 45, isMax: false },
          { shortDay: 'Thu', pct: 90, isMax: true },
          { shortDay: 'Fri', pct: 60, isMax: false },
          { shortDay: 'Sat', pct: 30, isMax: false },
          { shortDay: 'Sun', pct: 75, isMax: false },
        ];

  // Format visit date
  function formatVisitDate(dateStr: string) {
    const d = new Date(dateStr);
    return {
      month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
      day: d.getDate(),
    };
  }

  return (
    <>
      {/* ── Sidebar ── */}
      {/* Starts at top-20 to sit flush below the global NavBar (h-20 = 5rem) */}
      <aside className="fixed left-0 top-20 w-64 h-[calc(100vh-5rem)] bg-slate-50 dark:bg-slate-950 flex flex-col py-6 z-40 border-r border-slate-200/50">
        <div className="px-6 mb-8">
          <span className="text-xl font-extrabold text-blue-900 dark:text-blue-200 font-headline">
            Lucero Admin
          </span>
          <p className="text-xs text-slate-500 mt-0.5">Santa Rosa de Copán</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {sidebarNav.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive
                  ? 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 rounded-xl mx-2 px-4 py-3 font-bold flex items-center gap-3 transition-all translate-x-1'
                  : 'text-slate-500 dark:text-slate-400 mx-2 px-4 py-3 flex items-center gap-3 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-xl transition-all'
              }
            >
              <span className="material-symbols-outlined text-xl">{icon}</span>
              <span className="text-sm font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 mb-6">
          <button
            onClick={() => navigate('/admin-caseload-inventory')}
            className="w-full py-3 aurora-gradient text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity text-sm"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              add_circle
            </span>
            New Case
          </button>
        </div>

        <div className="pt-4 border-t border-slate-200/50 space-y-1">
          <NavLink
            to="/privacy-policy"
            className="text-slate-500 dark:text-slate-400 mx-2 px-4 py-2 flex items-center gap-3 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-xl transition-all"
          >
            <span className="material-symbols-outlined text-xl">settings</span>
            <span className="text-sm font-medium">Settings</span>
          </NavLink>
          <a
            href="mailto:support@lucero.org"
            className="text-slate-500 dark:text-slate-400 mx-2 px-4 py-2 flex items-center gap-3 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-xl transition-all"
          >
            <span className="material-symbols-outlined text-xl">help_outline</span>
            <span className="text-sm font-medium">Support</span>
          </a>
        </div>
      </aside>

      {/* ── Admin sub-header ── */}
      {/* Fixed below global NavBar (top-20), right of sidebar (left-64) */}
      <header className="fixed top-20 left-64 right-0 h-16 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-xl z-30 shadow-sm border-b border-slate-200/30">
        <div className="flex justify-between items-center h-full px-8">
          <div>
            <h1 className="text-lg font-bold text-blue-900 dark:text-white font-headline leading-none">
              Command Center
            </h1>
            <p className="text-[11px] text-on-surface-variant mt-0.5">Operational Oversight</p>
          </div>
          <div className="flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="/impact" className="hover:text-blue-800 transition-colors hidden md:block">
              Our Mission
            </a>
            <a href="/impact" className="hover:text-blue-800 transition-colors hidden md:block">
              Impact
            </a>
            <a href="/admin-donors-contributions" className="hover:text-blue-800 transition-colors hidden md:block">
              Donations
            </a>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      {/* ml-64 offsets the fixed sidebar; pt-16 offsets the fixed admin sub-header */}
      <main className="ml-64 pt-16 p-8 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* ── Error banner ── */}
          {error && (
            <div className="bg-error-container text-on-error-container px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-3">
              <span className="material-symbols-outlined text-lg">warning</span>
              {error} Showing cached layout while backend is initializing.
            </div>
          )}

          {/* ── Page greeting ── */}
          <section className="flex flex-col md:flex-row items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-primary tracking-tight font-headline">
                Good morning, Guardian
              </h2>
              <p className="text-on-surface-variant max-w-md mt-1 leading-relaxed text-sm">
                Your overview for Santa Rosa de Copán is ready. Here are the core metrics for
                today's operations.
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

          {/* ── Metric cards ── */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              label="Active Residents"
              value={stats ? String(stats.activeResidents) : '—'}
              icon="groups"
              borderColor="border-primary"
              loading={loading}
            >
              {stats && (
                <div className="flex items-center gap-2 text-[#006a6a] text-xs font-bold">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  <span>+{stats.activeResidentsWeekDelta} this week</span>
                </div>
              )}
            </StatCard>

            <StatCard
              label="Recent Donations"
              value={
                stats
                  ? `$${stats.recentDonationsTotal.toLocaleString()}`
                  : '—'
              }
              icon="volunteer_activism"
              borderColor="border-[#ffba38]"
              loading={loading}
            >
              {stats && (
                <p className="text-on-surface-variant text-xs">
                  Primary source:{' '}
                  <span className="font-bold text-[#593c00]">{stats.topDonorName}</span>
                </p>
              )}
            </StatCard>

            <StatCard
              label="Pending Case Logs"
              value={stats ? String(stats.pendingCaseLogs) : '—'}
              icon="assignment_late"
              borderColor="border-error"
              loading={loading}
            >
              {stats && (
                <div className="flex items-center gap-2 text-error text-xs font-bold">
                  <span className="material-symbols-outlined text-sm">priority_high</span>
                  <span>{stats.urgentCaseLogs} require urgent review</span>
                </div>
              )}
            </StatCard>

            <StatCard
              label="Home Visits Today"
              value={stats ? String(stats.homeVisitsToday) : '—'}
              icon="calendar_month"
              borderColor="border-[#006a6a]"
              loading={loading}
            >
              {stats && (
                <div className="flex items-center gap-2 text-on-surface-variant text-xs font-medium">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span>
                    Next: {stats.nextVisitTime} ({stats.nextVisitLocation})
                  </span>
                </div>
              )}
            </StatCard>
          </section>

          {/* ── Bottom grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left column – chart + visits */}
            <div className="lg:col-span-2 space-y-6">

              {/* Operational velocity chart */}
              <div className="bg-surface-container-low p-8 rounded-xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-primary font-headline">
                    Operational Velocity
                  </h3>
                  <span className="px-3 py-1 bg-surface-container-lowest text-[10px] font-bold rounded-full text-[#006a6a]">
                    WEEKLY VIEW
                  </span>
                </div>

                {loading ? (
                  <div className="h-64 flex items-end gap-2 px-4">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <Skeleton key={i} className="w-full rounded-t-lg" style={{ height: `${30 + i * 8}%` } as React.CSSProperties} />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="h-64 flex items-end justify-between gap-2 px-4">
                      {chartBars.map((bar, i) => (
                        <div
                          key={i}
                          className={`w-full rounded-t-lg relative group transition-all duration-500 ${
                            bar.isMax ? 'bg-primary-container' : 'bg-primary-container/20'
                          }`}
                          style={{ height: `${bar.pct}%` }}
                        >
                          {bar.isMax && (
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] px-2 py-1 rounded hidden group-hover:block whitespace-nowrap">
                              Peak: {bar.pct}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">
                      {chartBars.map((bar, i) => (
                        <span key={i}>{bar.shortDay}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Scheduled visits */}
              <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-primary font-headline">
                    Scheduled Visits
                  </h3>
                  <NavLink
                    to="/admin-home-visitation-case-conference"
                    className="text-primary text-sm font-bold hover:underline"
                  >
                    View Calendar
                  </NavLink>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                  </div>
                ) : upcomingVisits.length === 0 ? (
                  <p className="text-on-surface-variant text-sm text-center py-8">
                    No visits scheduled.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {upcomingVisits.slice(0, 4).map((visit) => {
                      const { month, day } = formatVisitDate(visit.visitDate);
                      const isAssigned = visit.status === 'assigned';
                      return (
                        <div
                          key={visit.visitationId}
                          className={`flex items-center justify-between p-4 bg-surface-container-low rounded-xl border-l-4 ${
                            isAssigned ? 'border-[#ffba38]' : 'border-primary'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="bg-surface-container-lowest w-12 h-12 rounded-xl flex flex-col items-center justify-center shadow-sm flex-shrink-0">
                              <span className="text-[10px] font-bold text-on-surface-variant">
                                {month}
                              </span>
                              <span className="text-lg font-bold text-primary leading-none">
                                {day}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-bold text-on-surface text-sm">
                                Case #{visit.residentCaseNo}
                              </h4>
                              <p className="text-xs text-on-surface-variant">
                                {visit.visitType} • {visit.locationVisited}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <p className="text-sm font-bold text-primary">
                              {visit.socialWorker}
                            </p>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                isAssigned
                                  ? 'bg-secondary-container text-on-secondary-container'
                                  : 'bg-primary-container text-white'
                              }`}
                            >
                              {isAssigned ? 'ASSIGNED' : 'PENDING'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right column – activity feed */}
            <div className="space-y-6">
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-primary font-headline">
                    Recent Updates
                  </h3>
                  <button
                    onClick={() => window.location.reload()}
                    className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer text-xl"
                    aria-label="Refresh"
                  >
                    sync
                  </button>
                </div>

                {loading ? (
                  <div className="space-y-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex gap-4">
                        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivity.length === 0 ? (
                  <p className="text-on-surface-variant text-sm text-center py-6">
                    No recent activity.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {recentActivity.slice(0, 4).map((item, idx) => {
                      const cfg = activityConfig[item.type];
                      const isLast = idx === recentActivity.slice(0, 4).length - 1;
                      return (
                        <div key={item.id} className="flex gap-4 relative">
                          {!isLast && (
                            <div className="absolute left-4 top-10 bottom-[-1.5rem] w-0.5 bg-outline-variant/20" />
                          )}
                          <div
                            className={`relative z-10 w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}
                          >
                            <span
                              className={`material-symbols-outlined ${cfg.color} text-sm`}
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              {cfg.icon}
                            </span>
                          </div>
                          <div>
                            <p
                              className="text-sm text-on-surface leading-snug"
                              dangerouslySetInnerHTML={{ __html: item.description }}
                            />
                            <span className="text-[10px] text-on-surface-variant uppercase font-bold">
                              {item.timeAgo}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <NavLink
                  to="/admin-reports-analytics"
                  className="block w-full mt-8 py-3 text-sm font-bold text-primary bg-surface-container hover:bg-surface-container-high rounded-xl transition-colors text-center"
                >
                  View All Activity
                </NavLink>
              </div>

              {/* Quick links card */}
              <div className="bg-surface-container-low p-6 rounded-xl">
                <h3 className="text-sm font-bold text-primary font-headline mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  {[
                    { to: '/admin-caseload-inventory', icon: 'folder_shared', label: 'View All Cases' },
                    { to: '/admin-donors-contributions', icon: 'volunteer_activism', label: 'Donor Log' },
                    { to: '/admin-process-recording', icon: 'history_edu', label: 'Process Recordings' },
                    { to: '/admin-reports-analytics', icon: 'analytics', label: 'Reports & Analytics' },
                  ].map(({ to, icon, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-on-surface-variant text-lg">
                        {icon}
                      </span>
                      {label}
                      <span className="material-symbols-outlined text-on-surface-variant text-sm ml-auto">
                        chevron_right
                      </span>
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
