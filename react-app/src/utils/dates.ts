export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const BASE_DATE: Date = new Date(2026, 2, 23); // Mar 23, 2026
export const COLS: number = 29; // 29 weeks: Mar 23 ~ Sep 28
export const TODAY_COL: number = Math.max(0, Math.min(28, Math.round((getWeekStart(new Date()).getTime() - BASE_DATE.getTime()) / (7 * 24 * 60 * 60 * 1000))));

export function dateToCol(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.round((d.getTime() - BASE_DATE.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

export function colToDate(col: number): string {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() + col * 7);
  return d.toISOString().split('T')[0];
}

export interface MonthHeader {
  name: string;
  count: number;
}

export interface WeekHeader {
  date: number;
  col: number;
}

export function buildMonthWeekHeaders(): { monthHeaders: MonthHeader[]; weeks: WeekHeader[] } {
  const months: Record<string, MonthHeader> = {};
  const weeks: WeekHeader[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < COLS; i++) {
    const d = new Date(BASE_DATE);
    d.setDate(d.getDate() + i * 7);
    const monthKey = d.getFullYear() + '-' + d.getMonth();
    if (!months[monthKey]) months[monthKey] = { name: monthNames[d.getMonth()], count: 0 };
    months[monthKey].count++;
    weeks.push({ date: d.getDate(), col: i });
  }

  const monthHeaders = Object.values(months);
  return { monthHeaders, weeks };
}
