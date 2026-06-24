import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { MessageSquare, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listBusinessCustomerFeedback, type CustomerFeedbackSummary } from "@/app/lib/api";
import { EmployeeEmptyState } from "@/app/components/employee/EmployeeEmptyState";
import { DashboardListSkeleton } from "@/app/components/dashboard/DashboardSectionLoading";
import { CustomerFeedbackListItem } from "@/app/components/business/CustomerFeedbackListItem";
import { businessUi } from "@/app/components/business/businessDashboardUi";
import { CUSTOMERS_BASE } from "@/app/components/business/businessDashboardNav";
import { cn } from "@/lib/utils";
import { logClientError } from "@/app/lib/clientLog";
import { isApiPendingVerificationError } from "@/app/lib/apiError";
import { scheduleIdleWork } from "@/lib/publicRouteDefer";

export const DASHBOARD_CUSTOMER_FEEDBACK_TEASER_LIMIT = 3;

type RecentCustomerFeedbackPanelProps = {
  enabled?: boolean;
  className?: string;
};

export function RecentCustomerFeedbackPanel({
  enabled = true,
  className,
}: RecentCustomerFeedbackPanelProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CustomerFeedbackSummary | null>(null);
  const [items, setItems] = useState<Awaited<ReturnType<typeof listBusinessCustomerFeedback>>["items"]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listBusinessCustomerFeedback({
        take: DASHBOARD_CUSTOMER_FEEDBACK_TEASER_LIMIT,
        skip: 0,
      });
      setItems(res.items);
      setSummary(res.summary);
    } catch (err) {
      if (isApiPendingVerificationError(err)) {
        setItems([]);
        setSummary(null);
        setError(null);
        return;
      }
      logClientError("RecentCustomerFeedbackPanel.load", err);
      setError(t("business.customerFeedback.loadError"));
      setItems([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, t]);

  useEffect(() => {
    scheduleIdleWork(() => {
      void load();
    }, 1400);
  }, [load]);

  return (
    <Card className={cn(businessUi.cardStatic, "business-dashboard-panel-card w-full", className)}>
      <CardHeader className="business-dashboard-panel-card__header flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-lg">{t("business.customerFeedback.recentTitle")}</CardTitle>
          <CardDescription className={businessUi.cardDesc}>
            {summary && summary.feedbackCount > 0
              ? t("business.customerFeedback.recentDescWithStats", {
                  count: summary.feedbackCount,
                  average:
                    summary.averageRating != null ? summary.averageRating.toFixed(1) : "—",
                })
              : t("business.customerFeedback.recentDesc")}
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="shrink-0" asChild>
          <Link to={CUSTOMERS_BASE}>{t("dashboard.viewAll")}</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <DashboardListSkeleton minHeightClass="min-h-[200px]" />
        ) : error ? (
          <EmployeeEmptyState
            className="py-8"
            icon={<MessageSquare className="h-6 w-6 text-muted-foreground" aria-hidden />}
            title={t("business.customerFeedback.loadErrorTitle")}
            description={error}
            action={
              <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
                {t("business.customerFeedback.retry")}
              </Button>
            }
          />
        ) : items.length === 0 ? (
          <EmployeeEmptyState
            className="py-8"
            icon={<Star className="h-6 w-6 text-muted-foreground" aria-hidden />}
            title={t("emptyState.ratings.title")}
            description={t("emptyState.ratings.description")}
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <CustomerFeedbackListItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
