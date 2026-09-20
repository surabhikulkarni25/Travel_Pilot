/**
 * Date and calendar calculation utilities for TravelPilot
 * Ensures consistent inclusive calendar-day math without timezone drift.
 */

export function parseISODateParts(dateStr: string): { year: number; month: number; day: number } {
  if (!dateStr) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  }
  const parts = dateStr.split('-').map(Number);
  if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return { year: parts[0], month: parts[1] - 1, day: parts[2] };
  }
  const d = new Date(dateStr);
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

/**
 * Calculates the exact inclusive calendar days between two dates.
 * e.g.
 * 19 Sep to 19 Sep = 1 day
 * 19 Sep to 20 Sep = 2 days
 * 19 Sep to 21 Sep = 3 days
 * 19 Sep to 24 Sep = 6 days
 */
export function calculateCalendarDays(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 1;

  const start = parseISODateParts(startDateStr);
  const end = parseISODateParts(endDateStr);

  const startUtc = Date.UTC(start.year, start.month, start.day);
  const endUtc = Date.UTC(end.year, end.month, end.day);

  const diffMs = endUtc - startUtc;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Inclusive duration: if same day diffDays is 0, so duration is 1
  return Math.max(1, diffDays + 1);
}

/**
 * Calculates hotel nights between check-in (startDate) and check-out (endDate).
 * Check-in: 19 Sep, Check-out: 19 Sep -> 0 hotel nights.
 * Check-in: 19 Sep, Check-out: 20 Sep -> 1 hotel night.
 * Check-in: 19 Sep, Check-out: 21 Sep -> 2 hotel nights.
 */
export function calculateHotelNights(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0;
  const start = parseISODateParts(startDateStr);
  const end = parseISODateParts(endDateStr);

  const startUtc = Date.UTC(start.year, start.month, start.day);
  const endUtc = Date.UTC(end.year, end.month, end.day);

  const diffMs = endUtc - startUtc;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Derives the YYYY-MM-DD date string for a given 1-based day index.
 */
export function getDateForDayIndex(startDateStr: string, dayIndex: number): string {
  const start = parseISODateParts(startDateStr);
  const utcDate = new Date(Date.UTC(start.year, start.month, start.day + (dayIndex - 1)));
  return utcDate.toISOString().split('T')[0];
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Formats a clean date range for cards and headers, e.g. "19 Sep – 24 Sep" or "19 Sep"
 */
export function formatDateRange(startDateStr: string, endDateStr: string): string {
  if (!startDateStr) return '';
  const s = parseISODateParts(startDateStr);
  const sMonth = MONTH_NAMES[s.month] || '';

  if (!endDateStr || startDateStr === endDateStr) {
    return `${s.day} ${sMonth}`;
  }

  const e = parseISODateParts(endDateStr);
  const eMonth = MONTH_NAMES[e.month] || '';

  if (s.month === e.month && s.year === e.year) {
    return `${s.day} – ${e.day} ${sMonth}`;
  }

  return `${s.day} ${sMonth} – ${e.day} ${eMonth}`;
}

export function formatDayDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const p = parseISODateParts(dateStr);
  const d = new Date(Date.UTC(p.year, p.month, p.day));
  const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
  return `${dayName}, ${p.day} ${MONTH_NAMES[p.month]}`;
}
