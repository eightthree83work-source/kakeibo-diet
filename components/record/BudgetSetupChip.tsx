"use client";

import { useState } from "react";
import { BudgetSheet } from "@/components/shared/BudgetSheet";

/**
 * 目標予算が未設定のときに、「今日あと使える額」の代わりに出す控えめな案内。
 * 赤字にはせず、タップするとその場で設定シートが開く。
 */
export function BudgetSetupChip() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full bg-yellow-light px-3.5 py-2 text-sm font-bold text-ink active:scale-95 transition-transform"
      >
        <span aria-hidden>🎯</span>
        目標予算を設定しよう
        <span aria-hidden className="text-ink-soft">
          ›
        </span>
      </button>
      {open && <BudgetSheet initialBudget={0} onClose={() => setOpen(false)} />}
    </>
  );
}
