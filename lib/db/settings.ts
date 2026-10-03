import { db } from "./schema";
import { DEFAULT_SETTINGS, type Settings } from "@/types";

export async function getSettings(): Promise<Settings> {
  const settings = await db.settings.get("singleton");
  return settings ?? DEFAULT_SETTINGS;
}

export async function updateSettings(
  changes: Partial<Omit<Settings, "id">>
): Promise<void> {
  const existing = await db.settings.get("singleton");
  if (existing) {
    await db.settings.update("singleton", changes);
  } else {
    await db.settings.add({ ...DEFAULT_SETTINGS, ...changes });
  }
}
