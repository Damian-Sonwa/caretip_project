import rateLimit from "express-rate-limit";

export const leadSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many submissions. Please wait a moment and try again." },
});
