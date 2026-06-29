import { useTranslation } from "react-i18next";
import { BusinessSettingsPanelShell } from "./BusinessSettingsPanelShell";
import { ThemeAppearanceControl } from "@/app/components/theme/ThemeAppearanceControl";

export function BusinessSettingsAppearancePanel() {
  const { t } = useTranslation();

  return (
    <BusinessSettingsPanelShell embedded>
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">{t("theme.appearance.panelHint")}</p>
        <ThemeAppearanceControl />
      </div>
    </BusinessSettingsPanelShell>
  );
}
