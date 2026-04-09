import { useState, useEffect } from 'react';
import { authHeaders, getUser } from '../../utils/auth';

const API = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/donor-dashboard`;

const TO_USD: Record<string, number> = {
  USD: 1, NIO: 0.027, HNL: 0.040, CRC: 0.0019, GTQ: 0.129, PHP: 0.017,
};

interface Stats {
  residentsServed: number;
  successfulReintegrations: number;
  educationHours: number;
}

interface DonationAllocation {
  programArea: string;
  percentage: number;
}

interface MyDonation {
  donationId: number;
  donationType: string;
  donationDate: string | null;
  amount: number | null;
  currencyCode: string | null;
  estimatedValue: number | null;
  isRecurring: boolean;
}

interface MyDonationsResponse {
  lifetimeTotal: number;
  donations: MyDonation[];
}

const ALLOCATION_COLORS = [
  'bg-primary', 'bg-secondary', 'bg-[#9C27B0]', 'bg-[#FF9800]',
  'bg-[#4CAF50]', 'bg-[#E91E63]', 'bg-[#00BCD4]', 'bg-[#795548]',
];

const REGIONS = [
  { num: '01', title: 'Guatemala Highland Sanctuaries', desc: 'Focusing on indigenous community education and agricultural support.' },
  { num: '02', title: 'Honduras Urban Outreach', desc: 'Trauma-informed care and vocational training for at-risk youth.' },
  { num: '03', title: 'El Salvador Family Hubs', desc: 'Preventative health clinics and maternal nutritional programs.' },
];

const JOURNEY_STEPS = [
  { n: 1, title: 'Initial Pledging', desc: 'Funds are pooled and allocated based on urgent needs identified by field staff.' },
  { n: 2, title: 'Program Deployment', desc: 'Procurement of supplies and staffing of local clinics and educational centers.' },
  { n: 3, title: 'Direct Service', desc: 'Children receive care, meals, and instruction. Real-time data is captured on-site.' },
  { n: 4, title: 'Impact Reporting', desc: 'Metrics are audited and shared with you, ensuring complete transparency.' },
];

export default function ImpactPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [allocation, setAllocation] = useState<DonationAllocation[]>([]);
  const [myDonations, setMyDonations] = useState<MyDonationsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const user = getUser();

  useEffect(() => {
    Promise.all([
      fetch(`${API}/stats`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/donation-allocation`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/my-donations`, { headers: authHeaders() }).then(r => r.json()),
    ]).then(([s, a, m]) => {
      setStats(s);
      setAllocation(a);
      setMyDonations(m);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const myLifetimeUSD = myDonations
    ? myDonations.donations.reduce((sum, d) => {
        const amt = d.amount ?? d.estimatedValue ?? 0;
        const rate = TO_USD[(d.currencyCode ?? 'USD').toUpperCase()] ?? 1;
        return sum + amt * rate;
      }, 0)
    : 0;

  const donationCount = myDonations?.donations.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Hero stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="md:col-span-2">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Ecosystem of Hope</p>
          <h2 className="font-manrope text-3xl font-extrabold text-primary leading-tight mb-3">
            Your legacy is measured in{' '}
            <span className="text-secondary italic">transformed lives.</span>
          </h2>
          <p className="text-on-surface-variant text-sm leading-relaxed mb-5 max-w-lg">
            Through your steadfast support, Lucera has provided sanctuary and hope to thousands of children across Central America. Witness the tangible ripple effect of your generosity.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="aurora-gradient text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
              Download 2026 Audit
            </button>
            <button className="text-on-surface text-sm font-bold px-4 py-2.5 hover:underline transition-colors">
              See Methodology
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-secondary-container/30 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>child_care</span>
            <div>
              <p className="font-manrope font-extrabold text-xl text-primary">
                {loading ? '—' : `${stats?.residentsServed.toLocaleString()}+`}
              </p>
              <p className="text-xs text-on-surface-variant">Residents Served</p>
            </div>
          </div>
          <div className="bg-tertiary-fixed/40 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-tertiary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>recycling</span>
            <div>
              <p className="font-manrope font-extrabold text-xl text-tertiary">
                {loading ? '—' : stats?.successfulReintegrations.toLocaleString()}
              </p>
              <p className="text-xs text-on-surface-variant">Successful Reintegrations</p>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>history_edu</span>
              <p className="font-manrope font-extrabold text-lg text-primary">
                {loading ? '—' : `${stats?.educationHours.toLocaleString()}+`}
              </p>
              <p className="text-xs text-on-surface-variant">Education Hours</p>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-2">
              <div className="bg-secondary h-full rounded-full" style={{ width: '80%' }}></div>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-1">Goal: {loading ? '—' : `${((stats?.educationHours ?? 0) * 1.25).toLocaleString()}`}</p>
          </div>
        </div>
      </div>

      {/* Personal Impact Summary */}
      <div className="aurora-gradient rounded-xl p-6 text-white">
        <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Your Personal Impact</p>
        <h3 className="font-manrope text-xl font-extrabold mb-4 text-white">
          {user?.firstName ? `${user.firstName}, here's the difference you've made.` : "Here's the difference you've made."}
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="font-manrope font-extrabold text-2xl">
              {loading ? '—' : `$${myLifetimeUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </p>
            <p className="text-white/70 text-xs mt-1">Lifetime Contributions</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="font-manrope font-extrabold text-2xl">
              {loading ? '—' : donationCount}
            </p>
            <p className="text-white/70 text-xs mt-1">Total Donations Made</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="font-manrope font-extrabold text-2xl">
              {loading ? '—' : myDonations?.donations.some(d => d.isRecurring) ? 'Active' : 'One-time'}
            </p>
            <p className="text-white/70 text-xs mt-1">Giving Status</p>
          </div>
        </div>
      </div>

      {/* Regional Footprint */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container-low rounded-xl p-6">
        <div>
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Regional Footprint</p>
          <h3 className="font-manrope text-xl font-extrabold text-primary mb-5">
            Restoring Hope across Central America
          </h3>
          <div className="space-y-4">
            {REGIONS.map(({ num, title, desc }) => (
              <div key={num} className="flex gap-3">
                <span className="text-[11px] font-extrabold text-secondary/60 w-6 flex-shrink-0 mt-0.5">{num}</span>
                <div>
                  <p className="text-sm font-bold text-on-surface">{title}</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surface-container-high rounded-xl overflow-hidden flex items-center justify-center">
          <span className="material-symbols-outlined text-outline-variant text-[64px]">map</span>
        </div>
      </div>

      {/* Transparent Stewardship */}
      <div>
        <h3 className="font-manrope text-xl font-bold text-on-surface text-center mb-1">Transparent Stewardship</h3>
        <p className="text-xs text-on-surface-variant text-center mb-5">Every dollar is optimized for maximum frontline impact.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-surface-container-low rounded-xl p-5">
            <p className="text-sm font-bold text-on-surface mb-3">Programmatic Allocation</p>
            {loading ? (
              <p className="text-xs text-on-surface-variant">Loading...</p>
            ) : (
              <>
                <div className="flex gap-3 mb-3 flex-wrap">
                  {allocation.map(({ programArea, percentage }, i) => (
                    <div key={programArea} className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
                      <span className={`w-2.5 h-2.5 rounded-full ${ALLOCATION_COLORS[i % ALLOCATION_COLORS.length]}`}></span>
                      {percentage}% {programArea}
                    </div>
                  ))}
                </div>
                <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                  {allocation.map(({ programArea, percentage }, i) => (
                    <div
                      key={programArea}
                      className={`${ALLOCATION_COLORS[i % ALLOCATION_COLORS.length]} h-full`}
                      style={{ width: `${percentage}%` }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="aurora-gradient rounded-xl p-5 text-white flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-[28px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <p className="font-manrope font-extrabold text-3xl">92%</p>
            <p className="text-white/70 text-xs leading-relaxed mt-1">Of all donations go directly to field operations and programs.</p>
          </div>
        </div>
      </div>

      {/* Faces of Impact */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-manrope text-xl font-bold text-on-surface">The Faces of Impact</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              title: "Mateo's New Chapter",
              quote: '"Before the Lucera school opened, Mateo walked 4 hours for basic tutoring. Now, he\'s at the top of his science class and dreams of being an engineer."',
              location: 'Huehuetenango, Guatemala',
            },
            {
              title: 'Sustainable Nutrition',
              quote: 'Through the Family Hub program, the Sanchez family now operates a community greenhouse, providing food for 20 other families in their village.',
              location: 'Santa Ana, El Salvador',
            },
          ].map(({ title, quote, location }) => (
            <div key={title} className="relative rounded-xl overflow-hidden bg-surface-container-high h-48">
              <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 to-on-surface/20"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-white/20 text-[64px]">person</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="font-manrope font-bold text-white text-sm mb-1">{title}</p>
                <p className="text-white/70 text-[11px] leading-relaxed mb-1">{quote}</p>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-white/60 text-[12px]">location_on</span>
                  <span className="text-[10px] text-white/60">{location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Journey of Your Gift */}
      <div className="bg-surface-container-low rounded-xl p-6">
        <h3 className="font-manrope text-lg font-bold text-on-surface text-center mb-1">The Journey of Your Gift</h3>
        <p className="text-xs text-on-surface-variant text-center mb-6">From the moment you click donate, your contribution goes through a rigorous process of deployment and verification.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {JOURNEY_STEPS.map(({ n, title, desc }) => (
            <div key={n} className="text-center">
              <div className="w-10 h-10 rounded-full aurora-gradient text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-3">{n}</div>
              <p className="text-sm font-bold text-on-surface mb-1">{title}</p>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="aurora-gradient rounded-2xl p-8 text-center text-white">
        <h3 className="font-manrope text-2xl font-extrabold mb-2 text-white">
          The next chapter starts with{' '}
          <span className="text-secondary-fixed">your support.</span>
        </h3>
        <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
          Join us in reaching our 2026 milestone of 6,000 children supported. Together, we can build a lasting sanctuary of growth.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button className="bg-white text-primary font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity">
            Increase Your Impact
          </button>
          <button className="border-2 border-white/30 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-white/10 transition-colors">
            Start a Fundraiser
          </button>
        </div>
        <p className="text-white/40 text-[10px] mt-6">© 2026 Lucera. All rights reserved. Registered 501(c)3 Non-Profit Organization.</p>
      </div>
    </div>
  );
}
