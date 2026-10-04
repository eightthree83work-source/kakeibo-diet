"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { countTransactionsInCategory, deleteCategory } from "@/lib/db";
import type { Category } from "@/types";

interface CategoryDeleteSheetProps {
  category: Category;
  /** 付け替え先の候補（削除するカテゴリ以外） */
  others: Category[];
  onClose: () => void;
}

const UNCATEGORIZED = "";

/**
 * カテゴリ削除の確認。使用中のカテゴリでも記録は消さず、
 * 別のカテゴリへ付け替えるか、「未分類」にする（既定は未分類）。
 */
export function CategoryDeleteSheet({
  category,
  others,
  onClose,
}: CategoryDeleteSheetProps) {
  const [count, setCount] = useState<number | null>(null);
  const [moveTo, setMoveTo] = useState(UNCATEGORIZED);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    countTransactionsInCategory(category.id).then((n) => {
      if (!cancelled) setCount(n);
    });
    return () => {
      cancelled = true;
    };
  }, [category.id]);

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteCategory(category.id, moveTo || undefined);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除できませんでした");
      setBusy(false);
    }
  }

  return (
    <BottomSheet title={`「${category.name}」を削除`} onClose={onClose}>
      {count === null ? (
        <p className="mt-3 text-sm text-ink-soft">確認中…</p>
      ) : count === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">
          このカテゴリを使った記録はありません。削除しますか？
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm text-ink">
            このカテゴリの記録が <b className="tabular-nums">{count}件</b> あります。
            <b>記録は消えません。</b>削除後の扱いを選んでください。
          </p>
          <label className="mt-3 block text-sm text-ink-soft">
            記録の移動先
            <select
              value={moveTo}
              onChange={(e) => setMoveTo(e.target.value)}
              className="mt-1 block h-14 w-full rounded-2xl border border-border bg-base px-4 text-[1rem] font-bold text-ink"
            >
              <option value={UNCATEGORIZED}>未分類にする</option>
              {others.map((c) => (
                <option key={c.id} value={c.id}>
                  「{c.name}」へ移す
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm font-bold text-waste">
          {error}
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
          disabled={count === null || busy}
          onClick={handleDelete}
          className="h-14 flex-[2] rounded-2xl bg-waste font-heading text-lg font-bold text-white shadow-sm active:scale-95 transition-transform disabled:opacity-40"
        >
          削除する
        </button>
      </div>
    </BottomSheet>
  );
}
