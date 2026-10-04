import { describe, expect, it } from "vitest";
import { bodyFatLevelOf, calcBudgetProgress } from "./budgetProgress";

describe("calcBudgetProgress", () => {
  it("目標予算に対する残りと使用割合を返す", () => {
    const p = calcBudgetProgress(50000, 20000, new Date(2026, 9, 10));
    expect(p.remaining).toBe(30000);
    expect(p.usedRatio).toBeCloseTo(0.4, 5);
  });

  it("オーバーしている場合は残りがマイナスになる", () => {
    const p = calcBudgetProgress(10000, 12000, new Date(2026, 9, 10));
    expect(p.remaining).toBe(-2000);
    expect(p.usedRatio).toBeCloseTo(1.2, 5);
  });

  it("目標予算が未設定（0）の場合は使用割合を0にする", () => {
    const p = calcBudgetProgress(0, 5000, new Date(2026, 9, 10));
    expect(p.usedRatio).toBe(0);
  });

  it("月の経過割合は今日を含めて計算する", () => {
    expect(
      calcBudgetProgress(1, 0, new Date(2026, 9, 31)).elapsedRatio
    ).toBe(1);
    expect(
      calcBudgetProgress(1, 0, new Date(2026, 9, 1)).elapsedRatio
    ).toBeCloseTo(1 / 31, 5);
  });
});

describe("bodyFatLevelOf", () => {
  it("浪費率に応じて体型レベルを返す", () => {
    expect(bodyFatLevelOf(0)).toBe("lean");
    expect(bodyFatLevelOf(0.1)).toBe("normal");
    expect(bodyFatLevelOf(0.25)).toBe("high");
    expect(bodyFatLevelOf(0.3)).toBe("obese");
  });
});
