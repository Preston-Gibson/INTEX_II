export default function Footer() {
  return (
    <footer className="w-full py-12 mt-10 border-t border-slate-700/50 bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between">
        <div className="mb-8 md:mb-0">
          <div className="text-lg font-bold text-white mb-4">
            Lucero
          </div>
          <p className="text-slate-400 font-inter text-sm leading-relaxed max-w-xs">
            © 2024 Lucero. Dedicated to the children of Central America.
            Providing safety, education, and hope.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="flex flex-col gap-3">
            <span className="font-manrope text-xs font-bold text-slate-300 uppercase tracking-widest">
              Transparency
            </span>
            <a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">
              Transparency Report
            </a>
            <a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">
              Audit History
            </a>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-manrope text-xs font-bold text-slate-300 uppercase tracking-widest">
              Company
            </span>
            <a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">
              Careers
            </a>
            <a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">
              Contact Us
            </a>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-manrope text-xs font-bold text-slate-300 uppercase tracking-widest">
              Legal
            </span>
            <a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">
              Privacy Policy
            </a>
            <a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">
              Donor Rights
            </a>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-manrope text-xs font-bold text-slate-300 uppercase tracking-widest">
              Connect
            </span>
            <div className="flex gap-4">
              <span className="material-symbols-outlined text-slate-400 hover:text-blue-400 cursor-pointer">
                public
              </span>
              <span className="material-symbols-outlined text-slate-400 hover:text-blue-400 cursor-pointer">
                alternate_email
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
