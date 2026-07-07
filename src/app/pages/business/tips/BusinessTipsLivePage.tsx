import { useTranslation } from "react-i18next";

import { useRequireAuth } from "../../../hooks/useRequireAuth";
import { useSubscriptionEntitlements } from "../../../hooks/useSubscriptionEntitlements";
import { useBusinessTipsModuleData } from "../../../hooks/useBusinessTipsModuleData";
import { useLiveActivityStream } from "../../../hooks/useLiveActivityStream";
import { LiveActivityCenter } from "../../../components/business/insights/LiveActivityCenter";

/** Live Tips — operational activity stream (Sprint 5C). */
export function BusinessTipsLivePage() {
  const { t } = useTranslation();
  const { user, sessionValidated } = useRequireAuth();

  const { advancedAnalyticsEnabled } = useSubscriptionEntitlements({
    enabled: user?.role === "business" && sessionValidated,
    role: user?.role === "business" ? "business" : null,
  });

  const data = useBusinessTipsModuleData(
    Boolean(sessionValidated && user?.role === "business"),
    advancedAnalyticsEnabled,
  );

  const { items, liveIds } = useLiveActivityStream({
    enabled: Boolean(sessionValidated && user?.role === "business"),
    businessId: user?.businessId,
    initialTips: data.recentTips,
    t,
  });

  return (
    <div className="space-y-6 pt-6">
      <p className="text-sm text-muted-foreground">{t("business.tips.liveDesc")}</p>
      <LiveActivityCenter
        items={items}
        liveIds={liveIds}
        loading={data.isInitialAnalyticsLoading}
        refreshing={data.isAnalyticsRefreshing}
      />
    </div>
  );
}
