import { format } from "date-fns";
import { fromDateKey } from "@/lib/domain/date";
import { formatYen } from "@/lib/format";
import type { WeekSummary } from "@/lib/domain/weeklyReport";

interface TrendChartProps {
  /** 古い順。最後が選択中の週 */
  weeks: WeekSummary[];
}

const CHART_HEIGHT_PX = 96;

/** 直近の週ごとの家計体重（支出）と家計体脂肪率の推移 */
export function TrendChart({ weeks }: TrendChartProps) {
  const max = Math.max(...weeks.map((w) => w.total), 1);
  const lastIndex = weeks.length - 1;

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-[1rem] font-bold text-ink">
          週ごとの推移
        </h2>
        <p className="text-xs text-ink-soft">棒：支出　数字：体脂肪率</p>
      </div>

      <ul className="mt-4 flex items-end justify-between gap-2">
        {weeks.map((week, i) => {
          const selected = i === lastIndex;
          return (
            <li
              key={week.range.start}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
              aria-label={`${week.range.start}からの週 支出${formatYen(
                week.total
              )} 体脂肪率${(week.wasteRate * 100).toFixed(1)}%`}
            >
              <span
                className={`text-xs tabular-nums ${
                  selected ? "font-bold text-ink" : "text-ink-soft"
                }`}
              >
                {week.recordCount > 0
                  ? `${(week.wasteRate * 100).toFixed(0)}%`
                  : "-"}
              </span>
              <div
                className="flex w-full items-end"
                style={{ height: CHART_HEIGHT_PX }}
              >
                <div
                  className={`w-full rounded-t-lg ${
                    selected ? "bg-mint" : "bg-mint-light"
                  }`}
                  style={{
                    height: Math.max((week.total / max) * CHART_HEIGHT_PX, 3),
                  }}
                />
              </div>
              <span className="text-[10px] tabular-nums text-ink-soft">
                {format(fromDateKey(week.range.start), "M/d")}〜
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
