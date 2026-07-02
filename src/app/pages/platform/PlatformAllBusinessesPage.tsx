import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Building2 } from "lucide-react";
import { Link } from "react-router";
import { fetchPlatformBusinesses, type PlatformBusinessRow } from "../../lib/api";
import { logClientError } from "../../lib/clientLog";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { PlatformPage, PlatformPageHeader, PlatformResponsiveData } from "../../components/platform/PlatformPageChrome";
import { PlatformBusinessListFilters } from "../../components/platform/BusinessVerificationFilters";
import { platformUi } from "../../components/platform/platformDashboardUi";
import { formatEur } from "../../lib/formatEur";
import {
  DashboardListSkeleton,
  PlatformAdminTableSkeleton,
} from "../../components/dashboard/DashboardSectionLoading";
import { OnboardingVerificationStatusChip } from "../../components/verification/VerificationWorkflowStatusChip";
import { PlatformBusinessMobileCard } from "../../components/platform/PlatformBusinessMobileCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { ListFilterLoadError } from "../../components/shared/ListFilterLoadError";
import { classifyFetchError } from "../../lib/listFilterUx";
import {
  buildBusinessVerificationFilterSummary,
  resolveBusinessVerificationEmptyState,
} from "../../lib/businessVerificationFilterUx";
import {
  BUSINESS_VERIFICATION_PAGE_SIZE,
  useBusinessVerificationFilters,
} from "../../hooks/useBusinessVerificationFilters";

export function PlatformAllBusinessesPage() {
  const { t } = useTranslation();
  const {
    filters,
    debouncedQ,
    setFilters,
    clearAllFilters,
    removeFilter,
    hasActiveFilters,
  } = useBusinessVerificationFilters("all");
  const [rows, setRows] = useState<PlatformBusinessRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadErrorKind, setLoadErrorKind] = useState<ReturnType<typeof classifyFetchError>>("api");
  const loadGenRef = useRef(0);

  const listParams = useMemo(
    () => ({
      q: debouncedQ || undefined,
      status: filters.status,
      workflow: "onboarding" as const,
      date: filters.date,
      dateFrom: filters.date === "custom" ? filters.dateFrom || undefined : undefined,
      dateTo: filters.date === "custom" ? filters.dateTo || undefined : undefined,
      tips: filters.tips,
      sort: filters.sort,
      take: BUSINESS_VERIFICATION_PAGE_SIZE,
      page: filters.page,
    }),
    [debouncedQ, filters],
  );

  const load = useCallback(async () => {
    const gen = ++loadGenRef.current;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetchPlatformBusinesses(listParams);
      if (gen !== loadGenRef.current) return;
      if (res.warning) {
        throw new Error(res.warning);
      }
      setRows(res.businesses);
      setTotal(res.total ?? res.businesses.length);
    } catch (e) {
      if (gen !== loadGenRef.current) return;
      logClientError("PlatformAllBusinessesPage.load", e);
      setLoadError(toUserFriendlyMessage(e));
      setLoadErrorKind(classifyFetchError(e));
      setRows([]);
      setTotal(0);
    } finally {
      if (gen === loadGenRef.current) setLoading(false);
    }
  }, [listParams]);

  useEffect(() => {
    void load();
  }, [load]);

  const colCount = 5;
  const pageCount = Math.max(1, Math.ceil(total / BUSINESS_VERIFICATION_PAGE_SIZE));
  const showTableLoading = loading;

  const filterSummary = useMemo(
    () => buildBusinessVerificationFilterSummary(filters, debouncedQ, total, t, "all"),
    [debouncedQ, filters, t, total],
  );

  const emptyCopy = useMemo(
    () => resolveBusinessVerificationEmptyState(filters, debouncedQ, t, "all"),
    [debouncedQ, filters, t],
  );

  const paginationFooter =
    total > BUSINESS_VERIFICATION_PAGE_SIZE ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {t("admin.businessVerificationPage.pagination", {
            from: total === 0 ? 0 : filters.page * BUSINESS_VERIFICATION_PAGE_SIZE + 1,
            to: Math.min((filters.page + 1) * BUSINESS_VERIFICATION_PAGE_SIZE, total),
            total,
          })}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={filters.page === 0 || loading}
            onClick={() => setFilters({ page: filters.page - 1 }, { resetPage: false })}
            className="min-h-[40px] rounded-lg border border-border px-3 text-xs font-medium text-foreground disabled:opacity-50"
          >
            {t("admin.businessVerificationPage.prevPage")}
          </button>
          <span className="text-xs tabular-nums text-muted-foreground">
            {filters.page + 1} / {pageCount}
          </span>
          <button
            type="button"
            disabled={filters.page + 1 >= pageCount || loading}
            onClick={() => setFilters({ page: filters.page + 1 }, { resetPage: false })}
            className="min-h-[40px] rounded-lg border border-border px-3 text-xs font-medium text-foreground disabled:opacity-50"
          >
            {t("admin.businessVerificationPage.nextPage")}
          </button>
        </div>
      </div>
    ) : total > 0 ? (
      <p className="text-xs text-muted-foreground">
        {t("admin.businessVerificationPage.pagination", {
          from: 1,
          to: total,
          total,
        })}
      </p>
    ) : null;

  return (
    <PlatformPage>
      <PlatformPageHeader
        icon={Building2}
        title={t("admin.allBusinessesPage.title")}
        subtitle={t("admin.allBusinessesPage.subtitle")}
      />

      <PlatformBusinessListFilters
        workflow="all"
        filters={filters}
        onChange={(patch) => setFilters(patch)}
        onClearAll={clearAllFilters}
        onRemoveChip={removeFilter}
        hasActiveFilters={hasActiveFilters}
        searchValue={filters.q}
        onSearchChange={(q) => setFilters({ q })}
      />

      {!loadError && !showTableLoading ? (
        <p className="mb-4 text-sm font-medium text-foreground" role="status">
          {filterSummary}
        </p>
      ) : null}

      <PlatformResponsiveData
        footer={paginationFooter}
        mobile={
          showTableLoading ? (
            <DashboardListSkeleton rows={6} minHeightClass="min-h-0" />
          ) : loadError ? (
            <ListFilterLoadError message={loadError} kind={loadErrorKind} onRetry={() => void load()} />
          ) : rows.length === 0 ? (
            <EmptyState
              compact
              title={emptyCopy.title}
              description={emptyCopy.description}
              action={
                hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    {t("admin.businessVerificationPage.filters.clearAll")}
                  </button>
                ) : undefined
              }
            />
          ) : (
            rows.map((b) => <PlatformBusinessMobileCard key={b.id} business={b} />)
          )
        }
        desktop={
          <table className={platformUi.table}>
            <thead>
              <tr className={platformUi.tableHeadRow}>
                <th className={platformUi.tableTh}>{t("admin.colBusiness")}</th>
                <th className={platformUi.tableTh}>{t("admin.colOwner")}</th>
                <th className={platformUi.tableTh}>{t("admin.allBusinessesPage.colOnboardingVerification")}</th>
                <th className={platformUi.tableTh}>{t("admin.colTipsEur")}</th>
                <th className={platformUi.tableTh}>{t("admin.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {showTableLoading ? (
                <PlatformAdminTableSkeleton rows={10} cols={colCount} />
              ) : loadError ? (
                <tr>
                  <td colSpan={colCount} className="p-0">
                    <ListFilterLoadError
                      message={loadError}
                      kind={loadErrorKind}
                      onRetry={() => void load()}
                      compact
                    />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="p-0">
                    <EmptyState
                      compact
                      title={emptyCopy.title}
                      description={emptyCopy.description}
                      action={
                        hasActiveFilters ? (
                          <button
                            type="button"
                            onClick={clearAllFilters}
                            className="text-sm font-medium text-accent hover:underline"
                          >
                            {t("admin.businessVerificationPage.filters.clearAll")}
                          </button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                rows.map((b) => (
                  <tr key={b.id} className={platformUi.tableRow}>
                    <td className={platformUi.tableTd}>
                      <div className="font-medium">{b.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{b.slug}</div>
                    </td>
                    <td className={platformUi.tableTd}>{b.ownerEmail}</td>
                    <td className={platformUi.tableTd}>
                      <OnboardingVerificationStatusChip status={b.onboardingVerificationStatus} />
                    </td>
                    <td className={platformUi.tableTd}>{formatEur(b.totalTipsEur ?? 0)}</td>
                    <td className={platformUi.tableTd}>
                      <Link to={`/platform-admin/businesses/${b.id}`} className="text-sm text-accent hover:underline">
                        {t("admin.view")}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        }
      />
    </PlatformPage>
  );
}
