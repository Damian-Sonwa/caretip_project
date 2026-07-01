import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard } from "lucide-react";
import { PlatformPage, PlatformPageHeader } from "../../components/platform/PlatformPageChrome";
import { PlatformSubscriptionMonitoringSection } from "../../components/platform/PlatformSubscriptionMonitoringSection";

export function PlatformBusinessSubscriptionsPage() {
  const { t } = useTranslation();
  return (
    <PlatformPage>
      <PlatformPageHeader
        icon={CreditCard}
        title={t("admin.subscriptions.title")}
        subtitle={t("admin.subscriptions.desc")}
      />
      <Suspense fallback={null}>
        <PlatformSubscriptionMonitoringSection part="full" />
      </Suspense>
    </PlatformPage>
  );
}
