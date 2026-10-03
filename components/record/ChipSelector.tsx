"use client";

import { useState } from "react";

export interface ChipOption {
  value: string;
  label: string;
}

interface ChipSelectorProps {
  prefixLabel: string;
  options: ChipOption[];
  value?: string;
  placeholder: string;
  onChange: (value: string) => void;
}

export function ChipSelector({
  prefixLabel,
  options,
  value,
  placeholder,
  onChange,
}: ChipSelectorProps) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-sm text-ink-soft shadow-sm"
      >
        <span>{prefixLabel}</span>
        <span className="font-medium text-ink">
          {selectedLabel ?? placeholder}
        </span>
        <span aria-hidden className="text-xs">
          ▾
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 rounded-2xl bg-surface p-2 shadow-sm">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            onChange(option.value);
            setOpen(false);
          }}
          className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
            option.value === value
              ? "bg-mint text-white"
              : "bg-base text-ink-soft"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
