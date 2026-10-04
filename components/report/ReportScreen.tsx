"use client";

import { useState } from "react";
import { MAX_WEEKS_BACK, useWeeklyReport } from "@/lib/hooks/useWeeklyReport";
import { WeekSwitcher } from "./WeekSwitcher";
import { WeekSummaryCard } from "./WeekSummaryCard";
import { DailyChart } from "./DailyChart";
import { WasteRateTrend } from "./WasteRateTrend";
import { TopWasteList } from "./TopWasteList";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { ShareButton } from "./ShareButton";

export function ReportScreen() {
  const [weeksBack, setWeeksBack] = useState(0);
  const report = useWeeklyReport(weeksBack);

  if (!report) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 pt-5 pb-6" aria-busy>
        <div className="h-14 animate-pulse rounded-3xl bg-surface" />
        <div className="h-28 animate-pulse rounded-3xl bg-surface" />
        <div className="h-52 animate-pulse rounded-3xl bg-surface" />
      </div>
    );
  }

  const { current, comparison, trend, topWaste, categoryNames } = report;
  const hasRecords = current.recordCount > 0;

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pt-5 pb-6">
      <WeekSwitcher
        range={current.range}
        weeksBack={weeksBack}
        canGoBack={weeksBack < MAX_WEEKS_BACK}
        onChange={setWeeksBack}
      />
      <WeekSummaryCard week={current} comparison={comparison} />
      <ShareButton weeksBack={weeksBack} disabled={!hasRecords} />
      {hasRecords && <DailyChart days={current.days} />}
      <WasteRateTrend weeks={trend} />
      {hasRecords && (
        <TopWasteList entries={topWaste} categoryNames={categoryNames} />
      )}
      <CategoryBreakdown
        categories={current.categories}
        categoryNames={categoryNames}
      />
    </div>
  );
}
