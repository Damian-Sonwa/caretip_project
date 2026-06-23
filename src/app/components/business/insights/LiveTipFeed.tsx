import { useTranslation } from "react-i18next";
import { Radio } from "lucide-react";
import type { TipActivityRow } from "../../../lib/api";
import { formatEur } from "../../../lib/formatEur";
import { formatTimeAgo } from "../../../lib/formatTimeAgo";
import { ProfileAvatar } from "../../ui/profile-avatar";
import { PremiumLiveActivityCard } from "../../premium/PremiumLiveActivityCard";

type LiveTipFeedProps = {
  items: TipActivityRow[];
  loading: boolean;
};

export function LiveTipFeed({ items, loading }: LiveTipFeedProps) {
  const { t } = useTranslation();

  return (
    <PremiumLiveActivityCard title={t("business.tips.live.feedTitle")}>
      {loading && items.length === 0 ? (
        <div className="space-y-0 divide-y divide-white/8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex animate-pulse items-center gap-3 px-4 py-4 sm:px-5">
              <div className="h-10 w-10 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-white/10" />
                <div className="h-2.5 w-24 rounded bg-white/10" />
              </div>
              <div className="h-4 w-14 rounded bg-white/10" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-white/65 sm:px-5">{t("business.tips.live.feedEmpty")}</p>
      ) : (
        <ul className="divide-y divide-white/8">
          {items.map((tip) => (
            <li
              key={tip.id}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.04] sm:px-5"
            >
              <ProfileAvatar
                src={null}
                displayName={tip.staffName ?? t("business.tips.live.anonymousGuest")}
                className="h-10 w-10"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{tip.staffName ?? "—"}</p>
                <p className="truncate text-xs text-white/55">
                  {tip.locationName ?? tip.tableName ?? t("business.tips.live.venueDefault")}
                  <span className="mx-1.5 text-white/25">·</span>
                  {formatTimeAgo(tip.createdAt)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold tabular-nums text-[#EB992C]">{formatEur(tip.amount)}</p>
                <p className="flex items-center justify-end gap-1 text-[10px] uppercase tracking-wide text-white/45">
                  <Radio className="h-3 w-3" aria-hidden />
                  {t("business.tips.live.liveBadge")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PremiumLiveActivityCard>
  );
}
