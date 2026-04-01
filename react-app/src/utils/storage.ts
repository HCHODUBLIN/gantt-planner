import type { AllData, WeeklyPlan } from '../types';

const STORAGE_KEY = 'gantt-data';
const THEME_KEY = 'gantt-theme';
const LANG_KEY = 'gantt-lang';

export function loadFromLocalStorage(): AllData | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as AllData;
      if (parsed.categories && parsed.categories.length > 0) {
        // Migrate old "section" to "tags"
        parsed.categories.forEach(cat => {
          const c = cat as Record<string, unknown>;
          if (c.section && !cat.tags) {
            cat.tags = [c.section as string];
            delete c.section;
          }
        });
        return parsed;
      }
    }
  } catch {
    /* ignore bad localStorage */
  }
  return null;
}

export function saveToLocalStorage(data: AllData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearLocalStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
export function autoSaveToServer(data: AllData, onSuccess?: () => void): void {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
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

export async function saveToServer(data: AllData): Promise<boolean> {
  const resp = await fetch('/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data, null, 2)
  });
  if (!resp.ok) throw new Error('Save failed');
  return true;
}

export function getTheme(): string {
  return localStorage.getItem(THEME_KEY) || 'light';
}

export function setTheme(theme: string): void {
  localStorage.setItem(THEME_KEY, theme);
}

export function getLang(): string {
  return localStorage.getItem(LANG_KEY) || 'ko';
}

export function setLang(lang: string): void {
  localStorage.setItem(LANG_KEY, lang);
}

// Weekly plan storage
export function getWeekKey(weekStart: Date): string {
  const d = new Date(weekStart);
  const week = Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7);
  return `weeklyPlan-${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function loadWeeklyPlan(weekStart: Date): WeeklyPlan {
  const key = getWeekKey(weekStart);
  const stored = localStorage.getItem(key);
  return stored ? (JSON.parse(stored) as WeeklyPlan) : {};
}

export function saveWeeklyPlan(weekStart: Date, plan: WeeklyPlan): void {
  const key = getWeekKey(weekStart);
  localStorage.setItem(key, JSON.stringify(plan));
}
