import i18n from "@/i18n/i18n";

/** Relative time for activity feeds (minutes / hours / days). */
export function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return i18n.t("employee.relative.justNow", { defaultValue: "Just now" });
  if (diffMins < 60) return i18n.t("employee.relative.minutesAgo", { count: diffMins });
  if (diffHours < 24) {
    return diffHours === 1
      ? i18n.t("employee.relative.hourAgo")
      : i18n.t("employee.relative.hoursAgo", { count: diffHours });
  }
  return diffDays === 1 ? i18n.t("employee.relative.dayAgo") : i18n.t("employee.relative.daysAgo", { count: diffDays });
}
