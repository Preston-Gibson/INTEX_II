import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import UserAvatar from '../../components/UserAvatar';
import { authHeaders } from '../../utils/auth';

const API = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/home-visitation`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface UpcomingVisit {
  visitationId: number;
  visitDate: string;
  visitType: string;
  locationVisited: string;
  socialWorker: string;
  residentCaseNo: string;
  followUpNeeded: boolean;
}

interface HistoricalLog {
  visitationId: number;
  visitDate: string;
  visitType: string;
  locationVisited: string;
  socialWorker: string;
  residentCaseNo: string;
  purpose: string;
  familyMembersPresent: string;
  observations: string;
  followUpNeeded: boolean;
  followUpNotes: string;
  visitOutcome: string;
  familyCooperationLevel: string;
  safetyConcernsNoted: boolean;
}

interface ResidentOption {
  residentId: number;
  caseControlNo: string;
}

interface PagedLogs {
  data: HistoricalLog[];
  total: number;
  page: number;
  pageSize: number;
}

const VISIT_TYPES = [
  'Initial Assessment',
  'Routine Follow-Up',
  'Reintegration Assessment',
  'Post-Placement Monitoring',
  'Emergency',
];

const COOPERATION_LEVELS = ['Cooperative', 'Neutral', 'Uncooperative'];
const PAGE_SIZE = 15;

function fmtDate(raw: string) {
  if (!raw) return '—';
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-surface-container-high'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-sm text-on-surface">{label}</span>
    </label>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomeVisitationCaseConference() {
  const [upcomingVisits, setUpcomingVisits] = useState<UpcomingVisit[]>([]);
  const [logs, setLogs] = useState<HistoricalLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [residents, setResidents] = useState<ResidentOption[]>([]);
  const [socialWorkers, setSocialWorkers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);

  // Log form
  const [form, setForm] = useState({
    residentId: '',
    socialWorker: '',
    visitType: '',
    locationVisited: '',
    purpose: '',
    familyMembersPresent: '',
    observations: '',
    familyCooperationLevel: 'Neutral',
    followUpNeeded: false,
    followUpNotes: '',
    safetyConcernsNoted: false,
    visitOutcome: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Edit panel
  const [selectedLog, setSelectedLog] = useState<HistoricalLog | null>(null);
  const [editForm, setEditForm] = useState<Partial<HistoricalLog>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [search, setSearch] = useState('');

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    residentId: '',
    visitDate: '',
    socialWorker: '',
    visitType: '',
    locationVisited: '',
  });
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [socialWorkers, setSocialWorkers] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/process-recordings/social-workers`, { headers: authHeaders() })
      .then(r => r.json())
      .then(setSocialWorkers)
      .catch(() => {});
  }, []);

  function loadData() {
    return Promise.all([
      fetch(`${API}/upcoming-visits`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/residents`, { headers: authHeaders() }).then(r => r.json()),
    ]).then(([u, r]) => {
      setUpcomingVisits(u);
      setResidents(r);
      setLoading(false);
    }).catch(() => setLoading(false));

    // social-workers is a new endpoint — fetch separately so a 404 doesn't break the rest
    fetch(`${API}/social-workers`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then((sw: unknown) => { if (Array.isArray(sw)) setSocialWorkers(sw); })
      .catch(() => {});
  }

  async function handleScheduleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduleForm.residentId || !scheduleForm.visitDate || !scheduleForm.visitType || !scheduleForm.socialWorker) {
      setScheduleError('Please fill in all required fields.');
      return;
    }
    setScheduling(true);
    setScheduleError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/home-visitation/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          residentId: parseInt(scheduleForm.residentId),
          visitDate: scheduleForm.visitDate,
          socialWorker: scheduleForm.socialWorker,
          visitType: scheduleForm.visitType,
          locationVisited: scheduleForm.locationVisited,
        }),
      });
      if (!res.ok) throw new Error();
      setShowScheduleForm(false);
      setScheduleForm({ residentId: '', visitDate: '', socialWorker: '', visitType: '', locationVisited: '' });
      setLoading(true);
      loadData();
    } catch {
      setScheduleError('Failed to schedule visit. Please try again.');
    } finally {
      setScheduling(false);
    }
  }

  async function handleDeleteLog() {
    if (!logToDelete) return;
    setDeleting(true);
    await fetch(`${API}/${logToDelete.visitationId}`, { method: 'DELETE', headers: authHeaders() });
    setHistoricalLogs(logs => logs.filter(l => l.visitationId !== logToDelete.visitationId));
    setLogToDelete(null);
    setDeleting(false);
  }

  useEffect(() => { loadStatic(); }, []);
  useEffect(() => { loadLogs(currentPage); }, [currentPage]);

  // ── Log submit ──────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.residentId || !form.visitType) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          residentId: parseInt(form.residentId),
          socialWorker: form.socialWorker,
          visitType: form.visitType,
          locationVisited: form.locationVisited,
          purpose: form.purpose,
          familyMembersPresent: form.familyMembersPresent,
          observations: form.observations,
          familyCooperationLevel: form.familyCooperationLevel,
          safetyConcernsNoted: form.safetyConcernsNoted,
          followUpNeeded: form.followUpNeeded,
          followUpNotes: form.followUpNotes,
          visitOutcome: form.visitOutcome,
        }),
      });
      if (!res.ok) return;
      setForm({
        residentId: '', socialWorker: '', visitType: '', locationVisited: '',
        purpose: '', familyMembersPresent: '', observations: '',
        familyCooperationLevel: 'Neutral', followUpNeeded: false,
        followUpNotes: '', safetyConcernsNoted: false, visitOutcome: '',
      });
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      loadLogs(1);
      setCurrentPage(1);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Edit panel ──────────────────────────────────────────────────────────────

  function openLog(log: HistoricalLog) {
    setSelectedLog(log);
    setEditForm({ ...log });
    setSaveSuccess(false);
    setSaveError(null);
  }

  async function handleSaveLog(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLog) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`${API}/${selectedLog.visitationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) { setSaveError('Failed to save. Please try again.'); return; }
      setLogs(prev => prev.map(l =>
        l.visitationId === selectedLog.visitationId ? { ...l, ...editForm } as HistoricalLog : l
      ));
      setSelectedLog(prev => prev ? { ...prev, ...editForm } as HistoricalLog : null);
      setSaveSuccess(true);
    } finally {
      setSaving(false);
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const filteredLogs = logs.filter(log => {
    const q = search.toLowerCase();
    return (
      log.residentCaseNo.toLowerCase().includes(q) ||
      log.visitType.toLowerCase().includes(q) ||
      log.socialWorker.toLowerCase().includes(q) ||
      log.locationVisited.toLowerCase().includes(q) ||
      log.visitOutcome.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(totalLogs / PAGE_SIZE);
  const followUpCount = upcomingVisits.filter(v => v.followUpNeeded).length;
  const safetyCount = logs.filter(l => l.safetyConcernsNoted).length;

  const inputCls = 'w-full bg-surface-container-lowest rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20';
  const labelCls = 'text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 block';

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-surface overflow-hidden font-body">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex items-center justify-between px-6 py-3 bg-surface-container-lowest border-b border-outline-variant/20 flex-shrink-0 h-16">
          <div className="flex items-center gap-3 ml-auto">
            <UserAvatar />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">

          {/* Page title */}
          <div className="mb-6">
            <h1 className="font-manrope text-2xl font-extrabold text-on-surface tracking-tight">Home Visitation</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Schedule visits, log outcomes, and review field history.</p>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-surface-container-low rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-[18px]">home_pin</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Upcoming Visits</p>
                <p className="font-manrope text-xl font-extrabold text-primary">{loading ? '—' : upcomingVisits.length}</p>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-secondary text-[18px]">task_alt</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Follow-Ups Needed</p>
                <p className="font-manrope text-xl font-extrabold text-primary">{loading ? '—' : followUpCount}</p>
              </div>
            </div>
            <div className={`rounded-xl p-4 flex items-center gap-3 ${safetyCount > 0 ? 'bg-error/10' : 'bg-surface-container-low'}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${safetyCount > 0 ? 'bg-error/20' : 'bg-surface-container-high'}`}>
                <span className={`material-symbols-outlined text-[18px] ${safetyCount > 0 ? 'text-error' : 'text-on-surface-variant'}`}>warning</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Safety Flags</p>
                <p className={`font-manrope text-xl font-extrabold ${safetyCount > 0 ? 'text-error' : 'text-primary'}`}>{logsLoading ? '—' : safetyCount}</p>
              </div>
            </div>
          </div>

          {/* Two-column: Upcoming + Log form */}
          <div className="grid grid-cols-2 gap-6 mb-6">

            {/* Upcoming visits */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
                <h2 className="font-bold text-on-surface text-sm">Scheduled Visits</h2>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wide">Upcoming</span>
              </div>
              <div className="divide-y divide-outline-variant/10 max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="p-5 space-y-3">
                    <div className="animate-pulse bg-surface-container-high rounded-lg h-16" />
                    <div className="animate-pulse bg-surface-container-high rounded-lg h-16" />
                  </div>
                ) : upcomingVisits.length === 0 ? (
                  <p className="text-sm text-on-surface-variant text-center py-10">No upcoming visits scheduled.</p>
                ) : (
                  upcomingVisits.map(visit => {
                    const d = new Date(visit.visitDate);
                    return (
                      <div key={visit.visitationId} className="px-5 py-3.5 flex items-start gap-4 hover:bg-surface-container-low/50 transition-colors">
                        <div className="flex-shrink-0 w-10 text-center">
                          <p className="font-manrope font-extrabold text-primary text-base leading-none">{isNaN(d.getTime()) ? '—' : d.getDate()}</p>
                          <p className="text-[9px] font-bold text-on-surface-variant uppercase">{isNaN(d.getTime()) ? '' : d.toLocaleString('en-US', { month: 'short' })}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-bold text-on-surface truncate">{visit.residentCaseNo}</p>
                            {visit.followUpNeeded && (
                              <span className="text-[9px] font-bold bg-secondary/10 text-secondary px-1.5 py-0.5 rounded uppercase">Follow-up</span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant">{visit.visitType}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {visit.locationVisited && (
                              <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">location_on</span>
                                {visit.locationVisited}
                              </span>
                            )}
                            <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">person</span>
                              {visit.socialWorker}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Log a Visit form */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5">
                <button
                  onClick={() => { setShowScheduleForm(true); setScheduleError(null); }}
                  className="w-full mb-4 py-3 border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant text-sm font-semibold hover:bg-surface-container transition-colors"
                >
                  + Schedule New Visit
                </button>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Resident</label>
                    <select value={form.residentId} onChange={e => setForm(f => ({ ...f, residentId: e.target.value }))} className={inputCls} required>
                      <option value="">Select resident…</option>
                      {residents.map(r => <option key={r.residentId} value={r.residentId}>{r.caseControlNo}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Social Worker</label>
                    <input
                      list="sw-list"
                      className={inputCls}
                      placeholder="e.g. SW-04"
                      value={form.socialWorker}
                      onChange={e => setForm(f => ({ ...f, socialWorker: e.target.value }))}
                    />
                    <datalist id="sw-list">
                      {socialWorkers.map(sw => <option key={sw} value={sw} />)}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Visit Type</label>
                    <select value={form.visitType} onChange={e => setForm(f => ({ ...f, visitType: e.target.value }))} className={inputCls} required>
                      <option value="">Select type…</option>
                      {VISIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Location</label>
                    <input className={inputCls} placeholder="e.g. Family home" value={form.locationVisited} onChange={e => setForm(f => ({ ...f, locationVisited: e.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Purpose</label>
                    <input className={inputCls} placeholder="Purpose of visit" value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Family Members Present</label>
                    <input className={inputCls} placeholder="e.g. Mother, sibling" value={form.familyMembersPresent} onChange={e => setForm(f => ({ ...f, familyMembersPresent: e.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Family Cooperation</label>
                    <select value={form.familyCooperationLevel} onChange={e => setForm(f => ({ ...f, familyCooperationLevel: e.target.value }))} className={inputCls}>
                      {COOPERATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Visit Outcome</label>
                    <input className={inputCls} placeholder="e.g. Successful" value={form.visitOutcome} onChange={e => setForm(f => ({ ...f, visitOutcome: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Observations</label>
                  <textarea className={inputCls} placeholder="Key observations…" rows={2} value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} />
                </div>

                <div className="flex gap-6 pt-1">
                  <Toggle checked={form.followUpNeeded} onChange={v => setForm(f => ({ ...f, followUpNeeded: v }))} label="Follow-up needed" />
                  <Toggle checked={form.safetyConcernsNoted} onChange={v => setForm(f => ({ ...f, safetyConcernsNoted: v }))} label="Safety concerns" />
                </div>

                {form.followUpNeeded && (
                  <div>
                    <label className={labelCls}>Follow-up Notes</label>
                    <textarea className={inputCls} placeholder="Describe required follow-up…" rows={2} value={form.followUpNotes} onChange={e => setForm(f => ({ ...f, followUpNotes: e.target.value }))} />
                  </div>
                )}

                {submitSuccess && (
                  <p className="text-xs text-secondary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Visit logged successfully.
                  </p>
                )}

                <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50" style={{ backgroundColor: '#00696b' }}>
                  {submitting ? 'Submitting…' : 'Submit Log'}
                </button>
              </form>
            </div>
          </div>

          {/* Historical logs table */}
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
              <h2 className="font-bold text-on-surface text-sm">Visit History</h2>
              <span className="text-xs text-on-surface-variant">{totalLogs} total records</span>
            </div>

            {logsLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="animate-pulse bg-surface-container-high rounded-lg h-10" />)}
              </div>
            ) : filteredLogs.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-12">
                {search ? 'No results match your search.' : 'No visit history recorded yet.'}
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-outline-variant/20">
                        {['Date', 'Resident', 'Social Worker', 'Type', 'Location', 'Purpose', 'Outcome', 'Cooperation', 'Flags', ''].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log, i) => (
                        <tr key={log.visitationId} className={`border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors ${i % 2 !== 0 ? 'bg-surface-container-lowest/40' : ''}`}>
                          <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap text-xs">{fmtDate(log.visitDate)}</td>
                          <td className="px-4 py-3 font-medium text-on-surface">{log.residentCaseNo}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{log.socialWorker || '—'}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{log.visitType}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{log.locationVisited || '—'}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{log.purpose || '—'}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{log.visitOutcome || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              log.familyCooperationLevel === 'Cooperative' ? 'bg-secondary/10 text-secondary'
                              : log.familyCooperationLevel === 'Uncooperative' ? 'bg-error/10 text-error'
                              : 'bg-surface-container-high text-on-surface-variant'
                            }`}>
                              {log.familyCooperationLevel || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {log.followUpNeeded && <span title="Follow-up needed" className="material-symbols-outlined text-secondary text-[16px]">task_alt</span>}
                              {log.safetyConcernsNoted && <span title="Safety concern flagged" className="material-symbols-outlined text-error text-[16px]">warning</span>}
                              {!log.followUpNeeded && !log.safetyConcernsNoted && <span className="text-xs text-on-surface-variant">—</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => openLog(log)} title="View / Edit" className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors">
                              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-outline-variant/20">
                    <p className="text-xs text-on-surface-variant">
                      Page {currentPage} of {totalPages} &nbsp;·&nbsp; {totalLogs} records
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                      </button>
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        const p = totalPages <= 7 ? i + 1 : currentPage <= 4 ? i + 1 : currentPage >= totalPages - 3 ? totalPages - 6 + i : currentPage - 3 + i;
                        return (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${p === currentPage ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                          >
                            {p}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
      {/* Schedule New Visit modal */}
      {showScheduleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20">
              <h2 className="text-base font-manrope font-bold text-on-surface">Schedule New Visit</h2>
              <button onClick={() => setShowScheduleForm(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Resident *</label>
                <select
                  required
                  value={scheduleForm.residentId}
                  onChange={e => setScheduleForm(f => ({ ...f, residentId: e.target.value }))}
                  className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select a case…</option>
                  {residents.map(r => <option key={r.residentId} value={r.residentId}>{r.caseControlNo}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Visit Date *</label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.visitDate}
                    onChange={e => setScheduleForm(f => ({ ...f, visitDate: e.target.value }))}
                    className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Visit Type *</label>
                  <select
                    required
                    value={scheduleForm.visitType}
                    onChange={e => setScheduleForm(f => ({ ...f, visitType: e.target.value }))}
                    className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select…</option>
                    {VISIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Social Worker *</label>
                <select
                  required
                  value={scheduleForm.socialWorker}
                  onChange={e => setScheduleForm(f => ({ ...f, socialWorker: e.target.value }))}
                  className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select…</option>
                  {socialWorkers.map(sw => <option key={sw} value={sw}>{sw}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Family Home, Community Center…"
                  value={scheduleForm.locationVisited}
                  onChange={e => setScheduleForm(f => ({ ...f, locationVisited: e.target.value }))}
                  className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {scheduleError && <p className="text-xs text-error">{scheduleError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleForm(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white aurora-gradient hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {scheduling ? 'Scheduling…' : 'Schedule Visit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete log confirmation modal */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20">
              <h2 className="text-base font-manrope font-bold text-on-surface">Delete Visit Log</h2>
              <button onClick={() => setLogToDelete(null)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <form onSubmit={handleSaveLog} className="space-y-4">

                <div>
                  <label className={labelCls}>Social Worker</label>
                  <input
                    list="sw-list-edit"
                    className={inputCls}
                    value={editForm.socialWorker ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, socialWorker: e.target.value }))}
                  />
                  <datalist id="sw-list-edit">
                    {socialWorkers.map(sw => <option key={sw} value={sw} />)}
                  </datalist>
                </div>

                <div>
                  <label className={labelCls}>Visit Type</label>
                  <select className={inputCls} value={editForm.visitType ?? ''} onChange={e => setEditForm(f => ({ ...f, visitType: e.target.value }))}>
                    {VISIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Location</label>
                  <input className={inputCls} value={editForm.locationVisited ?? ''} onChange={e => setEditForm(f => ({ ...f, locationVisited: e.target.value }))} />
                </div>

                <div>
                  <label className={labelCls}>Purpose</label>
                  <input className={inputCls} value={editForm.purpose ?? ''} onChange={e => setEditForm(f => ({ ...f, purpose: e.target.value }))} />
                </div>

                <div>
                  <label className={labelCls}>Family Members Present</label>
                  <input className={inputCls} placeholder="e.g. Mother, sibling" value={editForm.familyMembersPresent ?? ''} onChange={e => setEditForm(f => ({ ...f, familyMembersPresent: e.target.value }))} />
                </div>

                <div>
                  <label className={labelCls}>Family Cooperation</label>
                  <select className={inputCls} value={editForm.familyCooperationLevel ?? 'Neutral'} onChange={e => setEditForm(f => ({ ...f, familyCooperationLevel: e.target.value }))}>
                    {COOPERATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Visit Outcome</label>
                  <input className={inputCls} value={editForm.visitOutcome ?? ''} onChange={e => setEditForm(f => ({ ...f, visitOutcome: e.target.value }))} />
                </div>

                <div>
                  <label className={labelCls}>Observations</label>
                  <textarea className={inputCls} rows={3} value={editForm.observations ?? ''} onChange={e => setEditForm(f => ({ ...f, observations: e.target.value }))} />
                </div>

                <div className="flex flex-col gap-3 pt-1">
                  <Toggle checked={editForm.followUpNeeded ?? false} onChange={v => setEditForm(f => ({ ...f, followUpNeeded: v }))} label="Follow-up needed" />
                  <Toggle checked={editForm.safetyConcernsNoted ?? false} onChange={v => setEditForm(f => ({ ...f, safetyConcernsNoted: v }))} label="Safety concerns noted" />
                </div>

                {(editForm.followUpNeeded) && (
                  <div>
                    <label className={labelCls}>Follow-up Notes</label>
                    <textarea className={inputCls} rows={2} value={editForm.followUpNotes ?? ''} onChange={e => setEditForm(f => ({ ...f, followUpNotes: e.target.value }))} />
                  </div>
                )}

                {saveError && <p className="text-xs text-error">{saveError}</p>}
                {saveSuccess && (
                  <p className="text-xs text-secondary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Changes saved.
                  </p>
                )}

                <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50" style={{ backgroundColor: '#00696b' }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
