"use client";

import { useState } from "react";
import { BudgetSheet } from "@/components/shared/BudgetSheet";
import { useLiveQuery } from "dexie-react-hooks";
import { getSettings } from "@/lib/db";
import { formatYen } from "@/lib/format";

/** 目標予算。ホーム画面の設定シートと同じ設定値（Settings.monthlyBudget）を共有する */
export function BudgetSection() {
  // 読み込み中（undefined）に「未設定」と一瞬出ないよう、useSettings の初期値は使わない
  const settings = useLiveQuery(() => getSettings(), []);
  const [open, setOpen] = useState(false);
  const loaded = settings !== undefined;
  const budget = settings?.monthlyBudget ?? 0;

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-sm">
      <h2 className="font-heading text-[1rem] font-bold text-ink">目標予算</h2>
      <p className="mt-1 text-xs text-ink-soft">1ヶ月の支出の目標です</p>

      <div className="mt-3 flex items-center justify-between gap-3">
        {!loaded ? (
          <p className="h-9" aria-busy />
        ) : budget > 0 ? (
          <p className="font-heading text-3xl font-bold tabular-nums text-ink">
            {formatYen(budget)}
          </p>
        ) : (
          <p className="text-sm font-bold text-ink-soft">未設定</p>
        )}
        <button
          type="button"
          disabled={!loaded}
          onClick={() => setOpen(true)}
          className="h-12 shrink-0 rounded-2xl bg-mint px-5 font-bold text-white shadow-sm active:scale-95 transition-transform disabled:opacity-40"
        >
          {budget > 0 ? "変更" : "設定する"}
        </button>
      </div>

      {open && <BudgetSheet initialBudget={budget} onClose={() => setOpen(false)} />}
    </section>
  );
}
