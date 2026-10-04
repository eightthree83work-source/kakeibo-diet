import { format } from "date-fns";
import { fromDateKey } from "@/lib/domain/date";
import type { WeekSummary } from "@/lib/domain/weeklyReport";

interface WasteRateTrendProps {
  /** 古い順。最後が選択中の週 */
  weeks: WeekSummary[];
}

const WIDTH = 320;
const HEIGHT = 150;
const PAD = { top: 22, right: 16, bottom: 26, left: 34 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

/** 家計体脂肪率（浪費率）の推移を折れ線で表示する。記録のない週は線を途切れさせる */
export function WasteRateTrend({ weeks }: WasteRateTrendProps) {
  const rates = weeks.map((w) => (w.recordCount > 0 ? w.wasteRate : null));
  const maxRate = Math.max(...rates.map((r) => r ?? 0));
  const yMax = Math.max(0.3, Math.ceil(maxRate * 10) / 10);

  const x = (i: number) =>
    PAD.left + (weeks.length > 1 ? (i / (weeks.length - 1)) * PLOT_W : PLOT_W / 2);
  const y = (rate: number) => PAD.top + (1 - rate / yMax) * PLOT_H;

  // 連続して記録のある週ごとに1本の線にする
  const runs: { i: number; rate: number }[][] = [];
  rates.forEach((rate, i) => {
    if (rate === null) return;
    const last = runs[runs.length - 1];
    if (last && last[last.length - 1].i === i - 1) {
      last.push({ i, rate });
    } else {
      runs.push([{ i, rate }]);
    }
  });

  const lastIndex = weeks.length - 1;
  const lastRate = rates[lastIndex];

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-[1rem] font-bold text-ink">
          家計体脂肪率の推移
        </h2>
        <p className="text-xs text-ink-soft">直近{weeks.length}週</p>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mt-3 w-full"
        role="img"
        aria-label={`直近${weeks.length}週の家計体脂肪率の推移`}
      >
        {[0, yMax / 2, yMax].map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              className="stroke-border"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={y(tick) + 3}
              textAnchor="end"
              className="fill-ink-soft"
              fontSize={10}
            >
              {Math.round(tick * 100)}%
            </text>
          </g>
        ))}

        {runs
          .filter((run) => run.length > 1)
          .map((run) => (
            <polyline
              key={run[0].i}
              points={run.map((p) => `${x(p.i)},${y(p.rate)}`).join(" ")}
              fill="none"
              className="stroke-waste"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

        {rates.map((rate, i) =>
          rate === null ? null : (
            <circle
              key={weeks[i].range.start}
              cx={x(i)}
              cy={y(rate)}
              r={i === lastIndex ? 5 : 3.5}
              className={i === lastIndex ? "fill-waste" : "fill-surface stroke-waste"}
              strokeWidth={2}
            />
          )
        )}

        {lastRate !== null && (
          <text
            x={x(lastIndex)}
            y={y(lastRate) - 10}
            textAnchor="end"
            className="fill-ink"
            fontSize={12}
            fontWeight={700}
          >
            {(lastRate * 100).toFixed(1)}%
          </text>
        )}

        {weeks.map((week, i) => (
          <text
            key={week.range.start}
            x={x(i)}
            y={HEIGHT - 8}
            textAnchor="middle"
            className={i === lastIndex ? "fill-ink" : "fill-ink-soft"}
            fontSize={9}
          >
            {format(fromDateKey(week.range.start), "M/d")}
          </text>
        ))}
      </svg>
      <p className="mt-1 text-center text-xs text-ink-soft">
        下がるほどダイエット成功。記録のない週は線がつながりません
      </p>
    </section>
  );
}
