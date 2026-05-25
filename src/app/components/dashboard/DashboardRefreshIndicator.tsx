import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type DashboardRefreshIndicatorProps = {
  isRefreshing: boolean;
  lastUpdatedAt: number | null;
  className?: string;
};

/** Subtle “Updating…” / “Updated just now” for dashboard analytics sections. */
export function DashboardRefreshIndicator({
  isRefreshing,
  lastUpdatedAt,
  className,
}: DashboardRefreshIndicatorProps) {
  const { t } = useTranslation();
  const [, tick] = useState(0);

  useEffect(() => {
    if (!lastUpdatedAt || isRefreshing) return;
    const id = window.setInterval(() => tick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, [lastUpdatedAt, isRefreshing]);

  if (!isRefreshing && !lastUpdatedAt) return null;

  const label = isRefreshing
    ? t("dashboard.refresh.updating")
    : t("dashboard.refresh.justNow");

  return (
    <div
      className={cn(
        "text-[11px] font-medium tracking-wide text-muted-foreground/80 tabular-nums",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {label}
    </div>
  );
}
