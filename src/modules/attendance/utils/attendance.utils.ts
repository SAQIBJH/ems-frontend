import { format, parseISO } from 'date-fns';

/** Format total minutes into "Xh Ym" display string. */
export function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Given a list of attendance records, build a map keyed by "YYYY-MM-DD". */
export function buildDateMap<T extends { attendanceDate: string }>(records: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const r of records) {
    const key = format(parseISO(r.attendanceDate), 'yyyy-MM-dd');
    map.set(key, r);
  }
  return map;
}

/** Return an array of Date objects for every day in the given month (year, month 0-indexed). */
export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}
