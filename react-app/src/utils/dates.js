// Dynamic date range: 4 weeks before current week + 6 months ahead
const now = new Date();
const currentWeekStart = getWeekStart(now);

// Start 4 weeks before current week
export const BASE_DATE = new Date(currentWeekStart);
BASE_DATE.setDate(BASE_DATE.getDate() - 4 * 7);

// End ~6 months from now
const endDate = new Date(currentWeekStart);
endDate.setMonth(endDate.getMonth() + 6);
export const COLS = Math.ceil((endDate - BASE_DATE) / (7 * 24 * 60 * 60 * 1000));

// Column index of the current week (for auto-scroll)
export const TODAY_COL = Math.round((currentWeekStart - BASE_DATE) / (7 * 24 * 60 * 60 * 1000));

export function dateToCol(dateStr) {
  const d = new Date(dateStr);
  return Math.round((d - BASE_DATE) / (7 * 24 * 60 * 60 * 1000));
}

export function colToDate(col) {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() + col * 7);
  return d.toISOString().split('T')[0];
}

export function formatDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export function buildMonthWeekHeaders() {
  const months = {};
  const weeks = [];
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
