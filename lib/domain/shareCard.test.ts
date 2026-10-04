import { describe, expect, it } from "vitest";
import { buildShareCardData, toPercentages } from "./shareCard";
import { summarizeWeek, type ReportTransaction } from "./weeklyReport";
import { getLastNWeekRanges } from "./weekRange";

const today = new Date(2026, 9, 10); // 2026-10-10 (土)。今週は 10/5〜10/11
const ranges = getLastNWeekRanges(today, 9, 1);

function tx(date: string, amount: number, type: ReportTransaction["type"]): ReportTransaction {
  return { date, amount, type };
}

function build(txs: ReportTransaction[], opts: { weeksBack?: number; noSpend?: string[]; extraRecorded?: string[] } = {}) {
  const weeks = ranges.map((r) => summarizeWeek(txs, r));
  const week = weeks[8];
  const recorded = new Set([...txs.map((t) => t.date), ...(opts.noSpend ?? []), ...(opts.extraRecorded ?? [])]);
  return buildShareCardData({
    week,
    previous: weeks[7],
    trend: weeks.slice(1),
    recordedDates: recorded,
    noSpendDates: new Set(opts.noSpend ?? []),
    weeksBack: opts.weeksBack ?? 0,
    today,
  });
}

describe("toPercentages", () => {
  it("合計が必ず100になる", () => {
    for (const values of [[1, 1, 1], [7000, 2000, 1000], [333, 333, 334], [1, 0, 0], [5, 3, 2]]) {
      expect(toPercentages(values).reduce((a, b) => a + b, 0)).toBe(100);
    }
  });
  it("1:1:1 は 34/33/33（余りは先頭へ）", () => {
    expect(toPercentages([1, 1, 1])).toEqual([34, 33, 33]);
  });
  it("合計0は全部0", () => {
    expect(toPercentages([0, 0, 0])).toEqual([0, 0, 0]);
  });
});

describe("buildShareCardData", () => {
  const prevWeek = [tx("2026-09-30", 7000, "necessary"), tx("2026-09-30", 3000, "waste")]; // 先週 30%
  const thisWeek = [
    tx("2026-10-05", 7000, "necessary"),
    tx("2026-10-06", 2000, "satisfied"),
    tx("2026-10-07", 1000, "waste"),
  ]; // 今週 10%

  it("家計体脂肪率・判定・内訳を割合で返す", () => {
    const d = build([...prevWeek, ...thisWeek]);
    expect(d.wastePercent).toBe(10);
    expect(d.level).toBe("normal");
    expect(d.composition).toEqual({ necessary: 70, satisfied: 20, waste: 10 });
    expect(d.fewRecords).toBe(false);
  });

  it("前週比は、下がったら down・ポイント差つき", () => {
    expect(build([...prevWeek, ...thisWeek]).comparison).toEqual({ kind: "down", points: 20 });
  });

  it("前週比は、上がったら up", () => {
    const d = build([
      tx("2026-09-30", 9000, "necessary"),
      tx("2026-09-30", 1000, "waste"),
      ...thisWeek.slice(0, 2),
      tx("2026-10-07", 3000, "waste"),
    ]);
    expect(d.comparison.kind).toBe("up");
  });

  it("前週に記録がなければ none", () => {
    expect(build(thisWeek).comparison).toEqual({ kind: "none" });
  });

  it("前週と同じ割合なら same", () => {
    expect(build([tx("2026-09-30", 900, "necessary"), tx("2026-09-30", 100, "waste"), tx("2026-10-05", 900, "necessary"), tx("2026-10-05", 100, "waste")]).comparison).toEqual({ kind: "same" });
  });

  it("今週は進行中として、今日までの日数で数える", () => {
    const d = build(thisWeek);
    expect(d.partial).toBe(true);
    expect(d.elapsedDays).toBe(6); // 月〜土
    expect(d.recordedDays).toBe(3);
    expect(d.periodLabel).toBe("今週");
    expect(d.rangeText).toBe("10/5〜10/11");
  });

  it("過去の週は7日ぶんで数え、進行中ではない", () => {
    const weeks = ranges.map((r) => summarizeWeek(prevWeek, r));
    const d = buildShareCardData({
      week: weeks[7],
      previous: weeks[6],
      trend: weeks.slice(0, 8),
      recordedDates: new Set(prevWeek.map((t) => t.date)),
      noSpendDates: new Set(),
      weeksBack: 1,
      today,
    });
    expect(d.partial).toBe(false);
    expect(d.elapsedDays).toBe(7);
    expect(d.periodLabel).toBe("先週");
    expect(d.rangeText).toBe("9/28〜10/4");
  });

  it("「支出なし」の日は、取引のない日だけ数える", () => {
    const d = build([tx("2026-10-05", 500, "necessary")], { noSpend: ["2026-10-05", "2026-10-06", "2026-10-07"] });
    expect(d.noSpendDays).toBe(2);
    expect(d.recordedDays).toBe(3);
  });

  it("連続記録は、その週の最終日（進行中なら今日）時点で数える", () => {
    const d = build([tx("2026-10-08", 500, "necessary"), tx("2026-10-09", 500, "necessary"), tx("2026-10-10", 500, "necessary")], {
      extraRecorded: ["2026-10-06", "2026-10-07"],
    });
    expect(d.streakDays).toBe(5);
  });

  it("連続記録は、その週より後の記録を数えない（過去の週の最終日時点）", () => {
    const weeks = ranges.map((r) => summarizeWeek(prevWeek, r));
    const recorded = new Set(["2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07"]);
    const d = buildShareCardData({
      week: weeks[7],
      previous: weeks[6],
      trend: weeks.slice(0, 8),
      recordedDates: recorded,
      noSpendDates: new Set(),
      weeksBack: 1,
      today,
    });
    expect(d.streakDays).toBe(2); // 10/3, 10/4（週の最終日は 10/4）
  });

  it("連続記録が切れていれば0", () => {
    expect(build([tx("2026-10-05", 500, "necessary")]).streakDays).toBe(0);
  });

  it("推移は、記録のない週が null で、記録のある週が2週以上なら折れ線にできる", () => {
    const d = build([...prevWeek, ...thisWeek]);
    expect(d.trend).toHaveLength(8);
    expect(d.trend.slice(0, 6).every((v) => v === null)).toBe(true);
    expect(d.trend[6]).toBe(30);
    expect(d.trend[7]).toBe(10);
    expect(d.trendHasLine).toBe(true);
  });

  it("記録のある週が1週だけなら、折れ線にしない", () => {
    expect(build(thisWeek).trendHasLine).toBe(false);
  });

  it("記録が3件未満なら fewRecords", () => {
    expect(build([tx("2026-10-05", 500, "waste")]).fewRecords).toBe(true);
    expect(build([tx("2026-10-05", 500, "waste"), tx("2026-10-05", 500, "necessary")]).fewRecords).toBe(true);
  });

  it("ムダが0%なら zeroWaste", () => {
    const d = build([tx("2026-10-05", 500, "necessary"), tx("2026-10-06", 500, "satisfied"), tx("2026-10-07", 500, "necessary")]);
    expect(d.zeroWaste).toBe(true);
    expect(d.wastePercent).toBe(0);
    expect(d.level).toBe("lean");
  });

  it("金額を表すフィールドを持たない（割合・日数・回数だけ）", () => {
    const d = build([...prevWeek, ...thisWeek]);
    const text = JSON.stringify(d);
    // 取引の金額（7000, 2000, 1000, 3000 など）がそのまま入っていないこと
    for (const amount of ["7000", "2000", "1000", "3000", "10000"]) {
      expect(text).not.toContain(amount);
    }
    expect(Object.keys(d).sort()).toEqual(
      [
        "comparison", "composition", "elapsedDays", "fewRecords", "level", "noSpendDays", "partial",
        "periodLabel", "rangeText", "recordedDays", "streakDays", "trend", "trendHasLine",
        "wastePercent", "zeroWaste",
      ].sort()
    );
  });
});
