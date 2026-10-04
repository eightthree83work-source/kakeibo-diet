const yenFormatter = new Intl.NumberFormat("ja-JP");

/** 金額を「¥1,234」形式に整形する（小数は四捨五入） */
export function formatYen(amount: number): string {
  return `¥${yenFormatter.format(Math.round(amount))}`;
}

export interface TodayRemainingDisplay {
  over: boolean;
  label: string;
  /** マイナスは符号ではなく「使いすぎ」の文言で表すため、常に絶対値を整形する */
  amountText: string;
}

/** 「今日あと使える額」の表示文言。使いすぎ（マイナス）のときは「今日は使いすぎ ¥N」とする */
export function describeTodayRemaining(
  todayRemaining: number | undefined
): TodayRemainingDisplay {
  if (todayRemaining === undefined) {
    return { over: false, label: "今日あと使える額", amountText: "---" };
  }
  const over = Math.round(todayRemaining) < 0;
  return {
    over,
    label: over ? "今日は使いすぎ" : "今日あと使える額",
    amountText: formatYen(Math.abs(todayRemaining)),
  };
}
