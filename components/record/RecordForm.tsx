"use client";

import { useEffect, useState } from "react";
import { NumPad } from "./NumPad";
import { TypeButtons } from "./TypeButtons";
import { ChipSelector } from "./ChipSelector";
import { DateChips } from "./DateChips";
import { BudgetSetupChip } from "./BudgetSetupChip";
import { useCategories } from "@/lib/hooks/useCategories";
import { useSettings } from "@/lib/hooks/useSettings";
import { useTodayRemaining } from "@/lib/hooks/useTodayRemaining";
import { addTransaction, markNoSpendDay } from "@/lib/db";
import { labelForDateKey, toDateKey } from "@/lib/domain/date";
import { describeTodayRemaining } from "@/lib/format";
import { ENTRY_TYPE_LABEL, PAYMENT_METHOD_LABEL, type EntryType, type PaymentMethod } from "@/types";

const MAX_DIGITS = 8;
const yen = new Intl.NumberFormat("ja-JP");

export function RecordForm() {
  const categories = useCategories();
  const settings = useSettings();
  const todayRemaining = useTodayRemaining();
  const remaining = describeTodayRemaining(todayRemaining);
  // 目標予算が未設定のときは、「今日あと使える額」を出さない（0円の予算では必ず「使いすぎ」になってしまう）
  const budgetUnset = settings !== undefined && settings.monthlyBudget <= 0;

  const [amountStr, setAmountStr] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>();
  /** null は「今日」。記録後は常に今日へ戻す */
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [memoOpen, setMemoOpen] = useState(false);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [celebration, setCelebration] = useState<EntryType | null>(null);
  const [celebrationDate, setCelebrationDate] = useState<string | null>(null);

  useEffect(() => {
    if (!celebration) return;
    const timer = setTimeout(() => setCelebration(null), 1800);
    return () => clearTimeout(timer);
  }, [celebration]);

  const activeCategoryId = categoryId ?? settings?.lastUsedCategoryId;
  const activePaymentMethod = paymentMethod ?? settings?.lastUsedPaymentMethod;
  const amount = Number(amountStr || "0");

  function handleDigit(digit: string) {
    setAmountStr((prev) => {
      if (digit === "00") {
        return prev === "" ? prev : (prev + "00").slice(0, MAX_DIGITS);
      }
      const next = prev === "0" ? digit : prev + digit;
      return next.slice(0, MAX_DIGITS);
    });
  }

  function handleBackspace() {
    setAmountStr((prev) => prev.slice(0, -1));
  }

  async function handleSelectType(type: EntryType) {
    if (amount <= 0 || saving) return;
    setSaving(true);
    try {
      await addTransaction({
        date: pickedDate ?? toDateKey(new Date()),
        amount,
        type,
        categoryId: activeCategoryId,
        paymentMethod: activePaymentMethod,
        memo: memo.trim() || undefined,
      });

      setAmountStr("");
      setMemo("");
      setMemoOpen(false);
      setCelebrationDate(pickedDate);
      setPickedDate(null);
      setCelebration(type);
    } finally {
      setSaving(false);
    }
  }

  async function handleNoSpend() {
    await markNoSpendDay(toDateKey(new Date()));
    setCelebration(null);
  }

  return (
    <div className="flex flex-1 flex-col px-4 pt-5 pb-3 gap-4 relative">
      {budgetUnset ? (
        <div className="flex items-center">
          <BudgetSetupChip />
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-soft">{remaining.label}</p>
          <p
            className={`font-heading text-2xl font-bold ${
              remaining.over ? "text-waste" : "text-mint-dark"
            }`}
          >
            {remaining.amountText}
          </p>
        </div>
      )}

      <div className="flex flex-col items-center gap-2 py-2">
        <p className="font-heading text-5xl font-bold text-ink tabular-nums">
          ¥{yen.format(amount)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DateChips value={pickedDate} onChange={setPickedDate} />
        <ChipSelector
          prefixLabel="カテゴリ"
          placeholder="未選択"
          value={activeCategoryId}
          options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
          onChange={setCategoryId}
        />
        <ChipSelector
          prefixLabel="支払い"
          placeholder="未選択"
          value={activePaymentMethod}
          options={Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => ({
            value,
            label,
          }))}
          onChange={(v) => setPaymentMethod(v as PaymentMethod)}
        />
        {!memoOpen ? (
          <button
            type="button"
            onClick={() => setMemoOpen(true)}
            className="rounded-full bg-surface px-3 py-1.5 text-sm text-ink-soft shadow-sm"
          >
            + メモ
          </button>
        ) : (
          <input
            autoFocus
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="メモ（任意）"
            maxLength={40}
            className="flex-1 min-w-[8rem] rounded-full bg-surface px-3 py-1.5 text-sm text-ink shadow-sm outline-none"
          />
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <NumPad onDigit={handleDigit} onBackspace={handleBackspace} />
        <TypeButtons disabled={amount <= 0 || saving} onSelect={handleSelectType} />
        <button
          type="button"
          onClick={handleNoSpend}
          className="self-center text-xs text-ink-soft underline underline-offset-2"
        >
          今日は支出なし
        </button>
      </div>

      {celebration && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-base/95"
          onClick={() => setCelebration(null)}
        >
          <div className="text-5xl animate-bounce">
            {celebration === "waste" ? "😅" : "✅"}
          </div>
          <p className="font-heading text-lg font-bold text-ink">
            {celebrationDate ? `${labelForDateKey(celebrationDate)}の分を` : ""}
            {ENTRY_TYPE_LABEL[celebration]}として記録しました
          </p>
          {budgetUnset ? (
            <p className="px-8 text-center text-sm text-ink-soft">
              目標予算を設定すると、
              <br />
              「今日あと使える額」がわかります
            </p>
          ) : (
            <>
              <p className="text-sm text-ink-soft">{remaining.label}</p>
              <p
                className={`font-heading text-3xl font-bold ${
                  remaining.over ? "text-waste" : "text-mint-dark"
                }`}
              >
                {remaining.amountText}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
