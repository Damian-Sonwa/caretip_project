import { promotePendingTipToRepeatTip } from "./repeatTip";
import type { TipSessionContextResponse } from "./api";

/**
 * Shared post-payment hook: runs after Stripe checkout is verified (webhook + tip-session ready).
 * Used on /rating (primary Stripe return) and /success (optional/manual).
 */
export function onVerifiedTipPaymentSession(
  sessionId: string,
  ctx: TipSessionContextResponse & { status: "ready" },
): void {
  if (!sessionId.trim()) return;
  promotePendingTipToRepeatTip({
    sessionId,
    verifiedBusinessId: ctx.businessId,
    verifiedEmployee: ctx.employee ? { id: ctx.employee.id, name: ctx.employee.name } : null,
  });
}
