import { NavLink } from 'react-router-dom';

const activeClass =
  'text-blue-700 dark:text-blue-300 border-b-2 border-blue-700 pb-1 transition-colors';
const inactiveClass =
  'text-slate-600 dark:text-slate-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors';

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? activeClass : inactiveClass;

export default function NavBar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl shadow-sm border-b border-slate-200/60">
      <div className="flex justify-between items-center max-w-7xl mx-auto px-6 h-20">
        <NavLink to="/" className="text-2xl font-bold text-primary dark:text-white">
          Lucero
        </NavLink>

        <div className="hidden md:flex items-center gap-8 font-manrope text-sm font-semibold tracking-tight">
          {/* Public */}
          <NavLink to="/" end className={navClass}>Our Mission</NavLink>
          <NavLink to="/impact" className={navClass}>Impact</NavLink>
          {/* Donor */}
          <NavLink to="/donor-dashboard" className={navClass}>Donor Dashboard</NavLink>

          {/* Admin */}
          <NavLink to="/admin-dashboard" className={navClass}>Admin</NavLink>
          <NavLink to="/admin-donors-contributions" className={navClass}>Donors</NavLink>
          <NavLink to="/admin-caseload-inventory" className={navClass}>Caseload</NavLink>
          <NavLink to="/admin-process-recording" className={navClass}>Process Recording</NavLink>
          <NavLink to="/admin-home-visitation-case-conference" className={navClass}>Home Visitation</NavLink>
          <NavLink to="/admin-reports-analytics" className={navClass}>Reports</NavLink>
        </div>

        <div className="flex items-center gap-4">
          <NavLink
            to="/login"
            className="px-5 py-2.5 aurora-gradient text-white text-sm font-bold rounded-xl transition-all active:scale-95 duration-150 ease-in-out"
          >
            Portal Login
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
