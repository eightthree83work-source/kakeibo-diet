/** iPhone / iPad か。iPadOS は Mac と同じ UA を名乗るので、タッチ対応かどうかで見分ける */
export function isIosDevice(userAgent: string, maxTouchPoints: number): boolean {
  if (/iPhone|iPad|iPod/.test(userAgent)) return true;
  return /Macintosh/.test(userAgent) && maxTouchPoints > 1;
}

/**
 * 「ホーム画面に追加」の案内を出すか。
 * iOS の Safari などで、まだホーム画面から起動しておらず、案内を閉じてもいないときだけ出す。
 * （Android や PC のブラウザは、ブラウザ自身のインストール案内があるので出さない）
 */
export function shouldShowInstallHint(state: {
  isIos: boolean;
  isStandalone: boolean;
  dismissed: boolean;
}): boolean {
  return state.isIos && !state.isStandalone && !state.dismissed;
}
