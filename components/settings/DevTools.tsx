"use client";

import { useState } from "react";
import { clearAllRecords, seedSampleData } from "@/lib/dev/sampleData";

/** 開発環境専用。動作確認用のサンプルデータを投入／全削除する */
export function DevTools() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: () => Promise<string>) {
    setBusy(true);
    try {
      setMessage(await action());
    } catch (error) {
      setMessage(`失敗しました: ${error instanceof Error ? error.message : error}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border-2 border-dashed border-yellow bg-yellow-light p-5">
      <h2 className="font-heading text-[1rem] font-bold text-ink">
        🛠 開発用ツール
        <span className="ml-2 rounded-full bg-yellow px-2 py-0.5 text-xs text-ink">
          dev のみ
        </span>
      </h2>
      <p className="mt-1 text-xs text-ink-soft">
        本番ビルドでは表示されません。このブラウザ（端末）のデータだけが対象です。
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            run(async () => {
              const { transactions } = await seedSampleData();
              return `過去8週分のサンプル（取引${transactions}件）を投入しました`;
            })
          }
          className="h-14 rounded-2xl bg-mint font-bold text-white shadow-sm active:scale-95 transition-transform disabled:opacity-40"
        >
          過去8週分のサンプルデータを投入
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (
              !window.confirm(
                "取引と「支出なし」の記録をすべて削除します。（設定・カテゴリは残ります）\nよろしいですか？"
              )
            ) {
              return;
            }
            void run(async () => {
              await clearAllRecords();
              return "記録をすべて削除しました";
            });
          }}
          className="h-14 rounded-2xl bg-waste font-bold text-white shadow-sm active:scale-95 transition-transform disabled:opacity-40"
        >
          記録を全削除
        </button>
      </div>

      {message && (
        <p role="status" className="mt-3 text-center text-sm font-bold text-ink">
          {message}
        </p>
      )}
    </section>
  );
}
