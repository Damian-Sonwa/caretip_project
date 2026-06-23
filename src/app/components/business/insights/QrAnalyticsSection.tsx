import { useTranslation } from "react-i18next";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import { useSubscriptionEntitlements } from "../../../hooks/useSubscriptionEntitlements";
import { useBusinessQrAnalytics } from "../../../hooks/useBusinessQrAnalytics";
import type { BusinessQrAnalyticsTimeframe } from "../../../lib/api";
import { QrAnalyticsLivePanel } from "./QrAnalyticsLivePanel";

type QrAnalyticsSectionProps = {
  loading?: boolean;
  timeframe?: BusinessQrAnalyticsTimeframe;
};

/** Analytics page — QR scan metrics from qr_scan_events (Sprint 4). */
export function QrAnalyticsSection({ timeframe = "month" }: QrAnalyticsSectionProps) {
  const { t } = useTranslation();
  const { user, sessionValidated } = useRequireAuth();
  const { advancedAnalyticsEnabled } = useSubscriptionEntitlements({
    enabled: user?.role === "business" && sessionValidated,
    role: user?.role === "business" ? "business" : null,
  });
  const qr = useBusinessQrAnalytics(
    Boolean(sessionValidated && user?.role === "business" && advancedAnalyticsEnabled),
    timeframe,
  );

  return (
    <section className="space-y-3" aria-label={t("business.team.performance.bi.qrTitle")}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t("business.team.performance.bi.qrTitle")}
      </h2>
      <QrAnalyticsLivePanel data={qr.data} loading={qr.loading} />
    </section>
  );
}
