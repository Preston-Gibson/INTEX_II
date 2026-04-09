import { NavLink, useNavigate } from 'react-router-dom';
import { isAuthenticated, getRole, clearToken } from '../utils/auth';

const activeClass =
  'text-blue-700 dark:text-blue-300 border-b-2 border-blue-700 pb-1 transition-colors';
const inactiveClass =
  'text-slate-600 dark:text-slate-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors';

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? activeClass : inactiveClass;

export default function NavBar() {
  const navigate = useNavigate();
  const loggedIn = isAuthenticated();
  const dashboardPath = getRole() === 'Admin' ? '/admin-dashboard' : '/donor-dashboard';

  function handleLogout() {
    clearToken();
    navigate('/');
  }

  return (
    <nav className="fixed top-9 w-full z-[1001] bg-white/90 backdrop-blur-xl shadow-sm border-b border-slate-200/60">
      <div className="grid grid-cols-3 items-center max-w-7xl mx-auto px-6 h-20">
        <NavLink to="/" className="flex items-center">
          <img src="/logo.png" alt="Lucera" className="h-10 w-auto object-contain" />
        </NavLink>

        <div className="hidden md:flex justify-center items-center gap-8 font-manrope text-sm font-semibold tracking-tight">
          {/* Publicly Accessible Pages */}
          <NavLink to="/" end className={navClass}>Our Mission</NavLink>
          <NavLink to="/impact" className={navClass}>Impact</NavLink>
        </div>

        <div className="flex items-center justify-end gap-3 w-[260px]">
          <NavLink
            to={loggedIn ? dashboardPath : '/login'}
            className="px-5 py-2.5 aurora-gradient text-white text-sm font-bold rounded-xl transition-all active:scale-95 duration-150 ease-in-out whitespace-nowrap"
          >
            {loggedIn ? 'My Dashboard' : 'Portal Login'}
          </NavLink>
          {loggedIn ? (
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 text-sm font-bold text-slate-800 bg-slate-200 border border-slate-400 rounded-xl hover:bg-slate-300 transition-colors whitespace-nowrap"
            >
              Log Out
            </button>
          ) : (
            <div className="w-[88px]" />
          )}
        </div>
      </div>
    </nav>
  );
}
