import { db } from "./schema";
import {
  BACKUP_APP_ID,
  BACKUP_VERSION,
  planMerge,
  type BackupFile,
} from "@/lib/domain/backup";
import { DEFAULT_SETTINGS } from "@/types";

export type ImportMode = "overwrite" | "merge";

export interface ImportResult {
  mode: ImportMode;
  transactions: number;
  categories: number;
  skippedTransactions: number;
}

export async function createBackup(): Promise<BackupFile> {
  const [transactions, categories, dailyLogs, settings] = await Promise.all([
    db.transactions.toArray(),
    db.categories.orderBy("order").toArray(),
    db.dailyLogs.toArray(),
    db.settings.get("singleton"),
  ]);
  return {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      transactions,
      categories,
      dailyLogs,
      settings: settings ?? DEFAULT_SETTINGS,
    },
  };
}

/**
 * バックアップを取り込む。1つのトランザクションなので、途中で失敗しても元のデータは変わらない。
 * - overwrite: 端末のデータをすべて消して、バックアップの内容に置き換える（設定も含む）
 * - merge: 端末のデータは残し、足りないものだけ追加する（設定は端末側を維持）
 */
export async function importBackup(
  backup: BackupFile,
  mode: ImportMode
): Promise<ImportResult> {
  const { data } = backup;
  return db.transaction(
    "rw",
    [db.transactions, db.categories, db.dailyLogs, db.settings],
    async () => {
      if (mode === "overwrite") {
        await Promise.all([
          db.transactions.clear(),
          db.categories.clear(),
          db.dailyLogs.clear(),
          db.settings.clear(),
        ]);
        await db.categories.bulkAdd(data.categories);
        await db.transactions.bulkAdd(data.transactions);
        await db.dailyLogs.bulkPut(data.dailyLogs);
        await db.settings.add(data.settings);
        return {
          mode,
          transactions: data.transactions.length,
          categories: data.categories.length,
          skippedTransactions: 0,
        };
      }

      const [transactions, categories, dailyLogs] = await Promise.all([
        db.transactions.toArray(),
        db.categories.toArray(),
        db.dailyLogs.toArray(),
      ]);
      const plan = planMerge({ transactions, categories, dailyLogs }, data);
      await db.categories.bulkAdd(plan.newCategories);
      await db.transactions.bulkAdd(plan.newTransactions);
      await db.dailyLogs.bulkPut(
        plan.newNoSpendDates.map((date) => ({ date, noSpend: true }))
      );
      return {
        mode,
        transactions: plan.newTransactions.length,
        categories: plan.newCategories.length,
        skippedTransactions: plan.skippedTransactions,
      };
    }
  );
}
