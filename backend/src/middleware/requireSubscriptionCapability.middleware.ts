import type { SubscriptionCapability } from "../config/subscriptionCapabilities.js";
import { requireFeature } from "../services/subscriptionEntitlement.service.js";

/** @deprecated Prefer `requireFeature` from subscriptionEntitlement.service.ts */
export function requireSubscriptionCapability(capability: SubscriptionCapability) {
  return requireFeature(capability);
}
