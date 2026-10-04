import type { ReactNode } from "react";
import { BudgetSection } from "./BudgetSection";
import { CategorySection } from "./CategorySection";
import { BackupSection } from "./BackupSection";

interface SettingsScreenProps {
  /** 開発環境でのみ渡される開発用ツール（画面の最下部に置く） */
  devTools?: ReactNode;
}

export function SettingsScreen({ devTools }: SettingsScreenProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pt-5 pb-6">
      <h1 className="font-heading text-xl font-bold">設定</h1>
      <BudgetSection />
      <CategorySection />
      <BackupSection />
      {devTools && <div className="mt-auto pt-6">{devTools}</div>}
    </div>
  );
}
