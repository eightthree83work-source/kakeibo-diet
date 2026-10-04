"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { db, importBackup, type ImportMode, type ImportResult } from "@/lib/db";
import type { BackupFile } from "@/lib/domain/backup";

interface ImportSheetProps {
  backup: BackupFile;
  onClose: () => void;
  onDone: (result: ImportResult) => void;
}

const MODES: { mode: ImportMode; title: string; description: string }[] = [
  {
    mode: "merge",
    title: "追加",
    description:
      "今のデータは残して、足りない記録だけ足します。同じ記録は重複しません。設定（目標予算など）は今のまま。",
  },
  {
    mode: "overwrite",
    title: "上書き",
    description:
      "今のデータをすべて消して、バックアップの内容に置き換えます。目標予算やカテゴリも置き換わります。",
  },
];

/** バックアップの取り込み。「追加」か「上書き」を選び、確認ダイアログを経て実行する */
export function ImportSheet({ backup, onClose, onDone }: ImportSheetProps) {
  const [mode, setMode] = useState<ImportMode>("merge");
  const [confirming, setConfirming] = useState(false);
  const [currentCount, setCurrentCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    db.transactions.count().then((n) => {
      if (!cancelled) setCurrentCount(n);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { data } = backup;
  const exportedAt = backup.exportedAt ? new Date(backup.exportedAt) : null;
  const overwrite = mode === "overwrite";

  async function handleRun() {
    setBusy(true);
    setError(null);
    try {
      onDone(await importBackup(backup, mode));
    } catch (e) {
      setError(
        `取り込みに失敗しました。今のデータは変更されていません。（${
          e instanceof Error ? e.message : e
        }）`
      );
      setBusy(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <BottomSheet title="本当に取り込みますか？" onClose={() => !busy && setConfirming(false)}>
        {overwrite ? (
          <p className="mt-3 rounded-2xl bg-waste-light p-3 text-sm font-bold text-waste">
            今のデータ（記録{currentCount ?? "…"}件）をすべて消して、バックアップの
            記録{data.transactions.length}件に置き換えます。この操作は元に戻せません。
          </p>
        ) : (
          <p className="mt-3 rounded-2xl bg-base p-3 text-sm text-ink">
            今のデータに、バックアップの記録（最大{data.transactions.length}件）を追加します。
            すでにある記録は重複しません。
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm font-bold text-waste">
            {error}
          </p>
        )}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirming(false)}
            className="h-14 flex-1 rounded-2xl bg-base font-bold text-ink-soft"
          >
            戻る
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleRun}
            className={`h-14 flex-[2] rounded-2xl font-heading text-lg font-bold text-white shadow-sm active:scale-95 transition-transform disabled:opacity-40 ${
              overwrite ? "bg-waste" : "bg-mint"
            }`}
          >
            {busy ? "取り込み中…" : overwrite ? "上書きする" : "追加する"}
          </button>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet title="バックアップから復元" onClose={onClose}>
      <p className="mt-2 text-sm text-ink-soft tabular-nums">
        {exportedAt && !Number.isNaN(exportedAt.getTime())
          ? `${format(exportedAt, "yyyy/M/d HH:mm")} のバックアップ ・ `
          : ""}
        記録{data.transactions.length}件 ・ カテゴリ{data.categories.length}件
      </p>

      <div role="radiogroup" aria-label="取り込み方法" className="mt-4 flex flex-col gap-2">
        {MODES.map((m) => (
          <button
            key={m.mode}
            type="button"
            role="radio"
            aria-checked={mode === m.mode}
            onClick={() => setMode(m.mode)}
            className={`rounded-2xl border-2 p-4 text-left ${
              mode === m.mode
                ? m.mode === "overwrite"
                  ? "border-waste bg-waste-light"
                  : "border-mint bg-mint-light"
                : "border-border bg-base"
            }`}
          >
            <p className="font-heading font-bold text-ink">{m.title}</p>
            <p className="mt-1 text-xs text-ink-soft">{m.description}</p>
          </button>
        ))}
      </div>

      {overwrite && (
        <p className="mt-3 text-xs text-ink-soft">
          ※ 念のため、先に今のデータをバックアップ（書き出し）しておくと安心です。
        </p>
      )}

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
          onClick={() => setConfirming(true)}
          className="h-14 flex-[2] rounded-2xl bg-mint font-heading text-lg font-bold text-white shadow-sm active:scale-95 transition-transform"
        >
          次へ
        </button>
      </div>
    </BottomSheet>
  );
}
