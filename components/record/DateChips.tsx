"use client";

import { useState } from "react";
import { subDays } from "date-fns";
import { clampToToday, labelForDateKey, toDateKey } from "@/lib/domain/date";

interface DateChipsProps {
  /** 選ばれた記録日。null は「今日」（日付をまたいでも常に今日になる） */
  value: string | null;
  onChange: (dateKey: string | null) => void;
}

/** 記録日のチップ。「昨日」はワンタップ、それ以前は下から出るシートで選ぶ */
export function DateChips({ value, onChange }: DateChipsProps) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const todayKey = toDateKey(today);
  const yesterdayKey = toDateKey(subDays(today, 1));
  const effective = value ?? todayKey;

  function select(dateKey: string) {
    const clamped = clampToToday(dateKey, today);
    onChange(clamped === todayKey ? null : clamped);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm shadow-sm ${
          value ? "bg-yellow-light text-ink-soft" : "bg-surface text-ink-soft"
        }`}
      >
        <span>日付</span>
        <span className="font-medium text-ink">
          {labelForDateKey(effective, today)}
        </span>
        <span aria-hidden className="text-xs">
          ▾
        </span>
      </button>

      {value ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded-full bg-mint-light px-3 py-1.5 text-sm font-bold text-mint-dark shadow-sm"
        >
          今日に戻す
        </button>
      ) : (
        <button
          type="button"
          onClick={() => select(yesterdayKey)}
          className="rounded-full bg-surface px-3 py-1.5 text-sm text-ink-soft shadow-sm"
        >
          昨日
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="date-sheet-title"
            className="w-full max-w-md rounded-t-3xl bg-surface px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="date-sheet-title"
              className="font-heading text-lg font-bold text-ink"
            >
              記録する日付
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { key: todayKey, label: "今日" },
                { key: yesterdayKey, label: "昨日" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    select(key);
                    setOpen(false);
                  }}
                  className={`h-14 rounded-2xl font-heading text-lg font-bold ${
                    effective === key ? "bg-mint text-white" : "bg-base text-ink-soft"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <label className="mt-4 block text-sm text-ink-soft">
              もっと前の日付
              <input
                type="date"
                max={todayKey}
                value={effective}
                onChange={(e) => {
                  if (!e.target.value) return;
                  select(e.target.value);
                }}
                className="mt-1 block h-14 w-full rounded-2xl border border-border bg-base px-4 text-lg font-bold text-ink"
              />
            </label>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 h-14 w-full rounded-2xl bg-mint font-heading text-lg font-bold text-white shadow-sm active:scale-95 transition-transform"
            >
              {labelForDateKey(effective, today)}に記録する
            </button>
          </div>
        </div>
      )}
    </>
  );
}
