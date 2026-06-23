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
import { PremiumLiveActivityCard } from "../../premium/PremiumLiveActivityCard";
import { cn } from "@/lib/utils";

type LiveActivityCenterProps = {
  items: LiveActivityItem[];
  liveIds: Set<string>;
  loading: boolean;
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

const KIND_ACCENT: Record<LiveActivityKind, string> = {
  tip_received: "text-[#EB992C]",
  qr_scanned: "text-sky-300",
  goal_achieved: "text-amber-300",
  goal_updated: "text-violet-300",
  employee_joined: "text-emerald-300",
  employee_invited: "text-blue-300",
  employee_updated: "text-white/80",
  location_created: "text-teal-300",
  billing_updated: "text-rose-300",
};

export function LiveActivityCenter({ items, liveIds, loading }: LiveActivityCenterProps) {
  const { t } = useTranslation();

  return (
    <PremiumLiveActivityCard
      title={t("business.liveActivity.centerTitle")}
      headerExtra={
        <span className="text-xs font-medium uppercase tracking-wide text-white/50">
          {t("business.liveActivity.streamLabel")}
        </span>
      }
    >
      {loading && items.length === 0 ? (
        <div className="space-y-0 divide-y divide-white/8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex animate-pulse items-center gap-3 px-4 py-4 sm:px-5">
              <div className="h-9 w-9 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-40 rounded bg-white/10" />
                <div className="h-2.5 w-28 rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-white/65 sm:px-5">
          {t("business.liveActivity.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-white/8">
          {items.map((item) => {
            const Icon = KIND_ICON[item.kind];
            const isLive = liveIds.has(item.id) || item.live;
            return (
              <li
                key={item.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3.5 transition-colors sm:px-5",
                  isLive && "bg-[#EB992C]/[0.06]",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06]",
                    KIND_ACCENT[item.kind],
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="truncate font-medium text-white">{item.title}</p>
                    {item.amountEur != null ? (
                      <p className="shrink-0 font-semibold tabular-nums text-[#EB992C]">
                        {formatEur(item.amountEur)}
                      </p>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-white/55">
                    {item.subtitle ?? t(`business.liveActivity.kind.${item.kind}`)}
                    <span className="mx-1.5 text-white/25">·</span>
                    {formatTimeAgo(item.at)}
                    {isLive ? (
                      <>
                        <span className="mx-1.5 text-white/25">·</span>
                        <span className="font-medium uppercase tracking-wide text-[#EB992C]/90">
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
    </PremiumLiveActivityCard>
  );
}
