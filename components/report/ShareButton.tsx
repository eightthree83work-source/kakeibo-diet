"use client";

import { useState } from "react";
import { ShareSheet } from "@/components/share/ShareSheet";

interface ShareButtonProps {
  weeksBack: number;
  /** その週に記録がない（シェアできない） */
  disabled: boolean;
}

/** 週次レポートの「計量結果をシェア」ボタン */
export function ShareButton({ weeksBack, disabled }: ShareButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="h-14 w-full rounded-2xl bg-mint font-heading text-lg font-bold text-white shadow-sm active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
      >
        📤 計量結果をシェア
      </button>
      {disabled && (
        <p className="text-xs text-ink-soft">記録がある週だけシェアできます</p>
      )}
      {open && <ShareSheet weeksBack={weeksBack} onClose={() => setOpen(false)} />}
    </div>
  );
}
