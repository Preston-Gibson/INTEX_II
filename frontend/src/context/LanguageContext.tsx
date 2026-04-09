import { createContext, useContext, useState, useCallback } from 'react';
import translations from '../i18n/translations';
import type { Language, TranslationKey } from '../i18n/translations';

const COOKIE_NAME = 'lucera_lang';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

function readLangCookie(): Language {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));
  const val = match?.split('=')[1];
  return val === 'es' ? 'es' : 'en';
}

function writeLangCookie(lang: Language) {
  document.cookie = `${COOKIE_NAME}=${lang}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
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
