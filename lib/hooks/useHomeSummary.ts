"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { endOfMonth, startOfMonth, subDays } from "date-fns";
import {
  getDailyLogsInRange,
  getSettings,
  getTransactionsInRange,
} from "@/lib/db";
import { toDateKey } from "@/lib/domain/date";
import { calcTodayRemaining } from "@/lib/domain/todayRemaining";
import { calcWasteRate } from "@/lib/domain/wasteRate";
import {
  calcBudgetProgress,
  type BudgetProgress,
} from "@/lib/domain/budgetProgress";
import { calcStreak } from "@/lib/domain/streak";
import type { EntryType } from "@/types";

/** ストリーク判定のために遡る日数 */
const STREAK_LOOKBACK_DAYS = 366;

export interface HomeSummary {
  monthlyBudget: number;
  todayRemaining: number;
  spentToday: number;
  progress: BudgetProgress;
  wasteRate: number;
  amountByType: Record<EntryType, number>;
  streak: number;
}

export function useHomeSummary(): HomeSummary | undefined {
  return useLiveQuery(async () => {
    const today = new Date();
    const todayKey = toDateKey(today);
    const settings = await getSettings();

    const monthTxs = await getTransactionsInRange(
      toDateKey(startOfMonth(today)),
      toDateKey(endOfMonth(today))
    );

    const amountByType: Record<EntryType, number> = {
      necessary: 0,
      satisfied: 0,
      waste: 0,
    };
    let spentThisMonth = 0;
    let spentToday = 0;
    for (const t of monthTxs) {
      amountByType[t.type] += t.amount;
      spentThisMonth += t.amount;
      if (t.date === todayKey) spentToday += t.amount;
    }

    const lookbackStart = toDateKey(subDays(today, STREAK_LOOKBACK_DAYS));
    const [recentTxs, logs] = await Promise.all([
      getTransactionsInRange(lookbackStart, todayKey),
      getDailyLogsInRange(lookbackStart, todayKey),
    ]);
    const recordedDates = new Set([
      ...recentTxs.map((t) => t.date),
      ...logs.filter((l) => l.noSpend).map((l) => l.date),
    ]);

    return {
      monthlyBudget: settings.monthlyBudget,
      todayRemaining: calcTodayRemaining({
        monthlyBudget: settings.monthlyBudget,
        transactionsThisMonth: monthTxs,
        today,
      }),
      spentToday,
      progress: calcBudgetProgress(
        settings.monthlyBudget,
        spentThisMonth,
        today
      ),
      wasteRate: calcWasteRate(monthTxs),
      amountByType,
      streak: calcStreak(recordedDates, today),
    };
  }, []);
}
