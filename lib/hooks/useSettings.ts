"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getSettings } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/types";

export function useSettings() {
  return useLiveQuery(() => getSettings(), [], DEFAULT_SETTINGS);
}
