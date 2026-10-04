import type {
  Category,
  DailyLog,
  PaymentMethod,
  Settings,
  Transaction,
} from "@/types";
import { PAYMENT_METHOD_LABEL } from "@/types";

export const BACKUP_APP_ID = "kakeibo-diet";
/** バックアップ形式のバージョン。形式を変えるときは上げて、古い版の読み込みも維持する */
export const BACKUP_VERSION = 1;

export interface BackupData {
  transactions: Transaction[];
  categories: Category[];
  dailyLogs: DailyLog[];
  settings: Settings;
}

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  version: number;
  exportedAt: string; // ISO 8601
  data: BackupData;
}

export type ParseResult =
  | { ok: true; backup: BackupFile }
  | { ok: false; error: string };

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const ENTRY_TYPES = ["necessary", "satisfied", "waste"];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string" && v !== "";
const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

class InvalidBackup extends Error {}

function fail(message: string): never {
  throw new InvalidBackup(message);
}

function parseTransaction(raw: unknown, index: number): Transaction {
  const at = `取引${index + 1}件目`;
  if (!isObj(raw)) fail(`${at}の形式が正しくありません`);
  if (!isStr(raw.id)) fail(`${at}: id がありません`);
  if (!isStr(raw.date) || !DATE_KEY.test(raw.date)) {
    fail(`${at}: 日付が正しくありません`);
  }
  if (!isNum(raw.amount) || raw.amount < 0) fail(`${at}: 金額が正しくありません`);
  if (!isStr(raw.type) || !ENTRY_TYPES.includes(raw.type)) {
    fail(`${at}: 種類（必要/満足/ムダ）が正しくありません`);
  }
  if (raw.categoryId !== undefined && !isStr(raw.categoryId)) {
    fail(`${at}: カテゴリが正しくありません`);
  }
  if (
    raw.paymentMethod !== undefined &&
    !(isStr(raw.paymentMethod) && raw.paymentMethod in PAYMENT_METHOD_LABEL)
  ) {
    fail(`${at}: 支払い方法が正しくありません`);
  }
  if (raw.memo !== undefined && typeof raw.memo !== "string") {
    fail(`${at}: メモが正しくありません`);
  }
  const now = Date.now();
  return {
    id: raw.id,
    date: raw.date,
    amount: raw.amount,
    type: raw.type as Transaction["type"],
    ...(raw.categoryId !== undefined ? { categoryId: raw.categoryId as string } : {}),
    ...(raw.paymentMethod !== undefined
      ? { paymentMethod: raw.paymentMethod as PaymentMethod }
      : {}),
    ...(raw.memo !== undefined ? { memo: raw.memo as string } : {}),
    createdAt: isNum(raw.createdAt) ? raw.createdAt : now,
    updatedAt: isNum(raw.updatedAt) ? raw.updatedAt : now,
  };
}

function parseCategory(raw: unknown, index: number): Category {
  const at = `カテゴリ${index + 1}件目`;
  if (!isObj(raw)) fail(`${at}の形式が正しくありません`);
  if (!isStr(raw.id)) fail(`${at}: id がありません`);
  if (!isStr(raw.name)) fail(`${at}: 名前がありません`);
  return {
    id: raw.id,
    name: raw.name,
    isDefault: raw.isDefault === true,
    order: isNum(raw.order) ? raw.order : index,
  };
}

function parseDailyLog(raw: unknown, index: number): DailyLog {
  const at = `支出なしの記録${index + 1}件目`;
  if (!isObj(raw)) fail(`${at}の形式が正しくありません`);
  if (!isStr(raw.date) || !DATE_KEY.test(raw.date)) {
    fail(`${at}: 日付が正しくありません`);
  }
  return { date: raw.date, noSpend: raw.noSpend !== false };
}

function parseSettings(raw: unknown, categoryIds: Set<string>): Settings {
  if (!isObj(raw)) fail("設定の形式が正しくありません");
  if (!isNum(raw.monthlyBudget) || raw.monthlyBudget < 0) {
    fail("設定: 目標予算が正しくありません");
  }
  if (raw.weekStartsOn !== 0 && raw.weekStartsOn !== 1) {
    fail("設定: 週の始まりが正しくありません");
  }
  const lastCategory =
    isStr(raw.lastUsedCategoryId) && categoryIds.has(raw.lastUsedCategoryId)
      ? raw.lastUsedCategoryId
      : undefined;
  const lastPayment =
    isStr(raw.lastUsedPaymentMethod) &&
    raw.lastUsedPaymentMethod in PAYMENT_METHOD_LABEL
      ? (raw.lastUsedPaymentMethod as PaymentMethod)
      : undefined;
  return {
    id: "singleton",
    monthlyBudget: raw.monthlyBudget,
    weekStartsOn: raw.weekStartsOn,
    ...(lastCategory ? { lastUsedCategoryId: lastCategory } : {}),
    ...(lastPayment ? { lastUsedPaymentMethod: lastPayment } : {}),
  };
}

function assertUnique(ids: string[], label: string): void {
  if (new Set(ids).size !== ids.length) fail(`${label}のIDが重複しています`);
}

function parseArray<T>(
  value: unknown,
  label: string,
  parseItem: (raw: unknown, index: number) => T
): T[] {
  if (!Array.isArray(value)) fail(`${label}のデータがありません`);
  return value.map(parseItem);
}

/** バックアップのJSON文字列を検証して読み込む。1つでも不正があれば全体を拒否する */
export function parseBackup(text: string): ParseResult {
  try {
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      fail("JSONとして読み込めませんでした");
    }
    if (!isObj(json) || json.app !== BACKUP_APP_ID) {
      fail("家計ダイエットのバックアップファイルではありません");
    }
    if (!isNum(json.version) || json.version > BACKUP_VERSION) {
      fail("このアプリより新しい形式のバックアップです。アプリを更新してから読み込んでください");
    }
    if (json.version < 1) fail("バックアップのバージョンが正しくありません");
    if (!isObj(json.data)) fail("データがありません");

    const categories = parseArray(json.data.categories, "カテゴリ", parseCategory);
    if (categories.length === 0) fail("カテゴリが1つも含まれていません");
    const categoryIds = new Set(categories.map((c) => c.id));
    // 存在しないカテゴリを指す取引は、未分類として読み込む
    const transactions = parseArray(json.data.transactions, "取引", parseTransaction).map(
      ({ categoryId, ...rest }) =>
        categoryId && categoryIds.has(categoryId) ? { ...rest, categoryId } : rest
    );
    assertUnique(categories.map((c) => c.id), "カテゴリ");
    assertUnique(transactions.map((t) => t.id), "取引");
    const dailyLogs = parseArray(json.data.dailyLogs, "支出なしの記録", parseDailyLog);
    const settings = parseSettings(json.data.settings, categoryIds);

    return {
      ok: true,
      backup: {
        app: BACKUP_APP_ID,
        version: json.version,
        exportedAt: isStr(json.exportedAt) ? json.exportedAt : "",
        data: { transactions, categories, dailyLogs, settings },
      },
    };
  } catch (error) {
    if (error instanceof InvalidBackup) return { ok: false, error: error.message };
    throw error;
  }
}

export interface MergePlan {
  /** 新しく作るカテゴリ（IDは取り込み元のまま。order は末尾に続けて振る） */
  newCategories: Category[];
  /** 追加する取引（カテゴリは端末側のIDへ付け替え済み） */
  newTransactions: Transaction[];
  /** 追加する「支出なし」の日付 */
  newNoSpendDates: string[];
  skippedTransactions: number;
}

/**
 * 「追加」インポートの計画を立てる。端末の既存データは変更しない。
 * - 取引: IDが同じものはスキップ（同じファイルを読み直しても増えない）
 * - カテゴリ: 名前が同じなら端末側のカテゴリへ寄せ、なければ新規作成
 * - 設定: 端末側を維持
 */
export function planMerge(
  existing: Pick<BackupData, "transactions" | "categories" | "dailyLogs">,
  incoming: BackupData
): MergePlan {
  const localByName = new Map(existing.categories.map((c) => [c.name, c.id]));
  const idMap = new Map<string, string>();
  const newCategories: Category[] = [];
  let nextOrder = existing.categories.length;

  for (const c of [...incoming.categories].sort((a, b) => a.order - b.order)) {
    const localId = localByName.get(c.name);
    if (localId) {
      idMap.set(c.id, localId);
    } else {
      idMap.set(c.id, c.id);
      localByName.set(c.name, c.id);
      newCategories.push({ ...c, isDefault: false, order: nextOrder++ });
    }
  }

  const knownIds = new Set(existing.transactions.map((t) => t.id));
  const newTransactions: Transaction[] = [];
  let skipped = 0;
  for (const t of incoming.transactions) {
    if (knownIds.has(t.id)) {
      skipped++;
      continue;
    }
    knownIds.add(t.id);
    const { categoryId, ...rest } = t;
    const mapped = categoryId ? idMap.get(categoryId) : undefined;
    newTransactions.push(mapped ? { ...rest, categoryId: mapped } : rest);
  }

  const knownLogs = new Set(existing.dailyLogs.filter((l) => l.noSpend).map((l) => l.date));
  const newNoSpendDates = incoming.dailyLogs
    .filter((l) => l.noSpend && !knownLogs.has(l.date))
    .map((l) => l.date);

  return { newCategories, newTransactions, newNoSpendDates, skippedTransactions: skipped };
}
