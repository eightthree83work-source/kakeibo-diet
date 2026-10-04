// iOS のスプラッシュ画面（apple-touch-startup-image）の対象機種。
// 画像の生成スクリプト（scripts/generate-icons.mjs）と app/layout.tsx の両方から使うため .mjs にしている。
// cssWidth / cssHeight は縦向きの画面サイズ（CSS px）、ratio は devicePixelRatio。
export const SPLASH_SCREENS = [
  { cssWidth: 440, cssHeight: 956, ratio: 3 }, // iPhone 16 Pro Max / 17 Pro Max
  { cssWidth: 420, cssHeight: 912, ratio: 3 }, // iPhone Air
  { cssWidth: 430, cssHeight: 932, ratio: 3 }, // 16 Plus / 15 Plus / 15 Pro Max / 14 Pro Max
  { cssWidth: 402, cssHeight: 874, ratio: 3 }, // 16 Pro / 17 / 17 Pro
  { cssWidth: 393, cssHeight: 852, ratio: 3 }, // 16 / 15 / 15 Pro / 14 Pro
  { cssWidth: 428, cssHeight: 926, ratio: 3 }, // 14 Plus / 13 Pro Max / 12 Pro Max
  { cssWidth: 390, cssHeight: 844, ratio: 3 }, // 14 / 13 / 13 Pro / 12 / 12 Pro
  { cssWidth: 375, cssHeight: 812, ratio: 3 }, // 13 mini / 12 mini / 11 Pro / XS / X
  { cssWidth: 414, cssHeight: 896, ratio: 3 }, // 11 Pro Max / XS Max
  { cssWidth: 414, cssHeight: 896, ratio: 2 }, // 11 / XR
  { cssWidth: 414, cssHeight: 736, ratio: 3 }, // 8 Plus / 7 Plus / 6s Plus
  { cssWidth: 375, cssHeight: 667, ratio: 2 }, // SE (2/3rd) / 8 / 7 / 6s
];
