import { subDays, subWeeks } from "date-fns";
import { getDailyLogsInRange, getSettings, getTransactionsInRange } from "@/lib/db";
import { toDateKey } from "@/lib/domain/date";
import { buildShareCardData, type ShareCardData } from "@/lib/domain/shareCard";
import { getLastNWeekRanges } from "@/lib/domain/weekRange";
import { summarizeWeek } from "@/lib/domain/weeklyReport";

/** 推移に出す週数（選んだ週を含む） */
export const SHARE_TREND_WEEKS = 8;
/** 連続記録を数えるために遡る日数 */
const STREAK_LOOKBACK_DAYS = 366;

/** `weeksBack` 週前（0 = 今週）のシェア画像用の値を、端末内のデータから作る */
export async function loadShareCardData(
  weeksBack: number,
  today: Date = new Date()
): Promise<ShareCardData> {
  const settings = await getSettings();
  // 前週との比較のため、推移より1週多く取る
  const ranges = getLastNWeekRanges(
    subWeeks(today, weeksBack),
    SHARE_TREND_WEEKS + 1,
    settings.weekStartsOn
  );
  const week = ranges[ranges.length - 1];
  const todayKey = toDateKey(today);
  const lastKey = week.end < todayKey ? week.end : todayKey;
  const lookbackStart = toDateKey(subDays(new Date(`${lastKey}T00:00:00`), STREAK_LOOKBACK_DAYS));

  const [weekTxs, recentTxs, logs] = await Promise.all([
    getTransactionsInRange(ranges[0].start, week.end),
    getTransactionsInRange(lookbackStart, lastKey),
    getDailyLogsInRange(lookbackStart, lastKey),
  ]);

  const summaries = ranges.map((range) => summarizeWeek(weekTxs, range));
  const noSpend = logs.filter((l) => l.noSpend).map((l) => l.date);

  return buildShareCardData({
    week: summaries[summaries.length - 1],
    previous: summaries[summaries.length - 2],
    trend: summaries.slice(1),
    recordedDates: new Set([...recentTxs.map((t) => t.date), ...noSpend]),
    noSpendDates: new Set(noSpend),
    weeksBack,
    today,
  });
}
