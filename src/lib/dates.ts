import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type DateLike = Date | string | number;

function pad(value: number) {
  return value.toString().padStart(2, '0');
}

export function toDate(value: DateLike = new Date()) {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  return new Date(value);
}

export function toDayKey(value: DateLike = new Date()) {
  const date = toDate(value);

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDayKey(dayKey: string) {
  const [year, month, day] = dayKey.split('-').map(Number);

  return new Date(year, (month || 1) - 1, day || 1, 12, 0, 0, 0);
}

export function dayKeyToIso(dayKey: string, hour = 12) {
  const date = parseDayKey(dayKey);
  date.setHours(hour, 0, 0, 0);

  return date.toISOString();
}

export function compareDayKeys(left: string, right: string) {
  return parseDayKey(left).getTime() - parseDayKey(right).getTime();
}

export function formatDayKey(dayKey: string, pattern: string) {
  return format(parseDayKey(dayKey), pattern, { locale: es });
}

export function getRecentDayKeys(days: number, anchor: DateLike = new Date()) {
  const keys: string[] = [];
  const date = toDate(anchor);

  for (let index = days - 1; index >= 0; index -= 1) {
    const cursor = new Date(date.getTime());
    cursor.setDate(cursor.getDate() - index);
    keys.push(toDayKey(cursor));
  }

  return keys;
}
