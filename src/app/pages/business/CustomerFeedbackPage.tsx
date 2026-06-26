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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { logClientError } from "@/app/lib/clientLog";
import { isApiSubscriptionRequiredError } from "@/app/lib/apiError";
import { useSubscriptionEntitlements } from "@/app/hooks/useSubscriptionEntitlements";
import {
  getPageSessionCache,
  setPageSessionCache,
  PAGE_CACHE_TTL_HIGH_MS,
} from "@/app/lib/pageSessionCache";

const PAGE_SIZE = 20;

type FeedbackCache = {
  items: CustomerFeedbackRow[];
  total: number;
  summary: CustomerFeedbackSummary | null;
};

export function CustomerFeedbackPage() {
  const { t } = useTranslation();
  const { user, authReady, authStatus } = useRequireAuth();
  const { ready, hasFeature, hasActiveEntitlements } = useSubscriptionEntitlements({
    enabled: authReady && authStatus === "authenticated" && user?.role === "business",
    role: "business",
  });
  const entitled = ready && hasActiveEntitlements && hasFeature("customerFeedback");
  const canLoad =
    authReady && authStatus === "authenticated" && user?.role === "business" && entitled;

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

  const loadFeedback = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!canLoad) return;
    const quiet = opts?.quiet === true;
    const cacheKey = `business:feedback:${user?.id ?? ""}:${page}:${employeeId}`;
    const cached = getPageSessionCache<FeedbackCache>(cacheKey, PAGE_CACHE_TTL_HIGH_MS);
    const useCachedFirst = !quiet && cached !== null;
    if (useCachedFirst) {
      setItems(cached.items);
      setTotal(cached.total);
      setSummary(cached.summary);
      setLoading(false);
    } else if (!quiet && items.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const skip = (page - 1) * PAGE_SIZE;
      const res = await listBusinessCustomerFeedback({
        take: PAGE_SIZE,
        skip,
        employeeId: employeeId === "all" ? undefined : employeeId,
      });
      const nextItems = res.items;
      const nextTotal = res.total;
      const nextSummary = res.summary;
      setItems(nextItems);
      setTotal(nextTotal);
      setSummary(nextSummary);
      setPageSessionCache(cacheKey, { items: nextItems, total: nextTotal, summary: nextSummary });
    } catch (err) {
      logClientError("CustomerFeedbackPage.load", err);
      if (isApiSubscriptionRequiredError(err)) {
        setError(null);
        setItems([]);
        setTotal(0);
        return;
      }
      if (!useCachedFirst) {
        setError(t("business.customerFeedback.loadError"));
        setItems([]);
        setTotal(0);
      }
    } finally {
      if (!quiet && !useCachedFirst) setLoading(false);
    }
  }, [canLoad, employeeId, items.length, page, t, user?.id]);

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
    <div className="space-y-4 pt-2 sm:space-y-5 sm:pt-4">
      {summaryLine ? (
        <p className="text-sm text-muted-foreground">{summaryLine}</p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
