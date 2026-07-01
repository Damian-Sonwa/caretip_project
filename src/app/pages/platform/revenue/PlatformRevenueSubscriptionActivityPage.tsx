import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard } from "lucide-react";
import type { PlatformSubscriptionActivityFilter } from "../../../lib/api";
import { PlatformPage, PlatformPageHeader } from "../../../components/platform/PlatformPageChrome";
import { PlatformSubscriptionMonitoringSection } from "../../../components/platform/PlatformSubscriptionMonitoringSection";

type PlatformRevenueSubscriptionActivityPageProps = {
  initialFilter: PlatformSubscriptionActivityFilter;
  titleKey: string;
  subtitleKey: string;
};

export function PlatformRevenueSubscriptionActivityPage({
  initialFilter,
  titleKey,
  subtitleKey,
}: PlatformRevenueSubscriptionActivityPageProps) {
  const { t } = useTranslation();
  return (
    <PlatformPage>
      <PlatformPageHeader icon={CreditCard} title={t(titleKey)} subtitle={t(subtitleKey)} />
      <Suspense fallback={null}>
        <PlatformSubscriptionMonitoringSection
          part="activity"
          embedded
          initialFilter={initialFilter}
          hideActivityFilters
        />
      </Suspense>
    </PlatformPage>
  );
}
