import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { authHeaders, getUser } from '../../utils/auth';
import TransparencySection from '../../components/TransparencySection';

const API = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/donor-dashboard`;

const TO_USD: Record<string, number> = {
  USD: 1, NIO: 0.027, HNL: 0.040, CRC: 0.0019, GTQ: 0.129, PHP: 0.017,
};

interface Stats {
  residentsServed: number;
  successfulReintegrations: number;
  educationHours: number;
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


interface Story {
  title: string;
  quote: string;
  location: string;
  image: string;
  fullStory: string;
}

const STORIES: Story[] = [
  {
    title: "Mateo's New Chapter",
    quote: '"Before the Lucera school opened, Mateo walked 4 hours for basic tutoring. Now, he\'s at the top of his science class and dreams of being an engineer."',
    location: 'Huehuetenango, Guatemala',
    image: '/mateo-story.jpg',
    fullStory: 'Mateo is 11 years old and lives in a remote highland village in Huehuetenango, where the nearest school used to be a 4-hour round trip on foot. Before the Lucera education center opened in 2023, Mateo\'s family could rarely afford the travel, and he spent most days helping on the family plot. Today, Mateo attends class five days a week, has completed two science fair projects, and was recently selected for a regional STEM competition. His teacher describes him as "the most curious student I\'ve ever taught." Mateo\'s dream is to study environmental engineering and one day design sustainable water systems for communities like his own.',
  },
  {
    title: 'Sustainable Nutrition',
    quote: 'Through the Family Hub program, the Sanchez family now operates a community greenhouse, providing food for 20 other families in their village.',
    location: 'Santa Ana, El Salvador',
    image: '/sanchez-greenhouse.jpg',
    fullStory: 'When the Sanchez family enrolled in Lucera\'s Family Hub program in 2024, they were struggling with food insecurity after a drought decimated their harvest. Through the program\'s agricultural training and micro-grant initiative, they built a small greenhouse on their property and learned modern growing techniques. Within six months, they were producing more than their family could consume. Rather than sell the surplus, the Sanchezes chose to share — forming a cooperative with 20 neighboring families. Today the greenhouse supplies fresh vegetables to the entire block, and Rosa Sanchez has become a community leader, teaching other families the same methods that transformed her household.',
  },
];

const REGIONS = [
  { num: '01', title: 'Guatemala Highland Sanctuaries', desc: 'Focusing on indigenous community education and agricultural support.', coords: [15.5, -90.3] as [number, number] },
  { num: '02', title: 'Honduras Urban Outreach', desc: 'Trauma-informed care and vocational training for at-risk youth.', coords: [14.1, -87.2] as [number, number] },
  { num: '03', title: 'El Salvador Family Hubs', desc: 'Preventative health clinics and maternal nutritional programs.', coords: [13.7, -89.2] as [number, number] },
];

const JOURNEY_STEPS = [
  { n: 1, title: 'Initial Pledging', desc: 'Funds are pooled and allocated based on urgent needs identified by field staff.' },
  { n: 2, title: 'Program Deployment', desc: 'Procurement of supplies and staffing of local clinics and educational centers.' },
  { n: 3, title: 'Direct Service', desc: 'Children receive care, meals, and instruction. Real-time data is captured on-site.' },
  { n: 4, title: 'Impact Reporting', desc: 'Metrics are audited and shared with you, ensuring complete transparency.' },
];

export default function ImpactPage({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [myDonations, setMyDonations] = useState<MyDonationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStory, setActiveStory] = useState<Story | null>(null);

  const openStory = useCallback((story: Story) => {
    setActiveStory(story);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeStory = useCallback(() => {
    setActiveStory(null);
    document.body.style.overflow = '';
  }, []);

  const user = getUser();

  useEffect(() => {
    Promise.all([
      fetch(`${API}/stats`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/my-donations`, { headers: authHeaders() }).then(r => r.json()),
    ]).then(([s, m]) => {
      setStats(s);
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
        </div>
        <div className="space-y-3">
          <div className="bg-secondary-container/30 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>child_care</span>
            <div>
              <p className="font-manrope font-extrabold text-xl text-primary">
                {loading ? '—' : `${(stats?.residentsServed ?? 0).toLocaleString()}+`}
              </p>
              <p className="text-xs text-on-surface-variant">Residents Served</p>
            </div>
          </div>
          <div className="bg-tertiary-fixed/40 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-tertiary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>recycling</span>
            <div>
              <p className="font-manrope font-extrabold text-xl text-tertiary">
                {loading ? '—' : (stats?.successfulReintegrations ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-on-surface-variant">Successful Reintegrations</p>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>history_edu</span>
              <p className="font-manrope font-extrabold text-lg text-primary">
                {loading ? '—' : `${(stats?.educationHours ?? 0).toLocaleString()}+`}
              </p>
              <p className="text-xs text-on-surface-variant">Education Hours</p>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-2">
              <div className="bg-secondary h-full rounded-full" style={{ width: `${stats?.educationHours ? Math.min((stats.educationHours / (stats.educationHours * 1.25)) * 100, 100) : 0}%` }}></div>
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
      <div className="bg-surface-container-low rounded-xl p-6">
        <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Regional Footprint</p>
        <h3 className="font-manrope text-xl font-extrabold text-primary mb-5">
          Restoring Hope across Central America
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6 items-start">
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
          <div className="rounded-xl overflow-hidden" style={{ height: 280 }}>
            <MapContainer
              center={[13.5, -88.5]}
              zoom={6}
              scrollWheelZoom={false}
              zoomControl={false}
              dragging={false}
              doubleClickZoom={false}
              touchZoom={false}
              keyboard={false}
              boxZoom={false}
              style={{ width: '100%', height: '100%', cursor: 'default' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {REGIONS.map(({ num, title, desc, coords }) => (
                <CircleMarker
                  key={num}
                  center={coords}
                  radius={14}
                  pathOptions={{ color: '#1a5fb4', fillColor: '#3584e4', fillOpacity: 0.75, weight: 2 }}
                >
                  <Popup>
                    <strong>{title}</strong><br />{desc}
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Transparent Stewardship */}
      <TransparencySection />

      {/* Faces of Impact */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-manrope text-xl font-bold text-on-surface">The Faces of Impact</h3>
          <p className="text-xs text-on-surface-variant">Click a story to read more</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {STORIES.map((story) => (
            <button
              key={story.title}
              onClick={() => openStory(story)}
              className="relative rounded-xl overflow-hidden h-56 text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <img
                src={story.image}
                alt={story.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 group-hover:from-black/90 transition-colors duration-300"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="font-manrope font-bold text-white text-sm mb-1">{story.title}</p>
                <p className="text-white/70 text-[11px] leading-relaxed mb-2 line-clamp-2">{story.quote}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-white/60 text-[12px]">location_on</span>
                    <span className="text-[10px] text-white/60">{story.location}</span>
                  </div>
                  <span className="text-[10px] font-bold text-white/60 group-hover:text-white transition-colors flex items-center gap-0.5">
                    Read story <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Story modal — rendered via portal so it covers the entire viewport including the header */}
      {activeStory && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeStory}>
          <div
            className="relative bg-surface rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <img
              src={activeStory.image}
              alt={activeStory.title}
              className="w-full h-52 object-cover"
            />
            <button
              onClick={closeStory}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[18px]">close</span>
            </button>
            <div className="p-6">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-primary text-[14px]">location_on</span>
                <span className="text-[11px] font-bold text-primary uppercase tracking-widest">{activeStory.location}</span>
              </div>
              <h3 className="font-manrope text-xl font-extrabold text-on-surface mb-3">{activeStory.title}</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-4">{activeStory.fullStory}</p>
              <button
                onClick={() => { closeStory(); onNavigate?.('Giving'); }}
                className="w-full aurora-gradient text-white font-bold py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity">
                Support Stories Like This
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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
        <button
          onClick={() => onNavigate?.('Giving')}
          className="bg-white text-primary font-bold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity">
          Donate Now
        </button>
        <p className="text-white/40 text-[10px] mt-6">© 2026 Lucera. All rights reserved. Registered 501(c)3 Non-Profit Organization.</p>
      </div>
    </div>
  );
}
