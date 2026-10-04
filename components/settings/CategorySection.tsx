"use client";

import { useState } from "react";
import { useCategories } from "@/lib/hooks/useCategories";
import {
  CATEGORY_NAME_MAX_LENGTH,
  addCategory,
  moveCategory,
  renameCategory,
  validateCategoryName,
} from "@/lib/db";
import type { Category } from "@/types";
import { CategoryDeleteSheet } from "./CategoryDeleteSheet";

const iconButton =
  "flex h-11 w-11 items-center justify-center rounded-full text-lg text-ink-soft active:bg-base disabled:opacity-25";

/** カテゴリの追加・名前の変更・並び替え・削除 */
export function CategorySection() {
  const categories = useCategories() ?? [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  async function handleAdd() {
    const result = validateCategoryName(newName, categories);
    if (result.error !== undefined) return setError(result.error);
    await addCategory(result.name);
    setNewName("");
    setError(null);
  }

  async function handleRename(category: Category) {
    const result = validateCategoryName(editName, categories, category.id);
    if (result.error !== undefined) return setError(result.error);
    if (result.name !== category.name) await renameCategory(category.id, result.name);
    setEditingId(null);
    setError(null);
  }

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-sm">
      <h2 className="font-heading text-[1rem] font-bold text-ink">カテゴリ</h2>
      <p className="mt-1 text-xs text-ink-soft">
        ▲▼で並び替えると、記録画面の選択肢の順番も変わります
      </p>

      <ul className="mt-3 flex flex-col">
        {categories.map((category, index) => (
          <li
            key={category.id}
            className="flex items-center gap-1 border-b border-border py-1 last:border-b-0"
          >
            {editingId === category.id ? (
              <>
                <input
                  autoFocus
                  value={editName}
                  maxLength={CATEGORY_NAME_MAX_LENGTH}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRename(category)}
                  aria-label="カテゴリ名"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-base px-3 text-ink outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRename(category)}
                  className="h-11 rounded-xl bg-mint px-4 text-sm font-bold text-white"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setError(null);
                  }}
                  className="h-11 px-2 text-sm text-ink-soft"
                >
                  戻る
                </button>
              </>
            ) : (
              <>
                <span className="min-w-0 flex-1 truncate pl-1 font-bold text-ink">
                  {category.name}
                </span>
                <button
                  type="button"
                  aria-label={`${category.name}を上へ`}
                  disabled={index === 0}
                  onClick={() => moveCategory(category.id, -1)}
                  className={iconButton}
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label={`${category.name}を下へ`}
                  disabled={index === categories.length - 1}
                  onClick={() => moveCategory(category.id, 1)}
                  className={iconButton}
                >
                  ▼
                </button>
                <button
                  type="button"
                  aria-label={`${category.name}の名前を変更`}
                  onClick={() => {
                    setEditingId(category.id);
                    setEditName(category.name);
                    setError(null);
                  }}
                  className={iconButton}
                >
                  ✏️
                </button>
                <button
                  type="button"
                  aria-label={`${category.name}を削除`}
                  disabled={categories.length <= 1}
                  onClick={() => setDeleting(category)}
                  className={iconButton}
                >
                  🗑
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex gap-2">
        <input
          value={newName}
          maxLength={CATEGORY_NAME_MAX_LENGTH}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="新しいカテゴリ名"
          aria-label="新しいカテゴリ名"
          className="h-12 min-w-0 flex-1 rounded-2xl border border-border bg-base px-4 text-ink outline-none placeholder:text-ink-soft"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newName.trim()}
          className="h-12 shrink-0 rounded-2xl bg-mint px-5 font-bold text-white shadow-sm active:scale-95 transition-transform disabled:opacity-40"
        >
          追加
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm font-bold text-waste">
          {error}
        </p>
      )}

      {deleting && (
        <CategoryDeleteSheet
          category={deleting}
          others={categories.filter((c) => c.id !== deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </section>
  );
}
