import type { BusinessSubscriptionTier } from "@prisma/client";
import {
  capabilitiesForTier,
  getPlanLimitsForTier,
  type PlanLimits,
  type SubscriptionCapability,
} from "./subscriptionCapabilities.js";

/** Registered sponsored programme keys — add programmes here without changing authorization. */
export const SPONSORED_PROGRAMME_KEYS = [
  "freelancer_support",
  "midwife_support",
] as const;

export type SponsoredProgrammeKey = (typeof SPONSORED_PROGRAMME_KEYS)[number];

/** Maps to subscription tier capability matrices (starter / business / enterprise). */
export type SponsoredCapabilityProfileKey = "starter" | "business" | "enterprise";

export const SPONSORED_CAPABILITY_PROFILE_KEYS = [
  "starter",
  "business",
  "enterprise",
] as const satisfies readonly SponsoredCapabilityProfileKey[];

export type SponsoredProgrammeDefinition = {
  programmeKey: SponsoredProgrammeKey;
  profileKey: SponsoredCapabilityProfileKey;
  /** i18n key for admin + billing display */
  labelKey: string;
};

const PROFILE_TO_TIER: Record<SponsoredCapabilityProfileKey, BusinessSubscriptionTier> = {
  starter: "basic",
  business: "premium",
  enterprise: "enterprise",
};

export const SPONSORED_PROGRAMMES: Record<SponsoredProgrammeKey, SponsoredProgrammeDefinition> = {
  freelancer_support: {
    programmeKey: "freelancer_support",
    profileKey: "business",
    labelKey: "sponsored.programmes.freelancer_support",
  },
  midwife_support: {
    programmeKey: "midwife_support",
    profileKey: "business",
    labelKey: "sponsored.programmes.midwife_support",
  },
};

export function isSponsoredProgrammeKey(value: string): value is SponsoredProgrammeKey {
  return (SPONSORED_PROGRAMME_KEYS as readonly string[]).includes(value);
}

export function isSponsoredCapabilityProfileKey(value: string): value is SponsoredCapabilityProfileKey {
  return (SPONSORED_CAPABILITY_PROFILE_KEYS as readonly string[]).includes(value);
}

export function getSponsoredProgrammeDefinition(
  programmeKey: string,
): SponsoredProgrammeDefinition | null {
  if (!isSponsoredProgrammeKey(programmeKey)) return null;
  return SPONSORED_PROGRAMMES[programmeKey] ?? null;
}

export function resolveSponsoredCapabilityProfile(
  programmeKey: string,
  profileKeyOverride?: string | null,
): {
  profileKey: SponsoredCapabilityProfileKey;
  subscriptionTier: BusinessSubscriptionTier;
  capabilities: SubscriptionCapability[];
  limits: PlanLimits;
} | null {
  const def = getSponsoredProgrammeDefinition(programmeKey);
  if (!def) return null;
  const profileKey =
    profileKeyOverride && isSponsoredCapabilityProfileKey(profileKeyOverride)
      ? profileKeyOverride
      : def.profileKey;
  const subscriptionTier = PROFILE_TO_TIER[profileKey];
  return {
    profileKey,
    subscriptionTier,
    capabilities: capabilitiesForTier(subscriptionTier),
    limits: getPlanLimitsForTier(subscriptionTier),
  };
}

export function resolveEffectiveCapabilityProfileKey(
  programmeKey: string,
  profileKeyOverride?: string | null,
): SponsoredCapabilityProfileKey | null {
  const def = getSponsoredProgrammeDefinition(programmeKey);
  if (!def) return null;
  if (profileKeyOverride && isSponsoredCapabilityProfileKey(profileKeyOverride)) {
    return profileKeyOverride;
  }
  return def.profileKey;
}
