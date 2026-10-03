"use client";

import { useEffect } from "react";
import { ensureSeeded } from "@/lib/db";

/** 初回起動時にデフォルトカテゴリ・設定をIndexedDBへ投入する */
export function AppInit() {
  useEffect(() => {
    ensureSeeded();
  }, []);
  return null;
}
