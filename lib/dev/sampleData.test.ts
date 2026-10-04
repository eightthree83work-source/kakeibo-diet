import { describe, expect, it } from "vitest";
import { clearAllRecords, generateSampleData, seedSampleData, SAMPLE_ID_PREFIX } from "./sampleData";
import { db, ensureSeeded } from "@/lib/db";
import { toDateKey } from "@/lib/domain/date";
import { getLastNWeekRanges } from "@/lib/domain/weekRange";
import { summarizeWeek } from "@/lib/domain/weeklyReport";

const today = new Date(2026, 9, 10); // 2026-10-10 (土)

describe("generateSampleData", () => {
  const data = generateSampleData(["c1", "c2"], today, 1);

  it("未来日を含まず、8週目の月曜（8/17）から今日までに収まる", () => {
    const dates = data.transactions.map((t) => t.date).sort();
    expect(dates[0] >= "2026-08-17").toBe(true);
    expect(dates[dates.length - 1] <= toDateKey(today)).toBe(true);
  });

  it("IDはすべてサンプルの接頭辞で始まり、重複しない", () => {
    const ids = data.transactions.map((t) => t.id);
    expect(ids.every((id) => id.startsWith(SAMPLE_ID_PREFIX))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("毎回同じ内容になる", () => {
    expect(generateSampleData(["c1", "c2"], today, 1)).toEqual(data);
  });

  it("8週すべてに支出があり、ムダの割合は後半の週ほど低くなる", () => {
    const ranges = getLastNWeekRanges(today, 8, 1);
    const weeks = ranges.map((r) => summarizeWeek(data.transactions, r));
    expect(weeks.every((w) => w.recordCount > 0)).toBe(true);
    const first = weeks.slice(0, 3).reduce((s, w) => s + w.wasteRate, 0) / 3;
    const last = weeks.slice(-3).reduce((s, w) => s + w.wasteRate, 0) / 3;
    expect(last).toBeLessThan(first);
  });

  it("「支出なし」の日には取引がない", () => {
    const txDates = new Set(data.transactions.map((t) => t.date));
    expect(data.noSpendDates.some((d) => txDates.has(d))).toBe(false);
  });
});

describe("seedSampleData / clearAllRecords", () => {
  it("再投入してもサンプルは重複せず、実データは消えない。全削除で空になる", async () => {
    await ensureSeeded();
    await db.transactions.add({
      id: "real-1",
      date: toDateKey(new Date()),
      amount: 123,
      type: "necessary",
      createdAt: 1,
      updatedAt: 1,
    });

    const first = await seedSampleData();
    const second = await seedSampleData();
    expect(second.transactions).toBe(first.transactions);
    expect(await db.transactions.count()).toBe(first.transactions + 1);
    expect(await db.transactions.get("real-1")).toBeDefined();

    await clearAllRecords();
    expect(await db.transactions.count()).toBe(0);
    expect(await db.dailyLogs.count()).toBe(0);
    expect(await db.categories.count()).toBeGreaterThan(0);
  });
});
