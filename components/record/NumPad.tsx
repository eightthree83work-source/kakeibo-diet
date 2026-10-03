"use client";

const KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "00", "0", "⌫"];

interface NumPadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
}

export function NumPad({ onDigit, onBackspace }: NumPadProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => (key === "⌫" ? onBackspace() : onDigit(key))}
          className="h-16 rounded-2xl bg-surface text-2xl font-heading font-bold text-ink shadow-sm active:scale-95 active:bg-mint-light transition-transform"
        >
          {key}
        </button>
      ))}
    </div>
  );
}
