// 支出の性質：必要 / 満足 / ムダ
export type EntryType = "necessary" | "satisfied" | "waste";

export type PaymentMethod = "paypay" | "cash" | "card";

export const ENTRY_TYPE_LABEL: Record<EntryType, string> = {
  necessary: "必要",
  satisfied: "満足",
  waste: "ムダ",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  paypay: "PayPay",
  cash: "現金",
  card: "カード",
};

export interface Category {
  id: string;
  name: string;
  isDefault: boolean;
  order: number;
}

export interface Transaction {
  id: string;
  /** 'YYYY-MM-DD' 形式。集計・週区切りに使う日付キー */
  date: string;
  amount: number;
  type: EntryType;
  categoryId?: string;
  paymentMethod?: PaymentMethod;
  memo?: string;
  createdAt: number;
  updatedAt: number;
}

/** 「今日は支出なし」の記録。ストリーク判定にのみ使う */
export interface DailyLog {
  /** 'YYYY-MM-DD' 形式。主キー */
  date: string;
  noSpend: boolean;
}

export interface Settings {
  id: "singleton";
  monthlyBudget: number;
  /** 0: 日曜始まり, 1: 月曜始まり */
  weekStartsOn: 0 | 1;
  lastUsedCategoryId?: string;
  lastUsedPaymentMethod?: PaymentMethod;
}

export const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  { name: "食費", isDefault: true, order: 0 },
  { name: "日用品", isDefault: true, order: 1 },
  { name: "交際費", isDefault: true, order: 2 },
  { name: "交通費", isDefault: true, order: 3 },
  { name: "趣味", isDefault: true, order: 4 },
  { name: "その他", isDefault: true, order: 5 },
];

export const DEFAULT_SETTINGS: Settings = {
  id: "singleton",
  monthlyBudget: 0,
  weekStartsOn: 1,
};
