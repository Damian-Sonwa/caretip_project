import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Activity } from "lucide-react";
import { fetchPlatformHealth, type PlatformHealthResponse } from "../../lib/api";
import { PlatformPage, PlatformPageHeader } from "../../components/platform/PlatformPageChrome";
import { NetworkOverviewHero } from "../../components/NetworkOverviewHero";
import { platformUi } from "../../components/platform/platformDashboardUi";

export function PlatformSystemHealthPage() {
  const { t } = useTranslation();
  const [health, setHealth] = useState<PlatformHealthResponse | null>(null);

  useEffect(() => {
    void fetchPlatformHealth().then(setHealth);
  }, []);

  return (
    <PlatformPage>
      <PlatformPageHeader
        icon={Activity}
        title={t("admin.systemHealthPage.title")}
        subtitle={t("admin.systemHealthPage.subtitle")}
      />
      <div className={platformUi.contentCard}>
        <NetworkOverviewHero health={health} embedded variant="health" />
      </div>
      <div className={platformUi.contentCard}>
        <NetworkOverviewHero health={health} embedded variant="copy" />
      </div>
    </PlatformPage>
  );
}
