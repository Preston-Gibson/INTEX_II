import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { isAuthenticated, getRole, clearToken } from '../utils/auth';
import { useLanguage } from '../context/LanguageContext';

const activeClass =
  'text-blue-700 dark:text-blue-300 border-b-2 border-blue-700 pb-1 transition-colors';
const inactiveClass =
  'text-slate-600 dark:text-slate-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors';

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? activeClass : inactiveClass;

const mobileNavClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'text-blue-700 font-semibold'
    : 'text-slate-600 hover:text-blue-800 transition-colors';

export default function NavBar() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const loggedIn = isAuthenticated();
  const dashboardPath = getRole() === 'Admin' ? '/admin-dashboard' : '/donor-dashboard';
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    clearToken();
    navigate('/');
  }

  return (
    <nav className="fixed top-9 w-full z-[1001] bg-white/90 backdrop-blur-xl shadow-sm border-b border-slate-200/60">
      <div className="flex items-center justify-between md:grid md:grid-cols-3 max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-20">

        {/* Left — logo + wordmark */}
        <div className="flex items-center gap-3">
          <NavLink to="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
            <img src="/logo.png" alt="Lucera" className="h-8 md:h-10 w-auto object-contain" />
            <span className="text-xl md:text-2xl font-bold text-primary">Lucera</span>
          </NavLink>
        </div>

        {/* Center — nav links (desktop only) */}
        <div className="hidden md:flex justify-center items-center gap-8 font-manrope text-sm font-semibold tracking-tight">
          <NavLink to="/" end className={navClass}>{t('nav.mission')}</NavLink>
          <NavLink to="/impact" className={navClass}>{t('nav.impact')}</NavLink>
          <NavLink to="/donor-shoutout" className={navClass}>Our Supporters</NavLink>
        </div>

        {/* Right — auth + hamburger */}
        <div className="flex items-center justify-end gap-2 md:gap-3">
          <NavLink
            to={loggedIn ? dashboardPath : '/login'}
            className="px-3 py-2 md:px-5 md:py-2.5 aurora-gradient text-white text-xs md:text-sm font-bold rounded-xl transition-all active:scale-95 duration-150 ease-in-out whitespace-nowrap"
          >
            {loggedIn ? t('nav.dashboard') : t('nav.login')}
          </NavLink>
          {loggedIn && (
            <button
              onClick={handleLogout}
              className="hidden md:block px-4 py-2.5 text-sm font-bold text-white bg-slate-700 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              {t('nav.logout')}
            </button>
          )}
          {/* Hamburger — mobile only */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label="Toggle menu"
          >
            <span className={`block h-0.5 w-5 bg-slate-700 transition-transform duration-200 ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-5 bg-slate-700 transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-5 bg-slate-700 transition-transform duration-200 ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </div>

      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/60 px-6 py-4 flex flex-col gap-4 font-manrope text-sm font-semibold">
          <NavLink to="/" end className={mobileNavClass} onClick={() => setMenuOpen(false)}>{t('nav.mission')}</NavLink>
          <NavLink to="/impact" className={mobileNavClass} onClick={() => setMenuOpen(false)}>{t('nav.impact')}</NavLink>
          <NavLink to="/donor-shoutout" className={mobileNavClass} onClick={() => setMenuOpen(false)}>Our Supporters</NavLink>
          {loggedIn && (
            <button
              onClick={() => { handleLogout(); setMenuOpen(false); }}
              className="text-left text-sm font-bold text-slate-600 hover:text-red-600 transition-colors"
            >
              {t('nav.logout')}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
