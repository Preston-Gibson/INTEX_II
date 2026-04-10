import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage, onCookieConsent, onCookieDecline } from '../context/LanguageContext';

const CONSENT_KEY = 'cookie-notice-acknowledged';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    onCookieConsent(language);
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    onCookieDecline();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center">
      <div className="glass-panel rounded-2xl px-6 py-4 max-w-2xl w-full flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-lg">
        <span className="material-symbols-outlined text-primary text-[22px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
          cookie
        </span>
        <p className="text-sm text-on-surface leading-relaxed flex-1">
          {t('cookie.message')}{' '}
          <Link to="/privacy-policy" className="text-primary font-bold hover:underline">
            {t('cookie.learn')}
          </Link>
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={decline}
            className="text-sm font-bold px-5 py-2.5 rounded-xl border border-current hover:opacity-70 transition-opacity"
          >
            {t('cookie.decline')}
          </button>
          <button
            onClick={accept}
            className="aurora-gradient text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            {t('cookie.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
