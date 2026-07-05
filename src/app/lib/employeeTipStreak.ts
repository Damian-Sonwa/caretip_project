import type { TipItem } from "./api";

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
