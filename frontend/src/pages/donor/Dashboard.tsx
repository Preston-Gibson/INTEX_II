import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { downloadExport, authHeaders, getUser } from '../../utils/auth';
import ImpactPage from './ImpactPage';
import GivingPage from './GivingPage';
import SettingsPage from './SettingsPage';

const API = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/donor-dashboard`;

const TO_USD: Record<string, number> = {
  USD: 1, NIO: 0.027, HNL: 0.040, CRC: 0.0019, GTQ: 0.129, PHP: 0.017,
};

function toUSD(amount: number, currency: string | null): string {
  const rate = TO_USD[(currency ?? 'USD').toUpperCase()] ?? 1;
  return `$${(amount * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const NAV_ITEMS = [
  { label: 'Overview', icon: 'dashboard' },
  { label: 'Impact', icon: 'auto_awesome' },
  { label: 'Giving', icon: 'volunteer_activism' },
  { label: 'Settings', icon: 'settings' },
];

interface Stats {
  residentsServed: number;
  successfulReintegrations: number;
  educationHours: number;
}

interface YearlyImpact {
  year: number;
  residentCount: number;
}

interface DonationAllocation {
  programArea: string;
  totalAllocated: number;
  percentage: number;
}

interface MyDonation {
  donationId: number;
  donationType: string;
  donationDate: string | null;
  amount: number | null;
  currencyCode: string | null;
  estimatedValue: number | null;
  campaignName: string | null;
  isRecurring: boolean;
}

interface MyDonationsResponse {
  lifetimeTotal: number;
  donations: MyDonation[];
}

export default function DonorDashboard() {
  const location = useLocation();
  const [activeNav, setActiveNav] = useState<string>((location.state as { tab?: string })?.tab ?? 'Overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chartRange, setChartRange] = useState<'6 MONTHS' | '12 MONTHS'>('12 MONTHS');

  const [stats, setStats] = useState<Stats | null>(null);
  const [yearlyImpact, setYearlyImpact] = useState<YearlyImpact[]>([]);
  const [allocation, setAllocation] = useState<DonationAllocation[]>([]);
  const [myDonations, setMyDonations] = useState<MyDonationsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const user = getUser();
  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email ?? 'Donor';
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : (user?.email?.[0] ?? 'D').toUpperCase();

  useEffect(() => {
    if (activeNav !== 'Overview') return;
    setLoading(true);
    Promise.all([
      fetch(`${API}/stats`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/yearly-impact`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/donation-allocation`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/my-donations`, { headers: authHeaders() }).then(r => r.json()),
    ]).then(([s, y, a, m]) => {
      setStats(s);
      setYearlyImpact(y);
      setAllocation(a);
      setMyDonations(m);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [activeNav]);

  const chartData = (() => {
    const source = chartRange === '6 MONTHS' ? yearlyImpact.slice(-6) : yearlyImpact.slice(-12);
    const max = Math.max(...source.map(y => y.residentCount), 1);
    return source.map((y, i) => ({
      label: String(y.year),
      height: Math.round((y.residentCount / max) * 100),
      active: i === source.length - 1,
    }));
  })();

  const myDonationCount = myDonations?.donations.length ?? 0;
  const myLifetimeUSD = myDonations
    ? myDonations.donations.reduce((sum, d) => {
        const amt = d.amount ?? d.estimatedValue ?? 0;
        const rate = TO_USD[(d.currencyCode ?? 'USD').toUpperCase()] ?? 1;
        return sum + amt * rate;
      }, 0)
    : 0;
  const recentDonations = myDonations?.donations.slice(0, 3) ?? [];

  const sidebarContent = (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-surface-container-lowest border-r border-outline-variant/20 py-6 px-4 relative z-10 h-full">
      <div className="mb-8 px-2 flex items-center justify-between">
        <div>
          <p className="text-primary font-manrope font-extrabold text-lg leading-tight">Guardian Portal</p>
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mt-0.5">Donor Command Center</p>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ label, icon }) => (
          <button
            key={label}
            onClick={() => { setActiveNav(label); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeNav === label
                ? 'bg-primary/10 text-primary border-l-2 border-primary'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
            {label}
          </button>
        ))}
      </nav>
      <button className="w-full aurora-gradient text-white text-sm font-bold py-3 rounded-xl hover:opacity-90 transition-opacity mb-2">
        Donate Now
      </button>
      <Link to="/" className="w-full flex items-center justify-center gap-2 text-on-surface-variant text-xs font-semibold py-2 rounded-xl hover:bg-surface-container-low transition-colors">
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        Back to Home
      </Link>
    </aside>
  );

  return (
    <div className="flex h-screen bg-surface overflow-hidden font-body">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-full">
        {sidebarContent}
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 w-10 h-10 flex items-center justify-center bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-sm"
      >
        <span className="material-symbols-outlined text-on-surface-variant text-[22px]">menu</span>
      </button>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 flex">
            {sidebarContent}
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 pl-14 lg:pl-6 pr-4 md:pr-6 py-3 bg-surface-container-lowest border-b border-outline-variant/20 flex-shrink-0">
          <div className="hidden md:flex items-center gap-2 bg-surface-container-low rounded-xl px-3 py-2 flex-1 max-w-xs">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
            <input
              className="bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant outline-none w-full"
              placeholder="Search mission reports..."
            />
          </div>
          <p className="flex-1 text-center text-sm font-bold text-on-surface">
            {activeNav === 'Overview' ? 'Donor Dashboard' : activeNav === 'Impact' ? 'Impact Report' : activeNav === 'Giving' ? 'Giving Overview' : 'Settings'}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary">{initials}</div>
              <div className="text-right">
                <p className="text-xs font-bold text-on-surface leading-tight">{displayName}</p>
                <p className="text-[10px] text-secondary font-semibold">Donor</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeNav === 'Impact' && <ImpactPage />}
          {activeNav === 'Giving' && <GivingPage />}
          {activeNav === 'Settings' && <SettingsPage />}
          {activeNav !== 'Overview' ? null : <>

          <div className="mb-6">
            <h1 className="font-manrope text-3xl font-extrabold text-primary tracking-tight">
              Welcome, {user?.firstName ?? 'Guardian'}
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Thank you for your continued support of Lucera's mission.
            </p>
          </div>

          {/* Org-wide stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-surface-container-low rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-primary text-[18px]">home_pin</span>
              </div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Residents Served</p>
              <p className="font-manrope text-2xl font-extrabold text-primary">{loading ? '—' : stats?.residentsServed.toLocaleString()}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-secondary text-[18px]">volunteer_activism</span>
              </div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Reintegrations</p>
              <p className="font-manrope text-2xl font-extrabold text-primary">{loading ? '—' : stats?.successfulReintegrations.toLocaleString()}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-tertiary text-[18px]">history_edu</span>
              </div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Education Hours</p>
              <p className="font-manrope text-2xl font-extrabold text-primary">{loading ? '—' : stats ? `${stats.educationHours.toLocaleString()}+` : '—'}</p>
            </div>
          </div>

          {/* Personal donation stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="aurora-gradient rounded-xl p-4 text-white">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              </div>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">Your Lifetime Contributions</p>
              <p className="font-manrope text-2xl font-extrabold">
                {loading ? '—' : `$${myLifetimeUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-primary text-[18px]">receipt_long</span>
              </div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Your Total Donations</p>
              <p className="font-manrope text-2xl font-extrabold text-primary">{loading ? '—' : myDonationCount}</p>
              {recentDonations.length > 0 && (
                <div className="mt-3 space-y-1">
                  {recentDonations.map(d => (
                    <div key={d.donationId} className="flex justify-between text-xs text-on-surface-variant">
                      <span>{d.donationDate ? new Date(d.donationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
                      <span className="font-semibold text-on-surface">{d.amount != null ? toUSD(d.amount, d.currencyCode) : d.donationType}</span>
                    </div>
                  ))}
                </div>
              )}
              {myDonationCount === 0 && !loading && (
                <p className="text-xs text-on-surface-variant mt-2">No donations on record yet.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-surface-container-low rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-manrope font-bold text-on-surface">Year-Over-Year Impact</p>
                    <p className="text-xs text-on-surface-variant">Resident admissions by year</p>
                  </div>
                  <div className="flex gap-1 bg-surface-container rounded-xl p-1">
                    {(['6 MONTHS', '12 MONTHS'] as const).map((r) => (
                      <button key={r} onClick={() => setChartRange(r)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors ${chartRange === r ? 'aurora-gradient text-white' : 'text-on-surface-variant'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-end gap-2 h-32 px-2">
                  {loading ? (
                    <div className="flex-1 flex items-center justify-center text-on-surface-variant text-xs">Loading...</div>
                  ) : chartData.map(({ label, height, active }) => (
                    <div key={label} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-full rounded-t-lg transition-all ${active ? 'bg-primary' : 'bg-surface-container-high hover:bg-primary/40'}`} style={{ height: `${height}%` }}></div>
                      <span className={`text-[9px] font-bold uppercase ${active ? 'text-primary' : 'text-on-surface-variant'}`}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface-container-low rounded-xl p-5">
                <p className="font-manrope font-bold text-on-surface mb-1">Where Your Money Goes</p>
                <p className="text-xs text-on-surface-variant mb-4">For every $1 donated, 92 cents goes directly to program costs.</p>
                {loading ? <p className="text-xs text-on-surface-variant">Loading...</p> : (
                  <div className="space-y-4">
                    {allocation.map(({ programArea, percentage }) => (
                      <div key={programArea}>
                        <div className="flex justify-between mb-1 text-xs font-bold">
                          <span>{programArea}</span><span>{percentage}%</span>
                        </div>
                        <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                          <div className="bg-secondary h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-surface-container-low rounded-xl p-4">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Resources</p>
                <div className="space-y-2">
                  <button
                    onClick={() => downloadExport('/api/export/my-tax-receipt', 'xlsx')}
                    className="w-full flex items-center gap-2 text-sm text-primary font-medium hover:underline">
                    <span className="material-symbols-outlined text-[16px]">description</span>
                    Download Tax Receipt (All Years)
                  </button>
                  <button
                    onClick={() => downloadExport('/api/export/my-tax-receipt', 'xlsx', new Date().getFullYear())}
                    className="w-full flex items-center gap-2 text-sm text-primary font-medium hover:underline">
                    <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                    Download Tax Receipt ({new Date().getFullYear()})
                  </button>
                  <button className="w-full flex items-center gap-2 text-sm text-primary font-medium hover:underline">
                    <span className="material-symbols-outlined text-[16px]">mail</span>
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </div>
          </>}
        </main>
      </div>
    </div>
  );
}
