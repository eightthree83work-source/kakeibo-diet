"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getAllCategories } from "@/lib/db";

export function useCategories() {
  return useLiveQuery(() => getAllCategories(), [], []);
}
