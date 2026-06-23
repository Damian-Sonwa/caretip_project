import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import type { TipActivityRow } from "../../../lib/api";
import { formatEur } from "../../../lib/formatEur";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { businessUi } from "../businessDashboardUi";

type ActivityTimelineProps = {
  items: TipActivityRow[];
  loading: boolean;
  timezone?: string | null;
};

export function ActivityTimeline({ items, loading, timezone }: ActivityTimelineProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.toLowerCase().startsWith("de") ? de : enUS;

  const formatWhen = (iso: string) => {
    try {
      return format(new Date(iso), "EEE · HH:mm", {
        locale,
        ...(timezone ? { timeZone: timezone } : {}),
      });
    } catch {
      return iso;
    }
  };

  return (
    <Card className={businessUi.cardStatic}>
      <CardHeader className="border-b border-neutral-100/90">
        <CardTitle className="text-base">{t("business.tips.live.timelineTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {loading && items.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2 border-l border-dashed border-border pl-4 pb-4">
                  <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-full animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ol className="relative space-y-0 border-l border-dashed border-border pl-5">
            {items.slice(0, 12).map((tip, index) => (
              <li key={tip.id} className="relative pb-5 last:pb-0">
                <span
                  className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary"
                  aria-hidden
                />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {tip.staffName ?? t("business.tips.live.anonymousGuest")}
                    <span className="ml-2 font-semibold text-primary">{formatEur(tip.amount)}</span>
                  </p>
                  <time className="text-xs text-muted-foreground">{formatWhen(tip.createdAt)}</time>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {tip.locationName ?? tip.tableName ?? t("business.tips.live.venueDefault")}
                  {index === 0 ? ` · ${t("business.tips.live.mostRecent")}` : null}
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
