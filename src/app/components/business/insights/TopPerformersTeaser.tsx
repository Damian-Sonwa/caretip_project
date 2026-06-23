import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronRight, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileAvatar } from "../../ui/profile-avatar";
import { businessUi } from "../businessDashboardUi";
import { formatEur } from "../../../lib/formatEur";
import { cn } from "@/lib/utils";

type TopPerformerTeaserEmployee = {
  id: string;
  name: string;
  avatar: string | null;
  tips: number;
};

type TopPerformersTeaserProps = {
  topEmployee: TopPerformerTeaserEmployee | null;
  loading?: boolean;
};

export function TopPerformersTeaser({ topEmployee, loading }: TopPerformersTeaserProps) {
  const { t } = useTranslation();

  return (
    <Card className={cn(businessUi.cardStatic, "h-full")}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-neutral-100/90 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4 text-primary" aria-hidden />
          {t("business.dashboard.topPerformers")}
        </CardTitle>
        <Link
          to="/dashboard/team/top-performers"
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {t("business.dashboard.viewLeaderboard")}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="h-16 animate-pulse rounded-lg bg-muted/50" />
        ) : topEmployee ? (
          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-3.5 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              #1
            </span>
            <ProfileAvatar src={topEmployee.avatar} displayName={topEmployee.name} className="h-10 w-10" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{topEmployee.name}</p>
              <p className="text-lg font-bold tabular-nums text-foreground">{formatEur(topEmployee.tips)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("business.dashboard.topPerformersEmptyHint")}</p>
        )}
      </CardContent>
    </Card>
  );
}
