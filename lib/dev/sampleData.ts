import { addDays, startOfWeek, subWeeks } from "date-fns";
import { db } from "@/lib/db";
import { toDateKey } from "@/lib/domain/date";
import type { DailyLog, EntryType, Transaction } from "@/types";

/** サンプル取引のIDは必ずこの接頭辞で始める（再投入時にサンプルだけを消すため） */
export const SAMPLE_ID_PREFIX = "sample-";

const SAMPLE_WEEKS = 8;

/** 乱数を固定して、毎回同じサンプルが出るようにする（mulberry32） */
function createRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const AMOUNT_RANGE: Record<EntryType, [number, number]> = {
  necessary: [250, 1800],
  satisfied: [400, 2600],
  waste: [180, 2400],
};

const MEMOS: Record<EntryType, string[]> = {
  necessary: ["ランチ", "スーパー", "電車", "ドラッグストア", ""],
  satisfied: ["カフェ", "映画", "ごほうび", "本", ""],
  waste: ["コンビニ", "ガチャ", "つい買い", "夜のスイーツ", "衝動買い", ""],
};

export interface SampleData {
  transactions: Transaction[];
  noSpendDates: string[];
}

/**
 * 今日までの過去8週分（今週を含む）のサンプルを作る。未来日は含めない。
 * 古い週ほどムダが多く、だんだん減っていく（ダイエットが進む）ように作る。
 */
export function generateSampleData(
  categoryIds: string[],
  today: Date = new Date(),
  weekStartsOn: 0 | 1 = 1
): SampleData {
  const random = createRandom(20261004);
  const pick = <T,>(items: T[]): T => items[Math.floor(random() * items.length)];
  const amountOf = (type: EntryType) => {
    const [min, max] = AMOUNT_RANGE[type];
    return Math.round((min + random() * (max - min)) / 10) * 10;
  };

  const firstDay = startOfWeek(subWeeks(today, SAMPLE_WEEKS - 1), { weekStartsOn });
  const todayKey = toDateKey(today);
  const transactions: Transaction[] = [];
  const noSpendDates: string[] = [];

  for (let day = firstDay, n = 0; toDateKey(day) <= todayKey; day = addDays(day, 1)) {
    const weekIndex = Math.floor(n / 7); // 0 = いちばん古い週
    const wasteProbability = 0.36 - (weekIndex / (SAMPLE_WEEKS - 1)) * 0.24;
    const dateKey = toDateKey(day);
    n++;

    if (random() < 0.15) {
      if (random() < 0.6) noSpendDates.push(dateKey);
      continue;
    }

    const count = 1 + Math.floor(random() * 3);
    for (let i = 0; i < count; i++) {
      const r = random();
      const type: EntryType =
        r < wasteProbability ? "waste" : r < wasteProbability + 0.25 ? "satisfied" : "necessary";
      const createdAt = day.getTime() + 9 * 3600_000 + i * 3 * 3600_000;
      transactions.push({
        id: `${SAMPLE_ID_PREFIX}${dateKey}-${i}`,
        date: dateKey,
        amount: amountOf(type),
        type,
        categoryId: categoryIds.length > 0 ? pick(categoryIds) : undefined,
        paymentMethod: pick(["paypay", "cash", "card"] as const),
        memo: pick(MEMOS[type]) || undefined,
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  return { transactions, noSpendDates };
}

/** サンプルデータを投入する。以前のサンプルは先に消す（実データの取引には触らない） */
export async function seedSampleData(): Promise<{ transactions: number }> {
  const [categories, settings] = await Promise.all([
    db.categories.orderBy("order").toArray(),
    db.settings.get("singleton"),
  ]);
  const data = generateSampleData(
    categories.map((c) => c.id),
    new Date(),
    settings?.weekStartsOn ?? 1
  );

  await db.transaction("rw", db.transactions, db.dailyLogs, async () => {
    await db.transactions.where("id").startsWith(SAMPLE_ID_PREFIX).delete();
    await db.transactions.bulkPut(data.transactions);
    await db.dailyLogs.bulkPut(
      data.noSpendDates.map((date): DailyLog => ({ date, noSpend: true }))
    );
  });
  return { transactions: data.transactions.length };
}

/** 取引と「支出なし」の記録をすべて削除する（設定・カテゴリは残す） */
export async function clearAllRecords(): Promise<void> {
  await db.transaction("rw", db.transactions, db.dailyLogs, async () => {
    await db.transactions.clear();
    await db.dailyLogs.clear();
  });
}
