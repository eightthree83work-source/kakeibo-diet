import { beforeEach, describe, expect, it } from "vitest";
import {
  addCategory,
  countTransactionsInCategory,
  deleteCategory,
  getAllCategories,
  moveCategory,
  validateCategoryName,
} from "./categories";
import { db } from "./schema";
import { ensureSeeded } from "./init";

async function addTx(id: string, categoryId?: string) {
  await db.transactions.add({
    id,
    date: "2026-10-01",
    amount: 100,
    type: "necessary",
    categoryId,
    createdAt: 1,
    updatedAt: 1,
  });
}

beforeEach(async () => {
  await db.transactions.clear();
  await db.categories.clear();
  await db.settings.clear();
  await db.categories.bulkAdd([
    { id: "a", name: "食費", isDefault: true, order: 0 },
    { id: "b", name: "日用品", isDefault: true, order: 1 },
    { id: "c", name: "趣味", isDefault: true, order: 2 },
  ]);
  await db.settings.add({ id: "singleton", monthlyBudget: 0, weekStartsOn: 1 });
});

describe("validateCategoryName", () => {
  const existing = [
    { id: "a", name: "食費", isDefault: true, order: 0 },
    { id: "b", name: "日用品", isDefault: true, order: 1 },
  ];

  it("前後の空白を除いた名前を返す", () => {
    expect(validateCategoryName("  推し活 ", existing)).toEqual({ name: "推し活" });
  });
  it("空・長すぎ・重複はエラー", () => {
    expect(validateCategoryName("  ", existing).error).toBeDefined();
    expect(validateCategoryName("あ".repeat(13), existing).error).toBeDefined();
    expect(validateCategoryName("食費", existing).error).toBeDefined();
  });
  it("自分自身と同じ名前は許可する（名前を変えずに保存したとき）", () => {
    expect(validateCategoryName("食費", existing, "a").name).toBe("食費");
  });
});

describe("moveCategory", () => {
  it("上下に入れ替えて order を振り直す", async () => {
    await moveCategory("c", -1);
    expect((await getAllCategories()).map((c) => c.id)).toEqual(["a", "c", "b"]);
    await moveCategory("a", 1);
    expect((await getAllCategories()).map((c) => c.id)).toEqual(["c", "a", "b"]);
  });
  it("端では何も起きない", async () => {
    await moveCategory("a", -1);
    await moveCategory("c", 1);
    expect((await getAllCategories()).map((c) => c.id)).toEqual(["a", "b", "c"]);
  });
});

describe("deleteCategory", () => {
  it("使用中でなければそのまま消え、order が詰まる", async () => {
    await deleteCategory("a");
    const list = await getAllCategories();
    expect(list.map((c) => [c.id, c.order])).toEqual([["b", 0], ["c", 1]]);
  });

  it("移動先を指定しなければ、取引は残して未分類にする", async () => {
    await addTx("t1", "a");
    await addTx("t2", "a");
    await addTx("t3", "b");
    expect(await countTransactionsInCategory("a")).toBe(2);

    await deleteCategory("a");
    expect((await db.transactions.get("t1"))?.categoryId).toBeUndefined();
    expect((await db.transactions.get("t2"))?.categoryId).toBeUndefined();
    expect((await db.transactions.get("t3"))?.categoryId).toBe("b");
    expect(await db.transactions.count()).toBe(3);
  });

  it("移動先を指定すると取引をそのカテゴリへ付け替える", async () => {
    await addTx("t1", "a");
    await deleteCategory("a", "c");
    expect((await db.transactions.get("t1"))?.categoryId).toBe("c");
  });

  it("前回使ったカテゴリが消えたら設定から外す／付け替え先にする", async () => {
    await db.settings.update("singleton", { lastUsedCategoryId: "a" });
    await deleteCategory("a", "b");
    expect((await db.settings.get("singleton"))?.lastUsedCategoryId).toBe("b");

    await db.settings.update("singleton", { lastUsedCategoryId: "c" });
    await deleteCategory("c");
    expect((await db.settings.get("singleton"))?.lastUsedCategoryId).toBeUndefined();
  });

  it("最後の1件は削除できない", async () => {
    await deleteCategory("a");
    await deleteCategory("b");
    await expect(deleteCategory("c")).rejects.toThrow("最低1つ");
    expect(await db.categories.count()).toBe(1);
  });

  it("存在しない／自分自身の付け替え先はエラーで、何も変わらない", async () => {
    await addTx("t1", "a");
    await expect(deleteCategory("a", "zzz")).rejects.toThrow();
    await expect(deleteCategory("a", "a")).rejects.toThrow();
    expect(await db.categories.count()).toBe(3);
    expect((await db.transactions.get("t1"))?.categoryId).toBe("a");
  });
});

describe("addCategory", () => {
  it("末尾に追加される", async () => {
    await ensureSeeded();
    const added = await addCategory("推し活");
    const list = await getAllCategories();
    expect(list[list.length - 1].id).toBe(added.id);
  });
});
