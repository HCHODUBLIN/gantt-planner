const STORAGE_KEY = 'gantt-data';
const THEME_KEY = 'gantt-theme';
const LANG_KEY = 'gantt-lang';

export function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.categories && parsed.categories.length > 0) {
        // Migrate old "section" to "tags"
        parsed.categories.forEach(cat => {
          if (cat.section && !cat.tags) {
            cat.tags = [cat.section];
            delete cat.section;
          }
        });
        return parsed;
      }
    }
  } catch (e) {
    /* ignore bad localStorage */
  }
  return null;
}

export function saveToLocalStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearLocalStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

let autoSaveTimer = null;
export function autoSaveToServer(data, onSuccess) {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data, null, 2)
    })
      .then(resp => {
        if (resp.ok && onSuccess) onSuccess();
      })
      .catch(() => { /* server not running, silent fail */ });
  }, 1000);
}

export async function saveToServer(data) {
  const resp = await fetch('/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data, null, 2)
  });
  if (!resp.ok) throw new Error('Save failed');
  return true;
}

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function getLang() {
  return localStorage.getItem(LANG_KEY) || 'ko';
}

export function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
}

// Weekly plan storage
export function getWeekKey(weekStart) {
  const d = new Date(weekStart);
  const week = Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7);
  return `weeklyPlan-${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function loadWeeklyPlan(weekStart) {
  const key = getWeekKey(weekStart);
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : {};
}

export function saveWeeklyPlan(weekStart, plan) {
  const key = getWeekKey(weekStart);
  localStorage.setItem(key, JSON.stringify(plan));
}
