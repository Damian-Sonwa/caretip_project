import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";
import { PlatformPage, PlatformPageHeader } from "../../../components/platform/PlatformPageChrome";
import { platformUi } from "../../../components/platform/platformDashboardUi";

export function PlatformStaffAccountsPage() {
  const { t } = useTranslation();
  return (
    <PlatformPage>
      <PlatformPageHeader
        icon={Users}
        title={t("admin.staffAccountsPage.title")}
        subtitle={t("admin.staffAccountsPage.subtitle")}
      />
      <div className={platformUi.contentCard}>
        <p className="text-sm text-muted-foreground">{t("admin.staffAccountsPage.body")}</p>
      </div>
    </PlatformPage>
  );
}
