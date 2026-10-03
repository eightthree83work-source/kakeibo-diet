import { db } from "./schema";
import { generateId } from "./uuid";
import type { Category } from "@/types";

export function getAllCategories(): Promise<Category[]> {
  return db.categories.orderBy("order").toArray();
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

export async function deleteCategory(id: string): Promise<void> {
  await db.categories.delete(id);
}
