import { NavLink, Link, useNavigate } from 'react-router-dom';
import { clearToken } from '../utils/auth';

const NAV_ITEMS = [
  { to: '/admin-dashboard',                      icon: 'dashboard',          label: 'Dashboard' },
  { to: '/admin-caseload-inventory',             icon: 'folder_shared',      label: 'Caseload' },
  { to: '/admin-donors-contributions',           icon: 'volunteer_activism', label: 'Donors' },
  { to: '/admin-process-recording',              icon: 'history_edu',        label: 'Recordings' },
  { to: '/admin-home-visitation-case-conference',icon: 'home_pin',           label: 'Visits' },
  { to: '/admin-reports-analytics',              icon: 'analytics',          label: 'Analytics' },
];

export default function AdminSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-surface-container-lowest border-r border-outline-variant/20 py-6 px-4 relative z-10">
      <div className="mb-8 px-2">
        <p className="text-primary font-headline font-extrabold text-lg leading-tight">Lucera Admin</p>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin-dashboard'}
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
        onClick={() => navigate('/admin-caseload-inventory')}
        className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mb-2 shadow-sm"
        style={{ backgroundColor: '#ffba38', color: '#281900' }}
      >
        <span
          className="material-symbols-outlined text-[18px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          add_circle
        </span>
        New Case
      </button>

      <button
        onClick={() => { clearToken(); navigate('/login'); }}
        className="flex items-center justify-center gap-2 text-on-surface-variant text-xs font-semibold py-2 rounded-xl hover:bg-surface-container-low transition-colors w-full mb-1"
      >
        <span className="material-symbols-outlined text-[16px]">logout</span>
        Sign out
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
}
