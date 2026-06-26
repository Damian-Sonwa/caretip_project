import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import { useSubscriptionEntitlements } from "../../../hooks/useSubscriptionEntitlements";
import { useBusinessIntelligenceData } from "../../../hooks/useBusinessIntelligenceData";
import type { AnalyticsTimeframe } from "../../../hooks/useBusinessDashboardStats";
import { BusinessAnalyticsReporting } from "../../../components/business/BusinessAnalyticsReporting";
import { FeatureGate } from "../../../components/subscription/FeatureGate";

/** Tips → Analytics: sole owner of reporting, exports, and drill-downs. */
export function BusinessTipsAnalyticsPage() {
  const { t } = useTranslation();
  const { user, sessionValidated } = useRequireAuth();
  const [revenueTimeframe, setRevenueTimeframe] = useState<AnalyticsTimeframe>("month");
  const [qrTimeframe, setQrTimeframe] = useState<AnalyticsTimeframe>("month");
  const { advancedAnalyticsEnabled } = useSubscriptionEntitlements({
    enabled: user?.role === "business" && sessionValidated,
    role: user?.role === "business" ? "business" : null,
  });
  const data = useBusinessIntelligenceData(
    Boolean(sessionValidated && user?.role === "business"),
    advancedAnalyticsEnabled,
    revenueTimeframe,
  );

  return (
    <div className="space-y-6 pt-6">
      <p className="text-sm text-muted-foreground">{t("business.tips.analyticsDesc")}</p>
      <FeatureGate featureKey="advancedAnalytics" role="business" enabled={sessionValidated}>
        <BusinessAnalyticsReporting
          data={data}
          revenueTimeframe={revenueTimeframe}
          onRevenueTimeframeChange={setRevenueTimeframe}
          qrTimeframe={qrTimeframe}
          onQrTimeframeChange={setQrTimeframe}
        />
      </FeatureGate>
    </div>
  );
}
