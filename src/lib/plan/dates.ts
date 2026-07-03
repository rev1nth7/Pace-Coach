/** Pure ISO-date (YYYY-MM-DD) helpers, computed in UTC to avoid TZ drift. */

const DAY_MS = 86_400_000;

export const parseISO = (iso: string): number =>
  new Date(`${iso}T00:00:00Z`).getTime();

export const toISO = (ms: number): string =>
  new Date(ms).toISOString().slice(0, 10);

export const addDays = (iso: string, days: number): string =>
  toISO(parseISO(iso) + days * DAY_MS);

/** Day of week with Monday=0 … Sunday=6. */
export const dayOfWeekMon0 = (iso: string): number =>
  (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;

/** Whole days from `b` to `a` (a - b). */
export const diffDays = (a: string, b: string): number =>
  Math.round((parseISO(a) - parseISO(b)) / DAY_MS);
