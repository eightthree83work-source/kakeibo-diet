"use client";

import { useEffect } from "react";
import { ensureSeeded } from "@/lib/db";

/** 初回起動時にデフォルトカテゴリ・設定をIndexedDBへ投入し、データを消されにくくするよう端末へ依頼する */
export function AppInit() {
  useEffect(() => {
    ensureSeeded();
    // ブラウザの容量不足やしばらく使わないときの自動削除を避けるための依頼。
    // 許可されるかは端末次第（特に iOS ではホーム画面に追加したときに通りやすい）なので、結果は使わない
    navigator.storage?.persist?.().catch(() => {});
  }, []);
  return null;
}
