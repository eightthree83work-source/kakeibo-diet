import { describe, expect, it } from "vitest";
import {
  compareWeeks,
  pickTopWaste,
  summarizeWeek,
  type ReportTransaction,
  type WasteEntry,
} from "./weeklyReport";

const range = { start: "2026-10-05", end: "2026-10-11" };

const txs: ReportTransaction[] = [
  { date: "2026-10-05", amount: 700, type: "necessary", categoryId: "food" },
  { date: "2026-10-05", amount: 300, type: "waste", categoryId: "food" },
  { date: "2026-10-08", amount: 500, type: "satisfied", categoryId: "hobby" },
  { date: "2026-10-12", amount: 9999, type: "waste" }, // 範囲外
  { date: "2026-10-04", amount: 9999, type: "waste" }, // 範囲外
];

describe("summarizeWeek", () => {
  it("範囲内の支出だけを合計し、種類別・浪費率を出す", () => {
    const s = summarizeWeek(txs, range);
    expect(s.total).toBe(1500);
    expect(s.byType).toEqual({ necessary: 700, satisfied: 500, waste: 300 });
    expect(s.wasteRate).toBeCloseTo(0.2, 5);
    expect(s.recordCount).toBe(3);
  });

  it("支出のない日も含めて7日分の日別データを返す", () => {
    const s = summarizeWeek(txs, range);
    expect(s.days.map((d) => d.date)).toEqual([
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
    ]);
    expect(s.days[0].total).toBe(1000);
    expect(s.days[1].total).toBe(0);
    expect(s.days[3].byType.satisfied).toBe(500);
  });

  it("カテゴリ別は支出額の多い順で、ムダ分も持つ", () => {
    const s = summarizeWeek(
      [...txs, { date: "2026-10-09", amount: 100, type: "necessary" }],
      range
    );
    expect(s.categories).toEqual([
      { categoryId: "food", total: 1000, waste: 300 },
      { categoryId: "hobby", total: 500, waste: 0 },
      { categoryId: undefined, total: 100, waste: 0 },
    ]);
  });

  it("支出がない週は合計0・浪費率0", () => {
    const s = summarizeWeek([], range);
    expect(s.total).toBe(0);
    expect(s.wasteRate).toBe(0);
    expect(s.categories).toEqual([]);
  });
});

describe("compareWeeks", () => {
  it("前週との差（金額と体脂肪率のポイント差）を返す", () => {
    const prev = summarizeWeek(
      [{ date: "2026-09-29", amount: 2000, type: "waste" }],
      { start: "2026-09-28", end: "2026-10-04" }
    );
    const cur = summarizeWeek(txs, range);
    const c = compareWeeks(cur, prev);
    expect(c?.totalDiff).toBe(-500);
    expect(c?.wasteRateDiffPoints).toBeCloseTo(-80, 5);
  });

  it("前週に記録がなければ比較しない", () => {
    const prev = summarizeWeek([], { start: "2026-09-28", end: "2026-10-04" });
    expect(compareWeeks(summarizeWeek(txs, range), prev)).toBeNull();
  });
});

describe("pickTopWaste", () => {
  const entries: WasteEntry[] = [
    { id: "a", date: "2026-10-05", amount: 300, type: "waste" },
    { id: "b", date: "2026-10-06", amount: 900, type: "waste", memo: "ガチャ" },
    { id: "c", date: "2026-10-07", amount: 5000, type: "necessary" },
    { id: "d", date: "2026-10-08", amount: 600, type: "waste" },
    { id: "e", date: "2026-10-09", amount: 100, type: "waste" },
    { id: "f", date: "2026-10-20", amount: 9999, type: "waste" }, // 範囲外
    { id: "g", date: "2026-10-10", amount: 600, type: "waste" },
  ];

  it("範囲内のムダだけを金額の大きい順に上位N件返す", () => {
    expect(pickTopWaste(entries, range).map((t) => t.id)).toEqual([
      "b",
      "g",
      "d",
    ]);
  });

  it("同額なら日付の新しいものを先にする", () => {
    const ids = pickTopWaste(entries, range, 5).map((t) => t.id);
    expect(ids.indexOf("g")).toBeLessThan(ids.indexOf("d"));
  });

  it("ムダがなければ空配列", () => {
    expect(pickTopWaste([entries[2]], range)).toEqual([]);
  });
});
