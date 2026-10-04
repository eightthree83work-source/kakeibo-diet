interface BudgetSetupPromptProps {
  onSetup: () => void;
}

/** 目標予算が未設定のときに「今日あと使える額」の代わりに表示する案内 */
export function BudgetSetupPrompt({ onSetup }: BudgetSetupPromptProps) {
  return (
    <section className="rounded-3xl bg-yellow-light px-5 pt-6 pb-5 text-center shadow-sm">
      <p className="text-4xl" aria-hidden>
        🎯
      </p>
      <h2 className="mt-2 font-heading text-xl font-bold">
        目標予算を設定しよう
      </h2>
      <p className="mt-1.5 text-sm text-ink-soft">
        1ヶ月の目標予算を決めると、
        <br />
        「今日あと使える額」が毎日わかります
      </p>
      <button
        type="button"
        onClick={onSetup}
        className="mt-4 h-14 w-full rounded-2xl bg-mint font-heading text-lg font-bold text-white shadow-sm active:scale-95 transition-transform"
      >
        目標予算を設定する
      </button>
    </section>
  );
}
