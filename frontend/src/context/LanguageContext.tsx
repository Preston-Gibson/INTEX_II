import { createContext, useContext, useState, useCallback } from 'react';
import translations from '../i18n/translations';
import type { Language, TranslationKey } from '../i18n/translations';

const COOKIE_NAME = 'lucera_lang';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds
const CONSENT_KEY = 'cookie-notice-acknowledged';
const LANG_FALLBACK_KEY = 'lucera_lang_local';

function hasConsented(): boolean {
  return localStorage.getItem(CONSENT_KEY) === 'accepted';
}

function readLangCookie(): Language {
  // Read from cookie if consent given, otherwise fall back to localStorage
  if (hasConsented()) {
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${COOKIE_NAME}=`));
    const val = match?.split('=')[1];
    if (val === 'es' || val === 'en') return val;
  }
  const local = localStorage.getItem(LANG_FALLBACK_KEY);
  return local === 'es' ? 'es' : 'en';
}

export function writeLangCookie(lang: Language) {
  if (hasConsented()) {
    document.cookie = `${COOKIE_NAME}=${lang}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  } else {
    // No consent yet — store in localStorage only, no cookie
    localStorage.setItem(LANG_FALLBACK_KEY, lang);
  }
}

export function onCookieConsent(lang: Language) {
  // Called when user accepts cookies — promote localStorage pref to a real cookie
  document.cookie = `${COOKIE_NAME}=${lang}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function onCookieDecline() {
  // Remove the cookie if it exists
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Language>(readLangCookie);

  const setLanguage = useCallback((lang: Language) => {
    writeLangCookie(lang);
    setLang(lang);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language][key];
    },
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
