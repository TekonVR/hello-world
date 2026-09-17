/** Date helpers. Everything the student sees is in their local timezone. */

export const MS_PER_DAY = 86_400_000;
export const MS_PER_MINUTE = 60_000;

export function toDayKey(value: number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDayKey(dayKey: string): number {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day).getTime();
}

/** Whole days from `now` until a YYYY-MM-DD date. Negative once it has passed. */
export function daysUntil(dayKey: string, now: number): number {
  return Math.round((fromDayKey(dayKey) - fromDayKey(toDayKey(now))) / MS_PER_DAY);
}

/** Monday of the week containing `now`, as a day key. Weeks run Monday to Sunday. */
export function weekStartKey(now: number): string {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  const weekday = (date.getDay() + 6) % 7; // 0 = Monday
  date.setDate(date.getDate() - weekday);
  return toDayKey(date);
}

export function addDays(now: number, days: number): number {
  return now + days * MS_PER_DAY;
}

/** "in 12 days", "tomorrow", "today". Used in the reason line on the home card. */
export function describeDays(days: number): string {
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days < 14) return `in ${days} days`;
  if (days < 56) return `in ${Math.round(days / 7)} weeks`;
  return `in ${Math.round(days / 30)} months`;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
