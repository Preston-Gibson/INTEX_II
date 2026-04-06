import { NavLink } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm dark:shadow-none">
      <div className="flex justify-between items-center max-w-7xl mx-auto px-6 h-20">
        <div className="text-2xl font-bold text-blue-900 dark:text-white">
          Lucero
        </div>
        <div className="hidden md:flex items-center gap-8 font-manrope text-sm font-semibold tracking-tight">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? 'text-blue-700 dark:text-blue-300 border-b-2 border-blue-700 pb-1 transition-colors'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors'
            }
          >
            Our Mission
          </NavLink>
          <NavLink
            to="/impact"
            className={({ isActive }) =>
              isActive
                ? 'text-blue-700 dark:text-blue-300 border-b-2 border-blue-700 pb-1 transition-colors'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors'
            }
          >
            Impact
          </NavLink>
          <a
            className="text-slate-600 dark:text-slate-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
            href="#"
          >
            Donate
          </a>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-5 py-2.5 aurora-gradient text-white text-sm font-bold rounded-xl transition-all active:scale-95 duration-150 ease-in-out">
            Portal Login
          </button>
        </div>
      </div>
    </nav>
  )
}