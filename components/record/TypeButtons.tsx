"use client";

import type { EntryType } from "@/types";

const TYPES: { type: EntryType; label: string; className: string }[] = [
  {
    type: "necessary",
    label: "必要",
    className: "bg-mint text-white",
  },
  {
    type: "satisfied",
    label: "満足",
    className: "bg-yellow text-ink",
  },
  {
    type: "waste",
    label: "ムダ",
    className: "bg-waste text-white",
  },
];

interface TypeButtonsProps {
  disabled: boolean;
  onSelect: (type: EntryType) => void;
}

export function TypeButtons({ disabled, onSelect }: TypeButtonsProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {TYPES.map(({ type, label, className }) => (
        <button
          key={type}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(type)}
          className={`h-16 rounded-2xl font-heading text-lg font-bold shadow-sm active:scale-95 transition-transform disabled:opacity-40 ${className}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
