import { addDays } from "date-fns";
import { fromDateKey, toDateKey } from "./date";
import { calcWasteRate } from "./wasteRate";
import type { DateRange } from "./weekRange";
import type { EntryType } from "@/types";

export interface ReportTransaction {
  date: string; // 'YYYY-MM-DD'
  amount: number;
  type: EntryType;
  categoryId?: string;
}

export type AmountByType = Record<EntryType, number>;

export interface DaySummary {
  date: string;
  total: number;
  byType: AmountByType;
}

export interface CategorySummary {
  /** 未分類の支出は undefined */
  categoryId?: string;
  total: number;
  waste: number;
}

export interface WeekSummary {
  range: DateRange;
  total: number;
  byType: AmountByType;
  /** 家計体脂肪率（0〜1） */
  wasteRate: number;
  recordCount: number;
  days: DaySummary[];
  /** 支出額の多い順 */
  categories: CategorySummary[];
}

function emptyByType(): AmountByType {
  return { necessary: 0, satisfied: 0, waste: 0 };
}

/** `range`（両端含む）に入る支出を、週次レポート用に集計する */
export function summarizeWeek(
  transactions: ReportTransaction[],
  range: DateRange
): WeekSummary {
  const days = new Map<string, DaySummary>();
  for (
    let cursor = fromDateKey(range.start);
    toDateKey(cursor) <= range.end;
    cursor = addDays(cursor, 1)
  ) {
    const date = toDateKey(cursor);
    days.set(date, { date, total: 0, byType: emptyByType() });
  }

  const byType = emptyByType();
  const categories = new Map<string | undefined, CategorySummary>();
  const inRange: ReportTransaction[] = [];
  let total = 0;

  for (const t of transactions) {
    const day = days.get(t.date);
    if (!day) continue;
    inRange.push(t);
    total += t.amount;
    byType[t.type] += t.amount;
    day.total += t.amount;
    day.byType[t.type] += t.amount;

    const entry = categories.get(t.categoryId) ?? {
      categoryId: t.categoryId,
      total: 0,
      waste: 0,
    };
    entry.total += t.amount;
    if (t.type === "waste") entry.waste += t.amount;
    categories.set(t.categoryId, entry);
  }

  return {
    range,
    total,
    byType,
    wasteRate: calcWasteRate(inRange),
    recordCount: inRange.length,
    days: [...days.values()],
    categories: [...categories.values()].sort((a, b) => b.total - a.total),
  };
}

export interface WeekComparison {
  /** 支出合計の増減（今週 - 前週）。マイナスが良い */
  totalDiff: number;
  /** 家計体脂肪率の増減（パーセントポイント）。マイナスが良い */
  wasteRateDiffPoints: number;
}

/** 前週との比較。前週に支出がなければ比較できないので null を返す */
export function compareWeeks(
  current: WeekSummary,
  previous: WeekSummary
): WeekComparison | null {
  if (previous.recordCount === 0) return null;
  return {
    totalDiff: current.total - previous.total,
    wasteRateDiffPoints: (current.wasteRate - previous.wasteRate) * 100,
  };
}

export interface WasteEntry extends ReportTransaction {
  id: string;
  memo?: string;
}

/** `range` 内のムダ支出を金額の大きい順に `limit` 件返す。同額は日付の新しい順 */
export function pickTopWaste(
  transactions: WasteEntry[],
  range: DateRange,
  limit = 3
): WasteEntry[] {
  return transactions
    .filter(
      (t) => t.type === "waste" && t.date >= range.start && t.date <= range.end
    )
    .sort((a, b) => b.amount - a.amount || b.date.localeCompare(a.date))
    .slice(0, limit);
}
