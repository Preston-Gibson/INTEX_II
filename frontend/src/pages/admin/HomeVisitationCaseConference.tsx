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
  observations: string;
  followUpNeeded: boolean;
  visitOutcome: string;
  familyCooperationLevel: string;
  safetyConcernsNoted: boolean;
}

interface ResidentOption {
  residentId: number;
  caseControlNo: string;
}

const CASE_CONFERENCES = [
  {
    id: 1,
    day: '24',
    month: 'Oct',
    title: 'Advocacy Strategy: Sofia Mendez',
    priority: true,
    description: 'Objective: Reviewing legal status and family reintegration possibilities.',
    lead: 'Dr. Arriaga',
    room: 'Conf. Room B',
    action: 'join',
  },
  {
    id: 2,
    day: '26',
    month: 'Oct',
    title: 'Monthly Caseload Review',
    priority: false,
    description: 'General status updates for all current active cases in Santa Rosa.',
    attendees: 'All Staff (12 attendees)',
    action: 'agenda',
  },
];

const VISIT_TYPES = [
  'Initial Assessment',
  'Routine Follow-Up',
  'Reintegration Assessment',
  'Post-Placement Monitoring',
  'Emergency',
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomeVisitationCaseConference() {
  const [upcomingVisits, setUpcomingVisits] = useState<UpcomingVisit[]>([]);
  const [historicalLogs, setHistoricalLogs] = useState<HistoricalLog[]>([]);
  const [residents, setResidents] = useState<ResidentOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedResident, setSelectedResident] = useState('');
  const [visitType, setVisitType] = useState('');
  const [visitSummary, setVisitSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [logToDelete, setLogToDelete] = useState<HistoricalLog | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      fetch(`${API}/historical-logs`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/residents`, { headers: authHeaders() }).then(r => r.json()),
    ]).then(([u, h, r]) => {
      setUpcomingVisits(u);
      setHistoricalLogs(h);
      setResidents(r);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

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

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedResident || !visitType) return;
    setSubmitting(true);
    await fetch(`${API}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        residentId: parseInt(selectedResident),
        visitType,
        observations: visitSummary,
        familyCooperationLevel: 'Neutral',
        safetyConcernsNoted: false,
        followUpNeeded: false,
        followUpNotes: '',
        locationVisited: '',
      }),
    });
    setSelectedResident('');
    setVisitType('');
    setVisitSummary('');
    setSubmitting(false);
    setLoading(true);
    loadData();
  }

  return (
    <div className="flex h-screen bg-surface overflow-hidden font-body">
      <AdminSidebar />

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex items-center justify-between px-6 py-3 bg-surface-container-lowest border-b border-outline-variant/20 flex-shrink-0 h-16">
          <div className="flex items-center gap-2 bg-surface-container-low rounded-xl px-3 py-2 w-64">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
            <input
              className="bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant outline-none w-full"
              placeholder="Search visits..."
            />
          </div>
          <div className="flex items-center gap-3">
            <UserAvatar />
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6 lg:px-12">
          <header className="mb-10">
            <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2 font-manrope">
              Visitations &amp; Conferences
            </h1>
            <p className="text-on-surface-variant font-body">
              Managing social work interventions and advocacy for residents in Santa Rosa de Copán.
            </p>
          </header>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left column */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Scheduled Visits */}
              <section className="bg-surface-container-low rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-manrope font-bold text-lg text-primary">Scheduled Visits</h2>
                  <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full text-xs font-bold">Upcoming</span>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    <>
                      <div className="animate-pulse bg-surface-container-high rounded-xl h-24" />
                      <div className="animate-pulse bg-surface-container-high rounded-xl h-24" />
                    </>
                  ) : upcomingVisits.length === 0 ? (
                    <p className="text-sm text-on-surface-variant text-center py-4">No upcoming visits scheduled.</p>
                  ) : (
                    upcomingVisits.map((visit, i) => (
                      <div
                        key={visit.visitationId}
                        className={`bg-surface-container-lowest p-4 rounded-xl shadow-sm border-l-4 ${i % 2 === 0 ? 'border-primary' : 'border-secondary'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-xs font-bold uppercase tracking-wider ${i % 2 === 0 ? 'text-primary' : 'text-secondary'}`}>
                            {visit.visitDate} • {visit.visitType}
                          </span>
                          <span className="material-symbols-outlined text-outline text-sm">more_vert</span>
                        </div>
                        <h3 className="font-manrope font-bold text-on-surface">{visit.residentCaseNo}</h3>
                        <p className="text-xs text-on-surface-variant mb-3">{visit.locationVisited}</p>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-outline">person</span>
                          <span className="text-[10px] font-medium text-outline">{visit.socialWorker}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => { setShowScheduleForm(true); setScheduleError(null); }}
                  className="w-full mt-6 py-3 border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant text-sm font-semibold hover:bg-surface-container transition-colors"
                >
                  + Schedule New Visit
                </button>
              </section>

              {/* Log Outcome */}
              <section className="bg-surface-container-low rounded-xl p-6 shadow-sm">
                <h2 className="font-manrope font-bold text-lg text-primary mb-6">Log Outcome</h2>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-tight">
                      Select Resident
                    </label>
                    <select
                      value={selectedResident}
                      onChange={(e) => setSelectedResident(e.target.value)}
                      className="w-full bg-surface-container-lowest border-0 rounded-xl focus:ring-2 focus:ring-primary py-3 px-4 text-sm text-on-surface"
                      required
                    >
                      <option value="">Select a case...</option>
                      {residents.map((r) => (
                        <option key={r.residentId} value={r.residentId}>{r.caseControlNo}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-tight">
                      Visit Type
                    </label>
                    <select
                      value={visitType}
                      onChange={(e) => setVisitType(e.target.value)}
                      className="w-full bg-surface-container-lowest border-0 rounded-xl focus:ring-2 focus:ring-primary py-3 px-4 text-sm text-on-surface"
                      required
                    >
                      <option value="">Select visit type...</option>
                      {VISIT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-tight">
                      Visit Summary
                    </label>
                    <textarea
                      value={visitSummary}
                      onChange={(e) => setVisitSummary(e.target.value)}
                      className="w-full bg-surface-container-lowest border-0 rounded-xl focus:ring-2 focus:ring-primary py-3 px-4 text-sm"
                      placeholder="Key observations..."
                      rows={3}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Log'}
                  </button>
                </form>
              </section>
            </div>

            {/* Right column */}
            <div className="lg:col-span-8 space-y-8">
              {/* Case Conferences */}
              <section className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-primary p-6 flex justify-between items-center">
                  <div>
                    <h2 className="font-manrope font-bold text-xl text-white">Upcoming Case Conferences</h2>
                    <p className="text-blue-200 text-sm">Multidisciplinary team reviews</p>
                  </div>
                  <span className="material-symbols-outlined text-white text-3xl">groups</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {CASE_CONFERENCES.map((conf) => (
                    <div key={conf.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center gap-6">
                      <div className="flex-shrink-0 text-center bg-slate-50 p-4 rounded-xl min-w-[100px]">
                        <span className="block text-2xl font-bold text-primary">{conf.day}</span>
                        <span className="text-xs font-bold text-on-surface-variant uppercase">{conf.month}</span>
                      </div>

                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-manrope font-extrabold text-lg">{conf.title}</h3>
                          {conf.priority && (
                            <span className="bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold">PRIORITY</span>
                          )}
                        </div>
                        <p className="text-sm text-on-surface-variant mb-3">{conf.description}</p>
                        <div className="flex flex-wrap gap-4">
                          {'lead' in conf && conf.lead && (
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm text-secondary">person</span>
                              <span className="text-xs font-medium text-on-surface-variant">Lead: {conf.lead}</span>
                            </div>
                          )}
                          {'room' in conf && conf.room && (
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm text-secondary">meeting_room</span>
                              <span className="text-xs font-medium text-on-surface-variant">{conf.room}</span>
                            </div>
                          )}
                          {'attendees' in conf && conf.attendees && (
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm text-secondary">diversity_3</span>
                              <span className="text-xs font-medium text-on-surface-variant">{conf.attendees}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {conf.action === 'join' ? (
                        <button className="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-lg font-bold text-xs flex-shrink-0">
                          Join Link
                        </button>
                      ) : (
                        <button className="text-primary font-bold text-xs hover:underline flex-shrink-0">
                          View Agenda
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Historical Logs */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-manrope font-bold text-2xl text-on-surface">Historical Visit Logs</h2>
                  <div className="flex gap-2">
                    <button className="p-2 bg-surface-container-high rounded-lg">
                      <span className="material-symbols-outlined text-sm">filter_list</span>
                    </button>
                    <button className="p-2 bg-surface-container-high rounded-lg">
                      <span className="material-symbols-outlined text-sm">download</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loading ? (
                    <>
                      <div className="animate-pulse bg-surface-container-high rounded-xl h-40" />
                      <div className="animate-pulse bg-surface-container-high rounded-xl h-40" />
                      <div className="animate-pulse bg-surface-container-high rounded-xl h-40" />
                      <div className="animate-pulse bg-surface-container-high rounded-xl h-40" />
                    </>
                  ) : historicalLogs.length === 0 ? (
                    <p className="text-sm text-on-surface-variant col-span-2 text-center py-8">No historical logs found.</p>
                  ) : (
                    historicalLogs.map((log) => {
                      const isFollowUp = log.followUpNeeded;
                      return (
                        <div
                          key={log.visitationId}
                          className={`bg-surface-container-low rounded-xl p-5 border-t-2 ${isFollowUp ? 'border-tertiary-fixed' : 'border-secondary-fixed'}`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${isFollowUp ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' : 'bg-secondary-fixed text-on-secondary-fixed-variant'}`}>
                              {isFollowUp ? 'FOLLOW-UP REQ' : 'COMPLETED'}
                            </div>
                            <span className="text-xs text-on-surface-variant">{log.visitDate}</span>
                          </div>
                          <h4 className="font-manrope font-bold text-base mb-1">{log.visitType}</h4>
                          <p className="text-xs text-on-surface-variant mb-1">{log.residentCaseNo} • {log.locationVisited}</p>
                          <p className="text-sm text-on-surface-variant line-clamp-3 mb-4">
                            {log.observations || 'No observations recorded.'}
                          </p>
                          {log.safetyConcernsNoted && (
                            <div className="flex items-center gap-1 mb-3">
                              <span className="material-symbols-outlined text-error text-sm">warning</span>
                              <span className="text-[10px] font-bold text-error uppercase">Safety concern flagged</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center">
                                <span className="text-[9px] font-bold text-on-primary-container">
                                  {log.socialWorker.replace('SW-', '')}
                                </span>
                              </div>
                              <span className="text-xs font-medium">{log.socialWorker}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-medium ${log.familyCooperationLevel === 'Cooperative' ? 'text-secondary' : log.familyCooperationLevel === 'Uncooperative' ? 'text-error' : 'text-on-surface-variant'}`}>
                                {log.familyCooperationLevel}
                              </span>
                              <button
                                onClick={() => setLogToDelete(log)}
                                className="text-on-surface-variant hover:text-error transition-colors"
                                title="Delete log"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>
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
            <div className="px-6 py-5">
              <p className="text-sm text-on-surface mb-1">
                Delete the <strong>{logToDelete.visitType}</strong> log for case <strong>{logToDelete.residentCaseNo}</strong>?
              </p>
              <p className="text-sm text-on-surface-variant mb-4">This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setLogToDelete(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteLog}
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
