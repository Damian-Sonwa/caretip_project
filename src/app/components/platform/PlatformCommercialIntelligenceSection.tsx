import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Loader2 } from "lucide-react";
import {
  fetchPlatformCommercialIntelligence,
  type PlatformCommercialIntelligence,
  type PlatformCommercialBusinessInsight,
} from "../../lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { platformUi } from "./platformDashboardUi";

const COMMERCIAL_FETCH_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("timeout")), ms);
    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((err: unknown) => {
        window.clearTimeout(timer);
        reject(err);
      });
  });
}

function SegmentList({
  title,
  items,
  emptyLabel,
  variant,
}: {
  title: string;
  items: PlatformCommercialBusinessInsight[];
  emptyLabel: string;
  variant: "growth" | "risk" | "opportunity" | "enterprise";
}) {
  const { t } = useTranslation();
  const border =
    variant === "growth"
      ? "border-emerald-500/30"
      : variant === "risk"
        ? "border-amber-500/30"
        : variant === "enterprise"
          ? "border-violet-500/30"
          : "border-primary/30";

  return (
    <div className={cn("rounded-xl border bg-muted/10 p-4", border)}>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={`${item.segment}-${item.businessId}`} className="text-sm">
              <Link
                to={`/platform-admin/businesses/${item.businessId}`}
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                {item.name}
              </Link>
              <span className="ml-2 text-xs uppercase text-muted-foreground">{item.tier}</span>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t(`admin.commercial.reasons.${item.reasonCode}`, {
                  defaultValue: item.reasonCode,
                  ...item.evidence,
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PlatformCommercialIntelligenceSection() {
  const { t } = useTranslation();
  const [data, setData] = useState<PlatformCommercialIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const d = await withTimeout(fetchPlatformCommercialIntelligence(), COMMERCIAL_FETCH_TIMEOUT_MS);
      setData(d);
    } catch {
      setData(null);
      setLoadError(t("admin.commercial.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Card className={cn(platformUi.contentCard, "mb-6")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("admin.commercial.title")}</CardTitle>
          <CardDescription>{t("admin.commercial.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-[88px] items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />
          <span className="sr-only">{t("admin.networkHero.checking")}</span>
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className={cn(platformUi.contentCard, "mb-6")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("admin.commercial.title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t("admin.retry")}
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const sub = data.subscription;
  const readiness = data.enterpriseReadiness;

  return (
    <Card className={cn(platformUi.contentCard, "mb-6")}>
      <CardHeader>
        <CardTitle className="text-base">{t("admin.commercial.title")}</CardTitle>
        <CardDescription>{t("admin.commercial.desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{t("admin.commercial.subscriptionTitle")}</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("admin.commercial.subscriptionPeriod", { days: sub.periodDays })}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: t("admin.commercial.upgrades"), value: sub.upgrades },
              { label: t("admin.commercial.downgrades"), value: sub.downgrades },
              { label: t("admin.commercial.cancellationsScheduled"), value: sub.cancellationsScheduled },
              { label: t("admin.commercial.paymentFailures"), value: sub.paymentFailures },
              { label: t("admin.commercial.renewals"), value: sub.renewalsSucceeded },
              { label: t("admin.commercial.activeSubscriptions"), value: sub.activeSubscriptions },
              { label: t("admin.commercial.cancelAtPeriodEnd"), value: sub.cancelAtPeriodEnd },
              { label: t("admin.commercial.pastDue"), value: sub.pastDue },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border border-border/60 bg-background px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{m.label}</p>
                <p className="text-xl font-semibold tabular-nums">{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SegmentList
            title={t("admin.commercial.growthCandidates")}
            items={data.segments.growthCandidates}
            emptyLabel={t("admin.commercial.none")}
            variant="growth"
          />
          <SegmentList
            title={t("admin.commercial.atRisk")}
            items={data.segments.atRisk}
            emptyLabel={t("admin.commercial.none")}
            variant="risk"
          />
          <SegmentList
            title={t("admin.commercial.premiumOpportunities")}
            items={data.segments.premiumOpportunities}
            emptyLabel={t("admin.commercial.none")}
            variant="opportunity"
          />
          <SegmentList
            title={t("admin.commercial.enterpriseCandidates")}
            items={data.segments.enterpriseCandidates}
            emptyLabel={t("admin.commercial.none")}
            variant="enterprise"
          />
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
          <h4 className="text-sm font-semibold text-foreground">{t("admin.commercial.enterpriseReadiness")}</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.commercial.enterpriseScore", {
              score: readiness.score,
              max: readiness.maxScore,
            })}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {readiness.checks.map((check) => (
              <li key={check.id} className="flex items-center gap-2 text-xs">
                <span
                  className={cn(
                    "inline-block h-2 w-2 rounded-full",
                    check.passed ? "bg-emerald-500" : "bg-muted-foreground/40",
                  )}
                  aria-hidden
                />
                <span className={check.passed ? "text-foreground" : "text-muted-foreground"}>{check.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
