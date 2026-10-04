import type { FontSpec } from "./fontEmbed";

/**
 * シェア画像のフォント。
 * 画像は端末のダーク/ライトやアプリのCSS変数に左右されないよう、フォント名を直接指定する。
 * 名前は `app/layout.tsx` の next/font が `@font-face` に付ける名前と同じ。
 *
 * 画像の文字は、すべて M PLUS Rounded 1c（太さごとに別ファイルの静的フォント）にそろえる。
 * 本文用の Noto Sans JP は、太さ400・500・700が1つの可変フォントを共有していて、
 * 動作確認に使った WebKit（Safari と同系のエンジン）では、太さの指定が効かず、
 * どの太さも細く描かれた。静的フォントなら、エンジンによる差が出ない。
 */
export const FONT_HEADING = '"M PLUS Rounded 1c", sans-serif';
export const FONT_BODY = FONT_HEADING;

/** 画像に埋め込むフォントと太さ（カードで実際に使うものだけ） */
export const CARD_FONT_SPECS: FontSpec[] = [{ family: "M PLUS Rounded 1c", weights: [700, 800] }];
