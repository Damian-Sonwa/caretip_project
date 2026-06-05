import rateLimit from "express-rate-limit";

/** Limits brute-force attempts on password-based sign-in (per IP). */
export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_LOGIN_MAX_PER_WINDOW ?? 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many sign-in attempts. Please try again later." },
});

/** Forgot-password requests per IP (abuse prevention). */
export const authForgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.AUTH_FORGOT_PASSWORD_MAX_PER_HOUR ?? 5),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many reset requests. Please try again later." },
});

/** Reset-password submissions per IP. */
export const authResetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.AUTH_RESET_PASSWORD_MAX_PER_HOUR ?? 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
});

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
