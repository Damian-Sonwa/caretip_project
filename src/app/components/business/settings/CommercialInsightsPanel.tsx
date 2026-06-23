import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Loader2 } from "lucide-react";
import {
  fetchManagerCommercialInsights,
  type ManagerCommercialInsights,
} from "../../../lib/api";

function evidenceLine(evidence: Record<string, string | number>): string {
  return Object.entries(evidence)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}

export function CommercialInsightsPanel() {
  const { t } = useTranslation();
  const [data, setData] = useState<ManagerCommercialInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const insights = await fetchManagerCommercialInsights();
        if (!cancelled) setData(insights);
      } catch {
        if (!cancelled) setError(t("business.commercial.loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  if (loading) {
    return (
      <div className="flex min-h-[120px] items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      </div>
    );
  }

  if (error || !data) return null;

  const topUtilization = data.utilization.slice(0, 5);
  const showUpgrade = data.tier === "basic" && data.upgradeOpportunities.length > 0;
  const showRetention = data.retention.level !== "low" || data.retention.signals.length > 0;

  if (topUtilization.length === 0 && !showUpgrade && !showRetention) return null;

  return (
    <section className="space-y-6 rounded-xl border border-border/60 bg-muted/10 p-5">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t("business.commercial.title")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("business.commercial.desc")}</p>
      </div>

      {topUtilization.length > 0 ? (
        <div>
          <h4 className="text-sm font-semibold text-foreground">{t("business.commercial.utilizationTitle")}</h4>
          <ul className="mt-2 space-y-2">
            {topUtilization.map((row) => (
              <li
                key={row.featureKey}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
              >
                <span>{t(`business.commercial.features.${row.featureKey}`, row.featureKey)}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {t("business.commercial.hits30d", { count: row.hits30d })}
                  {row.source === "inferred" ? ` · ${t("business.commercial.inferred")}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showUpgrade ? (
        <div>
          <h4 className="text-sm font-semibold text-foreground">{t("business.commercial.upgradeTitle")}</h4>
          <p className="mt-1 text-xs text-muted-foreground">{t("business.commercial.upgradeDisclaimer")}</p>
          <ul className="mt-3 space-y-3">
            {data.upgradeOpportunities.map((opp) => (
              <li key={opp.id} className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 text-sm">
                <p className="font-medium text-foreground">
                  {t(`business.commercial.opportunities.${opp.reasonCode}`, {
                    defaultValue: opp.reasonCode,
                    ...opp.evidence,
                  })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{evidenceLine(opp.evidence)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground/80">
                  {t("business.commercial.suggestedTier", { tier: opp.suggestedTier })}
                </p>
              </li>
            ))}
          </ul>
          <Link
            to="/dashboard/billing/subscription#billing-plans"
            className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("business.commercial.viewPlans")}
          </Link>
        </div>
      ) : null}

      {showRetention && data.retention.signals.length > 0 ? (
        <div>
          <h4 className="text-sm font-semibold text-foreground">{t("business.commercial.retentionTitle")}</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            {t(`business.commercial.retentionLevel.${data.retention.level}`)}
          </p>
          <ul className="mt-2 space-y-2">
            {data.retention.signals.map((signal) => (
              <li
                key={signal.id}
                className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
              >
                <p>
                  {t(`business.commercial.retentionSignals.${signal.reasonCode}`, {
                    defaultValue: signal.reasonCode,
                    ...signal.evidence,
                  })}
                </p>
                <p className="mt-0.5 text-xs opacity-80">{evidenceLine(signal.evidence)}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
