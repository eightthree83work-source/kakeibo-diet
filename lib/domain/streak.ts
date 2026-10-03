import { subDays } from "date-fns";
import { toDateKey } from "./date";

/**
 * ストリーク（連続記録日数）を計算する。
 *
 * `recordedDates` には「支出を記録した日」または「今日は支出なしボタンを押した日」を渡す。
 * 今日がまだ記録されていなくても、昨日までの連続記録があればストリークは維持して表示する
 * （1日の終わりに記録を忘れるとそこで途切れる）。
 */
export function calcStreak(
  recordedDates: Set<string>,
  today: Date = new Date()
): number {
  const todayKey = toDateKey(today);

  let cursor = today;
  if (!recordedDates.has(todayKey)) {
    cursor = subDays(today, 1);
    if (!recordedDates.has(toDateKey(cursor))) {
      return 0;
    }
  }

  let streak = 0;
  while (recordedDates.has(toDateKey(cursor))) {
    streak++;
    cursor = subDays(cursor, 1);
  }
  return streak;
}
