import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type DashboardRefreshIndicatorProps = {
  isRefreshing: boolean;
  lastUpdatedAt: number | null;
  className?: string;
};

const MIN_UPDATING_VISIBLE_MS = 750;

/** Subtle “Updating…” / “Updated just now” for dashboard analytics sections. */
export function DashboardRefreshIndicator({
  isRefreshing,
  lastUpdatedAt,
  className,
}: DashboardRefreshIndicatorProps) {
  const { t } = useTranslation();
  const [, tick] = useState(0);
  const [showUpdating, setShowUpdating] = useState(isRefreshing);
  const updatingSinceRef = useRef<number | null>(isRefreshing ? Date.now() : null);

  useEffect(() => {
    if (isRefreshing) {
      updatingSinceRef.current = Date.now();
      setShowUpdating(true);
      return;
    }
    if (!updatingSinceRef.current) {
      setShowUpdating(false);
      return;
    }
    const elapsed = Date.now() - updatingSinceRef.current;
    const remaining = Math.max(0, MIN_UPDATING_VISIBLE_MS - elapsed);
    const id = window.setTimeout(() => {
      updatingSinceRef.current = null;
      setShowUpdating(false);
    }, remaining);
    return () => window.clearTimeout(id);
  }, [isRefreshing]);

  useEffect(() => {
    if (!lastUpdatedAt || showUpdating) return;
    const id = window.setInterval(() => tick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, [lastUpdatedAt, showUpdating]);

  if (!showUpdating && !lastUpdatedAt) return null;

  const label = showUpdating
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
