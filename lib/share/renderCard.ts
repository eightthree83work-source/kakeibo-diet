import { toBlob } from "html-to-image";
import { CARD_FONT_SPECS } from "./cardFonts";
import { buildFontEmbedCSS } from "./fontEmbed";
import { CARD_HEIGHT, CARD_WIDTH } from "./cardSize";


/** Chromium 系以外（Safari など）は、1回目の描画でフォントや図形が抜けることがあるため、空描画を1回挟む */
function needsWarmUp(): boolean {
  return !(navigator as Navigator & { userAgentData?: unknown }).userAgentData;
}

/**
 * 画面上にある（画面外でもよい）カードの DOM を、1080×1350 の PNG にする。
 * 日本語フォントは、カードに出ている文字を含む分割ファイルだけを埋め込む。
 */
export async function renderCardToBlob(node: HTMLElement): Promise<Blob> {
  await document.fonts.ready;
  const fontEmbedCSS = await buildFontEmbedCSS(node.textContent ?? "", CARD_FONT_SPECS);

  const options = {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    pixelRatio: 1,
    backgroundColor: "#fffbf5",
    fontEmbedCSS,
    cacheBust: false,
  };

  if (needsWarmUp()) {
    await toBlob(node, options).catch(() => null);
  }
  const blob = await toBlob(node, options);
  if (!blob || blob.size === 0) throw new Error("画像を作れませんでした");
  return blob;
}
