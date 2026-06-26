import { useTranslation } from "react-i18next";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import { useSubscriptionEntitlements } from "../../../hooks/useSubscriptionEntitlements";
import { useBusinessQrAnalytics } from "../../../hooks/useBusinessQrAnalytics";
import type { BusinessQrAnalytics, BusinessQrAnalyticsTimeframe } from "../../../lib/api";
import { QrAnalyticsLivePanel } from "./QrAnalyticsLivePanel";

type QrAnalyticsSectionProps = {
  loading?: boolean;
  timeframe?: BusinessQrAnalyticsTimeframe;
  showHeading?: boolean;
  /** When provided, skips a separate fetch and uses bundle data from useBusinessAnalytics. */
  data?: BusinessQrAnalytics | null;
  dataLoading?: boolean;
};

/** Analytics page — QR scan metrics from qr_scan_events (Sprint 4). */
export function QrAnalyticsSection({
  timeframe = "month",
  showHeading = true,
  data: dataProp,
  dataLoading,
}: QrAnalyticsSectionProps) {
  const { t } = useTranslation();
  const { user, sessionValidated } = useRequireAuth();
  const { advancedAnalyticsEnabled } = useSubscriptionEntitlements({
    enabled: user?.role === "business" && sessionValidated,
    role: user?.role === "business" ? "business" : null,
  });
  const useHook = dataProp === undefined;
  const qr = useBusinessQrAnalytics(
    useHook && Boolean(sessionValidated && user?.role === "business" && advancedAnalyticsEnabled),
    timeframe,
  );
  const data = dataProp !== undefined ? dataProp : qr.data;
  const loading = dataProp !== undefined ? Boolean(dataLoading) : qr.loading;

  return (
    <section className="space-y-3" aria-label={showHeading ? t("business.team.performance.bi.qrTitle") : undefined}>
      {showHeading ? (
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("business.team.performance.bi.qrTitle")}
        </h2>
      ) : null}
      <QrAnalyticsLivePanel data={data} loading={loading} />
    </section>
  );
}
