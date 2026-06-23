import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import type { TipActivityRow } from "../../../lib/api";
import { formatEur } from "../../../lib/formatEur";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { businessUi } from "../businessDashboardUi";

type LocationLeaderboardProps = {
  recentTips: TipActivityRow[];
};

export function LocationLeaderboard({ recentTips }: LocationLeaderboardProps) {
  const { t } = useTranslation();

  const ranked = useMemo(() => {
    const map = new Map<string, { tips: number; count: number }>();
    for (const tip of recentTips) {
      const label = tip.locationName?.trim() || t("business.team.topPerformers.mainVenue");
      const row = map.get(label) ?? { tips: 0, count: 0 };
      row.tips += tip.amount;
      row.count += 1;
      map.set(label, row);
    }
    return [...map.entries()]
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.tips - a.tips)
      .slice(0, 5);
  }, [recentTips, t]);

  return (
    <Card className={businessUi.cardStatic}>
      <CardHeader className="border-b border-neutral-100/90">
        <CardTitle className="text-base">{t("business.team.topPerformers.locationLeaderboard")}</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border/60 p-0">
        {ranked.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {t("business.team.topPerformers.locationEmpty")}
          </p>
        ) : (
          ranked.map((row, index) => (
            <div key={row.name} className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                {index + 1}
              </span>
              <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{row.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t("business.team.topPerformers.tipCount", { count: row.count })}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{formatEur(row.tips)}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
