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
