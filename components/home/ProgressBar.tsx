interface ProgressBarProps {
  /** 0〜1。1を超える値は満タンとして描画する */
  ratio: number;
  /** 塗り部分の色クラス */
  fillClassName: string;
  /** 目安位置（0〜1）。指定すると縦線のマーカーを表示する */
  markerRatio?: number;
  label: string;
}

export function ProgressBar({
  ratio,
  fillClassName,
  markerRatio,
  label,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(ratio, 0), 1);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      className="relative h-4 w-full overflow-hidden rounded-full bg-border"
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${fillClassName}`}
        style={{ width: `${clamped * 100}%` }}
      />
      {markerRatio !== undefined && (
        <div
          aria-hidden
          className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-ink/60"
          style={{ left: `${Math.min(Math.max(markerRatio, 0), 1) * 100}%` }}
        />
      )}
    </div>
  );
}
