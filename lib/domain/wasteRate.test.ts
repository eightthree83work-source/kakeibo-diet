import { describe, expect, it } from "vitest";
import { calcWasteRate } from "./wasteRate";

describe("calcWasteRate", () => {
  it("支出がない場合は0を返す", () => {
    expect(calcWasteRate([])).toBe(0);
  });

  it("ムダ分類の割合を正しく計算する", () => {
    const rate = calcWasteRate([
      { amount: 7000, type: "necessary" },
      { amount: 2000, type: "satisfied" },
      { amount: 1000, type: "waste" },
    ]);
    expect(rate).toBeCloseTo(0.1, 5);
  });

  it("全てムダの場合は1を返す", () => {
    const rate = calcWasteRate([
      { amount: 500, type: "waste" },
      { amount: 500, type: "waste" },
    ]);
    expect(rate).toBe(1);
  });

  it("ムダがない場合は0を返す", () => {
    const rate = calcWasteRate([
      { amount: 500, type: "necessary" },
      { amount: 500, type: "satisfied" },
    ]);
    expect(rate).toBe(0);
  });
});
