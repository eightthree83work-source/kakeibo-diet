import { db } from "./schema";

export async function markNoSpendDay(date: string): Promise<void> {
  await db.dailyLogs.put({ date, noSpend: true });
}

export function getDailyLogsInRange(
  startDate: string,
  endDate: string
): Promise<{ date: string; noSpend: boolean }[]> {
  return db.dailyLogs
    .where("date")
    .between(startDate, endDate, true, true)
    .toArray();
}
