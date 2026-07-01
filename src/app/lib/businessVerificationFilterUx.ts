import type { TFunction } from "i18next";
import type { BusinessVerificationFilterState } from "../hooks/useBusinessVerificationFilters";
import { countRestrictiveFilterDimensions, type ListEmptyStateCopy } from "./listFilterUx";

export type BusinessVerificationWorkflow = "kyc" | "onboarding";

function i18nRoot(workflow: BusinessVerificationWorkflow): string {
  return workflow === "onboarding"
    ? "admin.onboardingVerificationPage"
    : "admin.businessVerificationPage";
}

function tipsIsRestrictive(tips: BusinessVerificationFilterState["tips"]): boolean {
  return tips !== "all" && tips !== "highest" && tips !== "lowest";
}

export function countBusinessVerificationRestrictiveDimensions(
  filters: BusinessVerificationFilterState,
  debouncedQ: string,
): number {
  return countRestrictiveFilterDimensions([
    debouncedQ.trim() !== "",
    filters.status !== "all",
    filters.date !== "all",
    tipsIsRestrictive(filters.tips),
  ]);
}

function translateOrFallback(
  t: TFunction,
  key: string,
  fallbackKey: string,
  options?: Record<string, unknown>,
): string {
  const primary = t(key, { ...(options ?? {}), defaultValue: "" });
  if (primary && primary !== key) return primary;
  const fallback = t(fallbackKey, { ...(options ?? {}), defaultValue: "" });
  if (fallback && fallback !== fallbackKey) return fallback;
  return primary || fallback || key;
}

export function resolveBusinessVerificationEmptyState(
  filters: BusinessVerificationFilterState,
  debouncedQ: string,
  t: TFunction,
  workflow: BusinessVerificationWorkflow = "kyc",
): ListEmptyStateCopy {
  const root = i18nRoot(workflow);
  const dimensions = countBusinessVerificationRestrictiveDimensions(filters, debouncedQ);

  if (dimensions === 0) {
    return {
      title: t(`${root}.emptyList`),
    };
  }

  if (dimensions > 1) {
    return {
      title: translateOrFallback(
        t,
        `${root}.empty.combinedFilters.title`,
        "admin.businessVerificationPage.empty.combinedFilters.title",
      ),
      description: translateOrFallback(
        t,
        `${root}.empty.combinedFilters.description`,
        "admin.businessVerificationPage.empty.combinedFilters.description",
      ),
    };
  }

  if (debouncedQ.trim()) {
    return {
      title: translateOrFallback(
        t,
        `${root}.empty.search.title`,
        "admin.businessVerificationPage.empty.search.title",
      ),
      description: translateOrFallback(
        t,
        `${root}.empty.search.description`,
        "admin.businessVerificationPage.empty.search.description",
        { q: debouncedQ.trim() },
      ),
    };
  }

  if (filters.status !== "all") {
    const key = filters.status;
    return {
      title: translateOrFallback(
        t,
        `${root}.empty.status.${key}.title`,
        `admin.businessVerificationPage.empty.status.${key}.title`,
      ),
      description:
        translateOrFallback(
          t,
          `${root}.empty.status.${key}.description`,
          `admin.businessVerificationPage.empty.status.${key}.description`,
          { hours: 48 },
        ) || undefined,
    };
  }

  if (filters.date !== "all") {
    if (filters.date === "custom") {
      return {
        title: translateOrFallback(
          t,
          `${root}.empty.date.custom.title`,
          "admin.businessVerificationPage.empty.date.custom.title",
        ),
        description: translateOrFallback(
          t,
          `${root}.empty.date.custom.description`,
          "admin.businessVerificationPage.empty.date.custom.description",
        ),
      };
    }
    return {
      title: translateOrFallback(
        t,
        `${root}.empty.date.${filters.date}.title`,
        `admin.businessVerificationPage.empty.date.${filters.date}.title`,
      ),
      description:
        translateOrFallback(
          t,
          `${root}.empty.date.${filters.date}.description`,
          `admin.businessVerificationPage.empty.date.${filters.date}.description`,
        ) || undefined,
    };
  }

  if (tipsIsRestrictive(filters.tips)) {
    return {
      title: translateOrFallback(
        t,
        `${root}.empty.tips.${filters.tips}.title`,
        `admin.businessVerificationPage.empty.tips.${filters.tips}.title`,
      ),
      description:
        translateOrFallback(
          t,
          `${root}.empty.tips.${filters.tips}.description`,
          `admin.businessVerificationPage.empty.tips.${filters.tips}.description`,
        ) || undefined,
    };
  }

  return {
    title: translateOrFallback(
      t,
      `${root}.empty.combinedFilters.title`,
      "admin.businessVerificationPage.empty.combinedFilters.title",
    ),
  };
}

export function buildBusinessVerificationFilterSummary(
  filters: BusinessVerificationFilterState,
  debouncedQ: string,
  total: number,
  t: TFunction,
  workflow: BusinessVerificationWorkflow = "kyc",
): string {
  const root = i18nRoot(workflow);

  if (debouncedQ.trim()) {
    return t(`${root}.summary.search`, {
      total,
      q: debouncedQ.trim(),
      defaultValue: t("admin.businessVerificationPage.summary.search", { total, q: debouncedQ.trim() }),
    });
  }

  if (filters.status !== "all") {
    return translateOrFallback(
      t,
      `${root}.summary.status.${filters.status}`,
      `admin.businessVerificationPage.summary.status.${filters.status}`,
      { total, defaultValue: t("admin.businessVerificationPage.summary.default", { total }) },
    );
  }

  if (filters.date !== "all") {
    if (filters.date === "custom" && (filters.dateFrom || filters.dateTo)) {
      return translateOrFallback(
        t,
        `${root}.summary.date.custom`,
        "admin.businessVerificationPage.summary.date.custom",
        {
          total,
          from: filters.dateFrom || "…",
          to: filters.dateTo || "…",
          defaultValue: t("admin.businessVerificationPage.summary.default", { total }),
        },
      );
    }
    return translateOrFallback(
      t,
      `${root}.summary.date.${filters.date}`,
      `admin.businessVerificationPage.summary.date.${filters.date}`,
      { total, defaultValue: t("admin.businessVerificationPage.summary.default", { total }) },
    );
  }

  if (tipsIsRestrictive(filters.tips)) {
    return translateOrFallback(
      t,
      `${root}.summary.tips.${filters.tips}`,
      `admin.businessVerificationPage.summary.tips.${filters.tips}`,
      { total, defaultValue: t("admin.businessVerificationPage.summary.default", { total }) },
    );
  }

  return t(`${root}.summary.default`, {
    total,
    defaultValue: t("admin.businessVerificationPage.summary.default", { total }),
  });
}
