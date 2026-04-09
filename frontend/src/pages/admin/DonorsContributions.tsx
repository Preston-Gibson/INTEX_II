import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import UserAvatar from '../../components/UserAvatar';
import { authHeaders, downloadExport } from '../../utils/auth';

const API = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/supporters`;

// Approximate fixed rates to USD (updated periodically)
const TO_USD: Record<string, number> = {
  USD: 1,
  NIO: 0.027,   // Nicaraguan córdoba
  HNL: 0.040,   // Honduran lempira
  CRC: 0.0019,  // Costa Rican colón
  GTQ: 0.129,   // Guatemalan quetzal
  PHP: 0.017,   // Philippine peso
};

function toUSD(amount: number, currency: string | null): string {
  const rate = TO_USD[(currency ?? 'USD').toUpperCase()] ?? 1;
  const usd = amount * rate;
  return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const SUPPORTER_TYPES  = ['Monetary Donor', 'Volunteer', 'Skills Contributor', 'In-Kind Donor', 'Social Media Ambassador'];
const DONATION_TYPES   = ['Monetary', 'InKind', 'Time', 'Skills', 'SocialMedia'];
const STATUS_OPTIONS   = ['Active', 'Inactive'];
const RELATIONSHIP_TYPES = ['Individual', 'Organization'];
const PAGE_SIZE = 20;

const STATUS_BADGE: Record<string, string> = {
  Active:   'bg-secondary/10 text-secondary',
  Inactive: 'bg-surface-container-high text-on-surface-variant',
};

const TYPE_BADGE: Record<string, string> = {
  'Monetary Donor':         'bg-primary/10 text-primary',
  'Volunteer':              'bg-tertiary-fixed text-on-surface',
  'Skills Contributor':     'bg-secondary/10 text-secondary',
  'In-Kind Donor':          'bg-error/10 text-error',
  'Social Media Ambassador':'bg-surface-container-high text-on-surface-variant',
};

const DONATION_TYPE_BADGE: Record<string, string> = {
  'Monetary':    'bg-primary/10 text-primary',
  'InKind':      'bg-error/10 text-error',
  'Time':        'bg-tertiary-fixed text-on-surface',
  'Skills':      'bg-secondary/10 text-secondary',
  'SocialMedia': 'bg-surface-container-high text-on-surface-variant',
};

const DONATION_TYPE_LABEL: Record<string, string> = {
  'Monetary':    'Monetary',
  'InKind':      'In-Kind',
  'Time':        'Time',
  'Skills':      'Skills',
  'SocialMedia': 'Social Media',
};

// ── Interfaces ────────────────────────────────────────────────────────────────

interface SupporterRow {
  supporterId: number;
  displayName: string;
  supporterType: string;
  relationshipType: string;
  region: string;
  country: string;
  email: string;
  status: string;
  createdAt: string;
  firstDonationDate: string | null;
  acquisitionChannel: string;
  donationCount: number;
  totalEstimatedValue: number;
}

interface SupporterDetail {
  supporterId: number;
  supporterType: string;
  displayName: string;
  organizationName: string;
  firstName: string;
  lastName: string;
  relationshipType: string;
  region: string;
  country: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  firstDonationDate: string | null;
  acquisitionChannel: string;
}

interface DonationAllocation {
  allocationId: number;
  safehouseId: number;
  safehouseName: string;
  programArea: string;
  amountAllocated: number;
  allocationDate: string;
  allocationNotes: string | null;
}

interface DonationRow {
  donationId: number;
  supporterId: number;
  supporterName: string;
  donationType: string;
  donationDate: string | null;
  isRecurring: boolean;
  campaignName: string | null;
  channelSource: string | null;
  currencyCode: string | null;
  amount: number | null;
  estimatedValue: number;
  impactUnit: string;
  notes: string | null;
  isReviewed: boolean;
  allocationCount: number;
  allocations: DonationAllocation[];
}

type SupporterFormData = Omit<SupporterDetail, 'supporterId' | 'createdAt'>;

type DonationFormData = {
  donationType: string;
  donationDate: string;
  isRecurring: boolean;
  campaignName: string;
  channelSource: string;
  currencyCode: string;
  amount: string;
  estimatedValue: string;
  impactUnit: string;
  notes: string;
};

const EMPTY_SUPPORTER: SupporterFormData = {
  supporterType: '', displayName: '', organizationName: '', firstName: '',
  lastName: '', relationshipType: '', region: '', country: '',
  email: '', phone: '', status: '', firstDonationDate: null, acquisitionChannel: '',
};

const EMPTY_DONATION: DonationFormData = {
  donationType: '', donationDate: '', isRecurring: false,
  campaignName: '', channelSource: '', currencyCode: 'PHP',
  amount: '', estimatedValue: '', impactUnit: '', notes: '',
};

// ── Helper components ─────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 block">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls  = 'w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20';
const selectCls = 'w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none';

function fmt(val: number | null | undefined) {
  if (val == null) return '—';
  return val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Pagination ────────────────────────────────────────────────────────────────

function PaginationBar({
  total, currentPage, pageSize, onPageChange,
  noun = 'records',
}: {
  total: number; currentPage: number; pageSize: number;
  onPageChange: (p: number) => void; noun?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between px-1">
      <p className="text-xs text-on-surface-variant">
        Showing{' '}
        <span className="font-semibold text-on-surface">
          {Math.min((currentPage - 1) * pageSize + 1, total)}–{Math.min(currentPage * pageSize, total)}
        </span>{' '}
        of <span className="font-semibold text-on-surface">{total}</span> {noun}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(1)} disabled={currentPage === 1}
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <span className="material-symbols-outlined text-[18px]">first_page</span>
        </button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .reduce<(number | '...')[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === '...'
              ? <span key={`ellipsis-${i}`} className="px-2 text-xs text-on-surface-variant">…</span>
              : <button key={p} onClick={() => onPageChange(p as number)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                    currentPage === p ? 'aurora-gradient text-white' : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}>
                  {p}
                </button>
          )}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <span className="material-symbols-outlined text-[18px]">last_page</span>
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DonorsContributions() {
  const [activeTab, setActiveTab] = useState<'supporters' | 'donations'>('supporters');

  // ── Supporters state ──────────────────────────────────────────────────────
  const [supporters, setSupporters] = useState<SupporterRow[]>([]);
  const [supportersLoading, setSupportersLoading] = useState(true);
  const [suppSearch, setSuppSearch] = useState('');
  const [suppType, setSuppType]     = useState('');
  const [suppStatus, setSuppStatus] = useState('');
  const [suppPage, setSuppPage]     = useState(1);
  const [suppRefresh, setSuppRefresh] = useState(0);

  // ── Donations state ───────────────────────────────────────────────────────
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(true);
  const [donSearch, setDonSearch]   = useState('');
  const [donType, setDonType]       = useState('');
  const [donPage, setDonPage]       = useState(1);
  const [donRefresh, setDonRefresh] = useState(0);

  // ── Supporter modal state ─────────────────────────────────────────────────
  const [suppModalMode, setSuppModalMode]     = useState<'add' | 'edit' | null>(null);
  const [selectedSupporter, setSelectedSupporter] = useState<SupporterDetail | null>(null);
  const [suppForm, setSuppForm]               = useState<SupporterFormData>(EMPTY_SUPPORTER);
  const [suppFormLoading, setSuppFormLoading] = useState(false);
  const [suppFormError, setSuppFormError]     = useState<string | null>(null);

  // ── Donation detail / record donation state ───────────────────────────────
  const [donModalMode, setDonModalMode]       = useState<'add' | 'view' | null>(null);
  const [selectedDonation, setSelectedDonation] = useState<DonationRow | null>(null);
  const [donTargetSuppId, setDonTargetSuppId] = useState<number | null>(null);
  const [donShowSuppSelector, setDonShowSuppSelector] = useState(false);
  const [donForm, setDonForm]                 = useState<DonationFormData>(EMPTY_DONATION);
  const [donFormError, setDonFormError]       = useState<string | null>(null);

  // ── Expanded details tracking ───────────────────────────────────────────────
  const [expandedDetails, setExpandedDetails] = useState<Set<number>>(new Set());
  function toggleDetail(id: number) {
    setExpandedDetails(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Supporter donations panel (within edit modal) ─────────────────────────
  const [suppDonations, setSuppDonations]     = useState<DonationRow[]>([]);
  const [suppDonLoading, setSuppDonLoading]   = useState(false);
  const [suppDonPage, setSuppDonPage]         = useState(1);
  const [suppDonModalTab, setSuppDonModalTab] = useState<'profile' | 'donations'>('profile');

  // ── Fetch supporters ──────────────────────────────────────────────────────
  useEffect(() => {
    setSupportersLoading(true);
    const params = new URLSearchParams();
    if (suppSearch) params.set('search', suppSearch);
    if (suppType)   params.set('supporterType', suppType);
    if (suppStatus) params.set('status', suppStatus);

    const delay = suppSearch ? 300 : 0;
    const timer = setTimeout(() => {
      fetch(`${API}?${params}`, { headers: authHeaders() })
        .then(r => r.json())
        .then(data => { setSupporters(data); setSuppPage(1); setSupportersLoading(false); })
        .catch(() => setSupportersLoading(false));
    }, delay);
    return () => clearTimeout(timer);
  }, [suppSearch, suppType, suppStatus, suppRefresh]);

  // ── Fetch donations ───────────────────────────────────────────────────────
  useEffect(() => {
    setDonationsLoading(true);
    const params = new URLSearchParams();
    if (donSearch) params.set('search', donSearch);
    if (donType)   params.set('donationType', donType);

    const delay = donSearch ? 300 : 0;
    const timer = setTimeout(() => {
      fetch(`${API}/donations?${params}`, { headers: authHeaders() })
        .then(r => r.json())
        .then(data => { setDonations(data); setDonPage(1); setDonationsLoading(false); })
        .catch(() => setDonationsLoading(false));
    }, delay);
    return () => clearTimeout(timer);
  }, [donSearch, donType, donRefresh]);

  // ── Supporter modal helpers ───────────────────────────────────────────────
  function openAddSupporter() {
    setSuppForm(EMPTY_SUPPORTER);
    setSelectedSupporter(null);
    setSuppFormError(null);
    setSuppDonations([]);
    setSuppDonModalTab('profile');
    setSuppModalMode('add');
  }

  async function openEditSupporter(id: number) {
    setSuppFormError(null);
    setSuppFormLoading(true);
    setSuppDonLoading(true);
    setSuppDonModalTab('profile');
    setSuppModalMode('edit');
    try {
      const [detail, dons] = await Promise.all([
        fetch(`${API}/${id}`, { headers: authHeaders() }).then(r => r.json()) as Promise<SupporterDetail>,
        fetch(`${API}/${id}/donations`, { headers: authHeaders() }).then(r => r.json()) as Promise<DonationRow[]>,
      ]);
      setSelectedSupporter(detail);
      const { supporterId: _id, createdAt: _ca, ...rest } = detail;
      setSuppForm(rest);
      setSuppDonations(dons);
      setSuppDonPage(1);
    } finally {
      setSuppFormLoading(false);
      setSuppDonLoading(false);
    }
  }

  function patchSupp(updates: Partial<SupporterFormData>) {
    setSuppForm(prev => ({ ...prev, ...updates }));
  }

  async function handleSupporterSubmit() {
    setSuppFormError(null);
    if (!suppForm.displayName.trim())  { setSuppFormError('Display Name is required.'); return; }
    if (!suppForm.supporterType)       { setSuppFormError('Supporter Type is required.'); return; }
    if (!suppForm.status)              { setSuppFormError('Status is required.'); return; }

    const url    = suppModalMode === 'add' ? API : `${API}/${selectedSupporter!.supporterId}`;
    const method = suppModalMode === 'add' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suppForm),
      });
      if (!res.ok) { setSuppFormError('Save failed. Please check all fields and try again.'); return; }
      setSuppModalMode(null);
      setSuppRefresh(k => k + 1);
    } catch {
      setSuppFormError('Network error. Please try again.');
    }
  }

  // ── Donation modal helpers ────────────────────────────────────────────────
  function openRecordDonation(suppId: number) {
    setDonTargetSuppId(suppId);
    setDonShowSuppSelector(false);
    setDonForm(EMPTY_DONATION);
    setDonFormError(null);
    setDonModalMode('add');
  }

  function openAddDonationFromTab() {
    setDonTargetSuppId(null);
    setDonShowSuppSelector(true);
    setDonForm(EMPTY_DONATION);
    setDonFormError(null);
    setDonModalMode('add');
  }

  function openViewDonation(d: DonationRow) {
    setSelectedDonation(d);
    setDonModalMode('view');
  }

  async function toggleReview(donationId: number, isReviewed: boolean) {
    await fetch(`${API}/donations/${donationId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ isReviewed }),
    });
    setSuppDonations(prev => prev.map(d => d.donationId === donationId ? { ...d, isReviewed } : d));
    setDonations(prev => prev.map(d => d.donationId === donationId ? { ...d, isReviewed } : d));
  }

  function patchDon(updates: Partial<DonationFormData>) {
    setDonForm(prev => ({ ...prev, ...updates }));
  }

  async function handleDonationSubmit() {
    setDonFormError(null);
    if (donShowSuppSelector && !donTargetSuppId) { setDonFormError('Please select a supporter.'); return; }
    if (!donForm.donationType)         { setDonFormError('Donation Type is required.'); return; }
    if (!donForm.estimatedValue)       { setDonFormError('Estimated Value is required.'); return; }

    const body = {
      donationType:   donForm.donationType,
      donationDate:   donForm.donationDate || null,
      isRecurring:    donForm.isRecurring,
      campaignName:   donForm.campaignName   || null,
      channelSource:  donForm.channelSource  || null,
      currencyCode:   donForm.currencyCode   || null,
      amount:         donForm.amount         ? parseFloat(donForm.amount) : null,
      estimatedValue: parseFloat(donForm.estimatedValue),
      impactUnit:     donForm.impactUnit     || '',
      notes:          donForm.notes          || null,
    };

    try {
      const res = await fetch(`${API}/${donTargetSuppId}/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      });
      if (!res.ok) { setDonFormError('Save failed. Please try again.'); return; }
      setDonModalMode(null);
      setDonRefresh(k => k + 1);
      setSuppRefresh(k => k + 1);
      // If we're in an edit modal, reload that supporter's donations too
      if (suppModalMode === 'edit' && selectedSupporter) {
        setSuppDonLoading(true);
        fetch(`${API}/${selectedSupporter.supporterId}/donations`, { headers: authHeaders() })
          .then(r => r.json())
          .then(data => { setSuppDonations(data); setSuppDonPage(1); })
          .finally(() => setSuppDonLoading(false));
      }
    } catch {
      setDonFormError('Network error. Please try again.');
    }
  }

  // ── Paginated slices ──────────────────────────────────────────────────────
  const suppPageRows = supporters.slice((suppPage - 1) * PAGE_SIZE, suppPage * PAGE_SIZE);
  const donPageRows  = donations.slice((donPage  - 1) * PAGE_SIZE, donPage  * PAGE_SIZE);
  const sortedSuppDonations = [...suppDonations].sort((a, b) => {
    const needsReview = (d: DonationRow) => (d.donationType === 'InKind' || d.donationType === 'Time') && !d.isReviewed;
    const aNeeds = needsReview(a) ? 0 : (a.donationType === 'InKind' || a.donationType === 'Time') ? 1 : 2;
    const bNeeds = needsReview(b) ? 0 : (b.donationType === 'InKind' || b.donationType === 'Time') ? 1 : 2;
    return aNeeds - bNeeds;
  });
  const suppDonPageRows = sortedSuppDonations.slice((suppDonPage - 1) * PAGE_SIZE, suppDonPage * PAGE_SIZE);

  return (
    <div className="flex h-screen bg-surface overflow-hidden font-body">

      <AdminSidebar />

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="flex items-center gap-3 px-6 py-3 bg-surface-container-lowest border-b border-outline-variant/20 flex-shrink-0 flex-wrap">

          {activeTab === 'supporters' ? (
            <>
              <div className="flex items-center gap-2 bg-surface-container-low rounded-xl px-3 py-2 min-w-[220px]">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
                <input
                  className="bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant outline-none w-full"
                  placeholder="Search name, email, organization..."
                  value={suppSearch}
                  onChange={e => setSuppSearch(e.target.value)}
                />
              </div>
              <select value={suppType} onChange={e => setSuppType(e.target.value)}
                className="bg-surface-container-low text-sm text-on-surface rounded-xl px-3 py-2 outline-none border-none">
                <option value="">All Types</option>
                {SUPPORTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={suppStatus} onChange={e => setSuppStatus(e.target.value)}
                className="bg-surface-container-low text-sm text-on-surface rounded-xl px-3 py-2 outline-none border-none">
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 bg-surface-container-low rounded-xl px-3 py-2 min-w-[220px]">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
                <input
                  className="bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant outline-none w-full"
                  placeholder="Search supporter or campaign..."
                  value={donSearch}
                  onChange={e => setDonSearch(e.target.value)}
                />
              </div>
              <select value={donType} onChange={e => setDonType(e.target.value)}
                className="bg-surface-container-low text-sm text-on-surface rounded-xl px-3 py-2 outline-none border-none">
                <option value="">All Donation Types</option>
                {DONATION_TYPES.map(t => <option key={t} value={t}>{DONATION_TYPE_LABEL[t] ?? t}</option>)}
              </select>
            </>
          )}

          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1 ml-auto">
            <button onClick={() => setActiveTab('supporters')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'supporters' ? 'aurora-gradient text-white' : 'text-on-surface-variant hover:bg-surface-container'
              }`}>
              Supporters
            </button>
            <button onClick={() => setActiveTab('donations')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'donations' ? 'aurora-gradient text-white' : 'text-on-surface-variant hover:bg-surface-container'
              }`}>
              Donations
            </button>
          </div>

          <button
            onClick={() => downloadExport('/api/export/donations', 'csv')}
            className="flex items-center gap-2 bg-surface-container-low text-on-surface text-xs font-bold px-4 py-2 rounded-xl hover:bg-surface-container transition-colors flex-shrink-0">
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export CSV
          </button>
          <button
            onClick={() => downloadExport('/api/export/donations', 'xlsx')}
            className="flex items-center gap-2 bg-surface-container-low text-on-surface text-xs font-bold px-4 py-2 rounded-xl hover:bg-surface-container transition-colors flex-shrink-0">
            <span className="material-symbols-outlined text-[16px]">table_view</span>
            Export XLSX
          </button>
          {activeTab === 'supporters' && (
            <button onClick={openAddSupporter}
              className="aurora-gradient text-white text-sm font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Add Supporter
            </button>
          )}
          {activeTab === 'donations' && (
            <button onClick={openAddDonationFromTab}
              className="aurora-gradient text-white text-sm font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">add_card</span>
              Add Donation
            </button>
          )}
          <UserAvatar />
        </header>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* ── Supporters Tab ── */}
          {activeTab === 'supporters' && (
            supportersLoading ? (
              <div className="flex items-center justify-center h-40 text-on-surface-variant text-sm">
                Loading supporters...
              </div>
            ) : supporters.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-on-surface-variant text-sm gap-2">
                <span className="material-symbols-outlined text-[40px]">volunteer_activism</span>
                No supporters match your filters.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-x-auto">
                  <table className="w-full text-sm min-w-[900px]">
                    <thead>
                      <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                        {['Name', 'Type', 'Status', 'Region / Country', 'Email', 'Acquisition', 'Donations', 'Est. Value', ''].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {suppPageRows.map(s => (
                        <tr key={s.supporterId} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3 font-semibold text-xs text-on-surface whitespace-nowrap">{s.displayName}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${TYPE_BADGE[s.supporterType] ?? 'bg-surface-container text-on-surface-variant'}`}>
                              {s.supporterType}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${STATUS_BADGE[s.status] ?? 'bg-surface-container text-on-surface-variant'}`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">
                            {[s.region, s.country].filter(Boolean).join(', ') || '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">{s.email || '—'}</td>
                          <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">{s.acquisitionChannel || '—'}</td>
                          <td className="px-4 py-3 text-xs text-on-surface font-semibold whitespace-nowrap text-center">{s.donationCount}</td>
                          <td className="px-4 py-3 text-xs text-on-surface whitespace-nowrap">${fmt(s.totalEstimatedValue)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button onClick={() => openEditSupporter(s.supporterId)}
                              className="flex items-center gap-1 text-primary text-xs font-semibold hover:underline whitespace-nowrap">
                              <span className="material-symbols-outlined text-[15px]">edit</span>
                              View/Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationBar total={supporters.length} currentPage={suppPage} pageSize={PAGE_SIZE}
                  onPageChange={setSuppPage} noun="supporters" />
              </div>
            )
          )}

          {/* ── Donations Tab ── */}
          {activeTab === 'donations' && (
            donationsLoading ? (
              <div className="flex items-center justify-center h-40 text-on-surface-variant text-sm">
                Loading donations...
              </div>
            ) : donations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-on-surface-variant text-sm gap-2">
                <span className="material-symbols-outlined text-[40px]">payments</span>
                No donations match your filters.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-x-auto">
                  <table className="w-full text-sm min-w-[1100px]">
                    <thead>
                      <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                        {['Supporter', 'Type', 'Date', 'Amount', 'Est. Value', 'Campaign', 'Details', 'Channel', 'Recurring', 'Allocations', ''].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {donPageRows.map(d => (
                        <tr key={d.donationId} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3 text-xs font-semibold text-on-surface whitespace-nowrap">{d.supporterName || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${DONATION_TYPE_BADGE[d.donationType] ?? 'bg-surface-container text-on-surface-variant'}`}>
                              {DONATION_TYPE_LABEL[d.donationType] ?? d.donationType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">{d.donationDate ?? '—'}</td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">
                            {d.amount != null ? toUSD(d.amount, d.currencyCode) : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">{toUSD(d.estimatedValue, d.currencyCode ?? 'USD')}</td>
                          <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">{d.campaignName || '—'}</td>
                          <td className="px-4 py-3 text-xs text-on-surface-variant max-w-[260px]">
                            {d.notes ? (
                              <div>
                                <span className={expandedDetails.has(d.donationId) ? 'whitespace-pre-wrap break-words' : 'block truncate'}>{d.notes}</span>
                                <button onClick={() => toggleDetail(d.donationId)} className="text-primary text-[10px] font-bold mt-0.5 hover:underline">
                                  {expandedDetails.has(d.donationId) ? 'Show less' : 'Show more'}
                                </button>
                              </div>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">{d.channelSource || '—'}</td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${d.isRecurring ? 'bg-secondary/10 text-secondary' : 'bg-surface-container text-on-surface-variant'}`}>
                              {d.isRecurring ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-center">{d.allocationCount}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => openViewDonation(d)}
                              className="flex items-center gap-1 text-primary text-xs font-semibold hover:underline whitespace-nowrap">
                              <span className="material-symbols-outlined text-[15px]">visibility</span>
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationBar total={donations.length} currentPage={donPage} pageSize={PAGE_SIZE}
                  onPageChange={setDonPage} noun="donations" />
              </div>
            )
          )}
        </main>
      </div>

      {/* ── Add / Edit Supporter Modal ── */}
      {suppModalMode !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 flex-shrink-0">
              <h2 className="font-manrope text-lg font-extrabold text-primary">
                {suppModalMode === 'add' ? 'Add Supporter' : selectedSupporter?.displayName ?? 'Edit Supporter'}
              </h2>
              <div className="flex items-center gap-3">
                {suppModalMode === 'edit' && (
                  <>
                    <button
                      onClick={() => { setSuppDonModalTab('profile'); }}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${suppDonModalTab === 'profile' ? 'aurora-gradient text-white' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
                      Profile
                    </button>
                    <button
                      onClick={() => { setSuppDonModalTab('donations'); }}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${suppDonModalTab === 'donations' ? 'aurora-gradient text-white' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
                      Donations ({suppDonations.length})
                    </button>
                  </>
                )}
                <button onClick={() => setSuppModalMode(null)}>
                  <span className="material-symbols-outlined text-on-surface-variant hover:text-on-surface">close</span>
                </button>
              </div>
            </div>

            {suppFormLoading ? (
              <div className="flex items-center justify-center flex-1 text-on-surface-variant text-sm py-12">Loading...</div>
            ) : suppDonModalTab === 'profile' ? (
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 border-b border-outline-variant/20 pb-1">Identity</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Display Name *">
                      <input className={inputCls} value={suppForm.displayName} onChange={e => patchSupp({ displayName: e.target.value })} />
                    </Field>
                    <Field label="Supporter Type *">
                      <select className={selectCls} value={suppForm.supporterType} onChange={e => patchSupp({ supporterType: e.target.value })}>
                        <option value="">Select type</option>
                        {SUPPORTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="First Name">
                      <input className={inputCls} value={suppForm.firstName} onChange={e => patchSupp({ firstName: e.target.value })} />
                    </Field>
                    <Field label="Last Name">
                      <input className={inputCls} value={suppForm.lastName} onChange={e => patchSupp({ lastName: e.target.value })} />
                    </Field>
                    <Field label="Organization Name">
                      <input className={inputCls} value={suppForm.organizationName} onChange={e => patchSupp({ organizationName: e.target.value })} />
                    </Field>
                    <Field label="Relationship Type">
                      <select className={selectCls} value={suppForm.relationshipType} onChange={e => patchSupp({ relationshipType: e.target.value })}>
                        <option value="">Select</option>
                        {RELATIONSHIP_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </Field>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 border-b border-outline-variant/20 pb-1">Contact & Location</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Email">
                      <input className={inputCls} type="email" value={suppForm.email} onChange={e => patchSupp({ email: e.target.value })} />
                    </Field>
                    <Field label="Phone">
                      <input className={inputCls} value={suppForm.phone} onChange={e => patchSupp({ phone: e.target.value })} />
                    </Field>
                    <Field label="Region">
                      <input className={inputCls} value={suppForm.region} onChange={e => patchSupp({ region: e.target.value })} />
                    </Field>
                    <Field label="Country">
                      <input className={inputCls} value={suppForm.country} onChange={e => patchSupp({ country: e.target.value })} />
                    </Field>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 border-b border-outline-variant/20 pb-1">Status & Acquisition</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Status *">
                      <select className={selectCls} value={suppForm.status} onChange={e => patchSupp({ status: e.target.value })}>
                        <option value="">Select status</option>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                    <Field label="Acquisition Channel">
                      <input className={inputCls} value={suppForm.acquisitionChannel} onChange={e => patchSupp({ acquisitionChannel: e.target.value })} />
                    </Field>
                    <Field label="First Donation Date">
                      <input className={inputCls} type="date"
                        value={suppForm.firstDonationDate ?? ''}
                        onChange={e => patchSupp({ firstDonationDate: e.target.value || null })} />
                    </Field>
                  </div>
                </div>
                {suppFormError && (
                  <p className="text-xs text-error font-semibold">{suppFormError}</p>
                )}
              </div>
            ) : (
              /* Donations sub-tab */
              <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-on-surface-variant">
                    {suppDonations.length} donation{suppDonations.length !== 1 ? 's' : ''} recorded
                  </p>
                  <button onClick={() => { setSuppModalMode(null); openRecordDonation(selectedSupporter!.supporterId); }}
                    className="aurora-gradient text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px]">add</span>
                    Record Donation
                  </button>
                </div>
                {suppDonLoading ? (
                  <div className="text-center text-on-surface-variant text-sm py-8">Loading donations...</div>
                ) : suppDonations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-on-surface-variant text-sm gap-2">
                    <span className="material-symbols-outlined text-[36px]">payments</span>
                    No donations recorded yet.
                  </div>
                ) : (
                  <>
                    <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 overflow-x-auto">
                      <table className="w-full text-sm min-w-[860px]">
                        <thead>
                          <tr className="border-b border-outline-variant/20">
                            {['Type', 'Date', 'Amount', 'Est. Value', 'Campaign', 'Details', 'Recurring', 'Alloc.', 'Reviewed'].map(h => (
                              <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {suppDonPageRows.map(d => {
                            const needsReview = (d.donationType === 'InKind' || d.donationType === 'Time') && !d.isReviewed;
                            return (
                            <tr key={d.donationId} className={`border-b border-outline-variant/10 hover:bg-surface-container transition-colors ${needsReview ? 'bg-tertiary-fixed/20' : ''}`}>
                              <td className="px-4 py-2.5">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${DONATION_TYPE_BADGE[d.donationType] ?? 'bg-surface-container text-on-surface-variant'}`}>
                                  {DONATION_TYPE_LABEL[d.donationType] ?? d.donationType}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-xs text-on-surface-variant whitespace-nowrap">{d.donationDate ?? '—'}</td>
                              <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                                {d.amount != null ? toUSD(d.amount, d.currencyCode) : '—'}
                              </td>
                              <td className="px-4 py-2.5 text-xs whitespace-nowrap">{toUSD(d.estimatedValue, d.currencyCode ?? 'USD')}</td>
                              <td className="px-4 py-2.5 text-xs text-on-surface-variant whitespace-nowrap">{d.campaignName || '—'}</td>
                              <td className="px-4 py-2.5 text-xs text-on-surface-variant max-w-[260px]">
                                {d.notes ? (
                                  <div>
                                    <span className={expandedDetails.has(d.donationId) ? 'whitespace-pre-wrap break-words' : 'block truncate'}>{d.notes}</span>
                                    <button onClick={() => toggleDetail(d.donationId)} className="text-primary text-[10px] font-bold mt-0.5 hover:underline">
                                      {expandedDetails.has(d.donationId) ? 'Show less' : 'Show more'}
                                    </button>
                                  </div>
                                ) : '—'}
                              </td>
                              <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${d.isRecurring ? 'bg-secondary/10 text-secondary' : 'bg-surface-container text-on-surface-variant'}`}>
                                  {d.isRecurring ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-xs text-center">{d.allocations.length}</td>
                              <td className="px-4 py-2.5 text-center">
                                {(d.donationType === 'InKind' || d.donationType === 'Time') ? (
                                  <button
                                    onClick={() => toggleReview(d.donationId, !d.isReviewed)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                      d.isReviewed
                                        ? 'bg-secondary/10 text-secondary'
                                        : 'bg-error/10 text-error hover:bg-error/20'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[14px]" style={d.isReviewed ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                                      {d.isReviewed ? 'check_circle' : 'pending'}
                                    </span>
                                    {d.isReviewed ? 'Reviewed' : 'Pending'}
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-on-surface-variant">—</span>
                                )}
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {sortedSuppDonations.length > PAGE_SIZE && (
                      <PaginationBar total={sortedSuppDonations.length} currentPage={suppDonPage} pageSize={PAGE_SIZE}
                        onPageChange={setSuppDonPage} noun="donations" />
                    )}
                  </>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant/20 flex-shrink-0">
              <button onClick={() => setSuppModalMode(null)}
                className="text-sm font-semibold text-on-surface-variant hover:text-on-surface px-4 py-2 rounded-xl hover:bg-surface-container-low transition-colors">
                Cancel
              </button>
              {suppDonModalTab === 'profile' && (
                <button onClick={handleSupporterSubmit}
                  className="aurora-gradient text-white text-sm font-bold px-5 py-2 rounded-xl hover:opacity-90 transition-opacity">
                  {suppModalMode === 'add' ? 'Save Supporter' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Record Donation Modal ── */}
      {donModalMode === 'add' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 flex-shrink-0">
              <h2 className="font-manrope text-lg font-extrabold text-primary">Record Donation</h2>
              <button onClick={() => setDonModalMode(null)}>
                <span className="material-symbols-outlined text-on-surface-variant hover:text-on-surface">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {donShowSuppSelector && (
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 border-b border-outline-variant/20 pb-1">Supporter</p>
                  <Field label="Supporter *">
                    <select
                      className={selectCls}
                      value={donTargetSuppId ?? ''}
                      onChange={e => setDonTargetSuppId(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Select supporter…</option>
                      {supporters.map(s => (
                        <option key={s.supporterId} value={s.supporterId}>{s.displayName}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 border-b border-outline-variant/20 pb-1">Contribution Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Donation Type *">
                    <select className={selectCls} value={donForm.donationType} onChange={e => patchDon({ donationType: e.target.value })}>
                      <option value="">Select type</option>
                      {DONATION_TYPES.map(t => <option key={t} value={t}>{DONATION_TYPE_LABEL[t] ?? t}</option>)}
                    </select>
                  </Field>
                  <Field label="Donation Date">
                    <input className={inputCls} type="date" value={donForm.donationDate}
                      onChange={e => patchDon({ donationDate: e.target.value })} />
                  </Field>
                  <Field label="Currency Code">
                    <input className={inputCls} value={donForm.currencyCode}
                      onChange={e => patchDon({ currencyCode: e.target.value })} placeholder="PHP" />
                  </Field>
                  <Field label="Amount">
                    <input className={inputCls} type="number" min="0" step="0.01" value={donForm.amount}
                      onChange={e => patchDon({ amount: e.target.value })} />
                  </Field>
                  <Field label="Estimated Value (PHP) *">
                    <input className={inputCls} type="number" min="0" step="0.01" value={donForm.estimatedValue}
                      onChange={e => patchDon({ estimatedValue: e.target.value })} />
                  </Field>
                  <Field label="Impact Unit">
                    <input className={inputCls} value={donForm.impactUnit}
                      onChange={e => patchDon({ impactUnit: e.target.value })} placeholder="e.g. meals, hours" />
                  </Field>
                  <Field label="Campaign Name">
                    <input className={inputCls} value={donForm.campaignName}
                      onChange={e => patchDon({ campaignName: e.target.value })} />
                  </Field>
                  <Field label="Channel Source">
                    <input className={inputCls} value={donForm.channelSource}
                      onChange={e => patchDon({ channelSource: e.target.value })} placeholder="e.g. Online, Event" />
                  </Field>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 border-b border-outline-variant/20 pb-1">Additional</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Notes">
                    <textarea className={`${inputCls} resize-none h-20`} value={donForm.notes}
                      onChange={e => patchDon({ notes: e.target.value })} />
                  </Field>
                  <Field label="Recurring">
                    <div className="flex items-center gap-2 mt-2">
                      <input type="checkbox" id="isRecurring" checked={donForm.isRecurring}
                        onChange={e => patchDon({ isRecurring: e.target.checked })}
                        className="w-4 h-4 accent-primary" />
                      <label htmlFor="isRecurring" className="text-sm text-on-surface">Recurring donation</label>
                    </div>
                  </Field>
                </div>
              </div>
              {donFormError && (
                <p className="text-xs text-error font-semibold">{donFormError}</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant/20 flex-shrink-0">
              <button onClick={() => setDonModalMode(null)}
                className="text-sm font-semibold text-on-surface-variant hover:text-on-surface px-4 py-2 rounded-xl hover:bg-surface-container-low transition-colors">
                Cancel
              </button>
              <button onClick={handleDonationSubmit}
                className="aurora-gradient text-white text-sm font-bold px-5 py-2 rounded-xl hover:opacity-90 transition-opacity">
                Save Donation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Donation / Allocations Modal ── */}
      {donModalMode === 'view' && selectedDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 flex-shrink-0">
              <h2 className="font-manrope text-lg font-extrabold text-primary">Donation Detail</h2>
              <button onClick={() => setDonModalMode(null)}>
                <span className="material-symbols-outlined text-on-surface-variant hover:text-on-surface">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {/* Summary */}
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 border-b border-outline-variant/20 pb-1">Summary</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  {[
                    ['Supporter', selectedDonation.supporterName || '—'],
                    ['Type', DONATION_TYPE_LABEL[selectedDonation.donationType] ?? selectedDonation.donationType],
                    ['Date', selectedDonation.donationDate ?? '—'],
                    ['Amount', selectedDonation.amount != null ? toUSD(selectedDonation.amount, selectedDonation.currencyCode) : '—'],
                    ['Est. Value', toUSD(selectedDonation.estimatedValue, selectedDonation.currencyCode ?? 'USD')],
                    ['Campaign', selectedDonation.campaignName || '—'],
                    ['Channel', selectedDonation.channelSource || '—'],
                    ['Recurring', selectedDonation.isRecurring ? 'Yes' : 'No'],
                    ['Impact Unit', selectedDonation.impactUnit || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex flex-col">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{k}</span>
                      <span className="text-sm text-on-surface mt-0.5">{v}</span>
                    </div>
                  ))}
                </div>
                {selectedDonation.notes && (
                  <div className="mt-3">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Notes</span>
                    <p className="text-sm text-on-surface mt-0.5">{selectedDonation.notes}</p>
                  </div>
                )}
              </div>

              {/* Allocation breakdown */}
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 border-b border-outline-variant/20 pb-1">
                  Allocation Breakdown ({selectedDonation.allocations.length})
                </p>
                {selectedDonation.allocations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-on-surface-variant text-sm gap-1">
                    <span className="material-symbols-outlined text-[32px]">account_balance</span>
                    No allocations recorded for this donation.
                  </div>
                ) : (
                  <div className="rounded-xl border border-outline-variant/20 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                          {['Safehouse', 'Program Area', 'Amount Allocated', 'Date', 'Notes'].map(h => (
                            <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDonation.allocations.map(a => (
                          <tr key={a.allocationId} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                            <td className="px-4 py-2.5 text-xs whitespace-nowrap">{a.safehouseName || '—'}</td>
                            <td className="px-4 py-2.5 text-xs whitespace-nowrap">{a.programArea}</td>
                            <td className="px-4 py-2.5 text-xs whitespace-nowrap">${fmt(a.amountAllocated)}</td>
                            <td className="px-4 py-2.5 text-xs text-on-surface-variant whitespace-nowrap">{a.allocationDate}</td>
                            <td className="px-4 py-2.5 text-xs text-on-surface-variant">{a.allocationNotes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end px-6 py-4 border-t border-outline-variant/20 flex-shrink-0">
              <button onClick={() => setDonModalMode(null)}
                className="text-sm font-semibold text-on-surface-variant hover:text-on-surface px-4 py-2 rounded-xl hover:bg-surface-container-low transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
