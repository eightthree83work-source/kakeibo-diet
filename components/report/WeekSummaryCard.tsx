import { formatYen } from "@/lib/format";
import {
  BODY_FAT_LEVEL_LABEL,
  bodyFatLevelOf,
} from "@/lib/domain/budgetProgress";
import type { WeekComparison, WeekSummary } from "@/lib/domain/weeklyReport";

interface WeekSummaryCardProps {
  week: WeekSummary;
  comparison: WeekComparison | null;
}

/** 増減の表示。支出も体脂肪率も「減る = 良い」ので、減ったらミント、増えたら赤 */
function Delta({ value, text }: { value: number; text: string }) {
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) {
    return <span className="text-ink-soft">先週と同じ</span>;
  }
  const good = rounded < 0;
  return (
    <span className={`font-bold ${good ? "text-mint-dark" : "text-waste"}`}>
      {good ? "▼" : "▲"} {text}
    </span>
  );
}

export function WeekSummaryCard({ week, comparison }: WeekSummaryCardProps) {
  const level = bodyFatLevelOf(week.wasteRate);

  if (week.recordCount === 0) {
    return (
      <section className="rounded-3xl bg-surface p-6 text-center shadow-sm">
        <p className="text-4xl" aria-hidden>
          📝
        </p>
        <p className="mt-2 font-heading text-[1rem] font-bold text-ink">
          この週の記録はありません
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          支出を記録すると、週ごとの振り返りが表示されます
        </p>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-2 gap-3">
      <div className="rounded-3xl bg-mint-light p-4 shadow-sm">
        <h2 className="text-xs font-bold text-ink-soft">家計体重（支出）</h2>
        <p className="mt-1 font-heading text-2xl font-extrabold tabular-nums text-mint-dark">
          {formatYen(week.total)}
        </p>
        <p className="mt-2 text-xs tabular-nums">
          {comparison ? (
            <Delta
              value={comparison.totalDiff}
              text={`${formatYen(Math.abs(comparison.totalDiff))} ${
                comparison.totalDiff < 0 ? "減" : "増"
              }`}
            />
          ) : (
            <span className="text-ink-soft">先週の記録なし</span>
          )}
        </p>
      </div>

      <div className="rounded-3xl bg-surface p-4 shadow-sm">
        <h2 className="text-xs font-bold text-ink-soft">家計体脂肪率</h2>
        <p className="mt-1 font-heading text-2xl font-extrabold tabular-nums text-ink">
          {(week.wasteRate * 100).toFixed(1)}
          <span className="text-[1rem]">%</span>
        </p>
        <p className="mt-2 text-xs tabular-nums">
          {comparison ? (
            <Delta
              value={comparison.wasteRateDiffPoints}
              text={`${Math.abs(comparison.wasteRateDiffPoints).toFixed(1)}pt ${
                comparison.wasteRateDiffPoints < 0 ? "減" : "増"
              }`}
            />
          ) : (
            <span className="text-ink-soft">{BODY_FAT_LEVEL_LABEL[level]}</span>
          )}
        </p>
      </div>
    </section>
  );
}
