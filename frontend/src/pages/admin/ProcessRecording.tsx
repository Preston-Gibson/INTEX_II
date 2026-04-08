import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { authHeaders } from '../../utils/auth';

const API = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/process-recordings`;

// ── Types ─────────────────────────────────────────────────────────────────────

interface ResidentOption {
  residentId: number;
  caseControlNo: string;
  internalCode: string;
  assignedSocialWorker: string;
  caseStatus: string;
  safehouseName: string;
}

interface Recording {
  recordingId: number;
  residentId: number;
  sessionDate: string;
  socialWorker: string;
  sessionType: string;
  sessionDurationMinutes: number;
  emotionalStateObserved: string;
  emotionalStateEnd: string;
  sessionNarrative: string;
  interventionsApplied: string;
  followUpActions: string;
  progressNoted: boolean;
  concernsFlagged: boolean;
  referralMade: boolean;
}

const EMPTY_FORM = {
  sessionDate: new Date().toISOString().slice(0, 10),
  socialWorker: '',
  sessionType: 'Individual',
  sessionDurationMinutes: 60,
  emotionalStateObserved: '',
  emotionalStateEnd: '',
  sessionNarrative: '',
  interventionsApplied: '',
  followUpActions: '',
  progressNoted: false,
  concernsFlagged: false,
  referralMade: false,
};

const inputCls = 'w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20';
const textareaCls = `${inputCls} resize-none`;
const labelCls = 'text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 block';

const STATUS_BADGE: Record<string, string> = {
  Active:      'bg-secondary/10 text-secondary',
  Closed:      'bg-surface-container-high text-on-surface-variant',
  Transferred: 'bg-tertiary-fixed text-on-surface',
};

const EMOTIONAL_STATES = [
  'Calm', 'Anxious', 'Sad', 'Angry', 'Hopeful', 'Withdrawn',
  'Engaged', 'Distressed', 'Neutral', 'Tearful', 'Playful', 'Guarded',
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProcessRecording() {
  const [residents, setResidents] = useState<ResidentOption[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ResidentOption | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [recordingToDelete, setRecordingToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load residents
  useEffect(() => {
    fetch(`${API}/residents?search=${encodeURIComponent(search)}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(setResidents)
      .catch(() => {});
  }, [search]);

  // Load recordings when resident selected
  useEffect(() => {
    if (!selected) { setRecordings([]); return; }
    setLoadingRecordings(true);
    fetch(`${API}?residentId=${selected.residentId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { setRecordings(data); setLoadingRecordings(false); })
      .catch(() => setLoadingRecordings(false));
  }, [selected]);

  function handleSelect(r: ResidentOption) {
    setSelected(r);
    setShowForm(false);
    setExpandedId(null);
  }

  function handleFormChange(field: string, value: string | number | boolean) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ ...form, residentId: selected.residentId }),
      });
      if (!res.ok) throw new Error('Failed to save');
      // Reload recordings
      const updated = await fetch(`${API}?residentId=${selected.residentId}`, { headers: authHeaders() }).then(r => r.json());
      setRecordings(updated);
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch {
      setSubmitError('Failed to save recording. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (recordingToDelete === null) return;
    setDeleting(true);
    await fetch(`${API}/${recordingToDelete}`, { method: 'DELETE', headers: authHeaders() });
    setRecordings(r => r.filter(x => x.recordingId !== recordingToDelete));
    setRecordingToDelete(null);
    setDeleting(false);
  }

  return (
    <div className="flex h-screen bg-surface overflow-hidden font-body">

      <AdminSidebar />

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="flex items-center gap-4 px-6 py-3 bg-surface-container-lowest border-b border-outline-variant/20 flex-shrink-0">
          <div className="flex items-center gap-2 bg-surface-container-low rounded-xl px-3 py-2 flex-1 max-w-xs">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
            <input
              className="bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant outline-none w-full"
              placeholder="Search by case no. or social worker…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <p className="flex-1 text-center text-sm font-bold text-on-surface">Process Recording — Session Documentation</p>
          <div className="flex items-center gap-3 flex-1 justify-end">
            {selected && (
              <button
                onClick={() => { setShowForm(true); setForm(EMPTY_FORM); }}
                className="flex items-center gap-2 aurora-gradient text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                New Recording
              </button>
            )}
          </div>
        </header>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Resident List ── */}
          <div className="w-72 flex-shrink-0 flex flex-col border-r border-outline-variant/20 bg-surface-container-lowest overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant/20">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Residents</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{residents.length} found</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {residents.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-8">No residents found</p>
              ) : residents.map(r => (
                <button
                  key={r.residentId}
                  onClick={() => handleSelect(r)}
                  className={`w-full text-left px-4 py-3 transition-colors border-b border-outline-variant/10 ${
                    selected?.residentId === r.residentId
                      ? 'bg-primary/10 border-l-2 border-l-primary'
                      : 'hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-bold text-on-surface">{r.caseControlNo}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[r.caseStatus] ?? 'bg-surface-container text-on-surface-variant'}`}>
                      {r.caseStatus}
                    </span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant">{r.safehouseName}</p>
                  <p className="text-[10px] text-on-surface-variant">{r.assignedSocialWorker}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Right Panel ── */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 p-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
                </div>
                <p className="font-manrope font-bold text-on-surface">Select a Resident</p>
                <p className="text-sm text-on-surface-variant max-w-xs">Choose a resident from the list to view their session history or add a new process recording.</p>
              </div>
            ) : (
              <div className="flex flex-1 overflow-hidden">

                {/* Recording history */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between flex-shrink-0">
                    <div>
                      <p className="font-manrope font-bold text-on-surface">{selected.caseControlNo}</p>
                      <p className="text-xs text-on-surface-variant">{selected.safehouseName} · {selected.assignedSocialWorker}</p>
                    </div>
                    <p className="text-xs text-on-surface-variant">{recordings.length} recording{recordings.length !== 1 ? 's' : ''}</p>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                    {loadingRecordings ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="w-6 h-6 rounded-full aurora-gradient animate-spin opacity-80" />
                      </div>
                    ) : recordings.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
                        <span className="material-symbols-outlined text-on-surface-variant text-[32px]">history_edu</span>
                        <p className="text-sm text-on-surface-variant">No recordings yet for this resident.</p>
                      </div>
                    ) : recordings.map(rec => (
                      <div key={rec.recordingId} className="bg-surface-container-low rounded-2xl overflow-hidden">
                        {/* Summary row */}
                        <button
                          className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-surface-container transition-colors"
                          onClick={() => setExpandedId(expandedId === rec.recordingId ? null : rec.recordingId)}
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              {rec.sessionType === 'Group' ? 'groups' : 'person'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-on-surface">{formatDate(rec.sessionDate)}</p>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{rec.sessionType}</span>
                              {rec.concernsFlagged && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-error/10 text-error">Concern Flagged</span>}
                              {rec.progressNoted && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">Progress Noted</span>}
                              {rec.referralMade && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-surface">Referral Made</span>}
                            </div>
                            <p className="text-xs text-on-surface-variant mt-0.5">{rec.socialWorker} · {rec.sessionDurationMinutes} min</p>
                          </div>
                          <span className="material-symbols-outlined text-on-surface-variant text-[18px] flex-shrink-0">
                            {expandedId === rec.recordingId ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>

                        {/* Expanded detail */}
                        {expandedId === rec.recordingId && (
                          <div className="px-5 pb-5 space-y-4 border-t border-outline-variant/10">
                            <div className="grid grid-cols-2 gap-4 pt-4">
                              <div>
                                <p className={labelCls}>Emotional State (Start)</p>
                                <p className="text-sm text-on-surface">{rec.emotionalStateObserved || '—'}</p>
                              </div>
                              <div>
                                <p className={labelCls}>Emotional State (End)</p>
                                <p className="text-sm text-on-surface">{rec.emotionalStateEnd || '—'}</p>
                              </div>
                            </div>
                            <div>
                              <p className={labelCls}>Session Narrative</p>
                              <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{rec.sessionNarrative || '—'}</p>
                            </div>
                            <div>
                              <p className={labelCls}>Interventions Applied</p>
                              <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{rec.interventionsApplied || '—'}</p>
                            </div>
                            <div>
                              <p className={labelCls}>Follow-Up Actions</p>
                              <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{rec.followUpActions || '—'}</p>
                            </div>
                            <div className="flex justify-end">
                              <button onClick={() => setRecordingToDelete(rec.recordingId)} className="text-xs text-error hover:underline flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── New Recording Form (slide-in panel) ── */}
                {showForm && (
                  <div className="w-96 flex-shrink-0 flex flex-col border-l border-outline-variant/20 bg-surface-container-lowest overflow-hidden">
                    <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between flex-shrink-0">
                      <div>
                        <p className="font-manrope font-bold text-on-surface text-sm">New Recording</p>
                        <p className="text-[10px] text-on-surface-variant">{selected.caseControlNo}</p>
                      </div>
                      <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors">
                        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">close</span>
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Session Date</label>
                          <input type="date" required className={inputCls} value={form.sessionDate}
                            onChange={e => handleFormChange('sessionDate', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Duration (min)</label>
                          <input type="number" min={1} className={inputCls} value={form.sessionDurationMinutes}
                            onChange={e => handleFormChange('sessionDurationMinutes', parseInt(e.target.value) || 0)} />
                        </div>
                      </div>

                      <div>
                        <label className={labelCls}>Social Worker</label>
                        <input required className={inputCls} placeholder="Full name" value={form.socialWorker}
                          onChange={e => handleFormChange('socialWorker', e.target.value)} />
                      </div>

                      <div>
                        <label className={labelCls}>Session Type</label>
                        <div className="flex gap-2">
                          {['Individual', 'Group'].map(t => (
                            <button type="button" key={t}
                              onClick={() => handleFormChange('sessionType', t)}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${form.sessionType === t ? 'aurora-gradient text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Emotional State (Start)</label>
                          <select className={inputCls} value={form.emotionalStateObserved}
                            onChange={e => handleFormChange('emotionalStateObserved', e.target.value)}>
                            <option value="">Select…</option>
                            {EMOTIONAL_STATES.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Emotional State (End)</label>
                          <select className={inputCls} value={form.emotionalStateEnd}
                            onChange={e => handleFormChange('emotionalStateEnd', e.target.value)}>
                            <option value="">Select…</option>
                            {EMOTIONAL_STATES.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className={labelCls}>Session Narrative</label>
                        <textarea required rows={4} className={textareaCls} placeholder="Summary of the session…"
                          value={form.sessionNarrative}
                          onChange={e => handleFormChange('sessionNarrative', e.target.value)} />
                      </div>

                      <div>
                        <label className={labelCls}>Interventions Applied</label>
                        <textarea rows={3} className={textareaCls} placeholder="Techniques, approaches used…"
                          value={form.interventionsApplied}
                          onChange={e => handleFormChange('interventionsApplied', e.target.value)} />
                      </div>

                      <div>
                        <label className={labelCls}>Follow-Up Actions</label>
                        <textarea rows={3} className={textareaCls} placeholder="Next steps, tasks assigned…"
                          value={form.followUpActions}
                          onChange={e => handleFormChange('followUpActions', e.target.value)} />
                      </div>

                      <div className="space-y-2">
                        <p className={labelCls}>Flags</p>
                        {[
                          { key: 'progressNoted', label: 'Progress Noted', color: 'text-secondary' },
                          { key: 'concernsFlagged', label: 'Concern Flagged', color: 'text-error' },
                          { key: 'referralMade', label: 'Referral Made', color: 'text-primary' },
                        ].map(({ key, label, color }) => (
                          <label key={key} className="flex items-center gap-3 cursor-pointer">
                            <div
                              onClick={() => handleFormChange(key, !form[key as keyof typeof form])}
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer ${
                                form[key as keyof typeof form] ? 'bg-primary border-primary' : 'border-outline-variant bg-surface-container-low'
                              }`}>
                              {form[key as keyof typeof form] && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                            </div>
                            <span className={`text-xs font-semibold ${color}`}>{label}</span>
                          </label>
                        ))}
                      </div>

                      {submitError && <p className="text-xs text-error">{submitError}</p>}

                      <div className="flex gap-2 pt-2 pb-4">
                        <button type="button" onClick={() => setShowForm(false)}
                          className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors">
                          Cancel
                        </button>
                        <button type="submit" disabled={submitting}
                          className="flex-1 py-2.5 rounded-xl text-xs font-bold aurora-gradient text-white hover:opacity-90 transition-opacity disabled:opacity-50">
                          {submitting ? 'Saving…' : 'Save Recording'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {recordingToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20">
              <h2 className="text-base font-manrope font-bold text-on-surface">Delete Recording</h2>
              <button onClick={() => setRecordingToDelete(null)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-on-surface mb-1">Are you sure you want to delete this session recording?</p>
              <p className="text-sm text-on-surface-variant">This action cannot be undone.</p>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setRecordingToDelete(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-error hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
