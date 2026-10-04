import { beforeEach, describe, expect, it } from "vitest";
import { createBackup, importBackup } from "./backup";
import { db } from "./schema";
import { parseBackup } from "@/lib/domain/backup";

async function seedLocal() {
  await Promise.all([
    db.transactions.clear(),
    db.categories.clear(),
    db.dailyLogs.clear(),
    db.settings.clear(),
  ]);
  await db.categories.bulkAdd([
    { id: "L1", name: "食費", isDefault: true, order: 0 },
    { id: "L2", name: "日用品", isDefault: true, order: 1 },
  ]);
  await db.transactions.bulkAdd([
    { id: "t1", date: "2026-10-01", amount: 500, type: "necessary", categoryId: "L1", createdAt: 1, updatedAt: 1 },
    { id: "t9", date: "2026-10-09", amount: 300, type: "waste", categoryId: "L2", createdAt: 9, updatedAt: 9 },
  ]);
  await db.dailyLogs.add({ date: "2026-10-03", noSpend: true });
  await db.settings.add({ id: "singleton", monthlyBudget: 30000, weekStartsOn: 1 });
}

function incoming() {
  const text = JSON.stringify({
    app: "kakeibo-diet",
    version: 1,
    exportedAt: "",
    data: {
      categories: [
        { id: "c1", name: "食費", isDefault: true, order: 0 },
        { id: "c2", name: "推し活", isDefault: false, order: 1 },
      ],
      transactions: [
        { id: "t1", date: "2026-10-01", amount: 500, type: "necessary", categoryId: "c1", createdAt: 1, updatedAt: 1 },
        { id: "t2", date: "2026-10-02", amount: 900, type: "waste", categoryId: "c2", createdAt: 2, updatedAt: 2 },
      ],
      dailyLogs: [{ date: "2026-10-04", noSpend: true }],
      settings: { id: "singleton", monthlyBudget: 80000, weekStartsOn: 0 },
    },
  });
  const r = parseBackup(text);
  if (!r.ok) throw new Error(r.error);
  return r.backup;
}

beforeEach(seedLocal);

describe("createBackup → parseBackup", () => {
  it("エクスポートしたものをそのまま読み込める（往復で内容が変わらない）", async () => {
    const backup = await createBackup();
    const r = parseBackup(JSON.stringify(backup));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.backup.data).toEqual(backup.data);
  });
});

describe("importBackup", () => {
  it("上書き: 端末のデータをバックアップの内容に置き換える（設定も）", async () => {
    const result = await importBackup(incoming(), "overwrite");
    expect(result.transactions).toBe(2);
    expect((await db.transactions.toArray()).map((t) => t.id).sort()).toEqual(["t1", "t2"]);
    expect((await db.categories.toArray()).map((c) => c.id).sort()).toEqual(["c1", "c2"]);
    expect((await db.dailyLogs.toArray()).map((l) => l.date)).toEqual(["2026-10-04"]);
    expect((await db.settings.get("singleton"))?.monthlyBudget).toBe(80000);
  });

  it("追加: 端末のデータと設定は残し、足りないものだけ増やす", async () => {
    const result = await importBackup(incoming(), "merge");
    expect(result).toMatchObject({ transactions: 1, categories: 1, skippedTransactions: 1 });
    expect((await db.transactions.toArray()).map((t) => t.id).sort()).toEqual(["t1", "t2", "t9"]);
    expect(await db.categories.count()).toBe(3);
    expect((await db.transactions.get("t2"))?.categoryId).toBe("c2");
    expect(await db.dailyLogs.count()).toBe(2);
    expect((await db.settings.get("singleton"))?.monthlyBudget).toBe(30000);
  });

  it("追加を2回続けても増えない", async () => {
    await importBackup(incoming(), "merge");
    const second = await importBackup(incoming(), "merge");
    expect(second).toMatchObject({ transactions: 0, categories: 0 });
    expect(await db.transactions.count()).toBe(3);
  });

  it("途中で失敗したら、上書きでも元のデータは消えない", async () => {
    const backup = incoming();
    // 検証をすり抜けた不正データ（IDの重複）を想定して、DB側の失敗を起こす
    backup.data.transactions.push({ ...backup.data.transactions[0] });
    await expect(importBackup(backup, "overwrite")).rejects.toThrow();
    expect((await db.transactions.toArray()).map((t) => t.id).sort()).toEqual(["t1", "t9"]);
    expect((await db.settings.get("singleton"))?.monthlyBudget).toBe(30000);
  });
});
