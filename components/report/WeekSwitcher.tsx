import { format } from "date-fns";
import { fromDateKey } from "@/lib/domain/date";
import type { DateRange } from "@/lib/domain/weekRange";

interface WeekSwitcherProps {
  range: DateRange;
  weeksBack: number;
  canGoBack: boolean;
  onChange: (weeksBack: number) => void;
}

const navButton =
  "flex h-12 w-12 items-center justify-center rounded-full bg-surface text-xl font-bold shadow-sm active:scale-95 transition-transform disabled:opacity-30";

function weekTitle(weeksBack: number): string {
  if (weeksBack === 0) return "今週";
  if (weeksBack === 1) return "先週";
  return `${weeksBack}週前`;
}

/** 週の切り替え。親指で押しやすいよう、左右に大きなボタンを置く */
export function WeekSwitcher({
  range,
  weeksBack,
  canGoBack,
  onChange,
}: WeekSwitcherProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        aria-label="1週前へ"
        disabled={!canGoBack}
        onClick={() => onChange(weeksBack + 1)}
        className={navButton}
      >
        ‹
      </button>
      <div className="text-center">
        <h1 className="font-heading text-xl font-bold">
          {weekTitle(weeksBack)}のレポート
        </h1>
        <p className="text-xs text-ink-soft tabular-nums">
          {format(fromDateKey(range.start), "M/d")} 〜{" "}
          {format(fromDateKey(range.end), "M/d")}
          {weeksBack === 0 && "（途中経過）"}
        </p>
      </div>
      <button
        type="button"
        aria-label="1週後へ"
        disabled={weeksBack === 0}
        onClick={() => onChange(weeksBack - 1)}
        className={navButton}
      >
        ›
      </button>
    </div>
  );
}
