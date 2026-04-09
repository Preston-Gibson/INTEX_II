import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full py-12 border-t border-slate-700/50 bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between">
        <div className="mb-8 md:mb-0">
          <div className="text-lg font-bold text-white mb-4">
            Lucera
          </div>
          <p className="text-slate-400 font-inter text-sm leading-relaxed max-w-xs">
            {t('footer.tagline')}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
          <div className="flex flex-col gap-3">
            <span className="font-manrope text-xs font-bold text-slate-300 uppercase tracking-widest">
              {t('footer.transparency')}
            </span>
            <a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">
              {t('footer.transparency.report')}
            </a>
            <a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">
              {t('footer.audit')}
            </a>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-manrope text-xs font-bold text-slate-300 uppercase tracking-widest">
              {t('footer.legal')}
            </span>
            <Link to="/privacy-policy" className="text-slate-400 text-sm hover:text-blue-400 transition-colors">
              {t('footer.privacy')}
            </Link>
            <a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">
              {t('footer.donor_rights')}
            </a>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-manrope text-xs font-bold text-slate-300 uppercase tracking-widest">
              {t('footer.connect')}
            </span>
            <div className="flex gap-4">
              <span className="material-symbols-outlined text-slate-400 hover:text-blue-400 cursor-pointer">
                public
              </span>
              <span className="material-symbols-outlined text-slate-400 hover:text-blue-400 cursor-pointer">
                alternate_email
              </span>
            </div>
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
