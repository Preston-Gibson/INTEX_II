import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full py-12 border-t border-slate-700/50 bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-start md:justify-between gap-10">
        <div className="mb-8 md:mb-0 shrink-0">
          <div className="text-lg font-bold text-white mb-4">
            Lucera
          </div>
          <p className="text-slate-400 font-inter text-sm leading-relaxed max-w-xs">
            {t('footer.tagline')}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-0 gap-y-8 md:ml-auto md:w-auto">
          <div className="flex flex-col gap-3">
            <span className="font-manrope text-xs font-bold text-slate-300 uppercase tracking-widest">
              {t('footer.transparency')}
            </span>
            <Link to="/donor-shoutout" className="text-slate-400 text-sm hover:text-blue-400 transition-colors">
              Our Supporters
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-manrope text-xs font-bold text-slate-300 uppercase tracking-widest">
              {t('footer.connect')}
            </span>
            <div className="flex gap-4">
              <a href="https://www.lighthousesanctuary.org/" target="_blank" rel="noopener noreferrer" className="material-symbols-outlined text-slate-400 hover:text-blue-400 cursor-pointer">
                public
              </a>
              <a href="mailto:info@lucera.org" target="_blank" rel="noopener noreferrer" className="material-symbols-outlined text-slate-400 hover:text-blue-400 cursor-pointer">
                alternate_email
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-manrope text-xs font-bold text-slate-300 uppercase tracking-widest">
              Legal
            </span>
            <Link to="/privacy-policy" className="text-slate-400 text-sm hover:text-blue-400 transition-colors">
              Privacy Policy
            </Link>
            <div>
              <p className="text-slate-400 font-inter text-xs leading-relaxed max-w-xs">
                {t('footer.copyright')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
