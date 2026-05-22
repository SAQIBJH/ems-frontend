import { format, parseISO } from 'date-fns';

export function formatDateForApi(date: Date | string): string {
  return format(typeof date === 'string' ? parseISO(date) : date, 'yyyy-MM-dd');
}
