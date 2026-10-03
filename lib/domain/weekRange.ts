import { startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { toDateKey } from "./date";

export interface DateRange {
  start: string; // 'YYYY-MM-DD'
  end: string; // 'YYYY-MM-DD'
}

/** `date` を含む週の範囲を返す（weekStartsOn: 0=日曜始まり, 1=月曜始まり） */
export function getWeekRange(date: Date, weekStartsOn: 0 | 1): DateRange {
  return {
    start: toDateKey(startOfWeek(date, { weekStartsOn })),
    end: toDateKey(endOfWeek(date, { weekStartsOn })),
  };
}

/** `date` を含む週を0週目として、過去 `count` 週分の範囲を古い順で返す */
export function getLastNWeekRanges(
  date: Date,
  count: number,
  weekStartsOn: 0 | 1
): DateRange[] {
  const ranges: DateRange[] = [];
  for (let i = count - 1; i >= 0; i--) {
    ranges.push(getWeekRange(subWeeks(date, i), weekStartsOn));
  }
  return ranges;
}

/** 直近完了した1つ前の週（先週）の範囲を返す */
export function getPreviousWeekRange(
  date: Date,
  weekStartsOn: 0 | 1
): DateRange {
  return getWeekRange(subWeeks(date, 1), weekStartsOn);
}
