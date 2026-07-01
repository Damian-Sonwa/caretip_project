import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import { PlatformPage, PlatformPageHeader } from "../../../components/platform/PlatformPageChrome";
import { PlatformSettingsNotificationsPanel } from "../../../components/platform/PlatformSettingsNotificationsPanel";

export function PlatformCommunicationNotificationsPage() {
  const { t } = useTranslation();
  return (
    <PlatformPage>
      <PlatformPageHeader
        icon={Bell}
        title={t("admin.communicationNotificationsPage.title")}
        subtitle={t("admin.communicationNotificationsPage.subtitle")}
      />
      <PlatformSettingsNotificationsPanel />
    </PlatformPage>
  );
}
