import { useTranslation } from "react-i18next";
import { FeatureGate } from "../subscription/FeatureGate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { businessUi } from "@/app/components/business/businessDashboardUi";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { useBusinessQrAnalytics } from "../../hooks/useBusinessQrAnalytics";
import { QrAnalyticsLivePanel } from "./insights/QrAnalyticsLivePanel";

type QrStudioPerformancePanelProps = {
  canView: boolean;
  templateLabel: string;
};

/** QR Studio — lightweight scan analytics from qr_scan_events. */
export function QrStudioPerformancePanel({ canView, templateLabel }: QrStudioPerformancePanelProps) {
  const { t } = useTranslation();
  const { sessionValidated } = useRequireAuth();
  const qr = useBusinessQrAnalytics(Boolean(canView && sessionValidated), "month");

  return (
    <FeatureGate featureKey="advancedAnalytics" role="business" enabled={canView}>
      <Card className={businessUi.cardStatic}>
        <CardHeader className="border-b border-neutral-100/90">
          <CardTitle className="text-base">{t("business.qrStudio.analytics.title")}</CardTitle>
          <CardDescription className={businessUi.cardDesc}>
            {t("business.qrStudio.analytics.description", { template: templateLabel })}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <QrAnalyticsLivePanel data={qr.data} loading={qr.loading} compact />
        </CardContent>
      </Card>
    </FeatureGate>
  );
}
