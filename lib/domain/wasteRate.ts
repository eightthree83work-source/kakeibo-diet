export interface TypedAmountRecord {
  amount: number;
  type: "necessary" | "satisfied" | "waste";
}

/** 浪費率（家計体脂肪率） = ムダに分類した支出 ÷ 支出合計。支出が0円の場合は0を返す */
export function calcWasteRate(records: TypedAmountRecord[]): number {
  let total = 0;
  let waste = 0;
  for (const r of records) {
    total += r.amount;
    if (r.type === "waste") {
      waste += r.amount;
    }
  }
  return total === 0 ? 0 : waste / total;
}
