import { createBillingCheckoutSession } from "@/app/lib/api";
import { primeCheckoutSyncExpectation } from "@/app/lib/checkoutIntent";
import { toUserFriendlyMessage } from "@/app/lib/errorMessages";
import type { TFunction } from "i18next";
import { toast } from "sonner";

export type ActivationCheckoutPlan = "trial" | "starter" | "business";

export async function startActivationCheckout(
  plan: ActivationCheckoutPlan,
  t: TFunction,
): Promise<void> {
  const includeTrial = plan === "trial";
  const planKey = plan === "starter" ? "basic" : "premium";
  primeCheckoutSyncExpectation(planKey);
  const session = await createBillingCheckoutSession({
    planKey,
    billingCycle: "monthly",
    includeTrial,
    checkoutFlow: "billing",
  });
  if (session.url) {
    window.location.assign(session.url);
    return;
  }
  toast.error(t("business.billing.checkoutNoUrl"));
}

export function activationCheckoutErrorMessage(err: unknown, t: TFunction): string {
  return toUserFriendlyMessage(err) || t("business.billing.checkoutError");
}
