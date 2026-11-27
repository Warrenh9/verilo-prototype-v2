/**
 * Demo clock. The scripted scenario was written with the qualification run on 12 Nov 2026.
 * Every scenario date is shifted by the same number of days so the run always lands on
 * today's date and nothing on screen looks stale. Model snapshot IDs and policy dates
 * (wording effective dates, claim event dates) are deliberately NOT shifted.
 */
const ANCHOR = Date.UTC(2026, 10, 12); // 12 Nov 2026, the scripted run day
const DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function todayUtc() {
  const n = new Date();
  return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
}

/** Days added to every scenario date. Never negative, so the scenario never moves backwards. */
export const DEMO_OFFSET_DAYS = Math.max(0, Math.round((todayUtc() - ANCHOR) / DAY));

const shift = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d) + DEMO_OFFSET_DAYS * DAY);
const pad = (n: number) => String(n).padStart(2, "0");

/** Shift every YYYY-MM-DD inside a string (ids, ISO timestamps). */
export function shiftIso(s: string): string {
  return s.replace(/(\d{4})-(\d{2})-(\d{2})/g, (_, y, m, d) => {
    const t = shift(+y, +m - 1, +d);
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
  });
}

/** Shift every "12 Nov 2026" / "12 November 2026" inside a string. */
export function shiftText(s: string): string {
  return s.replace(/(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (\d{4})/g, (whole, d, mon, y) => {
    const long = whole.split(" ")[1].length > 3;
    const t = shift(+y, MONTHS.indexOf(mon), +d);
    return `${t.getUTCDate()} ${(long ? LONG_MONTHS : MONTHS)[t.getUTCMonth()]} ${t.getUTCFullYear()}`;
  });
}

/** Shift both formats. Use on any scenario string that contains a date. */
export const sd = (s: string) => shiftText(shiftIso(s));

/** "12 Nov 2026" → "12 Nov" (drop the year for compact tables). */
export const noYear = (s: string) => s.replace(/ \d{4}\b/, "");
