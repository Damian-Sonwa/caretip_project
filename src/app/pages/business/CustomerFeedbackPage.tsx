import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MessageSquare, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  getBusinessStats,
  listBusinessCustomerFeedback,
  type CustomerFeedbackRow,
  type CustomerFeedbackSummary,
} from "@/app/lib/api";
import { useRequireAuth } from "@/app/hooks/useRequireAuth";
import { EmployeeEmptyState } from "@/app/components/employee/EmployeeEmptyState";
import { BusinessSubPageShellSkeleton } from "@/app/components/dashboard/BusinessSubPageShellSkeleton";
import { DashboardListSkeleton } from "@/app/components/dashboard/DashboardSectionLoading";
import { CustomerFeedbackListItem } from "@/app/components/business/CustomerFeedbackListItem";
import { businessUi } from "@/app/components/business/businessDashboardUi";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { cn } from "@/lib/utils";
import { logClientError } from "@/app/lib/clientLog";

const PAGE_SIZE = 20;

export function CustomerFeedbackPage() {
  const { t } = useTranslation();
  const { user, authReady, authStatus } = useRequireAuth();
  const canLoad = authReady && authStatus === "authenticated" && user?.role === "business";

  const [items, setItems] = useState<CustomerFeedbackRow[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<CustomerFeedbackSummary | null>(null);
  const [page, setPage] = useState(1);
  const [employeeId, setEmployeeId] = useState<string>("all");
  const [staffOptions, setStaffOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (!canLoad) return;
    void getBusinessStats("all", { scope: "analytics" })
      .then((stats) => {
        setStaffOptions(
          (stats.employees ?? []).map((e) => ({ id: e.id, name: e.name ?? "Staff" })),
        );
      })
      .catch((err) => logClientError("CustomerFeedbackPage.staff", err));
  }, [canLoad]);

  const loadFeedback = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setError(null);
    try {
      const skip = (page - 1) * PAGE_SIZE;
      const res = await listBusinessCustomerFeedback({
        take: PAGE_SIZE,
        skip,
        employeeId: employeeId === "all" ? undefined : employeeId,
      });
      setItems(res.items);
      setTotal(res.total);
      setSummary(res.summary);
    } catch (err) {
      logClientError("CustomerFeedbackPage.load", err);
      setError(t("business.customerFeedback.loadError"));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [canLoad, page, employeeId, t]);

  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  useEffect(() => {
    setPage(1);
  }, [employeeId]);

  const summaryLine = useMemo(() => {
    if (!summary || summary.feedbackCount === 0) return null;
    return t("business.customerFeedback.pageSummary", {
      count: summary.feedbackCount,
      average: summary.averageRating != null ? summary.averageRating.toFixed(1) : "—",
      ratings: summary.ratingCount,
    });
  }, [summary, t]);

  if (!authReady) {
    return <BusinessSubPageShellSkeleton />;
  }

  return (
    <div className={cn(businessUi.page, "mx-auto w-full max-w-4xl")}>
      <header className="mb-6 space-y-2">
        <div className="flex items-center gap-3">
          <span
            className={cn(businessUi.iconTileMuted, "flex h-11 w-11 items-center justify-center")}
            aria-hidden
          >
            <MessageSquare className="h-5 w-5 text-primary" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("business.customerFeedback.pageTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("business.customerFeedback.pageDesc")}</p>
          </div>
        </div>
        {summaryLine ? (
          <p className="text-sm text-muted-foreground">{summaryLine}</p>
        ) : null}
      </header>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger className="w-full sm:w-[240px]" aria-label={t("business.customerFeedback.filterEmployee")}>
            <SelectValue placeholder={t("business.customerFeedback.filterEmployee")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("business.customerFeedback.allEmployees")}</SelectItem>
            {staffOptions.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {total > 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("business.customerFeedback.showingCount", { shown: items.length, total })}
          </p>
        ) : null}
      </div>

      {loading && items.length === 0 ? (
        <DashboardListSkeleton minHeightClass="min-h-[280px]" />
      ) : error ? (
        <EmployeeEmptyState
          className="py-12"
          icon={<MessageSquare className="h-6 w-6 text-muted-foreground" aria-hidden />}
          title={t("business.customerFeedback.loadErrorTitle")}
          description={error}
          action={
            <Button type="button" variant="outline" onClick={() => void loadFeedback()}>
              {t("business.customerFeedback.retry")}
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmployeeEmptyState
          className="py-12"
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

      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
            {t("business.tipsActivity.prev")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("business.tipsActivity.pageOf", { page, pages: totalPages })}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t("business.tipsActivity.next")}
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
