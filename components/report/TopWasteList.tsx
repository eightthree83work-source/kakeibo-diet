import { format } from "date-fns";
import { fromDateKey } from "@/lib/domain/date";
import { formatYen } from "@/lib/format";
import type { WasteEntry } from "@/lib/domain/weeklyReport";

interface TopWasteListProps {
  entries: WasteEntry[];
  categoryNames: Record<string, string>;
}

const RANK_STYLE = ["bg-waste text-white", "bg-waste-light text-waste", "bg-waste-light text-waste"];

/** ムダが多かった支出の上位3件。メモがあればメモ、なければカテゴリ名を見出しにする */
export function TopWasteList({ entries, categoryNames }: TopWasteListProps) {
  return (
    <section className="rounded-3xl bg-surface p-5 shadow-sm">
      <h2 className="font-heading text-[1rem] font-bold text-ink">
        ムダが多かった支出 TOP3
      </h2>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">
          この週はムダの記録がありません。いい調子です 🎉
        </p>
      ) : (
        <ol className="mt-3 flex flex-col gap-2">
          {entries.map((entry, i) => {
            const category = entry.categoryId
              ? (categoryNames[entry.categoryId] ?? "削除済み")
              : "未分類";
            return (
              <li
                key={entry.id}
                className="flex items-center gap-3 rounded-2xl bg-base px-3 py-2.5"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${RANK_STYLE[i]}`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">
                    {entry.memo || category}
                  </p>
                  <p className="truncate text-xs text-ink-soft">
                    {format(fromDateKey(entry.date), "M/d(E)")}
                    {entry.memo ? ` ・ ${category}` : ""}
                  </p>
                </div>
                <p className="font-heading text-lg font-bold tabular-nums text-waste">
                  {formatYen(entry.amount)}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
