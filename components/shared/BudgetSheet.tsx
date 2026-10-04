"use client";

import { useState } from "react";
import { updateSettings } from "@/lib/db";
import { formatYen } from "@/lib/format";

const PRESETS = [30000, 50000, 80000, 100000];
const MAX_DIGITS = 8;

interface BudgetSheetProps {
  initialBudget: number;
  onClose: () => void;
}

/** 目標予算（月）を入力するボトムシート。親指で届く画面下部に表示する */
export function BudgetSheet({ initialBudget, onClose }: BudgetSheetProps) {
  const [value, setValue] = useState(
    initialBudget > 0 ? String(initialBudget) : ""
  );
  const [saving, setSaving] = useState(false);
  const budget = Number(value || "0");

  async function handleSave() {
    if (budget <= 0 || saving) return;
    setSaving(true);
    try {
      await updateSettings({ monthlyBudget: budget });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-sheet-title"
        className="w-full max-w-md rounded-t-3xl bg-surface px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="budget-sheet-title" className="font-heading text-lg font-bold">
          今月の目標予算
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          1ヶ月で使っていい金額です。ここから「今日あと使える額」を計算します。
        </p>

        <label className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-base px-4 py-3">
          <span className="font-heading text-2xl font-bold text-ink-soft">¥</span>
          <input
            autoFocus
            inputMode="numeric"
            pattern="[0-9]*"
            value={value}
            onChange={(e) =>
              setValue(e.target.value.replace(/\D/g, "").slice(0, MAX_DIGITS))
            }
            placeholder="50000"
            aria-label="目標予算（円）"
            className="w-full bg-transparent font-heading text-3xl font-bold tabular-nums outline-none placeholder:text-border"
          />
        </label>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setValue(String(preset))}
              className={`rounded-full py-2.5 text-sm font-bold ${
                budget === preset ? "bg-mint text-white" : "bg-base text-ink-soft"
              }`}
            >
              {preset / 10000}万円
            </button>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-14 flex-1 rounded-2xl bg-base font-bold text-ink-soft"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={budget <= 0 || saving}
            className="h-14 flex-[2] rounded-2xl bg-mint font-heading text-lg font-bold text-white shadow-sm active:scale-95 transition-transform disabled:opacity-40"
          >
            {budget > 0 ? `${formatYen(budget)} で設定` : "金額を入力"}
          </button>
        </div>
      </div>
    </div>
  );
}
