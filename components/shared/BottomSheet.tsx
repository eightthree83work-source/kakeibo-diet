"use client";

import { useId, type ReactNode } from "react";

interface BottomSheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** 親指で届く画面下部に出すシート。背景をタップすると閉じる */
export function BottomSheet({ title, onClose, children }: BottomSheetProps) {
  const titleId = useId();
  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="font-heading text-lg font-bold text-ink">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
