import { formatYen } from "@/lib/format";
import {
  BODY_FAT_LEVEL_LABEL,
  bodyFatLevelOf,
  type BodyFatLevel,
} from "@/lib/domain/budgetProgress";
import { ENTRY_TYPE_LABEL, type EntryType } from "@/types";

interface BodyFatCardProps {
  wasteRate: number;
  amountByType: Record<EntryType, number>;
}

const LEVEL_STYLE: Record<BodyFatLevel, string> = {
  lean: "bg-mint-light text-mint-dark",
  normal: "bg-mint-light text-mint-dark",
  high: "bg-yellow-light text-ink",
  obese: "bg-waste-light text-waste",
};

const SEGMENTS: { type: EntryType; className: string }[] = [
  { type: "necessary", className: "bg-mint" },
  { type: "satisfied", className: "bg-yellow" },
  { type: "waste", className: "bg-waste" },
];

/** 浪費率を「家計体脂肪率」として表示する */
export function BodyFatCard({ wasteRate, amountByType }: BodyFatCardProps) {
  const total =
    amountByType.necessary + amountByType.satisfied + amountByType.waste;
  const level = bodyFatLevelOf(wasteRate);

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-[1rem] font-bold text-ink">家計体脂肪率</h2>
        <p className="text-xs text-ink-soft">今月のムダの割合</p>
      </div>

      {total === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">
          支出を記録すると、ムダの割合が体脂肪率として表示されます
        </p>
      ) : (
        <>
          <div className="mt-2 flex items-center gap-3">
            <p className="font-heading text-4xl font-bold tabular-nums">
              {(wasteRate * 100).toFixed(1)}
              <span className="ml-0.5 text-xl">%</span>
            </p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${LEVEL_STYLE[level]}`}
            >
              {BODY_FAT_LEVEL_LABEL[level]}
            </span>
          </div>

          <div
            className="mt-3 flex h-4 w-full overflow-hidden rounded-full bg-border"
            aria-hidden
          >
            {SEGMENTS.map(({ type, className }) =>
              amountByType[type] > 0 ? (
                <div
                  key={type}
                  className={className}
                  style={{ width: `${(amountByType[type] / total) * 100}%` }}
                />
              ) : null
            )}
          </div>

          <ul className="mt-3 grid grid-cols-3 gap-2 text-center">
            {SEGMENTS.map(({ type, className }) => (
              <li key={type} className="rounded-2xl bg-base px-1 py-2">
                <p className="flex items-center justify-center gap-1 text-xs text-ink-soft">
                  <span className={`inline-block h-2 w-2 rounded-full ${className}`} />
                  {ENTRY_TYPE_LABEL[type]}
                </p>
                <p className="mt-0.5 text-sm font-bold tabular-nums">
                  {formatYen(amountByType[type])}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
