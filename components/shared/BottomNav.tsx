"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "記録", icon: "✏️" },
  { href: "/home", label: "ホーム", icon: "🏠" },
  { href: "/report", label: "レポート", icon: "📊" },
  { href: "/settings", label: "設定", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 flex border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs ${
              active ? "text-mint font-bold" : "text-ink-soft"
            }`}
          >
            <span className="text-lg leading-none" aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
