import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronRight, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileAvatar } from "../../ui/profile-avatar";
import { businessUi } from "../businessDashboardUi";
import { formatEur } from "../../../lib/formatEur";
import { cn } from "@/lib/utils";

export const TOP_PERFORMERS_PAGE_PATH = "/dashboard/team/top-performers";

export const DASHBOARD_EMPLOYEE_TEASER_LIMIT = 3;

export type TopPerformerTeaserEmployee = {
  id: string;
  name: string;
  avatar: string | null;
  tips: number;
};

type TopPerformersTeaserProps = {
  employees: TopPerformerTeaserEmployee[];
  loading?: boolean;
};

export function TopPerformersTeaser({ employees, loading }: TopPerformersTeaserProps) {
  const { t } = useTranslation();
  const teaser = employees.slice(0, DASHBOARD_EMPLOYEE_TEASER_LIMIT);

  return (
    <Card className={cn(businessUi.cardStatic, "h-full")}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-neutral-100/90 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4 text-primary" aria-hidden />
          {t("business.dashboard.topPerformers")}
        </CardTitle>
        <Link
          to={TOP_PERFORMERS_PAGE_PATH}
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {t("business.dashboard.viewAllTopPerformers")}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: DASHBOARD_EMPLOYEE_TEASER_LIMIT }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/50" />
            ))}
          </div>
        ) : teaser.length > 0 ? (
          <ul className="space-y-2">
            {teaser.map((employee, index) => (
              <li
                key={employee.id}
                className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-3.5 py-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  #{index + 1}
                </span>
                <ProfileAvatar src={employee.avatar} displayName={employee.name} className="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{employee.name}</p>
                  <p className="text-lg font-bold tabular-nums text-foreground">{formatEur(employee.tips)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t("business.dashboard.topPerformersEmptyHint")}</p>
        )}
      </CardContent>
    </Card>
  );
}
