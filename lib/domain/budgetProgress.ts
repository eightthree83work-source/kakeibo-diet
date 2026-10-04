import { getDaysInMonth } from "date-fns";

export interface BudgetProgress {
  /** 今月の支出合計（家計体重） */
  spent: number;
  /** 目標予算までの残り。オーバー時はマイナス */
  remaining: number;
  /** 支出 ÷ 目標予算。目標予算が0のときは0 */
  usedRatio: number;
  /** 月の経過割合（今日を含む）。「今日時点の目安」の位置に使う */
  elapsedRatio: number;
}

/** 目標予算に対する今月の支出の進み具合を計算する */
export function calcBudgetProgress(
  monthlyBudget: number,
  spent: number,
  today: Date = new Date()
): BudgetProgress {
  return {
    spent,
    remaining: monthlyBudget - spent,
    usedRatio: monthlyBudget > 0 ? spent / monthlyBudget : 0,
    elapsedRatio: today.getDate() / getDaysInMonth(today),
  };
}

export type BodyFatLevel = "lean" | "normal" | "high" | "obese";

export const BODY_FAT_LEVEL_LABEL: Record<BodyFatLevel, string> = {
  lean: "引き締まってる",
  normal: "標準",
  high: "ちょっと多め",
  obese: "ダイエット推奨",
};

/** 家計体脂肪率（浪費率 0〜1）を体型の判定レベルに変換する */
export function bodyFatLevelOf(wasteRate: number): BodyFatLevel {
  if (wasteRate < 0.1) return "lean";
  if (wasteRate < 0.2) return "normal";
  if (wasteRate < 0.3) return "high";
  return "obese";
}
