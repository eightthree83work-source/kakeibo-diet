import { describe, expect, it } from "vitest";
import { calcStreak } from "./streak";

describe("calcStreak", () => {
  it("記録が何もない場合は0", () => {
    expect(calcStreak(new Set(), new Date(2026, 9, 10))).toBe(0);
  });

  it("今日まで連続で記録している場合、その日数を返す", () => {
    const dates = new Set(["2026-10-08", "2026-10-09", "2026-10-10"]);
    expect(calcStreak(dates, new Date(2026, 9, 10))).toBe(3);
  });

  it("今日はまだ未記録でも昨日まで連続していればストリークを維持する", () => {
    const dates = new Set(["2026-10-08", "2026-10-09"]);
    expect(calcStreak(dates, new Date(2026, 9, 10))).toBe(2);
  });

  it("一昨日以前で途切れている場合はそこで止まる", () => {
    const dates = new Set(["2026-10-01", "2026-10-09", "2026-10-10"]);
    expect(calcStreak(dates, new Date(2026, 9, 10))).toBe(2);
  });

  it("昨日も今日も記録がなければ0", () => {
    const dates = new Set(["2026-10-05"]);
    expect(calcStreak(dates, new Date(2026, 9, 10))).toBe(0);
  });

  it("「今日は支出なし」の記録もストリークとしてカウントされる", () => {
    const dates = new Set(["2026-10-09", "2026-10-10"]);
    expect(calcStreak(dates, new Date(2026, 9, 10))).toBe(2);
  });
});
