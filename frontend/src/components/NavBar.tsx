import { NavLink, useNavigate } from 'react-router-dom';
import { isAuthenticated, getRole, clearToken } from '../utils/auth';
import { useLanguage } from '../context/LanguageContext';

const activeClass =
  'text-blue-700 dark:text-blue-300 border-b-2 border-blue-700 pb-1 transition-colors';
const inactiveClass =
  'text-slate-600 dark:text-slate-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors';

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? activeClass : inactiveClass;

export default function NavBar() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const loggedIn = isAuthenticated();
  const dashboardPath = getRole() === 'Admin' ? '/admin-dashboard' : '/donor-dashboard';

  function handleLogout() {
    clearToken();
    navigate('/');
  }

  return (
    <nav className="fixed top-9 w-full z-[1001] bg-white/90 backdrop-blur-xl shadow-sm border-b border-slate-200/60">
      <div className="grid grid-cols-3 max-w-7xl mx-auto px-6 h-20">

        {/* Left — logo + wordmark + language toggle */}
        <div className="flex items-center gap-3">
          <NavLink to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Lucera" className="h-10 w-auto object-contain" />
            <span className="text-2xl font-bold text-primary">Lucera</span>
          </NavLink>
        </div>

        {/* Center — nav links */}
        <div className="hidden md:flex justify-center items-center gap-8 font-manrope text-sm font-semibold tracking-tight">
          <NavLink to="/" end className={navClass}>{t('nav.mission')}</NavLink>
          <NavLink to="/impact" className={navClass}>{t('nav.impact')}</NavLink>
          <NavLink to="/donor-shoutout" className={navClass}>{t('shoutout.heading')}</NavLink>
        </div>

        {/* Right — auth */}
        <div className="flex items-center justify-end gap-3">
          <NavLink
            to={loggedIn ? dashboardPath : '/login'}
            className="px-5 py-2.5 aurora-gradient text-white text-sm font-bold rounded-xl transition-all active:scale-95 duration-150 ease-in-out whitespace-nowrap"
          >
            {loggedIn ? t('nav.dashboard') : t('nav.login')}
          </NavLink>
          {loggedIn && (
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 text-sm font-bold text-white bg-slate-700 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              {t('nav.logout')}
            </button>
          )}
        </div>

      </div>
    </nav>
  );
}
