"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { subWeeks } from "date-fns";
import { getAllCategories, getSettings, getTransactionsInRange } from "@/lib/db";
import { getLastNWeekRanges } from "@/lib/domain/weekRange";
import {
  compareWeeks,
  pickTopWaste,
  summarizeWeek,
  type WasteEntry,
  type WeekComparison,
  type WeekSummary,
} from "@/lib/domain/weeklyReport";

/** 浪費率の推移に出す週数（選択週を含む） */
export const TREND_WEEKS = 8;
/** 何週前まで遡れるか */
export const MAX_WEEKS_BACK = 12;

export interface WeeklyReport {
  current: WeekSummary;
  comparison: WeekComparison | null;
  /** 古い順。最後が選択週 */
  trend: WeekSummary[];
  /** 選択週でムダが大きかった支出（上位3件） */
  topWaste: WasteEntry[];
  categoryNames: Record<string, string>;
}

/** `weeksBack` 週前（0 = 今週）の週次レポートを返す */
export function useWeeklyReport(weeksBack: number): WeeklyReport | undefined {
  return useLiveQuery(async () => {
    const settings = await getSettings();
    const base = subWeeks(new Date(), weeksBack);
    // 前週との比較用に、推移グラフより1週多く取る
    const ranges = getLastNWeekRanges(base, TREND_WEEKS + 1, settings.weekStartsOn);
    const [txs, categories] = await Promise.all([
      getTransactionsInRange(ranges[0].start, ranges[ranges.length - 1].end),
      getAllCategories(),
    ]);

    const weeks = ranges.map((range) => summarizeWeek(txs, range));
    const current = weeks[weeks.length - 1];
    const previous = weeks[weeks.length - 2];

    return {
      current,
      comparison: compareWeeks(current, previous),
      trend: weeks.slice(1),
      topWaste: pickTopWaste(txs, current.range),
      categoryNames: Object.fromEntries(categories.map((c) => [c.id, c.name])),
    };
  }, [weeksBack]);
}
