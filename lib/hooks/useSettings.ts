"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getSettings } from "@/lib/db";

/** 設定を返す。読み込み中は undefined（初期値を返すと、設定済みでも一瞬「未設定」に見えてしまう） */
export function useSettings() {
  return useLiveQuery(() => getSettings(), []);
}
