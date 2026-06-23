import { useTranslation } from "react-i18next";
import { BusinessSettingsPanelShell } from "./BusinessSettingsPanelShell";

export function BusinessSettingsIntegrationsPanel() {
  const { t } = useTranslation();
  return (
    <BusinessSettingsPanelShell
      title={t("business.settings.panels.integrationsTitle")}
      description={t("business.settings.panels.integrationsDesc")}
    >
      <p className="text-sm text-muted-foreground">{t("business.settings.integrations.comingSoon")}</p>
    </BusinessSettingsPanelShell>
  );
}
