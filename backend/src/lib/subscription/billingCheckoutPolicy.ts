import type { SubscriptionPlanKey } from "@prisma/client";

/** Returned when checkout is requested for internal Basic (no Stripe billing). */
export const BASIC_CHECKOUT_NOT_REQUIRED_MESSAGE =
  "Basic is included automatically. No checkout required." as const;

/** Premium (enterprise planKey) is sales-led — no self-serve checkout. */
export const ENTERPRISE_CHECKOUT_CONTACT_SALES_MESSAGE =
  "Premium is available on request. Please contact sales." as const;

export class BillingCheckoutNotAllowedError extends Error {
  readonly planKey: SubscriptionPlanKey;
  readonly code: "basic_included" | "enterprise_contact_sales";

  constructor(planKey: SubscriptionPlanKey, message: string, code: "basic_included" | "enterprise_contact_sales") {
    super(message);
    this.name = "BillingCheckoutNotAllowedError";
    this.planKey = planKey;
    this.code = code;
  }
}

/**
 * Self-serve Stripe Checkout is Pro-only (`planKey: premium`).
 * Basic is internal; Premium (enterprise) is admin/sales.
 */
export function assertSelfServeCheckoutPlanKey(planKey: SubscriptionPlanKey): void {
  if (planKey === "basic") {
    throw new BillingCheckoutNotAllowedError(
      planKey,
      BASIC_CHECKOUT_NOT_REQUIRED_MESSAGE,
      "basic_included",
    );
  }
  if (planKey === "enterprise") {
    throw new BillingCheckoutNotAllowedError(
      planKey,
      ENTERPRISE_CHECKOUT_CONTACT_SALES_MESSAGE,
      "enterprise_contact_sales",
    );
  }
}

export function isSelfServeCheckoutPlanKey(planKey: SubscriptionPlanKey): boolean {
  return planKey === "premium";
}
