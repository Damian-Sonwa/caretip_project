import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import type { TipItem } from "./api";

function dateLocaleForTag(localeTag?: string) {
  if (localeTag?.toLowerCase().startsWith("de")) return de;
  return enUS;
}

/** Localized date+time for tip rows (uses German locale when UI language is German). */
export function formatTipDateTime(iso: string, localeTag?: string): string {
  const d = new Date(iso);
  return format(d, "Pp", { locale: dateLocaleForTag(localeTag) });
}

/** Consecutive calendar days with at least one tip (from period tip list). */
export function computeEmployeeTipStreakDays(tips: TipItem[]): number {
  if (tips.length === 0) return 0;
  const dayKeys = new Set(
    tips.map((t) => {
      const d = new Date(t.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 30; i++) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (!dayKeys.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
