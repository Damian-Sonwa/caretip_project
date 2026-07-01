import { useTranslation } from "react-i18next";
import { Shield } from "lucide-react";
import { PlatformPage, PlatformPageHeader } from "../../../components/platform/PlatformPageChrome";
import { platformUi } from "../../../components/platform/platformDashboardUi";

export function PlatformSecurityReportsPage() {
  const { t } = useTranslation();
  return (
    <PlatformPage>
      <PlatformPageHeader
        icon={Shield}
        title={t("admin.securityReportsPage.title")}
        subtitle={t("admin.securityReportsPage.subtitle")}
      />
      <div className={platformUi.contentCard}>
        <p className="text-sm text-muted-foreground">{t("admin.securityReportsPage.body")}</p>
      </div>
    </PlatformPage>
  );
}
