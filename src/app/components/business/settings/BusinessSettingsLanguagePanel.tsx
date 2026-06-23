import { useTranslation } from "react-i18next";
import { BusinessSettingsPanelShell } from "./BusinessSettingsPanelShell";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

export function BusinessSettingsLanguagePanel() {
  const { t, i18n } = useTranslation();
  const current = i18n.language?.startsWith("de") ? "de" : "en";

  return (
    <BusinessSettingsPanelShell
      title={t("business.settings.panels.languageTitle")}
      description={t("business.settings.panels.languageDesc")}
    >
      <div className="max-w-sm space-y-2">
        <Label htmlFor="settings-language">{t("business.settings.language.label")}</Label>
        <Select
          value={current}
          onValueChange={(lng) => {
            void i18n.changeLanguage(lng);
          }}
        >
          <SelectTrigger id="settings-language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">{t("business.settings.language.en")}</SelectItem>
            <SelectItem value="de">{t("business.settings.language.de")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </BusinessSettingsPanelShell>
  );
}
