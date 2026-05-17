import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  CreditCard,
  Palette,
  Settings2,
  Shield,
  User,
  Users,
} from "lucide-react";

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
  icon: LucideIcon;
};

export const BUSINESS_SETTINGS_SECTIONS: readonly BusinessSettingsSection[] = [
  {
    id: "general",
    labelKey: "business.settings.sections.general",
    descriptionKey: "business.settings.sections.generalDesc",
    icon: User,
  },
  {
    id: "business",
    labelKey: "business.settings.sections.business",
    descriptionKey: "business.settings.sections.businessDesc",
    icon: Building2,
  },
  {
    id: "team",
    labelKey: "business.settings.sections.team",
    descriptionKey: "business.settings.sections.teamDesc",
    icon: Users,
  },
  {
    id: "notifications",
    labelKey: "business.settings.sections.notifications",
    descriptionKey: "business.settings.sections.notificationsDesc",
    icon: Bell,
  },
  {
    id: "security",
    labelKey: "business.settings.sections.security",
    descriptionKey: "business.settings.sections.securityDesc",
    icon: Shield,
  },
  {
    id: "billing",
    labelKey: "business.settings.sections.billing",
    descriptionKey: "business.settings.sections.billingDesc",
    icon: CreditCard,
  },
  {
    id: "branding",
    labelKey: "business.settings.sections.branding",
    descriptionKey: "business.settings.sections.brandingDesc",
    icon: Palette,
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

export const BUSINESS_SETTINGS_PAGE_ICON = Settings2;
