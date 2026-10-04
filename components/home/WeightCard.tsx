import { ProgressBar } from "./ProgressBar";
import { formatYen } from "@/lib/format";
import type { BudgetProgress } from "@/lib/domain/budgetProgress";

interface WeightCardProps {
  monthlyBudget: number;
  progress: BudgetProgress;
  daysLeft: number;
}

/** 家計体重（今月の支出合計）を目標予算に対する進捗バーで表示する */
export function WeightCard({ monthlyBudget, progress, daysLeft }: WeightCardProps) {
  const { spent, remaining, usedRatio, elapsedRatio } = progress;
  const over = remaining < 0;
  // 月の経過ペースより早く使っていたら黄色、超えたら赤
  const fillClassName = over
    ? "bg-waste"
    : usedRatio > elapsedRatio
      ? "bg-yellow"
      : "bg-mint";

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-[1rem] font-bold text-ink">今月の家計体重</h2>
        <p className="text-xs text-ink-soft">残り{daysLeft}日</p>
      </div>

      <p className="mt-2 font-heading text-3xl font-bold tabular-nums">
        {formatYen(spent)}
        <span className="ml-1.5 text-sm font-medium text-ink-soft">
          / 目標 {formatYen(monthlyBudget)}
        </span>
      </p>

      <div className="mt-3">
        <ProgressBar
          ratio={usedRatio}
          markerRatio={elapsedRatio}
          fillClassName={fillClassName}
          label="目標予算に対する今月の支出"
        />
        <div className="mt-1.5 flex justify-between text-xs text-ink-soft">
          <span>{Math.round(usedRatio * 100)}% 使用</span>
          <span>｜ 今日までの目安 {Math.round(elapsedRatio * 100)}%</span>
        </div>
      </div>

      <p
        className={`mt-3 rounded-2xl px-3 py-2 text-center text-sm font-bold ${
          over ? "bg-waste-light text-waste" : "bg-base text-ink"
        }`}
      >
        {over ? (
          <>目標を {formatYen(-remaining)} オーバー</>
        ) : (
          <>
            目標まであと{" "}
            <span className="font-heading text-lg text-mint-dark tabular-nums">
              {formatYen(remaining)}
            </span>
          </>
        )}
      </p>
    </section>
  );
}
