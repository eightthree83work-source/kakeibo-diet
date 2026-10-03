import type { Metadata } from "next";
import { M_PLUS_Rounded_1c, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { AppInit } from "@/components/AppInit";
import { BottomNav } from "@/components/shared/BottomNav";

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

export const metadata: Metadata = {
  title: "家計ダイエット",
  description:
    "ダイエット感覚で、手間なく支出を把握して減らせる家計簿アプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${heading.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-base text-ink">
        <AppInit />
        <div className="flex flex-1 flex-col mx-auto w-full max-w-md">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
