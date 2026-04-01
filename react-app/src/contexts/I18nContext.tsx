import { createContext, useContext, useState, useCallback } from 'react';
import ko from '../i18n/ko';
import en from '../i18n/en';
import { getLang, setLang as persistLang } from '../utils/storage';
import type { Translations, I18nContextValue } from '../types';

const I18nContext = createContext<I18nContextValue | null>(null);

const translations: Record<string, Translations> = { ko, en };

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [lang, setLangState] = useState<string>(() => getLang());

  const toggleLang = () => {
    const next = lang === 'ko' ? 'en' : 'ko';
    setLangState(next);
    persistLang(next);
    document.documentElement.lang = next;
  };

  const t = useCallback((key: string): string | string[] => {
    return translations[lang][key] || key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
