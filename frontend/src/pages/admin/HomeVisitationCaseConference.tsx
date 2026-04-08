import { useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';

const SCHEDULED_VISITS = [
  {
    id: 1,
    timing: 'Tomorrow • 10:00 AM',
    timingColor: 'text-primary-container',
    borderColor: 'border-primary',
    family: 'Elena Garcia Family',
    community: 'Barrio El Centro',
    type: 'avatar',
  },
  {
    id: 2,
    timing: 'Wed • 2:30 PM',
    timingColor: 'text-secondary',
    borderColor: 'border-secondary',
    family: 'Mateo Ruiz',
    community: 'San Juan de Opoa',
    type: 'location',
  },
];

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

const VISIT_LOGS = [
  {
    id: 1,
    status: 'COMPLETED',
    statusBg: 'bg-secondary-fixed',
    statusText: 'text-on-secondary-fixed-variant',
    borderColor: 'border-secondary-fixed',
    date: 'Oct 12, 2024',
    title: 'Hernandez Family Home Visit',
    summary:
      'Mother is recovering well from surgery. Children are attending school regularly. Noted a need for food assistance due to crop failure...',
    worker: 'Lucia M.',
  },
  {
    id: 2,
    status: 'FOLLOW-UP REQ',
    statusBg: 'bg-tertiary-fixed',
    statusText: 'text-on-tertiary-fixed-variant',
    borderColor: 'border-tertiary-fixed',
    date: 'Oct 10, 2024',
    title: 'Rivera Housing Check',
    summary:
      'Significant structural damage noted in the living area. Family requires immediate consultation with community engineering team...',
    worker: 'David K.',
  },
];

const RESIDENT_OPTIONS = ['Elena Garcia', 'Mateo Ruiz', 'Sofia Mendez', 'Hernandez Family'];

export default function HomeVisitationCaseConference() {
  const [selectedResident, setSelectedResident] = useState('');
  const [visitSummary, setVisitSummary] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSelectedResident('');
    setVisitSummary('');
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
          <p className="text-sm font-bold text-on-surface font-manrope">Visitations &amp; Conferences</p>
          <div className="flex items-center gap-3">
            <button className="relative">
              <span className="material-symbols-outlined text-on-surface-variant text-[22px]">notifications</span>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-error rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                2
              </span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary">
              LA
            </div>
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
                  <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full text-xs font-bold">
                    This Week
                  </span>
                </div>

                <div className="space-y-4">
                  {SCHEDULED_VISITS.map((visit) => (
                    <div
                      key={visit.id}
                      className={`bg-surface-container-lowest p-4 rounded-xl shadow-sm border-l-4 ${visit.borderColor}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs font-bold ${visit.timingColor} uppercase tracking-wider`}>
                          {visit.timing}
                        </span>
                        {visit.type === 'avatar' && (
                          <span className="material-symbols-outlined text-outline text-sm">more_vert</span>
                        )}
                      </div>
                      <h3 className="font-manrope font-bold text-on-surface">{visit.family}</h3>
                      <p className="text-xs text-on-surface-variant mb-3">Community: {visit.community}</p>
                      {visit.type === 'avatar' ? (
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center border-2 border-surface-container-lowest">
                            <span className="text-[10px] font-bold text-on-primary-container">EG</span>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center border-2 border-surface-container-lowest">
                            <span className="text-[10px] font-bold text-on-secondary-container">+2</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-outline">location_on</span>
                          <span className="text-[10px] font-medium text-outline">In-Person Home Visit</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button className="w-full mt-6 py-3 border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant text-sm font-semibold hover:bg-white/50 transition-colors">
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
                    >
                      <option value="">Select a case...</option>
                      {RESIDENT_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
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
                    className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-all"
                  >
                    Submit Log
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
                    <div
                      key={conf.id}
                      className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center gap-6"
                    >
                      <div className="flex-shrink-0 text-center bg-slate-50 p-4 rounded-xl min-w-[100px]">
                        <span className="block text-2xl font-bold text-primary">{conf.day}</span>
                        <span className="text-xs font-bold text-on-surface-variant uppercase">{conf.month}</span>
                      </div>

                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-manrope font-extrabold text-lg">{conf.title}</h3>
                          {conf.priority && (
                            <span className="bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold">
                              PRIORITY
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-on-surface-variant mb-3">{conf.description}</p>
                        <div className="flex flex-wrap gap-4">
                          {conf.lead && (
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm text-secondary">person</span>
                              <span className="text-xs font-medium text-on-surface-variant">Lead: {conf.lead}</span>
                            </div>
                          )}
                          {conf.room && (
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm text-secondary">meeting_room</span>
                              <span className="text-xs font-medium text-on-surface-variant">{conf.room}</span>
                            </div>
                          )}
                          {conf.attendees && (
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
                  {VISIT_LOGS.map((log) => (
                    <div
                      key={log.id}
                      className={`bg-surface-container-low rounded-xl p-5 border-t-2 ${log.borderColor}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div
                          className={`text-[10px] font-bold ${log.statusText} ${log.statusBg} px-2 py-0.5 rounded`}
                        >
                          {log.status}
                        </div>
                        <span className="text-xs text-on-surface-variant">{log.date}</span>
                      </div>
                      <h4 className="font-manrope font-bold text-base mb-1">{log.title}</h4>
                      <p className="text-sm text-on-surface-variant line-clamp-3 mb-4">{log.summary}</p>
                      <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center">
                            <span className="text-[9px] font-bold text-on-primary-container">
                              {log.worker
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </span>
                          </div>
                          <span className="text-xs font-medium">{log.worker}</span>
                        </div>
                        <a href="#" className="text-primary text-xs font-bold flex items-center gap-1">
                          Full Report{' '}
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
