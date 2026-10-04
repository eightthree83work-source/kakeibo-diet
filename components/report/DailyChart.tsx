import { format } from "date-fns";
import { fromDateKey } from "@/lib/domain/date";
import { formatYen } from "@/lib/format";
import type { DaySummary } from "@/lib/domain/weeklyReport";

interface DailyChartProps {
  days: DaySummary[];
}

const CHART_HEIGHT_PX = 120;

/** 日別の支出を、必要・満足・ムダの積み上げ棒で表示する */
export function DailyChart({ days }: DailyChartProps) {
  const max = Math.max(...days.map((d) => d.total), 1);

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-sm">
      <h2 className="font-heading text-[1rem] font-bold text-ink">日別の支出</h2>

      <ul className="mt-4 flex items-end justify-between gap-1.5">
        {days.map((day) => {
          const date = fromDateKey(day.date);
          const height = (day.total / max) * CHART_HEIGHT_PX;
          return (
            <li
              key={day.date}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
              aria-label={`${format(date, "M/d")} ${formatYen(day.total)}`}
            >
              <span className="text-[10px] tabular-nums text-ink-soft">
                {day.total > 0 ? formatYen(day.total) : ""}
              </span>
              <div
                className="flex w-full flex-col-reverse justify-start"
                style={{ height: CHART_HEIGHT_PX }}
              >
                <div
                  className="flex w-full flex-col overflow-hidden rounded-t-lg"
                  style={{ height }}
                >
                  {day.byType.waste > 0 && (
                    <div
                      className="bg-waste"
                      style={{ flexGrow: day.byType.waste }}
                    />
                  )}
                  {day.byType.satisfied > 0 && (
                    <div
                      className="bg-yellow"
                      style={{ flexGrow: day.byType.satisfied }}
                    />
                  )}
                  {day.byType.necessary > 0 && (
                    <div
                      className="bg-mint"
                      style={{ flexGrow: day.byType.necessary }}
                    />
                  )}
                </div>
              </div>
              <span className="text-xs text-ink-soft">{format(date, "E")}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex justify-center gap-4 text-xs text-ink-soft">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-mint" />
          必要
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-yellow" />
          満足
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-waste" />
          ムダ
        </span>
      </div>
    </section>
  );
}
