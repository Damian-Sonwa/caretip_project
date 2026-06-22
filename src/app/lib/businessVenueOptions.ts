import { CARETIP_INDUSTRY_DEFINITIONS } from "../data/caretipIndustries";

/** Canonical business type values (stored on Business.businessType). */
export const BUSINESS_TYPE_OPTIONS = CARETIP_INDUSTRY_DEFINITIONS.filter((d) => d.showInOnboarding).map(
  (d) => ({
    value: d.storageValue,
    labelKey: d.onboardingLabelKey ?? d.labelKey,
  }),
);

export const BUSINESS_TYPE_I18N: Record<string, string> = Object.fromEntries(
  BUSINESS_TYPE_OPTIONS.map((opt) => [opt.value, opt.labelKey]),
);

/** Staff job titles (stored on Employee.jobTitle). */
export const STAFF_ROLE_OPTIONS = [
  { value: "Server", labelKey: "business.staffPage.roleServer" },
  { value: "Bartender", labelKey: "business.staffPage.roleBartender" },
  { value: "Chef", labelKey: "business.staffPage.roleChef" },
  { value: "Host", labelKey: "business.staffPage.roleHost" },
  { value: "Manager", labelKey: "business.staffPage.roleManager" },
  { value: "Nurse", labelKey: "business.staffPage.roleNurse" },
  { value: "Doctor", labelKey: "business.staffPage.roleDoctor" },
  { value: "Caregiver", labelKey: "business.staffPage.roleCaregiver" },
  { value: "Therapist", labelKey: "business.staffPage.roleTherapist" },
  { value: "Receptionist", labelKey: "business.staffPage.roleReceptionist" },
  { value: "Orderly", labelKey: "business.staffPage.roleOrderly" },
] as const;
