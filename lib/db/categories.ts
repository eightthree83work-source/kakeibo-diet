import { db } from "./schema";
import { generateId } from "./uuid";
import type { Category } from "@/types";

export const CATEGORY_NAME_MAX_LENGTH = 12;

export function getAllCategories(): Promise<Category[]> {
  return db.categories.orderBy("order").toArray();
}

/** カテゴリ名を検証して整える。問題があればエラー文言を返す */
export function validateCategoryName(
  rawName: string,
  existing: Category[],
  selfId?: string
): { name: string; error?: undefined } | { name?: undefined; error: string } {
  const name = rawName.trim();
  if (!name) return { error: "名前を入力してください" };
  if (name.length > CATEGORY_NAME_MAX_LENGTH) {
    return { error: `${CATEGORY_NAME_MAX_LENGTH}文字以内で入力してください` };
  }
  if (existing.some((c) => c.id !== selfId && c.name === name)) {
    return { error: "同じ名前のカテゴリがあります" };
  }
  return { name };
}

export async function addCategory(name: string): Promise<Category> {
  const count = await db.categories.count();
  const category: Category = {
    id: generateId(),
    name,
    isDefault: false,
    order: count,
  };
  await db.categories.add(category);
  return category;
}

export async function renameCategory(id: string, name: string): Promise<void> {
  await db.categories.update(id, { name });
}

/** カテゴリを1つ上（direction=-1）または下（+1）へ動かす。端なら何もしない */
export async function moveCategory(
  id: string,
  direction: -1 | 1
): Promise<void> {
  await db.transaction("rw", db.categories, async () => {
    const list = await getAllCategories();
    const from = list.findIndex((c) => c.id === id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= list.length) return;
    [list[from], list[to]] = [list[to], list[from]];
    // 並びが重複・欠番していても直るよう、全件の order を振り直す
    await Promise.all(
      list.map((c, index) => db.categories.update(c.id, { order: index }))
    );
  });
}

/** このカテゴリを使っている取引の件数 */
export function countTransactionsInCategory(id: string): Promise<number> {
  return db.transactions.where("categoryId").equals(id).count();
}

/**
 * カテゴリを削除する。取引は消さず、`moveToId` のカテゴリへ付け替える
 * （省略時は「未分類」＝カテゴリなしにする）。最後の1件は削除できない。
 */
export async function deleteCategory(
  id: string,
  moveToId?: string
): Promise<void> {
  await db.transaction(
    "rw",
    db.categories,
    db.transactions,
    db.settings,
    async () => {
      if ((await db.categories.count()) <= 1) {
        throw new Error("カテゴリは最低1つ必要です");
      }
      if (moveToId !== undefined) {
        if (moveToId === id || !(await db.categories.get(moveToId))) {
          throw new Error("付け替え先のカテゴリが見つかりません");
        }
      }

      await db.transactions
        .where("categoryId")
        .equals(id)
        .modify((t) => {
          if (moveToId) {
            t.categoryId = moveToId;
          } else {
            delete t.categoryId;
          }
        });

      const settings = await db.settings.get("singleton");
      if (settings?.lastUsedCategoryId === id) {
        await db.settings.update("singleton", {
          lastUsedCategoryId: moveToId,
        });
      }

      await db.categories.delete(id);
      const rest = await getAllCategories();
      await Promise.all(
        rest.map((c, index) => db.categories.update(c.id, { order: index }))
      );
    }
  );
}
