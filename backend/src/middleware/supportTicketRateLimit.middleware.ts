import rateLimit from "express-rate-limit";

/** Limit new support tickets per business manager (abuse protection). */
export const supportTicketCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.SUPPORT_TICKET_MAX_PER_HOUR ?? 8),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many support requests. Please try again later." },
  keyGenerator: (req) => req.user?.userId ?? req.user?.id ?? req.ip ?? "unknown",
});

export const supportTicketReplyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.SUPPORT_TICKET_REPLY_MAX_PER_WINDOW ?? 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many messages. Please wait a few minutes." },
  keyGenerator: (req) => req.user?.userId ?? req.user?.id ?? req.ip ?? "unknown",
});
