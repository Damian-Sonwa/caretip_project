import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import type {
  PlatformBusinessDatePreset,
  PlatformBusinessSort,
  PlatformBusinessStatusFilter,
  PlatformBusinessTipsFilter,
} from "../lib/api";

export const BUSINESS_VERIFICATION_PAGE_SIZE = 25;

export type BusinessVerificationFilterState = {
  q: string;
  status: PlatformBusinessStatusFilter;
  date: PlatformBusinessDatePreset;
  dateFrom: string;
  dateTo: string;
  tips: PlatformBusinessTipsFilter;
  sort: PlatformBusinessSort;
  page: number;
};

export const DEFAULT_BUSINESS_VERIFICATION_FILTERS: BusinessVerificationFilterState = {
  q: "",
  status: "all",
  date: "all",
  dateFrom: "",
  dateTo: "",
  tips: "all",
  sort: "newest",
  page: 0,
};

function parseStatus(
  raw: string | null,
  workflow: "kyc" | "onboarding" = "kyc",
): PlatformBusinessStatusFilter {
  const kycAllowed: PlatformBusinessStatusFilter[] = [
    "all",
    "verified",
    "pending_review",
    "awaiting_upload",
    "sla_breach",
    "rejected",
    "suspended",
    "not_started",
  ];
  const onboardingAllowed: PlatformBusinessStatusFilter[] = [
    "all",
    "draft",
    "submitted",
    "approved",
    "rejected",
    "suspended",
    "inactive",
  ];
  const allowed = workflow === "onboarding" ? onboardingAllowed : kycAllowed;
  return allowed.includes(raw as PlatformBusinessStatusFilter)
    ? (raw as PlatformBusinessStatusFilter)
    : "all";
}

function parseDate(raw: string | null): PlatformBusinessDatePreset {
  const allowed: PlatformBusinessDatePreset[] = [
    "all",
    "today",
    "last_7",
    "last_30",
    "this_month",
    "last_month",
    "custom",
  ];
  return allowed.includes(raw as PlatformBusinessDatePreset)
    ? (raw as PlatformBusinessDatePreset)
    : "all";
}

function parseTips(raw: string | null): PlatformBusinessTipsFilter {
  const allowed: PlatformBusinessTipsFilter[] = [
    "all",
    "zero",
    "1_500",
    "501_5000",
    "5001_plus",
    "highest",
    "lowest",
  ];
  return allowed.includes(raw as PlatformBusinessTipsFilter)
    ? (raw as PlatformBusinessTipsFilter)
    : "all";
}

function parseSort(raw: string | null): PlatformBusinessSort {
  const allowed: PlatformBusinessSort[] = [
    "newest",
    "oldest",
    "tips_high",
    "tips_low",
    "name_asc",
    "name_desc",
  ];
  return allowed.includes(raw as PlatformBusinessSort) ? (raw as PlatformBusinessSort) : "newest";
}

function readFiltersFromSearchParams(
  sp: URLSearchParams,
  workflow: "kyc" | "onboarding",
  defaultStatus: PlatformBusinessStatusFilter = "all",
): BusinessVerificationFilterState {
  const pageRaw = Number(sp.get("page") ?? "0");
  const hasStatusParam = sp.has("status");
  return {
    q: sp.get("q") ?? "",
    status: hasStatusParam ? parseStatus(sp.get("status"), workflow) : defaultStatus,
    date: parseDate(sp.get("date")),
    dateFrom: sp.get("dateFrom") ?? "",
    dateTo: sp.get("dateTo") ?? "",
    tips: parseTips(sp.get("tips")),
    sort: parseSort(sp.get("sort")),
    page: Number.isFinite(pageRaw) && pageRaw >= 0 ? pageRaw : 0,
  };
}

function filtersToSearchParams(
  filters: BusinessVerificationFilterState,
  defaultStatus: PlatformBusinessStatusFilter = "all",
): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.q.trim()) sp.set("q", filters.q.trim());
  if (filters.status !== "all") {
    sp.set("status", filters.status);
  } else if (defaultStatus !== "all") {
    sp.set("status", "all");
  }
  if (filters.date !== "all") sp.set("date", filters.date);
  if (filters.date === "custom") {
    if (filters.dateFrom) sp.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) sp.set("dateTo", filters.dateTo);
  }
  if (filters.tips !== "all") sp.set("tips", filters.tips);
  if (filters.sort !== "newest") sp.set("sort", filters.sort);
  if (filters.page > 0) sp.set("page", String(filters.page));
  return sp;
}

export function hasActiveBusinessVerificationFilters(
  filters: BusinessVerificationFilterState,
  debouncedQ: string,
  defaultStatus: PlatformBusinessStatusFilter = "all",
): boolean {
  const statusActive = filters.status !== "all" && filters.status !== defaultStatus;
  return (
    debouncedQ.trim() !== "" ||
    statusActive ||
    filters.date !== "all" ||
    filters.tips !== "all" ||
    filters.sort !== "newest"
  );
}

/** Filters that can reduce the result set (excludes sort-only changes). */
export function hasRestrictiveBusinessVerificationFilters(
  filters: BusinessVerificationFilterState,
  debouncedQ: string,
  defaultStatus: PlatformBusinessStatusFilter = "all",
): boolean {
  const tipsRestrictive =
    filters.tips !== "all" && filters.tips !== "highest" && filters.tips !== "lowest";
  const statusRestrictive = filters.status !== "all" && filters.status !== defaultStatus;
  return (
    debouncedQ.trim() !== "" ||
    statusRestrictive ||
    filters.date !== "all" ||
    tipsRestrictive
  );
}

export function useBusinessVerificationFilters(
  workflow: "kyc" | "onboarding" | "all" = "kyc",
  options?: { defaultStatus?: PlatformBusinessStatusFilter },
) {
  const statusWorkflow = workflow === "all" ? "onboarding" : workflow;
  const defaultStatus = options?.defaultStatus ?? "all";
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(
    () => readFiltersFromSearchParams(searchParams, statusWorkflow, defaultStatus),
    [searchParams, statusWorkflow, defaultStatus],
  );
  const [debouncedQ, setDebouncedQ] = useState(filters.q);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(filters.q), 400);
    return () => window.clearTimeout(timer);
  }, [filters.q]);

  const setFilters = useCallback(
    (patch: Partial<BusinessVerificationFilterState>, opts?: { resetPage?: boolean }) => {
      const next: BusinessVerificationFilterState = {
        ...filters,
        ...patch,
        ...(opts?.resetPage !== false && patch.page === undefined ? { page: 0 } : {}),
      };
      setSearchParams(filtersToSearchParams(next, defaultStatus), { replace: true });
    },
    [filters, setSearchParams, defaultStatus],
  );

  const clearAllFilters = useCallback(() => {
    if (defaultStatus !== "all") {
      setSearchParams(filtersToSearchParams({ ...DEFAULT_BUSINESS_VERIFICATION_FILTERS, status: defaultStatus }, defaultStatus), {
        replace: true,
      });
    } else {
      setSearchParams(new URLSearchParams(), { replace: true });
    }
    setDebouncedQ("");
  }, [setSearchParams, defaultStatus]);

  const removeFilter = useCallback(
    (key: keyof BusinessVerificationFilterState) => {
      if (key === "q") {
        setFilters({ q: "" });
        setDebouncedQ("");
        return;
      }
      if (key === "status") {
        setFilters({ status: "all" });
        return;
      }
      if (key === "date") {
        setFilters({ date: "all", dateFrom: "", dateTo: "" });
        return;
      }
      if (key === "tips") {
        setFilters({ tips: "all" });
        return;
      }
      if (key === "sort") {
        setFilters({ sort: "newest" });
      }
    },
    [setFilters],
  );

  const toggleStatusFilter = useCallback(
    (status: PlatformBusinessStatusFilter) => {
      if (status === "all" || filters.status === status) {
        setFilters({ status: "all" });
      } else {
        setFilters({ status });
      }
    },
    [filters.status, setFilters],
  );

  /** KPI card click — status-only view so card count matches the table total. */
  const applyKpiStatusFilter = useCallback(
    (status: PlatformBusinessStatusFilter) => {
      if (filters.status === status) {
        setFilters({ status: "all" });
        return;
      }
      setFilters({
        status,
        q: "",
        date: "all",
        dateFrom: "",
        dateTo: "",
        tips: "all",
        page: 0,
      });
      setDebouncedQ("");
    },
    [filters.status, setFilters],
  );

  return {
    filters,
    debouncedQ,
    setFilters,
    clearAllFilters,
    removeFilter,
    toggleStatusFilter,
    applyKpiStatusFilter,
    hasActiveFilters: hasActiveBusinessVerificationFilters(filters, debouncedQ, defaultStatus),
    hasRestrictiveFilters: hasRestrictiveBusinessVerificationFilters(filters, debouncedQ, defaultStatus),
  };
}
