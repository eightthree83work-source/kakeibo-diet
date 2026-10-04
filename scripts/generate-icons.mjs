// アプリアイコンとスプラッシュ画面（iOS）の PNG を生成する。
//   npm run icons
// デザインを変えたときだけ実行し、生成された PNG をコミットする（ビルド時には実行しない）。
// フォントに依存しないよう、文字は使わず図形だけで描く。
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const MINT = "#3dbd93";
const MINT_LIGHT = "#4fd0a5";
const MINT_DARK = "#2a9b77";

/** 512x512 の座標系で描いた、背景なしのコイン＋体重計ダイヤル */
const ART = `
  <circle cx="256" cy="256" r="186" fill="none" stroke="#fff" stroke-opacity="0.78"
          stroke-width="14" stroke-dasharray="3 13.23"/>
  <circle cx="256" cy="256" r="150" fill="#fff"/>
  <circle cx="256" cy="256" r="124" fill="none" stroke="#c9f0e1" stroke-width="10"/>
  <g fill="none" stroke="${MINT_DARK}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="202,190 256,262 310,190"/>
    <line x1="256" y1="262" x2="256" y2="336"/>
    <line x1="214" y1="282" x2="298" y2="282"/>
    <line x1="214" y1="310" x2="298" y2="310"/>
  </g>`;

const GRADIENT = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${MINT_LIGHT}"/>
      <stop offset="1" stop-color="${MINT}"/>
    </linearGradient>
  </defs>`;

/** 全面ミントのアイコン。iOS・Androidの丸め／マスクは端末側がかけるので、角丸にはしない */
function iconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    ${GRADIENT}<rect width="512" height="512" fill="url(#bg)"/>${ART}</svg>`;
}

/** スプラッシュ画面。ミント一色の中央にコインを置く */
function splashSvg(width, height) {
  const size = width * 0.44;
  const scale = size / 512;
  const x = width / 2 - 256 * scale;
  const y = height / 2 - 256 * scale - height * 0.02;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="${MINT}"/>
    <g transform="translate(${x} ${y}) scale(${scale})">${ART}</g></svg>`;
}

/** size を渡すと正方形のアイコン、width/height を渡すと指定ピクセル数ちょうどの画像にする */
async function writePng(svg, outPath, { width, height, palette = false }) {
  mkdirSync(dirname(outPath), { recursive: true });
  await sharp(Buffer.from(svg), { density: 384 })
    .resize(width, height)
    .png({ compressionLevel: 9, palette })
    .toFile(outPath);
  console.log("wrote", outPath.replace(root, "").replaceAll("\\", "/"), `${width}x${height}`);
}

// manifest 用（Android など）
for (const [file, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["icon-maskable-512.png", 512],
]) {
  await writePng(iconSvg(), join(root, "public/icons", file), { width: size, height: size });
}
// ファビコンと iOS のホーム画面アイコン（app/ に置くと Next.js が <link> を自動で付ける）
await writePng(iconSvg(), join(root, "app/icon.png"), { width: 192, height: 192 });
await writePng(iconSvg(), join(root, "app/apple-icon.png"), { width: 180, height: 180 });

// iOS のスプラッシュ画面。機種ごとの画面サイズ（px）に合わせた画像が必要
// 機種の一覧は lib/pwa/splashScreens.mjs（app/layout.tsx と共通）
const { SPLASH_SCREENS } = await import(
  new URL("../lib/pwa/splashScreens.mjs", import.meta.url).href
);
for (const s of SPLASH_SCREENS) {
  const width = s.cssWidth * s.ratio;
  const height = s.cssHeight * s.ratio;
  await writePng(
    splashSvg(width, height),
    join(root, "public/splash", `${s.cssWidth}x${s.cssHeight}@${s.ratio}.png`),
    { width, height, palette: true }
  );
}
