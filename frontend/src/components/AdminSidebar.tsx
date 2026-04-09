import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/admin-dashboard',                      icon: 'dashboard',          label: 'Dashboard' },
  { to: '/admin-caseload-inventory',             icon: 'folder_shared',      label: 'Residents' },
  { to: '/admin-donors-contributions',           icon: 'volunteer_activism', label: 'Donors' },
  { to: '/admin-process-recording',              icon: 'history_edu',        label: 'Counseling' },
  { to: '/admin-home-visitation-case-conference',icon: 'home_pin',           label: 'Visits' },
  { to: '/admin-reports-analytics',             icon: 'analytics',          label: 'Analytics' },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const sidebarContent = (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-surface-container-lowest border-r border-outline-variant/20 py-6 px-4 relative z-10 h-full">
      <div className="mb-8 px-2 flex items-center justify-between">
        <p className="text-primary font-headline font-extrabold text-lg leading-tight">Lucera Admin</p>
        {/* Close button — only visible when drawer is open on mobile */}
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin-dashboard'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => { navigate('/admin-caseload-inventory'); setOpen(false); }}
        className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mb-2 shadow-sm"
        style={{ backgroundColor: '#ffba38', color: '#281900' }}
      >
        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          add_circle
        </span>
        New Case
      </button>

      <Link
        to="/"
        className="flex items-center justify-center gap-2 text-on-surface-variant text-xs font-semibold py-2 rounded-xl hover:bg-surface-container-low transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        Back to Home
      </Link>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <div className="hidden lg:flex h-full">
        {sidebarContent}
      </div>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 w-10 h-10 flex items-center justify-center bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-sm"
      >
        <span className="material-symbols-outlined text-on-surface-variant text-[22px]">menu</span>
      </button>

      {/* Mobile drawer overlay */}
      {open && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 flex">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
