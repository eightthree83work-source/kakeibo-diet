import type { Metadata, Viewport } from "next";
import { M_PLUS_Rounded_1c, Noto_Sans_JP } from "next/font/google";
import { SerwistProvider } from "@serwist/turbopack/react";
import "./globals.css";
import { AppInit } from "@/components/AppInit";
import { BottomNav } from "@/components/shared/BottomNav";
import { SPLASH_SCREENS } from "@/lib/pwa/splashScreens.mjs";

const heading = M_PLUS_Rounded_1c({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const body = Noto_Sans_JP({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const APP_NAME = "家計ダイエット";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: APP_NAME,
  description:
    "ダイエット感覚で、手間なく支出を把握して減らせる家計簿アプリ",
  // iPhone でホーム画面に追加したとき、Safari の枠なしの全画面で起動する
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
    startupImage: SPLASH_SCREENS.map((s) => ({
      url: `/splash/${s.cssWidth}x${s.cssHeight}@${s.ratio}.png`,
      media: `(device-width: ${s.cssWidth}px) and (device-height: ${s.cssHeight}px) and (-webkit-device-pixel-ratio: ${s.ratio}) and (orientation: portrait)`,
    })),
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  // ステータスバーの色を、ライト／ダークそれぞれの画面の背景にそろえる
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffbf5" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1b19" },
  ],
  // ノッチやホームバーの領域まで描画し、BottomNav の safe-area の余白を効かせる
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${heading.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-base text-ink">
        {/* 開発中は古いキャッシュが残って紛らわしいので、Service Worker は本番だけ有効にする */}
        <SerwistProvider
          swUrl="/serwist/sw.js"
          disable={process.env.NODE_ENV === "development"}
        >
          <AppInit />
          <div className="flex flex-1 flex-col mx-auto w-full max-w-md">
            {children}
          </div>
          <BottomNav />
        </SerwistProvider>
      </body>
    </html>
  );
}
