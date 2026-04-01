import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';

export default function ToggleGroup() {
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang } = useI18n();

  return (
    <div className="toggle-group">
      <div className="toggle-pill" onClick={toggleTheme}>
        <span className={!isDark ? 'active' : ''}>Light</span>
        <span className={isDark ? 'active' : ''}>Dark</span>
      </div>
      <div className="toggle-pill" onClick={toggleLang}>
        <span className={lang === 'en' ? 'active' : ''}>EN</span>
        <span className={lang === 'ko' ? 'active' : ''}>KO</span>
      </div>
    </div>
  );
}
