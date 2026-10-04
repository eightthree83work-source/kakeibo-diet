import { isIosDevice } from "@/lib/pwa/installHint";

/**
 * - shared / downloaded: 保存できた
 * - cancelled: 共有シートを自分で閉じた
 * - needs-tap: 共有シートはタップ直後にしか開けず、待ち時間のせいで拒否された。
 *   準備したファイルをそのまま、もう一度タップしてもらって `saveFile` を呼び直す
 */
export type SaveFileResult = "shared" | "downloaded" | "cancelled" | "needs-tap";

/** iPhone / iPad か、ホーム画面から起動したアプリ（standalone）か */
function prefersShareSheet(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    isIosDevice(nav.userAgent, nav.maxTouchPoints) ||
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

function download(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * ファイルを端末に保存する。
 * iPhone やホーム画面から起動したアプリでは、`<a download>` だとファイルのプレビューが
 * アプリの画面を乗っ取って戻れなくなることがあるため、共有シート（「ファイルに保存」など）を使う。
 * 共有に対応していなければダウンロードにする。
 */
export async function saveFile(file: File): Promise<SaveFileResult> {
  if (
    prefersShareSheet() &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file], title: file.name });
      return "shared";
    } catch (error) {
      // 共有シートを自分で閉じただけなら、何もしない
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        return "needs-tap";
      }
      // それ以外の失敗は、ダウンロードにフォールバックする
    }
  }
  download(file);
  return "downloaded";
}
