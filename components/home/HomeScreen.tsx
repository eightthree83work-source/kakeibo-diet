"use client";

import { useState } from "react";
import Link from "next/link";
import { format, getDaysInMonth } from "date-fns";
import { ja } from "date-fns/locale";
import { useHomeSummary } from "@/lib/hooks/useHomeSummary";
import { formatYen } from "@/lib/format";
import { TodayRemainingHero } from "./TodayRemainingHero";
import { BudgetSetupPrompt } from "./BudgetSetupPrompt";
import { WeightCard } from "./WeightCard";
import { BodyFatCard } from "./BodyFatCard";
import { BudgetSheet } from "./BudgetSheet";

export function HomeScreen() {
  const summary = useHomeSummary();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!summary) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 pt-5 pb-6" aria-busy>
        <div className="h-44 animate-pulse rounded-3xl bg-surface" />
        <div className="h-48 animate-pulse rounded-3xl bg-surface" />
        <div className="h-48 animate-pulse rounded-3xl bg-surface" />
      </div>
    );
  }

  const today = new Date();
  const daysLeft = getDaysInMonth(today) - today.getDate() + 1;
  const hasBudget = summary.monthlyBudget > 0;

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pt-5 pb-6">
      <header className="flex items-center justify-between">
        <p className="font-heading text-lg font-bold">
          {format(today, "M月d日（E）", { locale: ja })}
        </p>
        <p
          className={`rounded-full px-3 py-1 text-sm font-bold ${
            summary.streak > 0
              ? "bg-yellow-light text-ink"
              : "bg-surface text-ink-soft"
          }`}
        >
          {summary.streak > 0
            ? `🔥 ${summary.streak}日連続記録`
            : "今日から記録をはじめよう"}
        </p>
      </header>

      {hasBudget ? (
        <TodayRemainingHero
          todayRemaining={summary.todayRemaining}
          spentToday={summary.spentToday}
        />
      ) : (
        <BudgetSetupPrompt onSetup={() => setSheetOpen(true)} />
      )}

      {hasBudget ? (
        <WeightCard
          monthlyBudget={summary.monthlyBudget}
          progress={summary.progress}
          daysLeft={daysLeft}
        />
      ) : (
        <section className="rounded-3xl bg-surface p-5 shadow-sm">
          <h2 className="font-heading text-[1rem] font-bold text-ink">今月の家計体重</h2>
          <p className="mt-2 font-heading text-3xl font-bold tabular-nums">
            {formatYen(summary.progress.spent)}
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            目標予算を設定すると、目標まであといくらかを進捗バーで確認できます
          </p>
        </section>
      )}

      <BodyFatCard
        wasteRate={summary.wasteRate}
        amountByType={summary.amountByType}
      />

      {/* 片手で操作しやすいよう、主なボタンは画面の下のほうにまとめる */}
      <div className="mt-2 flex flex-col gap-2">
        <Link
          href="/"
          className="flex h-14 items-center justify-center rounded-2xl bg-mint font-heading text-lg font-bold text-white shadow-sm active:scale-95 transition-transform"
        >
          ✏️ 支出を記録する
        </Link>
        {hasBudget && (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="h-12 rounded-2xl text-sm font-bold text-ink-soft"
          >
            目標予算を変更（{formatYen(summary.monthlyBudget)}）
          </button>
        )}
      </div>

      {sheetOpen && (
        <BudgetSheet
          initialBudget={summary.monthlyBudget}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  );
}
