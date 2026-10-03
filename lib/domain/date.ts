import { format, parseISO } from "date-fns";

/** Date を 'YYYY-MM-DD' のキー文字列に変換する */
export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function fromDateKey(key: string): Date {
  return parseISO(key);
}

export function monthKeyOf(dateKey: string): string {
  return dateKey.slice(0, 7); // 'YYYY-MM'
}
