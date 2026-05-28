import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, Sparkles } from "lucide-react";
import { fetchLandingAiDiagnostics, type LandingAiDiagnosticsResponse } from "../../lib/api";
import { platformUi } from "./platformDashboardUi";

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function PlatformLandingAiDiagnosticsPanel() {
  const { t } = useTranslation();
  const [data, setData] = useState<LandingAiDiagnosticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchLandingAiDiagnostics());
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.platformSettingsPage.landingAi.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const probeOk = data?.probe.reachable === true;
  const outageFallbackPct = data?.metrics.fallbackRate ?? 0;

  return (
    <section className={platformUi.contentCard} aria-labelledby="platform-landing-ai-diagnostics">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <div>
            <h2 id="platform-landing-ai-diagnostics" className="text-sm font-semibold text-foreground">
              {t("admin.platformSettingsPage.landingAi.title")}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t("admin.platformSettingsPage.landingAi.subtitle")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden />
          {t("admin.platformSettingsPage.landingAi.refresh")}
        </button>
      </div>

      {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}

      {data ? (
        <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{t("admin.platformSettingsPage.landingAi.openAiReachable")}</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {probeOk
                ? t("admin.platformSettingsPage.landingAi.yes")
                : t("admin.platformSettingsPage.landingAi.no")}
              {data.probe.httpStatus != null ? ` (HTTP ${data.probe.httpStatus})` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("admin.platformSettingsPage.landingAi.model")}</dt>
            <dd className="mt-0.5 font-medium text-foreground">{data.config.model}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("admin.platformSettingsPage.landingAi.keySource")}</dt>
            <dd className="mt-0.5 font-medium text-foreground">{data.config.keySource}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("admin.platformSettingsPage.landingAi.lastAiSuccess")}</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {formatWhen(data.metrics.lastOpenAiSuccessAt)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("admin.platformSettingsPage.landingAi.openAiSuccessRate")}</dt>
            <dd className="mt-0.5 font-medium text-foreground">{data.metrics.openAiSuccessRate}%</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("admin.platformSettingsPage.landingAi.fallbackRate")}</dt>
            <dd className="mt-0.5 font-medium text-foreground">{outageFallbackPct}%</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("admin.platformSettingsPage.landingAi.quotaFailures")}</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {data.metrics.quotaFailures} ({data.metrics.quotaFailureRate}%)
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("admin.platformSettingsPage.landingAi.totalChats")}</dt>
            <dd className="mt-0.5 font-medium text-foreground">{data.metrics.totalChats}</dd>
          </div>
        </dl>
      ) : loading ? (
        <p className="mt-3 text-xs text-muted-foreground">{t("admin.platformSettingsPage.landingAi.loading")}</p>
      ) : null}
    </section>
  );
}
