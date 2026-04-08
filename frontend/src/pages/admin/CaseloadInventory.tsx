import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { authHeaders } from '../../utils/auth';

const API = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/residents`;

const CASE_STATUS_OPTIONS = ['Active', 'Closed', 'Transferred'];
const CASE_CATEGORY_OPTIONS = ['Abandoned', 'Foundling', 'Neglected', 'Surrendered'];
const RISK_LEVEL_OPTIONS = ['Low', 'Medium', 'High'];
const SEX_OPTIONS = ['Female', 'Male'];
const PAGE_SIZE = 20;

const RISK_BADGE: Record<string, string> = {
  High:   'bg-error/10 text-error',
  Medium: 'bg-tertiary-fixed text-on-surface',
  Low:    'bg-secondary/10 text-secondary',
};

const STATUS_BADGE: Record<string, string> = {
  Active:      'bg-secondary/10 text-secondary',
  Closed:      'bg-surface-container-high text-on-surface-variant',
  Transferred: 'bg-tertiary-fixed text-on-surface',
  Discharged:  'bg-primary/10 text-primary',
};

// ── Interfaces ───────────────────────────────────────────────────────────────

interface SafehouseOption {
  safehouseId: number;
  safehouseCode: string;
  name: string;
  city: string;
  province: string;
}

interface ResidentRow {
  residentId: number;
  caseControlNo: string;
  internalCode: string;
  safehouseId: number;
  safehouseName: string;
  caseStatus: string;
  caseCategory: string;
  subCategories: string[];
  dateOfAdmission: string;
  assignedSocialWorker: string;
  currentRiskLevel: string;
  initialRiskLevel: string;
}

interface ResidentDetail {
  residentId: number;
  caseControlNo: string;
  internalCode: string;
  safehouseId: number;
  caseStatus: string;
  sex: string;
  dateOfBirth: string | null;
  birthStatus: string;
  placeOfBirth: string;
  religion: string;
  caseCategory: string;
  subCatOrphaned: boolean;
  subCatTrafficked: boolean;
  subCatChildLabor: boolean;
  subCatPhysicalAbuse: boolean;
  subCatSexualAbuse: boolean;
  subCatOsaec: boolean;
  subCatCicl: boolean;
  subCatAtRisk: boolean;
  subCatStreetChild: boolean;
  subCatChildWithHiv: boolean;
  isPwd: boolean;
  pwdType: string | null;
  hasSpecialNeeds: boolean;
  specialNeedsDiagnosis: string | null;
  familyIs4Ps: boolean;
  familySoloParent: boolean;
  familyIndigenous: boolean;
  familyParentPwd: boolean;
  familyInformalSettler: boolean;
  dateOfAdmission: string;
  ageUponAdmission: string;
  presentAge: string;
  lengthOfStay: string | null;
  referralSource: string | null;
  referringAgencyPerson: string | null;
  dateColbRegistered: string | null;
  dateColbObtained: string | null;
  assignedSocialWorker: string;
  initialCaseAssessment: string;
  dateCaseStudyPrepared: string | null;
  reintegrationType: string;
  reintegrationStatus: string;
  initialRiskLevel: string;
  currentRiskLevel: string;
  dateEnrolled: string | null;
  dateClosed: string | null;
  notesRestricted: string;
}

type ResidentFormData = Omit<ResidentDetail, 'residentId'>;

const EMPTY_FORM: ResidentFormData = {
  caseControlNo: '', internalCode: '', safehouseId: 0, caseStatus: '', sex: '',
  dateOfBirth: null, birthStatus: '', placeOfBirth: '', religion: '', caseCategory: '',
  subCatOrphaned: false, subCatTrafficked: false, subCatChildLabor: false,
  subCatPhysicalAbuse: false, subCatSexualAbuse: false, subCatOsaec: false,
  subCatCicl: false, subCatAtRisk: false, subCatStreetChild: false, subCatChildWithHiv: false,
  isPwd: false, pwdType: null, hasSpecialNeeds: false, specialNeedsDiagnosis: null,
  familyIs4Ps: false, familySoloParent: false, familyIndigenous: false,
  familyParentPwd: false, familyInformalSettler: false,
  dateOfAdmission: '', ageUponAdmission: '', presentAge: '',
  lengthOfStay: null, referralSource: null, referringAgencyPerson: null,
  dateColbRegistered: null, dateColbObtained: null,
  assignedSocialWorker: '', initialCaseAssessment: '',
  dateCaseStudyPrepared: null, reintegrationType: '', reintegrationStatus: '',
  initialRiskLevel: '', currentRiskLevel: '', dateEnrolled: null, dateClosed: null,
  notesRestricted: '',
};

// ── Helper components ────────────────────────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 border-b border-outline-variant/20 pb-1">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

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

const inputCls = 'w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20';
const selectCls = 'w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none';

// ── Main component ───────────────────────────────────────────────────────────

export default function CaseloadInventory() {


  const [residents, setResidents] = useState<ResidentRow[]>([]);
  const [safehouses, setSafehouses] = useState<SafehouseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSafehouse, setFilterSafehouse] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [currentPage, setCurrentPage] = useState(1);

  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedResident, setSelectedResident] = useState<ResidentDetail | null>(null);
  const [formData, setFormData] = useState<ResidentFormData>(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [caseToClose, setCaseToClose] = useState<ResidentRow | null>(null);
  const [closing, setClosing] = useState(false);

  // Fetch safehouses once on mount
  useEffect(() => {
    fetch(`${API}/safehouses`, { headers: authHeaders() })
      .then(r => r.json())
      .then(setSafehouses)
      .catch(console.error);
  }, []);

  // Fetch residents when filters or refreshKey change
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)          params.set('search', search);
    if (filterStatus)    params.set('caseStatus', filterStatus);
    if (filterSafehouse) params.set('safehouseId', filterSafehouse);
    if (filterCategory)  params.set('caseCategory', filterCategory);

    const delay = search ? 300 : 0;
    const timer = setTimeout(() => {
      fetch(`${API}?${params}`, { headers: authHeaders() })
        .then(r => r.json())
        .then(data => { setResidents(data); setCurrentPage(1); setLoading(false); })
        .catch(() => setLoading(false));
    }, delay);

    return () => clearTimeout(timer);
  }, [search, filterStatus, filterSafehouse, filterCategory, refreshKey]);

  function patch(updates: Partial<ResidentFormData>) {
    setFormData(prev => ({ ...prev, ...updates }));
  }

  function openAdd() {
    setFormData(EMPTY_FORM);
    setSelectedResident(null);
    setFormError(null);
    setModalMode('add');
  }

  async function openEdit(id: number) {
    setFormError(null);
    setFormLoading(true);
    setModalMode('edit');
    try {
      const data: ResidentDetail = await fetch(`${API}/${id}`, { headers: authHeaders() }).then(r => r.json());
      setSelectedResident(data);
      const { residentId: _id, ...rest } = data;
      setFormData(rest);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleCloseCase() {
    if (!caseToClose) return;
    setClosing(true);
    try {
      const detail: ResidentDetail = await fetch(`${API}/${caseToClose.residentId}`, { headers: authHeaders() }).then(r => r.json());
      const updated = {
        ...detail,
        caseStatus: 'Closed',
        dateClosed: new Date().toISOString().slice(0, 10),
      };
      await fetch(`${API}/${caseToClose.residentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(updated),
      });
      setCaseToClose(null);
      setRefreshKey(k => k + 1);
    } finally {
      setClosing(false);
    }
  }

  async function handleSubmit() {
    setFormError(null);

    if (!formData.caseControlNo.trim()) { setFormError('Case Control No is required.'); return; }
    if (!formData.dateOfAdmission)      { setFormError('Date of Admission is required.'); return; }
    if (formData.safehouseId === 0)     { setFormError('Please select a Safehouse.'); return; }

    const url    = modalMode === 'add' ? API : `${API}/${selectedResident!.residentId}`;
    const method = modalMode === 'add' ? 'POST' : 'PUT';
    const body   = modalMode === 'edit'
      ? { residentId: selectedResident!.residentId, ...formData }
      : formData;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      });
      if (!res.ok) { setFormError('Save failed. Please check all fields and try again.'); return; }
      setModalMode(null);
      setRefreshKey(k => k + 1);
    } catch {
      setFormError('Network error. Please try again.');
    }
  }

  return (
    <div className="flex h-screen bg-surface overflow-hidden font-body">
      <AdminSidebar />

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-3 px-6 py-3 bg-surface-container-lowest border-b border-outline-variant/20 flex-shrink-0 flex-wrap">
          <div className="flex items-center gap-2 bg-surface-container-low rounded-xl px-3 py-2 min-w-[220px]">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
            <input
              className="bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant outline-none w-full"
              placeholder="Search case no, code, social worker..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-surface-container-low text-sm text-on-surface rounded-xl px-3 py-2 outline-none border-none"
          >
            <option value="">All Statuses</option>
            {CASE_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={filterSafehouse}
            onChange={e => setFilterSafehouse(e.target.value)}
            className="bg-surface-container-low text-sm text-on-surface rounded-xl px-3 py-2 outline-none border-none"
          >
            <option value="">All Safehouses</option>
            {safehouses.map(s => (
              <option key={s.safehouseId} value={s.safehouseId}>{s.name}</option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-surface-container-low text-sm text-on-surface rounded-xl px-3 py-2 outline-none border-none"
          >
            <option value="">All Categories</option>
            {CASE_CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <p className="flex-1 text-center text-sm font-bold text-on-surface">Caseload Inventory</p>

          <button
            onClick={openAdd}
            className="aurora-gradient text-white text-sm font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Resident
          </button>
        </header>

        {/* Main table */}
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-on-surface-variant text-sm">
              Loading residents...
            </div>
          ) : residents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-on-surface-variant text-sm gap-2">
              <span className="material-symbols-outlined text-[40px]">folder_open</span>
              No residents match your filters.
            </div>
          ) : (() => {
            const totalPages = Math.ceil(residents.length / PAGE_SIZE);
            const pageRows = residents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
            return (
              <div className="flex flex-col gap-4">
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-x-auto">
                  <table className="w-full text-sm min-w-[960px]">
                    <thead>
                      <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                        {['Case Control No', 'Internal Code', 'Safehouse', 'Status', 'Category', 'Sub-categories', 'Admission Date', 'Social Worker', 'Risk Level', ''].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map(r => (
                        <tr key={r.residentId} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-primary font-semibold whitespace-nowrap">{r.caseControlNo}</td>
                          <td className="px-4 py-3 font-mono text-xs text-on-surface-variant whitespace-nowrap">{r.internalCode}</td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">{r.safehouseName}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${STATUS_BADGE[r.caseStatus] ?? 'bg-surface-container text-on-surface-variant'}`}>
                              {r.caseStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">{r.caseCategory}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1 max-w-[160px]">
                              {r.subCategories.slice(0, 3).map(s => (
                                <span key={s} className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">{s}</span>
                              ))}
                              {r.subCategories.length > 3 && (
                                <span className="bg-surface-container text-on-surface-variant text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                  +{r.subCategories.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">{r.dateOfAdmission}</td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">{r.assignedSocialWorker}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${RISK_BADGE[r.currentRiskLevel] ?? 'bg-surface-container text-on-surface-variant'}`}>
                              {r.currentRiskLevel}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => openEdit(r.residentId)}
                                className="flex items-center gap-1 text-primary text-xs font-semibold hover:underline whitespace-nowrap"
                              >
                                <span className="material-symbols-outlined text-[15px]">edit</span>
                                View/Edit
                              </button>
                              {r.caseStatus !== 'Closed' && (
                                <button
                                  onClick={() => setCaseToClose(r)}
                                  className="flex items-center gap-1 text-on-surface-variant text-xs font-semibold hover:text-error hover:underline whitespace-nowrap transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[15px]">folder_off</span>
                                  Close Case
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination bar */}
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs text-on-surface-variant">
                    Showing <span className="font-semibold text-on-surface">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, residents.length)}</span> of <span className="font-semibold text-on-surface">{residents.length}</span> residents
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">first_page</span>
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => p - 1)}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
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
                          : <button
                              key={p}
                              onClick={() => setCurrentPage(p as number)}
                              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                                currentPage === p
                                  ? 'aurora-gradient text-white'
                                  : 'text-on-surface-variant hover:bg-surface-container-low'
                              }`}
                            >
                              {p}
                            </button>
                      )}
                    <button
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">last_page</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </main>
      </div>

      {/* ── Add / Edit Modal ── */}
      {modalMode !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col mx-4">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 flex-shrink-0">
              <h2 className="font-manrope text-lg font-extrabold text-primary">
                {modalMode === 'add' ? 'Add New Resident' : 'Edit Resident'}
              </h2>
              <button onClick={() => setModalMode(null)}>
                <span className="material-symbols-outlined text-on-surface-variant hover:text-on-surface">close</span>
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {formLoading ? (
                <div className="text-center py-10 text-on-surface-variant text-sm">Loading...</div>
              ) : (
                <>
                  {/* 1. Basic Info */}
                  <FormSection title="Basic Info">
                    <Field label="Case Control No *">
                      <input className={inputCls} value={formData.caseControlNo}
                        onChange={e => patch({ caseControlNo: e.target.value })} />
                    </Field>
                    <Field label="Internal Code">
                      <input className={inputCls} value={formData.internalCode}
                        onChange={e => patch({ internalCode: e.target.value })} />
                    </Field>
                    <Field label="Safehouse *">
                      <select className={selectCls} value={formData.safehouseId}
                        onChange={e => patch({ safehouseId: Number(e.target.value) })}>
                        <option value={0} disabled>Select safehouse...</option>
                        {safehouses.map(s => (
                          <option key={s.safehouseId} value={s.safehouseId}>{s.name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Case Status *">
                      <select className={selectCls} value={formData.caseStatus}
                        onChange={e => patch({ caseStatus: e.target.value })}>
                        <option value="">Select...</option>
                        {CASE_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                    <Field label="Sex">
                      <select className={selectCls} value={formData.sex}
                        onChange={e => patch({ sex: e.target.value })}>
                        <option value="">Select...</option>
                        {SEX_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                    <Field label="Date of Birth">
                      <input type="date" className={inputCls}
                        value={formData.dateOfBirth ?? ''}
                        onChange={e => patch({ dateOfBirth: e.target.value || null })} />
                    </Field>
                    <Field label="Birth Status">
                      <input className={inputCls} value={formData.birthStatus}
                        onChange={e => patch({ birthStatus: e.target.value })} />
                    </Field>
                    <Field label="Place of Birth">
                      <input className={inputCls} value={formData.placeOfBirth}
                        onChange={e => patch({ placeOfBirth: e.target.value })} />
                    </Field>
                    <Field label="Religion">
                      <input className={inputCls} value={formData.religion}
                        onChange={e => patch({ religion: e.target.value })} />
                    </Field>
                  </FormSection>

                  {/* 2. Case Classification */}
                  <FormSection title="Case Classification">
                    <Field label="Case Category">
                      <select className={selectCls} value={formData.caseCategory}
                        onChange={e => patch({ caseCategory: e.target.value })}>
                        <option value="">Select...</option>
                        {CASE_CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                    <div />
                    <div className="col-span-2 grid grid-cols-2 gap-2">
                      {([
                        ['subCatOrphaned',     'Orphaned'],
                        ['subCatTrafficked',   'Trafficked'],
                        ['subCatChildLabor',   'Child Labor'],
                        ['subCatPhysicalAbuse','Physical Abuse'],
                        ['subCatSexualAbuse',  'Sexual Abuse'],
                        ['subCatOsaec',        'OSAEC'],
                        ['subCatCicl',         'CICL'],
                        ['subCatAtRisk',       'At Risk'],
                        ['subCatStreetChild',  'Street Child'],
                        ['subCatChildWithHiv', 'Child w/ HIV'],
                      ] as [keyof ResidentFormData, string][]).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="accent-primary"
                            checked={!!formData[key]}
                            onChange={e => patch({ [key]: e.target.checked })} />
                          <span className="text-sm text-on-surface">{label}</span>
                        </label>
                      ))}
                    </div>
                  </FormSection>

                  {/* 3. Disability & Special Needs */}
                  <FormSection title="Disability & Special Needs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="accent-primary"
                        checked={formData.isPwd}
                        onChange={e => patch({ isPwd: e.target.checked, pwdType: e.target.checked ? formData.pwdType : null })} />
                      <span className="text-sm text-on-surface">Person with Disability (PWD)</span>
                    </label>
                    {formData.isPwd ? (
                      <Field label="PWD Type">
                        <input className={inputCls} value={formData.pwdType ?? ''}
                          onChange={e => patch({ pwdType: e.target.value || null })} />
                      </Field>
                    ) : <div />}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="accent-primary"
                        checked={formData.hasSpecialNeeds}
                        onChange={e => patch({ hasSpecialNeeds: e.target.checked, specialNeedsDiagnosis: e.target.checked ? formData.specialNeedsDiagnosis : null })} />
                      <span className="text-sm text-on-surface">Has Special Needs</span>
                    </label>
                    {formData.hasSpecialNeeds ? (
                      <Field label="Special Needs Diagnosis">
                        <input className={inputCls} value={formData.specialNeedsDiagnosis ?? ''}
                          onChange={e => patch({ specialNeedsDiagnosis: e.target.value || null })} />
                      </Field>
                    ) : <div />}
                  </FormSection>

                  {/* 4. Family Profile */}
                  <FormSection title="Family Socio-Demographic Profile">
                    <div className="col-span-2 grid grid-cols-2 gap-2">
                      {([
                        ['familyIs4Ps',          '4Ps Beneficiary'],
                        ['familySoloParent',      'Solo Parent'],
                        ['familyIndigenous',      'Indigenous Group'],
                        ['familyParentPwd',       'Parent with Disability'],
                        ['familyInformalSettler', 'Informal Settler'],
                      ] as [keyof ResidentFormData, string][]).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="accent-primary"
                            checked={!!formData[key]}
                            onChange={e => patch({ [key]: e.target.checked })} />
                          <span className="text-sm text-on-surface">{label}</span>
                        </label>
                      ))}
                    </div>
                  </FormSection>

                  {/* 5. Admission Details */}
                  <FormSection title="Admission Details">
                    <Field label="Date of Admission *">
                      <input type="date" className={inputCls}
                        value={formData.dateOfAdmission}
                        onChange={e => patch({ dateOfAdmission: e.target.value })} />
                    </Field>
                    <Field label="Age Upon Admission">
                      <input className={inputCls} value={formData.ageUponAdmission}
                        onChange={e => patch({ ageUponAdmission: e.target.value })} />
                    </Field>
                    <Field label="Present Age">
                      <input className={inputCls} value={formData.presentAge}
                        onChange={e => patch({ presentAge: e.target.value })} />
                    </Field>
                    <Field label="Length of Stay">
                      <input className={inputCls} value={formData.lengthOfStay ?? ''}
                        onChange={e => patch({ lengthOfStay: e.target.value || null })} />
                    </Field>
                  </FormSection>

                  {/* 6. Referral */}
                  <FormSection title="Referral Information">
                    <Field label="Referral Source">
                      <input className={inputCls} value={formData.referralSource ?? ''}
                        onChange={e => patch({ referralSource: e.target.value || null })} />
                    </Field>
                    <Field label="Referring Agency / Person">
                      <input className={inputCls} value={formData.referringAgencyPerson ?? ''}
                        onChange={e => patch({ referringAgencyPerson: e.target.value || null })} />
                    </Field>
                  </FormSection>

                  {/* 7. Registration */}
                  <FormSection title="Registration Dates">
                    <Field label="COLB Registered">
                      <input type="date" className={inputCls}
                        value={formData.dateColbRegistered ?? ''}
                        onChange={e => patch({ dateColbRegistered: e.target.value || null })} />
                    </Field>
                    <Field label="COLB Obtained">
                      <input type="date" className={inputCls}
                        value={formData.dateColbObtained ?? ''}
                        onChange={e => patch({ dateColbObtained: e.target.value || null })} />
                    </Field>
                    <Field label="Case Study Prepared">
                      <input type="date" className={inputCls}
                        value={formData.dateCaseStudyPrepared ?? ''}
                        onChange={e => patch({ dateCaseStudyPrepared: e.target.value || null })} />
                    </Field>
                  </FormSection>

                  {/* 8. Social Work */}
                  <FormSection title="Social Work">
                    <Field label="Assigned Social Worker">
                      <input className={inputCls} value={formData.assignedSocialWorker}
                        onChange={e => patch({ assignedSocialWorker: e.target.value })} />
                    </Field>
                    <div />
                    <div className="col-span-2">
                      <Field label="Initial Case Assessment">
                        <textarea rows={3} className={`${inputCls} resize-none`}
                          value={formData.initialCaseAssessment}
                          onChange={e => patch({ initialCaseAssessment: e.target.value })} />
                      </Field>
                    </div>
                    <Field label="Initial Risk Level">
                      <select className={selectCls} value={formData.initialRiskLevel}
                        onChange={e => patch({ initialRiskLevel: e.target.value })}>
                        <option value="">Select...</option>
                        {RISK_LEVEL_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </Field>
                    <Field label="Current Risk Level">
                      <select className={selectCls} value={formData.currentRiskLevel}
                        onChange={e => patch({ currentRiskLevel: e.target.value })}>
                        <option value="">Select...</option>
                        {RISK_LEVEL_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </Field>
                  </FormSection>

                  {/* 9. Reintegration */}
                  <FormSection title="Reintegration">
                    <Field label="Reintegration Type">
                      <input className={inputCls} value={formData.reintegrationType}
                        onChange={e => patch({ reintegrationType: e.target.value })} />
                    </Field>
                    <Field label="Reintegration Status">
                      <input className={inputCls} value={formData.reintegrationStatus}
                        onChange={e => patch({ reintegrationStatus: e.target.value })} />
                    </Field>
                    <Field label="Date Enrolled">
                      <input type="date" className={inputCls}
                        value={formData.dateEnrolled ?? ''}
                        onChange={e => patch({ dateEnrolled: e.target.value || null })} />
                    </Field>
                    <Field label="Date Closed">
                      <input type="date" className={inputCls}
                        value={formData.dateClosed ?? ''}
                        onChange={e => patch({ dateClosed: e.target.value || null })} />
                    </Field>
                  </FormSection>

                  {/* 10. Notes */}
                  <FormSection title="Notes (Restricted)">
                    <div className="col-span-2">
                      <textarea rows={4} className={`${inputCls} resize-none`}
                        value={formData.notesRestricted}
                        onChange={e => patch({ notesRestricted: e.target.value })} />
                    </div>
                  </FormSection>
                </>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-outline-variant/20 flex items-center justify-between flex-shrink-0">
              <div className="flex-1">
                {formError && <p className="text-error text-xs font-semibold">{formError}</p>}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="aurora-gradient text-white text-sm font-bold px-6 py-2 rounded-xl hover:opacity-90 transition-opacity"
                >
                  {modalMode === 'add' ? 'Create Resident' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Case confirmation modal */}
      {caseToClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20">
              <h2 className="text-base font-manrope font-bold text-on-surface">Close Case</h2>
              <button onClick={() => setCaseToClose(null)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-on-surface mb-1">
                Close case <strong>{caseToClose.caseControlNo}</strong>?
              </p>
              <p className="text-sm text-on-surface-variant mb-4">
                The case status will be set to <strong>Closed</strong> and today will be recorded as the close date. This can be reversed by editing the case.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setCaseToClose(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseCase}
                  disabled={closing}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white aurora-gradient hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {closing ? 'Closing…' : 'Close Case'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
