import { createSerwistRoute } from "@serwist/turbopack";

/** Service Worker のキャッシュ更新の目印。デプロイごとに変わる値を使う */
const revision =
  process.env.VERCEL_GIT_COMMIT_SHA ?? Date.now().toString();

/**
 * オフラインでも開けるようにあらかじめ保存しておく画面。
 * 静的ファイル（JS/CSS/フォント）は Serwist がビルド結果から自動で集める。
 */
const PRECACHED_PAGES = ["/", "/home", "/report", "/settings", "/offline"];

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: PRECACHED_PAGES.map((url) => ({ url, revision })),
    swSrc: "app/sw.ts",
    // 初期設定は public/ 全体（iOS 用のスプラッシュ画像など端末に不要なもの）まで保存し、
    // フォント（Noto Sans JP は約380個に分割されていて、全部で約10MB）は事前には保存しない。
    // 実際に使われたものだけを、Service Worker の実行時キャッシュ（static-font-assets）が保存する。
    // そのため保存するファイルを自分で指定する
    globPatterns: [
      ".next/static/**/*.{js,css,html,ico,png,svg,webp,json,webmanifest}",
      "public/icons/**/*",
    ],
    useNativeEsbuild: true,
  });
