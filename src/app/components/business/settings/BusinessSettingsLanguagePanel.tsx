import { useTranslation } from "react-i18next";
import { changeAppLanguage, type AppLanguage } from "@/i18n/i18n";
import { BusinessSettingsPanelShell } from "./BusinessSettingsPanelShell";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

export function BusinessSettingsLanguagePanel() {
  const { t, i18n } = useTranslation();
  const current: AppLanguage = i18n.language?.startsWith("de") ? "de" : "en";

  return (
    <BusinessSettingsPanelShell embedded>
      <div className="max-w-sm space-y-2">
        <Label htmlFor="settings-language">{t("business.settings.language.label")}</Label>
        <Select
          value={current}
          onValueChange={(lng) => {
            void changeAppLanguage(lng as AppLanguage);
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
