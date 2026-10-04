"use client";

import { useSyncExternalStore } from "react";
import { isIosDevice, shouldShowInstallHint } from "@/lib/pwa/installHint";

const DISMISSED_KEY = "kakeibo-diet:installHintDismissed";
const DISMISSED_EVENT = "kakeibo-diet:install-hint-dismissed";

function subscribe(onChange: () => void): () => void {
  window.addEventListener(DISMISSED_EVENT, onChange);
  return () => window.removeEventListener(DISMISSED_EVENT, onChange);
}

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/** 案内を出すかどうか。サーバー側（SSR）では常に false にして、表示のずれを防ぐ */
function getSnapshot(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return shouldShowInstallHint({
    isIos: isIosDevice(nav.userAgent, nav.maxTouchPoints),
    isStandalone:
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true,
    dismissed: readDismissed(),
  });
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="inline-block h-4 w-4 align-[-0.2em] text-mint-dark"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="共有ボタン"
      role="img"
    >
      <path d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}

/** iPhone の Safari で、ホーム画面への追加方法を控えめに案内する。✕で閉じたら二度と出さない */
export function InstallHint() {
  const show = useSyncExternalStore(subscribe, getSnapshot, () => false);
  if (!show) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // 保存できない環境では、そのページを開いている間だけ閉じる
    }
    window.dispatchEvent(new Event(DISMISSED_EVENT));
  }

  return (
    <aside
      aria-label="ホーム画面への追加のご案内"
      className="relative rounded-2xl border border-border bg-surface px-4 py-3 pr-12 text-xs text-ink-soft"
    >
      <p className="font-bold text-ink">📲 ホーム画面に追加すると、アプリとして使えます</p>
      <p className="mt-1 leading-relaxed">
        Safari 下の <ShareIcon /> →「ホーム画面に追加」で、全画面で起動できます。記録データも消えにくくなります。
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="案内を閉じる"
        className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-lg text-ink-soft active:bg-base"
      >
        ✕
      </button>
    </aside>
  );
}
