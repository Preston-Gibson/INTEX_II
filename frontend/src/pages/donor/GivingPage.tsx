import { useState } from 'react';

const HISTORY = [
  { date: 'Oct 12, 2023', amount: '$150.00', program: 'Nutrition Center', status: 'Processed' },
  { date: 'Sep 05, 2023', amount: '$500.00', program: 'General Fund', status: 'Processed' },
  { date: 'Aug 28, 2023', amount: '$100.00', program: 'Emergency Housing', status: 'Pending' },
  { date: 'Aug 10, 2023', amount: '$25.00', program: 'Health Clinic', status: 'Processed' },
];

const PROGRAMS = [
  'Greatest Need (General Fund)',
  'Nutrition Center',
  'Education Fund',
  'Emergency Housing',
  'Health Clinic',
];

export default function GivingPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState('');
  const [program, setProgram] = useState(PROGRAMS[0]);

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden h-48 aurora-gradient">
        <div className="absolute inset-0 bg-primary/60"></div>
        <div className="relative z-10 p-8 flex flex-col justify-end h-full">
          <span className="inline-block px-3 py-1 bg-tertiary-fixed text-on-surface text-[10px] font-bold uppercase tracking-widest rounded-full mb-3 self-start">
            Active Campaign
          </span>
          <h2 className="font-manrope text-2xl font-extrabold text-white leading-tight mb-2">
            Every gift builds a sanctuary of hope.
          </h2>
          <p className="text-white/70 text-sm max-w-lg">
            Your contributions directly support nutrition, education, and safe housing for vulnerable children in our care.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Make a Gift */}
        <div className="col-span-2 bg-surface-container-low rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="font-manrope font-bold text-lg text-on-surface">Make a Gift</p>
            <span className="material-symbols-outlined text-secondary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          </div>

          <div className="flex gap-2 mb-4">
            {[25, 50, 100].map((amt) => (
              <button
                key={amt}
                onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors ${
                  selectedAmount === amt
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-outline-variant/30 text-on-surface hover:border-primary/40'
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 border border-outline-variant/30 rounded-xl px-3 py-2.5 mb-4 focus-within:border-primary/50">
            <span className="material-symbols-outlined text-on-surface-variant text-[16px]">attach_money</span>
            <input
              type="number"
              placeholder="Custom Amount"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
              className="bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant outline-none w-full"
            />
          </div>

          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Designate Your Impact</p>
          <div className="relative mb-8">
            <select
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              className="w-full appearance-none border border-outline-variant/30 rounded-xl px-3 py-2.5 text-sm text-on-surface bg-surface-container-lowest outline-none focus:border-primary/50 pr-8"
            >
              {PROGRAMS.map((p) => <option key={p}>{p}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">expand_more</span>
          </div>

          <button className="w-full aurora-gradient text-white font-bold py-3.5 rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            Proceed to Secure Gift
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>

        {/* Right column */}
        <div className="col-span-3 space-y-4">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary-container/30 rounded-xl p-4">
              <span className="material-symbols-outlined text-secondary text-[24px] mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
              <p className="font-manrope text-2xl font-extrabold text-primary">$12,450</p>
              <p className="text-xs text-on-surface-variant font-medium">Lifetime Giving</p>
            </div>
            <div className="bg-tertiary-fixed/40 rounded-xl p-4">
              <span className="material-symbols-outlined text-tertiary text-[24px] mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              <p className="font-manrope text-2xl font-extrabold text-tertiary">24</p>
              <p className="text-xs text-on-surface-variant font-medium">Students Sponsored</p>
            </div>
          </div>

          {/* Recent History */}
          <div className="bg-surface-container-low rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-manrope font-bold text-on-surface">Recent History</p>
              <button className="flex items-center gap-1 text-xs text-primary font-bold hover:underline">
                <span className="material-symbols-outlined text-[14px]">download</span>
                Download Tax Receipts (2023)
              </button>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-on-surface-variant font-bold uppercase tracking-wide">
                  <th className="text-left pb-4">Date</th>
                  <th className="text-left pb-4">Amount</th>
                  <th className="text-left pb-4">Program</th>
                  <th className="text-left pb-4">Status</th>
                  <th className="pb-4"></th>
                </tr>
              </thead>
              <tbody>
                {HISTORY.map((row, i) => (
                  <tr key={i}>
                    <td className="py-2.5 text-on-surface-variant">{row.date}</td>
                    <td className="py-2.5 font-bold text-on-surface">{row.amount}</td>
                    <td className="py-2.5 text-on-surface-variant">{row.program}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.status === 'Processed'
                          ? 'bg-secondary/10 text-secondary'
                          : 'bg-tertiary-fixed text-tertiary'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className="material-symbols-outlined text-on-surface-variant text-[16px]">receipt</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="mt-3 text-xs text-primary font-bold hover:underline">View Full History</button>
          </div>
        </div>
      </div>

      {/* Quote banner */}
      <div className="relative rounded-2xl overflow-hidden h-40 bg-surface-container-high">
        <div className="absolute inset-0 bg-gradient-to-r from-surface-container-highest/80 to-transparent"></div>
        <div className="relative z-10 p-8 flex items-center h-full">
          <div className="max-w-md">
            <p className="text-[10px] font-bold text-secondary mb-1">"</p>
            <p className="text-sm font-semibold text-on-surface italic leading-relaxed mb-3">
              "Radiant Guardian has changed the trajectory of our community. The support from donors isn't just money—it's a promise of a better future for our children."
            </p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-tertiary flex items-center justify-center text-white text-[10px] font-bold">MG</div>
              <div>
                <p className="text-xs font-bold text-on-surface">Maria Gonzalez</p>
                <p className="text-[10px] text-on-surface-variant">Regional Director, Guatemala</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
