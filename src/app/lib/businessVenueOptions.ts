/** Canonical business type values (stored on Business.businessType). */
export const BUSINESS_TYPE_OPTIONS = [
  { value: "Restaurant", labelKey: "business.onboarding.businessTypes.restaurant" },
  { value: "Hotel", labelKey: "business.onboarding.businessTypes.hotel" },
  { value: "Hospital", labelKey: "business.onboarding.businessTypes.hospital" },
  { value: "Salon", labelKey: "business.onboarding.businessTypes.salon" },
  { value: "Bar", labelKey: "business.onboarding.businessTypes.bar" },
  { value: "Cafe", labelKey: "business.onboarding.businessTypes.cafe" },
  { value: "Other", labelKey: "business.onboarding.businessTypes.other" },
] as const;

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
