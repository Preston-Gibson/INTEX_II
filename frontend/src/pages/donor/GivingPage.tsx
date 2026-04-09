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

// Distinct values from in_kind_donation_items data
const INKIND_ITEMS = [
  'Bags', 'Blankets', 'Books', 'Furniture', 'Hygiene Kits',
  'Medicines', 'Rice', 'School Supplies', 'Uniforms',
];

const INKIND_CATEGORIES = [
  'Clothing', 'Food', 'Furniture', 'Hygiene',
  'Medical', 'School Materials', 'Supplies',
];

const INKIND_UNITS = ['boxes', 'kg', 'packs', 'pcs', 'sets', 'units'];


interface InKindItem {
  id: number;
  itemName: string;
  customItemName?: string;
  category: string;
  quantity: string;
  unit: string;
}

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

const PayPalLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.5 6.5c.3 1.9-.6 3.9-2.3 5-1.4.9-3.1 1-4.7 1H11l-.8 5H7.5L9.5 4h5c1.8 0 3.8.4 5 2.5z" fill="#009cde"/>
    <path d="M8.5 13.5l.5-3h1.5c1.6 0 3.3-.1 4.7-1 1.7-1.1 2.6-3.1 2.3-5C16.3 2.4 14.3 2 12.5 2h-5L5 18h3l.5-4.5z" fill="#003087"/>
    <path d="M10 9.5l-.5 4h1.5c1.6 0 3.3-.1 4.7-1 1.7-1.1 2.6-3.1 2.3-5-.2-.9-.7-1.6-1.5-2.1C15.8 7.1 14.2 9.5 10 9.5z" fill="#012169"/>
  </svg>
);

const ApplePayLogo = () => (
  <svg viewBox="0 0 52 20" className="w-12 h-5" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.2 4.1c.5-.6.8-1.4.7-2.2-.7.1-1.6.5-2.1 1.1-.5.5-.9 1.3-.8 2.1.8.1 1.6-.4 2.2-1z" fill="currentColor"/>
    <path d="M9.9 5.3c-1.2-.1-2.3.7-2.8.7-.6 0-1.5-.6-2.5-.6-1.3 0-2.4.7-3.1 1.9C.1 9.7 1.1 13.3 2.5 15.2c.7 1 1.5 2.1 2.6 2 1-.1 1.4-.6 2.6-.6 1.2 0 1.5.6 2.6.6 1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3-.1 0-2.1-.8-2.1-3.1 0-1.9 1.6-2.8 1.6-2.9C12.8 5.7 9.9 5.3 9.9 5.3z" fill="currentColor"/>
    <text x="15" y="15" fontFamily="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif" fontSize="13" fontWeight="500" fill="currentColor">Pay</text>
  </svg>
);

const PAYMENT_METHODS = [
  { id: 'ach', label: 'Bank Account (ACH)', logo: <span className="material-symbols-outlined text-on-surface-variant text-[20px]">account_balance</span> },
  { id: 'paypal', label: 'PayPal', logo: <PayPalLogo /> },
  { id: 'applepay', label: 'Apple Pay', logo: <ApplePayLogo /> },
];

export default function GivingPage() {
  // Tab: monetary vs in-kind
  const [giftTab, setGiftTab] = useState<'monetary' | 'inkind'>('monetary');

  // Monetary state
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState('');
  const [program, setProgram] = useState(PROGRAMS[0]);
  const [paymentMethod, setPaymentMethod] = useState('ach');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // In-kind state
  const [inkindItems, setInkindItems] = useState<InKindItem[]>([]);
  const [inkindNotes, setInkindNotes] = useState('');
  const [inkindMsg, setInkindMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [newItem, setNewItem] = useState<Omit<InKindItem, 'id'>>({
    itemName: INKIND_ITEMS[0],
    customItemName: '',
    category: INKIND_CATEGORIES[0],
    quantity: '1',
    unit: INKIND_UNITS[0],
  });

  // History
  const [donations, setDonations] = useState<Donation[]>([]);
  const [lifetimeTotal, setLifetimeTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDonations = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    fetch(`${API}/my-donations`, { headers: authHeaders() })
      .then(async r => {
        if (!r.ok) {
          const text = await r.text().catch(() => r.statusText);
          throw new Error(`${r.status}: ${text}`);
        }
        return r.json();
      })
      .then(data => {
        setDonations(data.donations ?? []);
        setLifetimeTotal(data.lifetimeTotal ?? 0);
      })
      .catch(err => setLoadError(err.message ?? 'Failed to load donations'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadDonations(); }, [loadDonations]);

  const baseAmount = selectedAmount ?? (parseFloat(customAmount) || 0);

  // Monetary flow
  const confirmAndSubmit = () => {
    if (!baseAmount || baseAmount <= 0) {
      setSubmitMsg({ ok: false, text: 'Please enter a valid amount.' });
      return;
    }
    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const res = await fetch(`${API}/my-donations`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: baseAmount, campaignName: program, isRecurring, notes: null }),
      });
      if (res.ok) {
        setSubmitMsg({ ok: true, text: `Thank you! Your $${baseAmount.toFixed(2)} gift has been recorded.` });
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

  // In-kind flow
  const addInkindItem = () => {
    if (!newItem.quantity || parseInt(newItem.quantity) <= 0) return;
    setInkindItems(prev => [...prev, { ...newItem, id: Date.now() }]);
    setNewItem(prev => ({ ...prev, quantity: '1' }));
  };

  const removeInkindItem = (id: number) => {
    setInkindItems(prev => prev.filter(i => i.id !== id));
  };

  const handleInkindSubmit = async () => {
    if (inkindItems.length === 0) {
      setInkindMsg({ ok: false, text: 'Please add at least one item to your request.' });
      return;
    }
    setSubmitting(true);
    setInkindMsg(null);
    try {
      const payload = {
        items: inkindItems.map(i => ({
          itemName: i.itemName === 'Other' ? (i.customItemName || 'Other') : i.itemName,
          itemCategory: i.category,
          quantity: parseInt(i.quantity),
          unitOfMeasure: i.unit,
        })),
        campaignName: program,
        notes: inkindNotes || null,
      };
      const res = await fetch(`${API}/my-inkind-donations`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setInkindMsg({ ok: true, text: 'Your donation request has been submitted! Our team will be in touch.' });
        setInkindItems([]);
        setInkindNotes('');
        loadDonations();
      } else {
        const msg = await res.text().catch(() => 'Submission failed.');
        setInkindMsg({ ok: false, text: msg });
      }
    } catch {
      setInkindMsg({ ok: false, text: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const selectedMethodLabel = PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label ?? '';

  const selectClass = "w-full appearance-none border border-outline-variant/30 rounded-xl px-3 py-2 text-sm text-on-surface bg-surface-container-lowest outline-none focus:border-primary/50";

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
        {/* Make a Gift card */}
        <div className="md:col-span-2 bg-surface-container-low rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="font-manrope font-bold text-lg text-on-surface">Make a Gift</p>
            <span className="material-symbols-outlined text-secondary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          </div>

          {/* Monetary / In-Kind tab switcher */}
          <div className="flex items-center bg-surface-container-high rounded-xl p-1 mb-5">
            <button
              onClick={() => { setGiftTab('monetary'); setSubmitMsg(null); setInkindMsg(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all ${
                giftTab === 'monetary'
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">payments</span>
              Monetary
            </button>
            <button
              onClick={() => { setGiftTab('inkind'); setSubmitMsg(null); setInkindMsg(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all ${
                giftTab === 'inkind'
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">inventory_2</span>
              In-Kind
            </button>
          </div>

          {/* ── MONETARY TAB ── */}
          {giftTab === 'monetary' && (
            <>
              {/* One-time / Monthly toggle */}
              <div className="flex items-center bg-primary/10 rounded-full p-1 mb-4">
                <button
                  onClick={() => setIsRecurring(false)}
                  className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${
                    !isRecurring ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  One-time
                </button>
                <button
                  onClick={() => setIsRecurring(true)}
                  className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${
                    isRecurring ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Monthly
                </button>
              </div>

              <p className="text-center text-sm text-on-surface mb-4">
                Choose a <strong>{isRecurring ? 'monthly' : 'one-time'}</strong> amount
              </p>

              <div className="flex gap-2 mb-4">
                {[25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors ${
                      selectedAmount === amt
                        ? 'border-primary text-white bg-primary'
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
                  placeholder="Other amount"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                  className="bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant outline-none w-full"
                />
              </div>

              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Designate Your Impact</p>
              <div className="relative mb-4">
                <select value={program} onChange={(e) => setProgram(e.target.value)} className={selectClass}>
                  {PROGRAMS.map((p) => <option key={p}>{p}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">expand_more</span>
              </div>

              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Payment Method</p>
              <div className="border border-outline-variant/30 rounded-xl overflow-hidden mb-5">
                {PAYMENT_METHODS.map((method, i) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${
                      i > 0 ? 'border-t border-outline-variant/20' : ''
                    } ${paymentMethod === method.id ? 'bg-primary/5' : 'hover:bg-surface-container-high/50'}`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      paymentMethod === method.id ? 'border-primary' : 'border-outline-variant'
                    }`}>
                      {paymentMethod === method.id && <span className="w-2 h-2 rounded-full bg-primary block" />}
                    </span>
                    <span className="w-8 h-6 flex items-center justify-center flex-shrink-0">{method.logo}</span>
                    <span className="font-medium text-on-surface">{method.label}</span>
                  </button>
                ))}
              </div>

              {submitMsg && (
                <div className={`text-xs font-semibold px-3 py-2 rounded-lg mb-4 ${submitMsg.ok ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}>
                  {submitMsg.text}
                </div>
              )}

              <button
                onClick={confirmAndSubmit}
                disabled={submitting}
                className="w-full aurora-gradient text-white font-bold py-3.5 rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? 'Processing…' : 'Make Donation'}
                {!submitting && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
              </button>
            </>
          )}

          {/* ── IN-KIND TAB ── */}
          {giftTab === 'inkind' && (
            <>
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-4 flex gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0 mt-0.5">info</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Submit a supply donation request and our team will coordinate pickup or delivery with you directly.
                </p>
              </div>

              {/* Add item form */}
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Add Items</p>
              <div className="space-y-2 mb-3">
                {/* Row 1: Item Name | Donation Item Type */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide mb-1 block">Item Name</label>
                    <select
                      value={newItem.itemName}
                      onChange={e => setNewItem(p => ({ ...p, itemName: e.target.value, customItemName: '' }))}
                      className={selectClass}
                    >
                      {INKIND_ITEMS.map(i => <option key={i}>{i}</option>)}
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide mb-1 block">Item Type</label>
                    <select
                      value={newItem.category}
                      onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                      className={selectClass}
                    >
                      {INKIND_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                {/* Other item description */}
                {newItem.itemName === 'Other' && (
                  <div>
                    <label className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide mb-1 block">Describe the Item</label>
                    <input
                      type="text"
                      placeholder="e.g. Sleeping bags, Canned food…"
                      value={newItem.customItemName ?? ''}
                      onChange={e => setNewItem(p => ({ ...p, customItemName: e.target.value }))}
                      className="w-full border border-outline-variant/30 rounded-xl px-3 py-2 text-sm text-on-surface bg-surface-container-lowest outline-none focus:border-primary/50"
                    />
                  </div>
                )}
                {/* Row 2: Quantity | Shipment Type */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide mb-1 block">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))}
                      placeholder="e.g. 10"
                      className="w-full border border-outline-variant/30 rounded-xl px-3 py-2 text-sm text-on-surface bg-surface-container-lowest outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide mb-1 block">Shipment Type</label>
                    <select
                      value={newItem.unit}
                      onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))}
                      className={selectClass}
                    >
                      {INKIND_UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={addInkindItem}
                className="w-full py-2 mb-4 rounded-xl border-2 border-dashed border-primary/40 text-sm font-bold text-primary hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Item
              </button>

              {/* Item list */}
              {inkindItems.length > 0 && (
                <div className="border border-outline-variant/30 rounded-xl overflow-hidden mb-4">
                  <div className="px-4 py-2 bg-surface-container-high/50 border-b border-outline-variant/20">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                      Your Request ({inkindItems.length} item{inkindItems.length > 1 ? 's' : ''})
                    </p>
                  </div>
                  {inkindItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 border-outline-variant/20">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">
                          {item.itemName === 'Other' && item.customItemName ? item.customItemName : item.itemName}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">
                          {item.quantity} {item.unit} · {item.category}
                        </p>
                      </div>
                      <button
                        onClick={() => removeInkindItem(item.id)}
                        className="text-on-surface-variant hover:text-error transition-colors flex-shrink-0"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes */}
              <textarea
                value={inkindNotes}
                onChange={e => setInkindNotes(e.target.value)}
                placeholder="Any additional notes for our team… (optional)"
                rows={2}
                className="w-full border border-outline-variant/30 rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant bg-surface-container-lowest outline-none focus:border-primary/50 resize-none mb-4"
              />

              {inkindMsg && (
                <div className={`text-xs font-semibold px-3 py-2 rounded-lg mb-4 ${inkindMsg.ok ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}>
                  {inkindMsg.text}
                </div>
              )}

              <button
                onClick={handleInkindSubmit}
                disabled={submitting}
                className="w-full aurora-gradient text-white font-bold py-3.5 rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Submit Donation Request'}
                {!submitting && <span className="material-symbols-outlined text-[18px]">send</span>}
              </button>
            </>
          )}
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
            ) : loadError ? (
              <p className="text-xs text-error py-4 text-center font-semibold">{loadError}</p>
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
                        {d.donationType === 'InKind'
                          ? 'In-Kind'
                          : d.amount != null ? `$${d.amount.toFixed(2)}` : `~$${d.estimatedValue.toFixed(2)}`}
                      </td>
                      <td className="py-2.5 text-on-surface-variant">{d.campaignName ?? '—'}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.donationType === 'InKind'
                            ? 'bg-tertiary/10 text-tertiary'
                            : d.isRecurring ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-high text-on-surface-variant'
                        }`}>
                          {d.donationType === 'InKind' ? 'In-Kind' : d.isRecurring ? 'Monthly' : 'One-time'}
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

      {/* Monetary confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
            </div>
            <h3 className="font-manrope text-lg font-extrabold text-on-surface text-center mb-1">Confirm Your Donation</h3>
            <p className="text-sm text-on-surface-variant text-center mb-5">
              You're about to make a{' '}
              <strong className="text-on-surface">{isRecurring ? 'monthly' : 'one-time'}</strong> gift of{' '}
              <strong className="text-primary">${baseAmount.toFixed(2)}</strong> to{' '}
              <strong className="text-on-surface">{program}</strong> via {selectedMethodLabel}.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl border-2 border-outline-variant/40 text-sm font-bold text-on-surface-variant hover:border-outline-variant transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 rounded-xl aurora-gradient text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
