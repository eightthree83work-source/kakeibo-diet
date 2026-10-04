import { download } from "@/lib/saveFile";

export type ShareImageResult = "shared" | "downloaded" | "cancelled";

/** Web Share API でこのファイルを共有できる環境か（スマホの多くは true、PC の多くは false） */
export function canShareFile(file: File): boolean {
  return (
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  );
}

/**
 * 画像を共有する。共有に対応していなければ、ダウンロードにする。
 * 共有シートはタップ直後にしか開けないので、ボタンのタップから直接呼ぶこと。
 */
export async function shareImage(
  file: File,
  options: { text: string; title: string }
): Promise<ShareImageResult> {
  if (canShareFile(file)) {
    try {
      await navigator.share({ files: [file], text: options.text, title: options.title });
      return "shared";
    } catch (error) {
      // 共有シートを自分で閉じただけなら、何もしない
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      // それ以外の失敗は、ダウンロードにフォールバックする
    }
  }
  download(file);
  return "downloaded";
}
