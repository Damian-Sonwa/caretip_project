import type { NavigateFunction } from "react-router";

export const BILLING_SUBSCRIPTION_PATH = "/dashboard/billing/subscription";
export const BILLING_PLANS_SECTION_ID = "billing-plans";
export const BILLING_SUBSCRIPTION_PLANS_URL = `${BILLING_SUBSCRIPTION_PATH}#${BILLING_PLANS_SECTION_ID}`;
export const BILLING_START_TRIAL_URL = `${BILLING_SUBSCRIPTION_PATH}#start-trial`;

/** Matches `duration-200` on DialogContent. */
export const ACTIVATION_DIALOG_CLOSE_MS = 200;

/** Matches `data-[state=closed]:duration-300` on SheetContent. */
export const ACTIVATION_SHEET_CLOSE_MS = 300;

export type CloseBeforeNavigate = () => void | Promise<void>;

export function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export function waitForDialogCloseAnimation(
  ms = ACTIVATION_DIALOG_CLOSE_MS,
): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/** Belt-and-suspenders cleanup if a portal closed without restoring scroll. */
export function releaseBodyScrollLock(): void {
  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("padding-right");
  document.body.style.removeProperty("margin-right");
  document.documentElement.style.removeProperty("overflow");
}

export async function closeOverlayThenNavigate(
  navigate: NavigateFunction,
  options?: {
    closeBeforeNavigate?: CloseBeforeNavigate;
    closeAnimationMs?: number;
  },
): Promise<void> {
  if (options?.closeBeforeNavigate) {
    await options.closeBeforeNavigate();
    await waitForNextFrame();
    await waitForDialogCloseAnimation(
      options.closeAnimationMs ?? ACTIVATION_DIALOG_CLOSE_MS,
    );
    releaseBodyScrollLock();
  }
  navigate(BILLING_SUBSCRIPTION_PLANS_URL);
}

export function scrollToBillingPlansSection(behavior: ScrollBehavior = "smooth"): void {
  const el = document.getElementById(BILLING_PLANS_SECTION_ID);
  if (el) {
    el.scrollIntoView({ behavior, block: "start" });
  }
}
