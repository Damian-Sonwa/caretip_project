/**
 * Single source of truth for CareTip industry identifiers across pricing,
 * onboarding, contact forms, and landing marketing sections.
 */

export type IndustryId =
  | "restaurant"
  | "hotel"
  | "cafe"
  | "bar"
  | "salon"
  | "midwife"
  | "freelancer"
  | "logistics"
  | "healthcare_clinic"
  | "wellness_spa"
  | "other";

/** Pricing page audience segmentation — copy only, not separate layouts. */
export type PricingAudienceSegment = "operations" | "solo" | "general";

export type CaretipIndustryDefinition = {
  id: IndustryId;
  /** Persisted on `Business.businessType` (legacy Title Case values kept for compatibility). */
  storageValue: string;
  audienceSegment: PricingAudienceSegment;
  /** i18n key for display labels (pricing, contact). */
  labelKey: `staticPages.pricing.industry.${IndustryId}`;
  /** i18n key for onboarding select (falls back to labelKey). */
  onboardingLabelKey?: string;
  /** Landing homepage card id when featured. */
  landingCardId?: string;
  showInPricing: boolean;
  showInOnboarding: boolean;
  showInContact: boolean;
  showOnLanding: boolean;
};

export const CARETIP_INDUSTRY_DEFINITIONS: readonly CaretipIndustryDefinition[] = [
  {
    id: "restaurant",
    storageValue: "Restaurant",
    audienceSegment: "general",
    labelKey: "staticPages.pricing.industry.restaurant",
    onboardingLabelKey: "business.onboarding.businessTypes.restaurant",
    landingCardId: "restaurant",
    showInPricing: true,
    showInOnboarding: true,
    showInContact: true,
    showOnLanding: true,
  },
  {
    id: "hotel",
    storageValue: "Hotel",
    audienceSegment: "operations",
    labelKey: "staticPages.pricing.industry.hotel",
    onboardingLabelKey: "business.onboarding.businessTypes.hotel",
    landingCardId: "hotel",
    showInPricing: true,
    showInOnboarding: true,
    showInContact: true,
    showOnLanding: true,
  },
  {
    id: "logistics",
    storageValue: "Logistics",
    audienceSegment: "operations",
    labelKey: "staticPages.pricing.industry.logistics",
    onboardingLabelKey: "business.onboarding.businessTypes.logistics",
    landingCardId: "logistics",
    showInPricing: true,
    showInOnboarding: true,
    showInContact: true,
    showOnLanding: true,
  },
  {
    id: "cafe",
    storageValue: "Cafe",
    audienceSegment: "general",
    labelKey: "staticPages.pricing.industry.cafe",
    onboardingLabelKey: "business.onboarding.businessTypes.cafe",
    showInPricing: true,
    showInOnboarding: true,
    showInContact: true,
    showOnLanding: false,
  },
  {
    id: "bar",
    storageValue: "Bar",
    audienceSegment: "general",
    labelKey: "staticPages.pricing.industry.bar",
    onboardingLabelKey: "business.onboarding.businessTypes.bar",
    showInPricing: true,
    showInOnboarding: true,
    showInContact: true,
    showOnLanding: false,
  },
  {
    id: "salon",
    storageValue: "Salon",
    audienceSegment: "general",
    labelKey: "staticPages.pricing.industry.salon",
    onboardingLabelKey: "business.onboarding.businessTypes.salon",
    landingCardId: "salon",
    showInPricing: true,
    showInOnboarding: true,
    showInContact: true,
    showOnLanding: true,
  },
  {
    id: "midwife",
    storageValue: "Midwife",
    audienceSegment: "solo",
    labelKey: "staticPages.pricing.industry.midwife",
    onboardingLabelKey: "business.onboarding.businessTypes.midwife",
    landingCardId: "midwife",
    showInPricing: true,
    showInOnboarding: true,
    showInContact: true,
    showOnLanding: true,
  },
  {
    id: "freelancer",
    storageValue: "Freelancer",
    audienceSegment: "solo",
    labelKey: "staticPages.pricing.industry.freelancer",
    onboardingLabelKey: "business.onboarding.businessTypes.freelancer",
    landingCardId: "freelancer",
    showInPricing: true,
    showInOnboarding: true,
    showInContact: true,
    showOnLanding: true,
  },
  {
    id: "healthcare_clinic",
    storageValue: "Healthcare Clinic",
    audienceSegment: "solo",
    labelKey: "staticPages.pricing.industry.healthcare_clinic",
    onboardingLabelKey: "business.onboarding.businessTypes.healthcare_clinic",
    showInPricing: true,
    showInOnboarding: true,
    showInContact: true,
    showOnLanding: false,
  },
  {
    id: "wellness_spa",
    storageValue: "Wellness & Spa",
    audienceSegment: "general",
    labelKey: "staticPages.pricing.industry.wellness_spa",
    onboardingLabelKey: "business.onboarding.businessTypes.wellness_spa",
    showInPricing: true,
    showInOnboarding: true,
    showInContact: true,
    showOnLanding: false,
  },
  {
    id: "other",
    storageValue: "Other",
    audienceSegment: "general",
    labelKey: "staticPages.pricing.industry.other",
    onboardingLabelKey: "business.onboarding.businessTypes.other",
    showInPricing: true,
    showInOnboarding: true,
    showInContact: true,
    showOnLanding: false,
  },
] as const;

/** @deprecated Use IndustryId — kept for existing imports. */
export type Industry = IndustryId;

export const PRICING_INDUSTRIES: readonly IndustryId[] = CARETIP_INDUSTRY_DEFINITIONS.filter(
  (d) => d.showInPricing,
).map((d) => d.id);

export const CONTACT_INDUSTRIES: readonly IndustryId[] = CARETIP_INDUSTRY_DEFINITIONS.filter(
  (d) => d.showInContact,
).map((d) => d.id);

export const LANDING_INDUSTRY_CARD_IDS: readonly string[] = CARETIP_INDUSTRY_DEFINITIONS.filter(
  (d) => d.showOnLanding && d.landingCardId,
).map((d) => d.landingCardId!);

const industryById = new Map(CARETIP_INDUSTRY_DEFINITIONS.map((d) => [d.id, d]));

export function getIndustryDefinition(id: IndustryId): CaretipIndustryDefinition {
  const def = industryById.get(id);
  if (!def) throw new Error(`Unknown industry: ${id}`);
  return def;
}

export function resolvePricingAudienceSegment(industry: IndustryId): PricingAudienceSegment {
  return getIndustryDefinition(industry).audienceSegment;
}

/** Maps legacy `Business.businessType` strings to canonical industry ids. */
export function industryIdFromStorageValue(value: string | null | undefined): IndustryId | null {
  if (!value?.trim()) return null;
  const normalized = value.trim().toLowerCase();
  for (const def of CARETIP_INDUSTRY_DEFINITIONS) {
    if (def.storageValue.toLowerCase() === normalized || def.id === normalized) {
      return def.id;
    }
  }
  if (normalized === "hospital" || normalized === "healthcare") return "healthcare_clinic";
  if (normalized === "delivery") return "logistics";
  return null;
}
