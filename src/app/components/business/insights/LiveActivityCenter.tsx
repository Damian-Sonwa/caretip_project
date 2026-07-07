import { useTranslation } from "react-i18next";
import {
  CreditCard,
  MapPin,
  Mail,
  QrCode,
  Radio,
  Target,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import type { LiveActivityItem, LiveActivityKind } from "../../../hooks/useLiveActivityStream";
import { formatEur } from "../../../lib/formatEur";
import { formatTimeAgo } from "../../../lib/formatTimeAgo";
import { DashboardWorkspacePanel } from "../../dashboard/DashboardWorkspacePanel";
import { cn } from "@/lib/utils";

type LiveActivityCenterProps = {
  items: LiveActivityItem[];
  liveIds: Set<string>;
  loading: boolean;
  refreshing?: boolean;
};

const KIND_ICON: Record<LiveActivityKind, typeof Radio> = {
  tip_received: Radio,
  qr_scanned: QrCode,
  goal_achieved: Trophy,
  goal_updated: Target,
  employee_joined: UserPlus,
  employee_invited: Mail,
  employee_updated: Users,
  location_created: MapPin,
  billing_updated: CreditCard,
};

export function LiveActivityCenter({ items, liveIds, loading, refreshing = false }: LiveActivityCenterProps) {
  const { t } = useTranslation();
  const showSkeleton = loading && items.length === 0;

  return (
    <DashboardWorkspacePanel
      title={t("business.liveActivity.centerTitle")}
      headerExtra={
        refreshing ? (
          <span className="text-xs font-medium text-muted-foreground">{t("dashboard.refresh.updating")}</span>
        ) : (
          t("business.liveActivity.streamLabel")
        )
      }
    >
      {showSkeleton ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex animate-pulse items-center gap-3 px-4 py-4 sm:px-5">
              <div className="h-9 w-9 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-40 rounded bg-muted" />
                <div className="h-2.5 w-28 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground sm:px-5">
          {t("business.liveActivity.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const Icon = KIND_ICON[item.kind];
            const isLive = liveIds.has(item.id) || item.live;
            return (
              <li
                key={item.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3.5 sm:px-5",
                  isLive && "bg-primary/[0.04]",
                )}
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground">
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="truncate font-medium text-foreground">{item.title}</p>
                    {item.amountEur != null ? (
                      <p className="shrink-0 font-semibold tabular-nums text-primary">
                        {formatEur(item.amountEur)}
                      </p>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {item.subtitle ?? t(`business.liveActivity.kind.${item.kind}`)}
                    <span className="mx-1.5 text-border">·</span>
                    {formatTimeAgo(item.at)}
                    {isLive ? (
                      <>
                        <span className="mx-1.5 text-border">·</span>
                        <span className="font-medium uppercase tracking-wide text-primary">
                          {t("business.tips.live.liveBadge")}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardWorkspacePanel>
  );
}
