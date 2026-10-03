import { db } from "./schema";
import { generateId } from "./uuid";
import type { EntryType, PaymentMethod, Transaction } from "@/types";

export interface NewTransactionInput {
  date: string;
  amount: number;
  type: EntryType;
  categoryId?: string;
  paymentMethod?: PaymentMethod;
  memo?: string;
}

export async function addTransaction(
  input: NewTransactionInput
): Promise<Transaction> {
  const now = Date.now();
  const transaction: Transaction = {
    id: generateId(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  await db.transactions.add(transaction);

  if (input.categoryId || input.paymentMethod) {
    await db.settings.update("singleton", {
      ...(input.categoryId ? { lastUsedCategoryId: input.categoryId } : {}),
      ...(input.paymentMethod
        ? { lastUsedPaymentMethod: input.paymentMethod }
        : {}),
    });
  }

  return transaction;
}

export async function updateTransaction(
  id: string,
  changes: Partial<NewTransactionInput>
): Promise<void> {
  await db.transactions.update(id, { ...changes, updatedAt: Date.now() });
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.delete(id);
}

export function getTransactionsInRange(
  startDate: string,
  endDate: string
): Promise<Transaction[]> {
  return db.transactions
    .where("date")
    .between(startDate, endDate, true, true)
    .toArray();
}

export function getRecentTransactions(limit: number): Promise<Transaction[]> {
  return db.transactions.orderBy("createdAt").reverse().limit(limit).toArray();
}
