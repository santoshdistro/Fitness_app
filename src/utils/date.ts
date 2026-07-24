export function todayDateString(): string {
  return dateToDateString(new Date());
}

export function dateToDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfTodayIso(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

/** Shifts a `YYYY-MM-DD` date string by `days` (may be negative). */
export function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + days);
  return dateToDateString(date);
}

/** Start-of-day ISO timestamp for a `YYYY-MM-DD` date string, in local time. */
export function startOfDateIso(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toISOString();
}

/** Exclusive end-of-day ISO timestamp (start of the next day) for a range query upper bound. */
export function endOfDateIso(dateStr: string): string {
  return startOfDateIso(addDays(dateStr, 1));
}

export function isToday(dateStr: string): boolean {
  return dateStr === todayDateString();
}
