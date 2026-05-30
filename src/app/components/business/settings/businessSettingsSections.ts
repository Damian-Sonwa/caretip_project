import type { CareIconName } from "@/components/icons";

export type BusinessSettingsSectionId =
  | "general"
  | "business"
  | "team"
  | "notifications"
  | "security"
  | "billing"
  | "branding";

export type BusinessSettingsSection = {
  id: BusinessSettingsSectionId;
  labelKey: string;
  descriptionKey: string;
  icon: CareIconName;
};

export const BUSINESS_SETTINGS_SECTIONS: readonly BusinessSettingsSection[] = [
  {
    id: "general",
    labelKey: "business.settings.sections.general",
    descriptionKey: "business.settings.sections.generalDesc",
    icon: "general",
  },
  {
    id: "business",
    labelKey: "business.settings.sections.business",
    descriptionKey: "business.settings.sections.businessDesc",
    icon: "hospitalityVenue",
  },
  {
    id: "team",
    labelKey: "business.settings.sections.team",
    descriptionKey: "business.settings.sections.teamDesc",
    icon: "team",
  },
  {
    id: "notifications",
    labelKey: "business.settings.sections.notifications",
    descriptionKey: "business.settings.sections.notificationsDesc",
    icon: "notifications",
  },
  {
    id: "security",
    labelKey: "business.settings.sections.security",
    descriptionKey: "business.settings.sections.securityDesc",
    icon: "security",
  },
  {
    id: "billing",
    labelKey: "business.settings.sections.billing",
    descriptionKey: "business.settings.sections.billingDesc",
    icon: "billing",
  },
  {
    id: "branding",
    labelKey: "business.settings.sections.branding",
    descriptionKey: "business.settings.sections.brandingDesc",
    icon: "branding",
  },
] as const;

export const BUSINESS_SETTINGS_DEFAULT_SECTION: BusinessSettingsSectionId = "general";

export function parseBusinessSettingsSection(raw: string | null): BusinessSettingsSectionId {
  if (raw === "profile" || raw === "business") return "business";
  if (raw === "account" || raw === "profile-settings") return "general";
  const valid = BUSINESS_SETTINGS_SECTIONS.some((s) => s.id === raw);
  if (raw && valid) return raw as BusinessSettingsSectionId;
  return BUSINESS_SETTINGS_DEFAULT_SECTION;
}
