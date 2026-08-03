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

/** True if two dates fall in the same calendar month. */
export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** True if the date is within the current calendar month. Used to keep in-app
 * history lists to the current month (older entries stay in the database). */
export function isThisMonth(date: Date): boolean {
  return isSameMonth(date, new Date());
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

export function parseDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}

/** Monday of the week containing dateStr (weeks start Monday). */
export function startOfWeek(dateStr: string): string {
  const date = parseDate(dateStr);
  const day = (date.getDay() + 6) % 7; // 0 = Monday
  return addDays(dateStr, -day);
}

/** The 7 Mon..Sun date strings for the week containing dateStr. */
export function weekDays(dateStr: string): string[] {
  const monday = startOfWeek(dateStr);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/**
 * A Monday-first month grid for the month containing dateStr, as date strings
 * with `null` for the leading/trailing blanks.
 */
export function monthMatrix(dateStr: string): (string | null)[] {
  const date = parseDate(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // blanks before day 1
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < lead; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(dateToDateString(new Date(year, month, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function monthLabel(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/** Shifts a `YYYY-MM-DD` by whole months, clamping the day into range. */
export function addMonths(dateStr: string, months: number): string {
  const date = parseDate(dateStr);
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const daysInTarget = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), daysInTarget));
  return dateToDateString(target);
}
