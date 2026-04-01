import { createContext, useContext, useState, useCallback } from 'react';
import ko from '../i18n/ko';
import en from '../i18n/en';
import { getLang, setLang as persistLang } from '../utils/storage';

const I18nContext = createContext();

const translations = { ko, en };

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => getLang());

  const toggleLang = () => {
    const next = lang === 'ko' ? 'en' : 'ko';
    setLangState(next);
    persistLang(next);
    document.documentElement.lang = next;
  };

  const t = useCallback((key) => {
    return translations[lang][key] || key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
