import { formatYen } from "@/lib/format";
import type { CategorySummary } from "@/lib/domain/weeklyReport";

interface CategoryBreakdownProps {
  categories: CategorySummary[];
  categoryNames: Record<string, string>;
}

const MAX_ROWS = 5;

/** カテゴリ別の支出ランキング。ムダ分は赤で重ねて表示する */
export function CategoryBreakdown({
  categories,
  categoryNames,
}: CategoryBreakdownProps) {
  if (categories.length === 0) return null;

  const max = categories[0].total;
  const rows = categories.slice(0, MAX_ROWS);

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-[1rem] font-bold text-ink">
          カテゴリ別
        </h2>
        <p className="text-xs text-ink-soft">赤はムダの分</p>
      </div>

      <ul className="mt-3 flex flex-col gap-3">
        {rows.map((c) => (
          <li key={c.categoryId ?? "none"}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-bold text-ink">
                {c.categoryId ? (categoryNames[c.categoryId] ?? "削除済み") : "未分類"}
              </span>
              <span className="tabular-nums text-ink">{formatYen(c.total)}</span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-border">
              <div
                className="flex h-full overflow-hidden rounded-full"
                style={{ width: `${(c.total / max) * 100}%` }}
              >
                <div
                  className="bg-mint"
                  style={{ flexGrow: c.total - c.waste }}
                />
                {c.waste > 0 && (
                  <div className="bg-waste" style={{ flexGrow: c.waste }} />
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
