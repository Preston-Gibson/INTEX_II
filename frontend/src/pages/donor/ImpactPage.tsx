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
  return (
    <div className="space-y-8">
      {/* Hero stats row */}
      <div className="grid grid-cols-3 gap-4 items-start">
        <div className="col-span-2">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Ecosystem of Hope</p>
          <h2 className="font-manrope text-3xl font-extrabold text-primary leading-tight mb-3">
            Your legacy is measured in{' '}
            <span className="text-secondary italic">transformed lives.</span>
          </h2>
          <p className="text-on-surface-variant text-sm leading-relaxed mb-5 max-w-lg">
            Through your steadfast support, Radiant Guardian has provided sanctuary and hope to thousands of children across Central America. Witness the tangible ripple effect of your generosity.
          </p>
          <div className="flex gap-3">
            <button className="aurora-gradient text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
              Download 2023 Audit
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
              <p className="font-manrope font-extrabold text-xl text-primary">4,280+</p>
              <p className="text-xs text-on-surface-variant">Children Reached</p>
            </div>
          </div>
          <div className="bg-tertiary-fixed/40 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-tertiary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            <div>
              <p className="font-manrope font-extrabold text-xl text-tertiary">12</p>
              <p className="text-xs text-on-surface-variant">Schools Funded</p>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
              <p className="font-manrope font-extrabold text-lg text-primary">1.2M</p>
              <p className="text-xs text-on-surface-variant">Nutritious Meals Served</p>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-2">
              <div className="bg-secondary h-full rounded-full" style={{ width: '80%' }}></div>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-1">Goal: 1.5M</p>
          </div>
        </div>
      </div>

      {/* Regional Footprint */}
      <div className="grid grid-cols-2 gap-6 bg-surface-container-low rounded-xl p-6">
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
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-surface-container-low rounded-xl p-5">
            <p className="text-sm font-bold text-on-surface mb-3">Programmatic Allocation</p>
            <div className="flex gap-4 mb-3 flex-wrap">
              {[
                { label: '45% Education', color: 'bg-primary' },
                { label: '30% Nutrition', color: 'bg-secondary' },
                { label: '15% Health', color: 'bg-tertiary-fixed-dim' },
                { label: '10% Admin', color: 'bg-outline-variant' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
                  <span className={`w-2.5 h-2.5 rounded-full ${color}`}></span>
                  {label}
                </div>
              ))}
            </div>
            <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
              <div className="bg-primary h-full" style={{ width: '45%' }}></div>
              <div className="bg-secondary h-full" style={{ width: '30%' }}></div>
              <div className="bg-tertiary-fixed-dim h-full" style={{ width: '15%' }}></div>
              <div className="bg-outline-variant h-full" style={{ width: '10%' }}></div>
            </div>
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
          <button className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
            View Gallery
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              title: "Mateo's New Chapter",
              quote: '"Before the Radiant Guardian school opened, Mateo walked 4 hours for basic tutoring. Now, he\'s at the top of his science class and dreams of being an engineer."',
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
        <div className="grid grid-cols-4 gap-4">
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
        <h3 className="font-manrope text-2xl font-extrabold mb-2">
          The next chapter starts with{' '}
          <span className="text-secondary-fixed">your support.</span>
        </h3>
        <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
          Join us in reaching our 2024 milestone of 6,000 children supported. Together, we can build a lasting sanctuary of growth.
        </p>
        <div className="flex gap-3 justify-center">
          <button className="bg-white text-primary font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity">
            Increase Your Impact
          </button>
          <button className="border-2 border-white/30 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-white/10 transition-colors">
            Start a Fundraiser
          </button>
        </div>
        <p className="text-white/40 text-[10px] mt-6">© 2024 Radiant Guardian. All rights reserved. Registered 501(c)3 Non-Profit Organization.</p>
      </div>
    </div>
  );
}
