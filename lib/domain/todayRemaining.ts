import { getDaysInMonth } from "date-fns";
import { toDateKey } from "./date";

export interface AmountRecord {
  date: string; // 'YYYY-MM-DD'
  amount: number;
}

export interface TodayRemainingInput {
  monthlyBudget: number;
  /** 今月分の支出レコード（当日分を含む） */
  transactionsThisMonth: AmountRecord[];
  today?: Date;
}

/**
 * 今日あと使える額を計算する。
 *
 * 計算方法：
 * 1. 「今日を迎えた時点の1日あたり予算」を、今日より前の支出合計を目標予算から引いた
 *    残額を、今日を含む残り日数で割って求める。
 * 2. そこから今日すでに使った分を差し引いて、今日の残り使える額とする。
 * そのため日中に支出を記録するたびに表示額はリアルタイムに減っていく。
 */
export function calcTodayRemaining({
  monthlyBudget,
  transactionsThisMonth,
  today = new Date(),
}: TodayRemainingInput): number {
  const todayKey = toDateKey(today);

  let spentBeforeToday = 0;
  let spentToday = 0;
  for (const t of transactionsThisMonth) {
    if (t.date === todayKey) {
      spentToday += t.amount;
    } else if (t.date < todayKey) {
      spentBeforeToday += t.amount;
    }
  }

  const daysInMonth = getDaysInMonth(today);
  const dayOfMonth = today.getDate();
  const remainingDaysIncludingToday = daysInMonth - dayOfMonth + 1;

  const dailyShare =
    (monthlyBudget - spentBeforeToday) / remainingDaysIncludingToday;

  return dailyShare - spentToday;
}
