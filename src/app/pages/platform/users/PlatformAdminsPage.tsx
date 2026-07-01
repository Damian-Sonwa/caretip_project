import { useTranslation } from "react-i18next";
import { Shield } from "lucide-react";
import { PlatformPage, PlatformPageHeader } from "../../../components/platform/PlatformPageChrome";
import { platformUi } from "../../../components/platform/platformDashboardUi";

export function PlatformAdminsPage() {
  const { t } = useTranslation();
  return (
    <PlatformPage>
      <PlatformPageHeader
        icon={Shield}
        title={t("admin.platformAdminsPage.title")}
        subtitle={t("admin.platformAdminsPage.subtitle")}
      />
      <div className={platformUi.contentCard}>
        <p className="text-sm text-muted-foreground">{t("admin.platformAdminsPage.body")}</p>
      </div>
    </PlatformPage>
  );
}
