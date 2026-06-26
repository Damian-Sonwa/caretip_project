import type { BusinessSubscriptionTier, SubscriptionPlanKey, SubscriptionStatus } from "@prisma/client";
import type {
  PlanLimits,
  SubscriptionCapability,
} from "../../config/subscriptionCapabilities.js";
import { getPlanLimitsForTier } from "../../config/subscriptionCapabilities.js";

/** Lifecycle exposed to APIs — `none` when no Subscription row or no entitled access. */
export type SubscriptionLifecycleStatus = "none" | SubscriptionStatus;

/** How the business obtained current entitlements — resolver is authoritative. */
export type EntitlementAccessSource = "none" | "subscription" | "sponsored";

export type SubscriptionEntitlementState = {
  status: SubscriptionLifecycleStatus;
  plan: SubscriptionPlanKey | null;
  capabilities: SubscriptionCapability[];
  limits: PlanLimits;
  /** Mirrored tier for read-optimized UI; null when status is none. */
  subscriptionTier: BusinessSubscriptionTier | null;
  hasActiveEntitlements: boolean;
  accessSource: EntitlementAccessSource;
  /** Set when accessSource is sponsored — programme registry key. */
  sponsoredProgrammeKey: string | null;
};

export const EMPTY_SUBSCRIPTION_ENTITLEMENTS: SubscriptionEntitlementState = {
  status: "none",
  plan: null,
  capabilities: [],
  limits: getPlanLimitsForTier(null),
  subscriptionTier: null,
  hasActiveEntitlements: false,
  accessSource: "none",
  sponsoredProgrammeKey: null,
};
