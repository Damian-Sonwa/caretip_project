import rateLimit from "express-rate-limit";

/**
 * Auth credential rate limits use layered IP + email (+ invite) keys in
 * `authRateLimit.middleware.ts` — not IP-only express-rate-limit.
 */

/** Guest Stripe Checkout session creation (QR / public tipping). */
export const publicTipCheckoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.TIP_CHECKOUT_MAX_PER_WINDOW ?? 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many payment attempts. Please try again later." },
});

/**
 * Legacy Payment Intent API — not used by current Checkout UI; kept for compatibility.
 * Stricter cap to limit abuse surface.
 */
export const legacyPaymentIntentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.TIP_CREATE_INTENT_MAX_PER_WINDOW ?? 15),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many payment attempts. Please try again later." },
});
