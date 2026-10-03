import { db } from "./schema";
import { generateId } from "./uuid";
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "@/types";

let initialized: Promise<void> | null = null;

/** 初回起動時にデフォルトカテゴリ・設定を投入する。何度呼んでも安全。 */
export function ensureSeeded(): Promise<void> {
  if (!initialized) {
    initialized = db.transaction(
      "rw",
      db.categories,
      db.settings,
      async () => {
        const categoryCount = await db.categories.count();
        if (categoryCount === 0) {
          await db.categories.bulkAdd(
            DEFAULT_CATEGORIES.map((c) => ({ ...c, id: generateId() }))
          );
        }

        const settings = await db.settings.get("singleton");
        if (!settings) {
          await db.settings.add(DEFAULT_SETTINGS);
        }
      }
    );
  }
  return initialized;
}
