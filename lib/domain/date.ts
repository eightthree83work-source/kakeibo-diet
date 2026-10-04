import { format, parseISO, subDays } from "date-fns";
import { ja } from "date-fns/locale";

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

/** 記録日として選べる日付に丸める。未来日は今日にそろえる */
export function clampToToday(dateKey: string, today: Date = new Date()): string {
  const todayKey = toDateKey(today);
  return dateKey > todayKey ? todayKey : dateKey;
}

/** 記録日の表示名。今日・昨日はそのまま、それ以外は「10/2(木)」形式 */
export function labelForDateKey(dateKey: string, today: Date = new Date()): string {
  if (dateKey === toDateKey(today)) return "今日";
  if (dateKey === toDateKey(subDays(today, 1))) return "昨日";
  return format(fromDateKey(dateKey), "M/d(E)", { locale: ja });
}
