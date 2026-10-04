import { describeTodayRemaining, formatYen } from "@/lib/format";

interface TodayRemainingHeroProps {
  todayRemaining: number;
  spentToday: number;
}

/** 「今日あと使える額」。ホーム画面で最も目立たせる */
export function TodayRemainingHero({
  todayRemaining,
  spentToday,
}: TodayRemainingHeroProps) {
  const { over, label, amountText } = describeTodayRemaining(todayRemaining);

  return (
    <section
      className={`rounded-3xl px-5 pt-5 pb-6 text-center shadow-sm ${
        over ? "bg-waste-light" : "bg-mint-light"
      }`}
    >
      <h2 className="text-sm font-bold text-ink-soft">{label}</h2>
      <p
        className={`mt-1 font-heading text-6xl font-extrabold tabular-nums tracking-tight ${
          over ? "text-waste" : "text-mint-dark"
        }`}
      >
        {amountText}
      </p>
      <p className="mt-3 text-sm text-ink-soft">
        {over
          ? "明日からの1日予算で少しずつ取り戻そう"
          : `今日使った額 ${formatYen(spentToday)}`}
      </p>
    </section>
  );
}
