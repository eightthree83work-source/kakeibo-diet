import { describe, expect, it } from "vitest";
import {
  getLastNWeekRanges,
  getPreviousWeekRange,
  getWeekRange,
} from "./weekRange";

describe("getWeekRange", () => {
  it("月曜始まりで週の範囲を返す", () => {
    // 2026-10-10 is a Saturday
    const range = getWeekRange(new Date(2026, 9, 10), 1);
    expect(range).toEqual({ start: "2026-10-05", end: "2026-10-11" });
  });

  it("日曜始まりで週の範囲を返す", () => {
    const range = getWeekRange(new Date(2026, 9, 10), 0);
    expect(range).toEqual({ start: "2026-10-04", end: "2026-10-10" });
  });
});

describe("getPreviousWeekRange", () => {
  it("1週間前の範囲を返す", () => {
    const range = getPreviousWeekRange(new Date(2026, 9, 10), 1);
    expect(range).toEqual({ start: "2026-09-28", end: "2026-10-04" });
  });
});

describe("getLastNWeekRanges", () => {
  it("古い順にN週分の範囲を返す", () => {
    const ranges = getLastNWeekRanges(new Date(2026, 9, 10), 3, 1);
    expect(ranges).toEqual([
      { start: "2026-09-21", end: "2026-09-27" },
      { start: "2026-09-28", end: "2026-10-04" },
      { start: "2026-10-05", end: "2026-10-11" },
    ]);
  });
});
