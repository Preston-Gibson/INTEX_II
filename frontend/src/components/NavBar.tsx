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
        <NavLink to="/" className="text-2xl font-bold text-primary dark:text-white">
          Lucera
        </NavLink>

        <div className="hidden md:flex justify-center items-center gap-8 font-manrope text-sm font-semibold tracking-tight">
          {/* Publicly Accessible Pages */}
          <NavLink to="/" end className={navClass}>Our Mission</NavLink>
          <NavLink to="/impact" className={navClass}>Impact</NavLink>
        </div>

        <div className="flex items-center justify-end gap-4">
          {loggedIn ? (
            <>
              <NavLink
                to={dashboardPath}
                className="px-5 py-2.5 aurora-gradient text-white text-sm font-bold rounded-xl transition-all active:scale-95 duration-150 ease-in-out"
              >
                My Dashboard
              </NavLink>
              <button
                onClick={handleLogout}
                className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors underline"
              >
                Log Out
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="px-5 py-2.5 aurora-gradient text-white text-sm font-bold rounded-xl transition-all active:scale-95 duration-150 ease-in-out"
            >
              Portal Login
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
