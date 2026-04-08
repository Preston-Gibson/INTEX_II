import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserAvatar from '../../components/UserAvatar';
import { downloadExport } from '../../utils/auth';
import ImpactPage from './ImpactPage';
import GivingPage from './GivingPage';
import SettingsPage from './SettingsPage';

const API = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/donor-dashboard`;

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

export default function DonorDashboard() {
  const [activeNav, setActiveNav] = useState('Overview');
  const [chartRange, setChartRange] = useState<'6 MONTHS' | '12 MONTHS'>('12 MONTHS');
  const [customAmount, setCustomAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const [stats, setStats] = useState<Stats | null>(null);
  const [yearlyImpact, setYearlyImpact] = useState<YearlyImpact[]>([]);
  const [allocation, setAllocation] = useState<DonationAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeNav !== 'Overview') return;
    setLoading(true);
    Promise.all([
      fetch(`${API}/stats`).then(r => r.json()),
      fetch(`${API}/yearly-impact`).then(r => r.json()),
      fetch(`${API}/donation-allocation`).then(r => r.json()),
    ]).then(([s, y, a]) => {
      setStats(s);
      setYearlyImpact(y);
      setAllocation(a);
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

  return (
    <div className="flex h-screen bg-surface overflow-hidden font-body">
      <aside className="w-56 flex-shrink-0 flex flex-col bg-surface-container-lowest border-r border-outline-variant/20 py-6 px-4 relative z-10">
        <div className="mb-8 px-2">
          <p className="text-primary font-manrope font-extrabold text-lg leading-tight">Guardian Portal</p>
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mt-0.5">Donor Command Center</p>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ label, icon }) => (
            <button
              key={label}
              onClick={() => setActiveNav(label)}
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

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-4 px-6 py-3 bg-surface-container-lowest border-b border-outline-variant/20 flex-shrink-0">
          <div className="flex items-center gap-2 bg-surface-container-low rounded-xl px-3 py-2 flex-1 max-w-xs">
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
            <button className="relative">
              <span className="material-symbols-outlined text-on-surface-variant text-[22px]">notifications</span>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-error rounded-full text-white text-[9px] font-bold flex items-center justify-center">3</span>
            </button>
            <button>
              <span className="material-symbols-outlined text-on-surface-variant text-[22px]">help</span>
            </button>
            <UserAvatar />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {activeNav === 'Impact' && <ImpactPage />}
          {activeNav === 'Giving' && <GivingPage />}
          {activeNav === 'Settings' && <SettingsPage />}
          {activeNav !== 'Overview' ? null : <>
          <div className="flex items-start justify-between mb-6">
            <div>
              <span className="inline-block px-3 py-1 bg-tertiary-fixed text-on-surface text-[10px] font-bold uppercase tracking-widest rounded-full mb-3">
                Guardian Mission Update
              </span>
              <h1 className="font-manrope text-3xl font-extrabold text-primary tracking-tight">Good morning, Guardian</h1>
              <p className="text-on-surface-variant text-sm mt-1 max-w-lg leading-relaxed">
                Your contributions this month have directly enabled the deployment of nutritional kits to three new community centers in the Northern Highlands.
              </p>
            </div>
            <div className="bg-surface-container-low rounded-xl px-4 py-3 flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-tertiary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">Status Level</p>
                <p className="text-sm font-extrabold text-on-surface">Gold Guardian</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
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
            <div className="aurora-gradient rounded-xl p-4 text-white">
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-3">Impact Velocity</p>
              <p className="font-manrope text-2xl font-extrabold mb-2">Strong</p>
              <div className="w-full bg-white/20 rounded-full h-1.5 mb-1">
                <div className="bg-secondary-fixed h-full rounded-full" style={{ width: '85%' }}></div>
              </div>
              <p className="text-[10px] text-white/70">85% of annual goal reached</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-4">
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
              <div className="aurora-gradient rounded-xl p-5 text-white">
                <p className="font-manrope font-bold text-lg mb-1">Quick Action</p>
                <p className="text-white/70 text-xs mb-4">Boost your impact instantly with a recurring or one-time gift.</p>
                <div className="flex gap-2 mb-3">
                  {[25, 50, 100].map((amt) => (
                    <button key={amt} onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${selectedAmount === amt ? 'bg-white text-primary border-white' : 'bg-white/10 border-white/30 hover:bg-white/20'}`}>
                      ${amt}
                    </button>
                  ))}
                </div>
                <input type="number" placeholder="Custom amount" value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/50 outline-none mb-3 focus:border-white/50"
                />
                <button className="w-full bg-secondary-fixed text-on-surface font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity">
                  Send Contribution
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden h-48">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/60 to-primary aurora-gradient opacity-90"></div>
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <span className="inline-block px-2 py-0.5 bg-tertiary-fixed text-on-surface text-[9px] font-bold uppercase tracking-widest rounded-full mb-2 self-start">Field Report</span>
                  <p className="font-manrope font-bold text-white text-sm leading-snug mb-2">The difference your support made in Antigua.</p>
                  <div className="glass-panel rounded-lg p-2">
                    <p className="text-[10px] text-on-surface italic leading-relaxed">"Because of the support from guardians like you, we were able to sustain the clean water initiative through the dry season."</p>
                    <p className="text-[9px] font-bold text-secondary mt-1">— Maria V., Field Coordinator</p>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-xl p-4">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Command Resources</p>
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
                    Contact Guardian Support
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
