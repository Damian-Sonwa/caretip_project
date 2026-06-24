import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import { useSubscriptionEntitlements } from "../../../hooks/useSubscriptionEntitlements";
import { useBusinessIntelligenceData } from "../../../hooks/useBusinessIntelligenceData";
import { BusinessExecutivePerformance } from "../../../components/business/BusinessExecutivePerformance";
import { FeatureGate } from "../../../components/subscription/FeatureGate";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

/** Team → Performance: executive insights — health, trends, recommendations (not raw analytics). */
export function BusinessTeamPerformancePage() {
  const { t } = useTranslation();
  const { user, sessionValidated } = useRequireAuth();
  const { advancedAnalyticsEnabled } = useSubscriptionEntitlements({
    enabled: user?.role === "business" && sessionValidated,
    role: user?.role === "business" ? "business" : null,
  });
  const data = useBusinessIntelligenceData(
    Boolean(sessionValidated && user?.role === "business"),
    advancedAnalyticsEnabled,
  );

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <p className="max-w-2xl text-sm text-muted-foreground">{t("business.team.performanceDesc")}</p>
        <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" asChild>
          <Link to="/dashboard/tips/analytics">
            <BarChart3 className="mr-2 h-4 w-4" aria-hidden />
            {t("business.team.performance.openAnalytics")}
          </Link>
        </Button>
      </div>

      <FeatureGate featureKey="advancedAnalytics" role="business" enabled={sessionValidated}>
        <BusinessExecutivePerformance data={data} />
      </FeatureGate>
    </div>
  );
}
