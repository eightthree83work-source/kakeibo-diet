import { describe, expect, it } from "vitest";
import { calcTodayRemaining } from "./todayRemaining";

describe("calcTodayRemaining", () => {
  it("今日より前の支出がない場合、予算を残り日数で均等割りする", () => {
    const today = new Date(2026, 9, 10); // 2026-10-10, 31日の月、残り22日
    const result = calcTodayRemaining({
      monthlyBudget: 22000,
      transactionsThisMonth: [],
      today,
    });
    expect(result).toBeCloseTo(1000, 5);
  });

  it("今日より前の支出を予算から差し引いてから均等割りする", () => {
    const today = new Date(2026, 9, 10);
    const result = calcTodayRemaining({
      monthlyBudget: 22000,
      transactionsThisMonth: [{ date: "2026-10-05", amount: 2200 }],
      today,
    });
    // (22000 - 2200) / 22 = 900
    expect(result).toBeCloseTo(900, 5);
  });

  it("今日の支出を均等割り額からさらに差し引く", () => {
    const today = new Date(2026, 9, 10);
    const result = calcTodayRemaining({
      monthlyBudget: 22000,
      transactionsThisMonth: [
        { date: "2026-10-05", amount: 2200 },
        { date: "2026-10-10", amount: 500 },
      ],
      today,
    });
    // (22000 - 2200) / 22 - 500 = 400
    expect(result).toBeCloseTo(400, 5);
  });

  it("使いすぎている場合はマイナスを返す", () => {
    const today = new Date(2026, 9, 10);
    const result = calcTodayRemaining({
      monthlyBudget: 1000,
      transactionsThisMonth: [{ date: "2026-10-10", amount: 5000 }],
      today,
    });
    expect(result).toBeLessThan(0);
  });

  it("月末日は残り日数1日として計算する", () => {
    const today = new Date(2026, 9, 31); // 10月31日（最終日）
    const result = calcTodayRemaining({
      monthlyBudget: 3100,
      transactionsThisMonth: [{ date: "2026-10-15", amount: 3000 }],
      today,
    });
    // (3100 - 3000) / 1 = 100
    expect(result).toBeCloseTo(100, 5);
  });
});
