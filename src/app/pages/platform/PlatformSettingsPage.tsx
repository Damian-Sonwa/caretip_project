import { useTranslation } from "react-i18next";
import { Settings } from "lucide-react";
import { PlatformPage, PlatformPageHeader } from "../../components/platform/PlatformPageChrome";
import { platformUi } from "../../components/platform/platformDashboardUi";

export function PlatformSettingsPage() {
  const { t } = useTranslation();
  return (
    <PlatformPage>
      <PlatformPageHeader
        icon={Settings}
        title="System settings"
        subtitle="Global platform configuration. Additional controls can be wired here as your operations grow."
      />
      <div className={platformUi.contentCard}>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("admin.platformSettingsPage.cardBody")}</p>
      </div>
    </PlatformPage>
  );
}
