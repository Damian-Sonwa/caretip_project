import { useTranslation } from "react-i18next";
import { Settings } from "lucide-react";
import { PlatformPage, PlatformPageHeader } from "../../components/platform/PlatformPageChrome";
import { PlatformLandingAiDiagnosticsPanel } from "../../components/platform/PlatformLandingAiDiagnosticsPanel";
import { PlatformSettingsNotificationsPanel } from "../../components/platform/PlatformSettingsNotificationsPanel";
import { platformUi } from "../../components/platform/platformDashboardUi";

export function PlatformSettingsPage() {
  const { t } = useTranslation();
  return (
    <PlatformPage>
      <PlatformPageHeader
        icon={Settings}
        title={t("admin.platformSettingsPage.title")}
        subtitle={t("admin.platformSettingsPage.subtitle")}
      />
      <div className="space-y-6">
        <PlatformLandingAiDiagnosticsPanel />
        <PlatformSettingsNotificationsPanel />
        <div className={platformUi.contentCard}>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("admin.platformSettingsPage.cardBody")}
          </p>
        </div>
      </div>
    </PlatformPage>
  );
}
