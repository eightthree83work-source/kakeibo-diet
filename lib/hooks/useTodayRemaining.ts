"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { startOfMonth, endOfMonth } from "date-fns";
import { getSettings, getTransactionsInRange } from "@/lib/db";
import { calcTodayRemaining } from "@/lib/domain/todayRemaining";
import { toDateKey } from "@/lib/domain/date";

export function useTodayRemaining(): number | undefined {
  return useLiveQuery(async () => {
    const settings = await getSettings();
    const today = new Date();
    const txs = await getTransactionsInRange(
      toDateKey(startOfMonth(today)),
      toDateKey(endOfMonth(today))
    );
    return calcTodayRemaining({
      monthlyBudget: settings.monthlyBudget,
      transactionsThisMonth: txs,
      today,
    });
  }, []);
}
