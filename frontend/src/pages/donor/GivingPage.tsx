import { useState, useEffect, useCallback } from 'react';
import { authHeaders, downloadExport } from '../../utils/auth';

const API = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/donor-dashboard`;

const PROGRAMS = [
  'Greatest Need (General Fund)',
  'Nutrition Center',
  'Education Fund',
  'Emergency Housing',
  'Health Clinic',
];

interface Donation {
  donationId: number;
  donationType: string;
  donationDate: string | null;
  amount: number | null;
  currencyCode: string | null;
  estimatedValue: number;
  campaignName: string | null;
  isRecurring: boolean;
  notes: string | null;
}

export default function GivingPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState('');
  const [program, setProgram] = useState(PROGRAMS[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [donations, setDonations] = useState<Donation[]>([]);
  const [lifetimeTotal, setLifetimeTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadDonations = useCallback(() => {
    setLoading(true);
    fetch(`${API}/my-donations`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        setDonations(data.donations ?? []);
        setLifetimeTotal(data.lifetimeTotal ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadDonations(); }, [loadDonations]);

  const handleSubmit = async () => {
    const amount = selectedAmount ?? parseFloat(customAmount);
    if (!amount || amount <= 0) {
      setSubmitMsg({ ok: false, text: 'Please enter a valid amount.' });
      return;
    }
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const res = await fetch(`${API}/my-donations`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, campaignName: program, isRecurring, notes: null }),
      });
      if (res.ok) {
        setSubmitMsg({ ok: true, text: `Thank you! Your $${amount.toFixed(2)} gift has been recorded.` });
        setSelectedAmount(50);
        setCustomAmount('');
        loadDonations();
      } else {
        const msg = await res.text().catch(() => 'Submission failed.');
        setSubmitMsg({ ok: false, text: msg });
      }
    } catch {
      setSubmitMsg({ ok: false, text: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Make a Gift */}
        <div className="md:col-span-2 bg-surface-container-low rounded-xl p-6">
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
          <div className="relative mb-4">
            <select
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              className="w-full appearance-none border border-outline-variant/30 rounded-xl px-3 py-2.5 text-sm text-on-surface bg-surface-container-lowest outline-none focus:border-primary/50 pr-8"
            >
              {PROGRAMS.map((p) => <option key={p}>{p}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">expand_more</span>
          </div>

          <label className="flex items-center gap-2 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={e => setIsRecurring(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-xs text-on-surface-variant font-medium">Make this a monthly recurring gift</span>
          </label>

          {submitMsg && (
            <div className={`text-xs font-semibold px-3 py-2 rounded-lg mb-4 ${submitMsg.ok ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}>
              {submitMsg.text}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full aurora-gradient text-white font-bold py-3.5 rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? 'Processing…' : 'Proceed to Secure Gift'}
            {!submitting && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
          </button>
        </div>

        {/* Right column */}
        <div className="md:col-span-3 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary-container/30 rounded-xl p-4">
              <span className="material-symbols-outlined text-secondary text-[24px] mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
              <p className="font-manrope text-2xl font-extrabold text-primary">
                {loading ? '—' : `$${lifetimeTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
              <p className="text-xs text-on-surface-variant font-medium">Lifetime Giving</p>
            </div>
            <div className="bg-tertiary-fixed/40 rounded-xl p-4">
              <span className="material-symbols-outlined text-tertiary text-[24px] mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
              <p className="font-manrope text-2xl font-extrabold text-tertiary">
                {loading ? '—' : donations.length}
              </p>
              <p className="text-xs text-on-surface-variant font-medium">Total Contributions</p>
            </div>
          </div>

          {/* Recent History */}
          <div className="bg-surface-container-low rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-manrope font-bold text-on-surface">Recent History</p>
              <button
                onClick={() => downloadExport('/api/export/my-tax-receipt', 'xlsx')}
                className="flex items-center gap-1 text-xs text-primary font-bold hover:underline"
              >
                <span className="material-symbols-outlined text-[14px]">download</span>
                Download Tax Receipt
              </button>
            </div>
            {loading ? (
              <p className="text-xs text-on-surface-variant py-4 text-center">Loading…</p>
            ) : donations.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-4 text-center">No donations recorded yet.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-on-surface-variant font-bold uppercase tracking-wide">
                    <th className="text-left pb-4">Date</th>
                    <th className="text-left pb-4">Amount</th>
                    <th className="text-left pb-4">Campaign</th>
                    <th className="text-left pb-4">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.slice(0, 5).map((d) => (
                    <tr key={d.donationId}>
                      <td className="py-2.5 text-on-surface-variant">{formatDate(d.donationDate)}</td>
                      <td className="py-2.5 font-bold text-on-surface">
                        {d.amount != null ? `$${d.amount.toFixed(2)}` : `~$${d.estimatedValue.toFixed(2)}`}
                      </td>
                      <td className="py-2.5 text-on-surface-variant">{d.campaignName ?? '—'}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.isRecurring ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-high text-on-surface-variant'
                        }`}>
                          {d.isRecurring ? 'Monthly' : 'One-time'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
