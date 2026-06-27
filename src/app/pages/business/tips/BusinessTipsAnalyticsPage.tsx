import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import { useBusinessEntitlementsContext } from "../../../contexts/BusinessEntitlementsContext";
import { useSubscriptionEntitlements } from "../../../hooks/useSubscriptionEntitlements";
import { useBusinessIntelligenceData } from "../../../hooks/useBusinessIntelligenceData";
import type { AnalyticsTimeframe } from "../../../hooks/useBusinessDashboardStats";
import { BusinessAnalyticsReporting } from "../../../components/business/BusinessAnalyticsReporting";
import {
  isEntitlementsSessionPrimed,
  sessionHasFeature,
} from "../../../lib/subscriptionEntitlementFastPath";

/** Tips → Analytics: sole owner of reporting, exports, and drill-downs. Gated at layout level. */
export function BusinessTipsAnalyticsPage() {
  const { t } = useTranslation();
  const { user, sessionValidated } = useRequireAuth();
  const [revenueTimeframe, setRevenueTimeframe] = useState<AnalyticsTimeframe>("month");
  const [qrTimeframe, setQrTimeframe] = useState<AnalyticsTimeframe>("month");
  const businessContext = useBusinessEntitlementsContext();
  const fallbackEntitlements = useSubscriptionEntitlements({
    enabled: user?.role === "business" && sessionValidated && businessContext == null,
    role: user?.role === "business" ? "business" : null,
  });
  const { ready, hasFeature } = businessContext ?? fallbackEntitlements;
  const analyticsAllowed =
    (ready && hasFeature("advancedAnalytics")) ||
    (isEntitlementsSessionPrimed() && sessionHasFeature("advancedAnalytics"));

  const data = useBusinessIntelligenceData(
    Boolean(sessionValidated && user?.role === "business" && analyticsAllowed),
    true,
    revenueTimeframe,
  );

  return (
    <div className="space-y-6 pt-6">
      <p className="text-sm text-muted-foreground">{t("business.tips.analyticsDesc")}</p>
      <BusinessAnalyticsReporting
        data={data}
        revenueTimeframe={revenueTimeframe}
        onRevenueTimeframeChange={setRevenueTimeframe}
        qrTimeframe={qrTimeframe}
        onQrTimeframeChange={setQrTimeframe}
      />
    </div>
  );
}
