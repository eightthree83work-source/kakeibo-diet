import { format, parseISO } from "date-fns";
import { fromDateKey, toDateKey } from "./date";
import { calcStreak } from "./streak";
import { bodyFatLevelOf, type BodyFatLevel } from "./budgetProgress";
import { compareWeeks, type WeekSummary } from "./weeklyReport";
import type { EntryType } from "@/types";

/** これ未満の件数の週は「記録が少ないので参考値」と添える */
export const FEW_RECORDS_THRESHOLD = 3;

export type ShareComparison =
  | { kind: "none" } // 前週に記録がない
  | { kind: "same" }
  | { kind: "down"; points: number } // 家計体脂肪率が下がった（良い）
  | { kind: "up"; points: number };

/**
 * シェア画像に載せる値。**金額は一切含めない**（割合・日数・回数だけ）。
 * 項目を足すときも、金額を持ち込まないこと。
 */
export interface ShareCardData {
  /** 「今週」「先週」「3週前」 */
  periodLabel: string;
  /** 「9/29〜10/5」 */
  rangeText: string;
  /** 進行中の週（今週） */
  partial: boolean;
  /** 家計体脂肪率（%）。小数第1位まで */
  wastePercent: number;
  level: BodyFatLevel;
  comparison: ShareComparison;
  /** ムダが0%（記録はある） */
  zeroWaste: boolean;
  /** 支出の内訳（%）。整数で、合計は100 */
  composition: Record<EntryType, number>;
  /** 記録した日数と、その週のうち今日までに経過した日数 */
  recordedDays: number;
  elapsedDays: number;
  /** 「支出なし」を記録した日数 */
  noSpendDays: number;
  /** その週の最終日（進行中の週は今日）時点の連続記録日数 */
  streakDays: number;
  /** 直近の週ごとの家計体脂肪率（%）。古い順で、最後がこの週。記録のない週は null */
  trend: (number | null)[];
  /** 推移を折れ線にできるか（記録のある週が2週以上） */
  trendHasLine: boolean;
  /** 記録が少ない週 */
  fewRecords: boolean;
}

/** 合計が100になるよう、最大剰余法で整数のパーセントにする */
export function toPercentages(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return values.map(() => 0);
  const raw = values.map((v) => (v / total) * 100);
  const floors = raw.map(Math.floor);
  let remainder = 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (remainder <= 0) break;
    floors[i] += 1;
    remainder -= 1;
  }
  return floors;
}

function periodLabelOf(weeksBack: number): string {
  if (weeksBack <= 0) return "今週";
  if (weeksBack === 1) return "先週";
  return `${weeksBack}週前`;
}

function roundPercent(rate: number): number {
  return Math.round(rate * 1000) / 10;
}

export interface BuildShareCardInput {
  /** 選んだ週と、その前の週 */
  week: WeekSummary;
  previous: WeekSummary;
  /** 古い順で最後が `week` の、直近の週（通常8週） */
  trend: WeekSummary[];
  /** 記録した日（取引がある日、または「支出なし」を押した日）。連続記録の計算に使う。長めに遡って渡す */
  recordedDates: Set<string>;
  /** その週に「支出なし」を記録した日 */
  noSpendDates: Set<string>;
  weeksBack: number;
  today: Date;
}

export function buildShareCardData(input: BuildShareCardInput): ShareCardData {
  const { week, previous, trend, recordedDates, noSpendDates, weeksBack, today } = input;
  const todayKey = toDateKey(today);
  // 進行中の週は「今日まで」で数える
  const lastKey = week.range.end < todayKey ? week.range.end : todayKey;
  const elapsedDays = week.days.filter((d) => d.date <= lastKey).length;
  const recordedDays = week.days.filter((d) => d.date <= lastKey && recordedDates.has(d.date)).length;
  const noSpendDays = week.days.filter(
    (d) => d.date <= lastKey && d.total === 0 && noSpendDates.has(d.date)
  ).length;

  const comparisonRaw = compareWeeks(week, previous);
  let comparison: ShareComparison = { kind: "none" };
  if (comparisonRaw) {
    const points = Math.round(Math.abs(comparisonRaw.wasteRateDiffPoints) * 10) / 10;
    if (points === 0) comparison = { kind: "same" };
    else if (comparisonRaw.wasteRateDiffPoints < 0) comparison = { kind: "down", points };
    else comparison = { kind: "up", points };
  }

  const [necessary, satisfied, waste] = toPercentages([
    week.byType.necessary,
    week.byType.satisfied,
    week.byType.waste,
  ]);
  const trendValues = trend.map((w) => (w.recordCount > 0 ? roundPercent(w.wasteRate) : null));

  return {
    periodLabel: periodLabelOf(weeksBack),
    rangeText: `${format(parseISO(week.range.start), "M/d")}〜${format(parseISO(week.range.end), "M/d")}`,
    partial: week.range.end >= todayKey,
    wastePercent: roundPercent(week.wasteRate),
    level: bodyFatLevelOf(week.wasteRate),
    comparison,
    zeroWaste: week.recordCount > 0 && week.byType.waste === 0,
    composition: { necessary, satisfied, waste },
    recordedDays,
    elapsedDays,
    noSpendDays,
    streakDays: calcStreak(recordedDates, fromDateKey(lastKey)),
    trend: trendValues,
    trendHasLine: trendValues.filter((v) => v !== null).length >= 2,
    fewRecords: week.recordCount < FEW_RECORDS_THRESHOLD,
  };
}
