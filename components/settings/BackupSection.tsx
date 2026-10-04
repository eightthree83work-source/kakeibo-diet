"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { format } from "date-fns";
import { createBackup, type ImportResult } from "@/lib/db";
import { parseBackup, type BackupFile } from "@/lib/domain/backup";
import { ImportSheet } from "./ImportSheet";

const LAST_EXPORT_KEY = "kakeibo-diet:lastExportAt";

const LAST_EXPORT_EVENT = "kakeibo-diet:last-export";

function subscribeLastExport(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(LAST_EXPORT_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LAST_EXPORT_EVENT, onChange);
  };
}

function readLastExport(): string | null {
  try {
    return window.localStorage.getItem(LAST_EXPORT_KEY);
  } catch {
    return null;
  }
}

function describeResult(r: ImportResult): string {
  if (r.mode === "overwrite") {
    return `上書きしました（記録${r.transactions}件・カテゴリ${r.categories}件）`;
  }
  const skipped = r.skippedTransactions > 0 ? `。重複${r.skippedTransactions}件はスキップ` : "";
  return `追加しました（記録${r.transactions}件・カテゴリ${r.categories}件）${skipped}`;
}

/** JSONでの書き出し（バックアップ）と、書き出したファイルからの復元 */
export function BackupSection() {
  const fileInput = useRef<HTMLInputElement>(null);
  // localStorage は SSR では読めないので、サーバー側のスナップショットは null にする
  const lastExportRaw = useSyncExternalStore(subscribeLastExport, readLastExport, () => null);
  const lastExportDate = lastExportRaw ? new Date(lastExportRaw) : null;
  const lastExport =
    lastExportDate && !Number.isNaN(lastExportDate.getTime()) ? lastExportDate : null;
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);

  async function handleExport() {
    try {
      const backup = await createBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `kakeibo-diet-${format(new Date(), "yyyyMMdd-HHmm")}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      try {
        window.localStorage.setItem(LAST_EXPORT_KEY, new Date().toISOString());
      } catch {
        // 保存できなくても書き出し自体は成功している
      }
      window.dispatchEvent(new Event(LAST_EXPORT_EVENT));
      setMessage({
        text: `書き出しました（記録${backup.data.transactions.length}件）`,
        isError: false,
      });
    } catch (e) {
      setMessage({
        text: `書き出せませんでした（${e instanceof Error ? e.message : e}）`,
        isError: true,
      });
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const result = parseBackup(await file.text());
    if (!result.ok) {
      setMessage({ text: `読み込めませんでした: ${result.error}`, isError: true });
      return;
    }
    setMessage(null);
    setPending(result.backup);
  }

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-sm">
      <h2 className="font-heading text-[1rem] font-bold text-ink">
        バックアップ
      </h2>
      <p className="mt-1 text-xs text-ink-soft">
        データはこの端末のブラウザの中だけに保存されています。機種変更やブラウザのデータ削除に備えて、ときどき書き出しておくと安心です。
      </p>
      <p className="mt-2 text-xs font-bold tabular-nums text-ink">
        最後の書き出し：
        {lastExport ? format(lastExport, "M/d HH:mm") : "まだ書き出していません"}
      </p>

      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="h-14 rounded-2xl bg-mint font-bold text-white shadow-sm active:scale-95 transition-transform"
        >
          データを書き出す（JSON）
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="h-14 rounded-2xl bg-base font-bold text-ink shadow-sm active:scale-95 transition-transform"
        >
          バックアップから復元する
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            // 同じファイルをもう一度選べるようにする
            e.target.value = "";
          }}
        />
      </div>

      {message && (
        <p
          role={message.isError ? "alert" : "status"}
          className={`mt-3 text-sm font-bold ${message.isError ? "text-waste" : "text-mint-dark"}`}
        >
          {message.text}
        </p>
      )}

      {pending && (
        <ImportSheet
          backup={pending}
          onClose={() => setPending(null)}
          onDone={(result) => {
            setPending(null);
            setMessage({ text: describeResult(result), isError: false });
          }}
        />
      )}
    </section>
  );
}
