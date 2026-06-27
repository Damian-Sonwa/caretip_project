import { createBillingCheckoutSession } from "@/app/lib/api";
import { primeCheckoutSyncExpectation } from "@/app/lib/checkoutIntent";
import { toUserFriendlyMessage } from "@/app/lib/errorMessages";
import {
  BILLING_START_TRIAL_URL,
  releaseBodyScrollLock,
  waitForDialogCloseAnimation,
  waitForNextFrame,
  type CloseBeforeNavigate,
} from "@/app/lib/activateCareTipNavigation";
import type { TFunction } from "i18next";
import type { NavigateFunction } from "react-router";
import { toast } from "sonner";

export type ActivationCheckoutPlan = "trial" | "starter" | "business";

async function closeOverlayThenTrialNavigate(
  navigate?: NavigateFunction,
  closeBeforeNavigate?: CloseBeforeNavigate,
): Promise<void> {
  if (closeBeforeNavigate) {
    await closeBeforeNavigate();
    await waitForNextFrame();
    await waitForDialogCloseAnimation();
    releaseBodyScrollLock();
  }
  if (navigate) {
    navigate(BILLING_START_TRIAL_URL);
    return;
  }
  window.location.assign(BILLING_START_TRIAL_URL);
}

export async function startActivationCheckout(
  plan: ActivationCheckoutPlan,
  t: TFunction,
  options?: {
    closeBeforeNavigate?: CloseBeforeNavigate;
    navigate?: NavigateFunction;
  },
): Promise<void> {
  if (plan === "trial") {
    await closeOverlayThenTrialNavigate(options?.navigate, options?.closeBeforeNavigate);
    return;
  }

  const planKey = plan === "starter" ? "basic" : "premium";
  primeCheckoutSyncExpectation(planKey);
  const session = await createBillingCheckoutSession({
    planKey,
    billingCycle: "monthly",
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
