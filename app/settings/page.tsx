import { SettingsScreen } from "@/components/settings/SettingsScreen";

export default async function SettingsPage() {
  // 開発用ツールは本番バンドルに含めたくないので、静的 import ではなく
  // 条件付きの動的 import にする（本番ビルドでは条件が false に置き換わり、取り込みごと消える）
  const DevTools =
    process.env.NODE_ENV === "development"
      ? (await import("@/components/settings/DevTools")).DevTools
      : null;

  return <SettingsScreen devTools={DevTools && <DevTools />} />;
}
