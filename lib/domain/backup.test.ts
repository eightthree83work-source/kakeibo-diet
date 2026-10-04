import { describe, expect, it } from "vitest";
import { parseBackup, planMerge, type BackupData } from "./backup";

const base: BackupData = {
  categories: [
    { id: "c1", name: "食費", isDefault: true, order: 0 },
    { id: "c2", name: "推し活", isDefault: false, order: 1 },
  ],
  transactions: [
    { id: "t1", date: "2026-10-01", amount: 500, type: "necessary", categoryId: "c1", createdAt: 1, updatedAt: 1 },
    { id: "t2", date: "2026-10-02", amount: 900, type: "waste", categoryId: "c2", memo: "ガチャ", paymentMethod: "paypay", createdAt: 2, updatedAt: 2 },
  ],
  dailyLogs: [{ date: "2026-10-03", noSpend: true }],
  settings: { id: "singleton", monthlyBudget: 50000, weekStartsOn: 1, lastUsedCategoryId: "c1" },
};

function file(
  overrides: Record<string, unknown> = {},
  data: Partial<Record<keyof BackupData, unknown>> = {}
) {
  return JSON.stringify({
    app: "kakeibo-diet",
    version: 1,
    exportedAt: "2026-10-04T00:00:00.000Z",
    data: { ...base, ...data },
    ...overrides,
  });
}

describe("parseBackup", () => {
  it("正しいバックアップを読み込める", () => {
    const r = parseBackup(file());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.backup.data).toEqual(base);
  });

  it.each([
    ["JSONでない", "これはJSONではない", "JSON"],
    ["別アプリのファイル", file({ app: "other" }), "バックアップファイルではありません"],
    ["未来のバージョン", file({ version: 99 }), "新しい形式"],
    ["データなし", JSON.stringify({ app: "kakeibo-diet", version: 1 }), "データがありません"],
    ["日付が不正", file({}, { transactions: [{ ...base.transactions[0], date: "10/1" }] }), "日付"],
    ["金額がマイナス", file({}, { transactions: [{ ...base.transactions[0], amount: -1 }] }), "金額"],
    ["種類が不正", file({}, { transactions: [{ ...base.transactions[0], type: "foo" }] }), "種類"],
    ["取引IDの重複", file({}, { transactions: [base.transactions[0], base.transactions[0]] }), "重複"],
    ["カテゴリが空", file({}, { categories: [] }), "カテゴリが1つも"],
    ["週の始まりが不正", file({}, { settings: { ...base.settings, weekStartsOn: 3 } }), "週の始まり"],
  ])("拒否する: %s", (_name, text, message) => {
    const r = parseBackup(text);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(message);
  });

  it("存在しないカテゴリを指す取引は未分類として読む", () => {
    const r = parseBackup(
      file({}, { transactions: [{ ...base.transactions[0], categoryId: "zzz" }] })
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.backup.data.transactions[0].categoryId).toBeUndefined();
  });
});

describe("planMerge", () => {
  const local: Pick<BackupData, "transactions" | "categories" | "dailyLogs"> = {
    categories: [
      { id: "L1", name: "食費", isDefault: true, order: 0 },
      { id: "L2", name: "日用品", isDefault: true, order: 1 },
    ],
    transactions: [
      { id: "t1", date: "2026-10-01", amount: 500, type: "necessary", createdAt: 1, updatedAt: 1 },
    ],
    dailyLogs: [{ date: "2026-10-03", noSpend: true }],
  };

  it("同名カテゴリは端末側へ寄せ、新しい名前のカテゴリだけ作る", () => {
    const plan = planMerge(local, base);
    expect(plan.newCategories).toEqual([
      { id: "c2", name: "推し活", isDefault: false, order: 2 },
    ]);
    expect(plan.newTransactions.find((t) => t.id === "t2")?.categoryId).toBe("c2");
  });

  it("同名カテゴリの取引は端末側のIDに付け替える", () => {
    const plan = planMerge({ ...local, transactions: [] }, base);
    expect(plan.newTransactions.find((t) => t.id === "t1")?.categoryId).toBe("L1");
  });

  it("IDが同じ取引と、すでにある「支出なし」はスキップする", () => {
    const plan = planMerge(local, base);
    expect(plan.newTransactions.map((t) => t.id)).toEqual(["t2"]);
    expect(plan.skippedTransactions).toBe(1);
    expect(plan.newNoSpendDates).toEqual([]);
  });
});
