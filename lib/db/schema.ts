import Dexie, { type EntityTable } from "dexie";
import type { Category, DailyLog, Settings, Transaction } from "@/types";

export class KakeiboDB extends Dexie {
  transactions!: EntityTable<Transaction, "id">;
  categories!: EntityTable<Category, "id">;
  dailyLogs!: EntityTable<DailyLog, "date">;
  settings!: EntityTable<Settings, "id">;

  constructor() {
    super("kakeibo-diet");
    this.version(1).stores({
      transactions: "id, date, type, categoryId",
      categories: "id, order",
      dailyLogs: "date",
      settings: "id",
    });
  }
}

export const db = new KakeiboDB();
