import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('cookie-notice-acknowledged')) {
      setVisible(true);
    }
  }, []);

  const acknowledge = () => {
    localStorage.setItem('cookie-notice-acknowledged', 'true');
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
          We use only strictly necessary cookies to keep you securely logged in. No tracking or analytics.{' '}
          <Link to="/privacy-policy" className="text-primary font-bold hover:underline">
            Learn more
          </Link>
        </p>
        <button
          onClick={acknowledge}
          className="aurora-gradient text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity flex-shrink-0"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
