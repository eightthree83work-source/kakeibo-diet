export default async function SettingsPage() {
  // 開発用ツールは本番バンドルに含めたくないので、静的 import ではなく
  // 条件付きの動的 import にする（本番ビルドでは条件が false に置き換わり、取り込みごと消える）
  const DevTools =
    process.env.NODE_ENV === "development"
      ? (await import("@/components/settings/DevTools")).DevTools
      : null;

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pt-5 pb-6">
      <h1 className="font-heading text-xl font-bold">設定</h1>

      {/* TODO(ステップ④): 目標予算、カテゴリ編集、JSONエクスポート/インポート */}
      <section className="rounded-3xl bg-surface p-5 text-center shadow-sm">
        <p className="text-sm text-ink-soft">
          目標予算・カテゴリ編集・データのバックアップは準備中です
        </p>
      </section>

      {DevTools && (
        <div className="mt-auto pt-6">
          <DevTools />
        </div>
      )}
    </div>
  );
}
