import type { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { getTipCheckoutContext, isStripeConfigured } from "../services/stripe.service.js";
import { logServerError, clientSafeMessage, CLIENT_FALLBACK } from "../utils/httpErrors.js";

/**
 * POST /api/feedback/tip
 * Public — saves optional feedback tied to a completed Stripe Checkout session.
 */
export async function submitTipFeedback(req: Request, res: Response) {
  try {
    const body = req.body as Record<string, unknown>;
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    const ratingRaw = body.rating;
    const rating =
      typeof ratingRaw === "number" ? ratingRaw : typeof ratingRaw === "string" ? Number(ratingRaw) : null;
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";
    const tagsIn = Array.isArray(body.tags) ? body.tags : [];
    const tags = tagsIn
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 12);
    const customerName =
      typeof body.customerName === "string" ? body.customerName.trim().slice(0, 80) : null;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }
    const hasAnyContent = (rating != null && !Number.isNaN(rating)) || comment.length > 0 || tags.length > 0;
    if (!hasAnyContent) {
      return res.status(400).json({ message: "Please add a rating or a short note." });
    }
    if (rating != null && (!Number.isFinite(rating) || rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "rating must be between 1 and 5" });
    }
    if (comment.length > 1500) {
      return res.status(400).json({ message: "comment is too long" });
    }

    if (!isStripeConfigured()) {
      return res.status(503).json({
        message: "Payment processing is not configured yet.",
        code: "STRIPE_NOT_CONFIGURED",
      });
    }

    const ctx = await getTipCheckoutContext(sessionId);
    if (!ctx.paymentIntentId) {
      return res.status(400).json({ message: "Could not verify payment session." });
    }

    const tx = await prisma.transaction.findFirst({
      where: { stripePaymentIntentId: ctx.paymentIntentId, status: "success" },
      select: { id: true, businessId: true, employeeId: true, locationId: true, tableId: true },
    });
    if (!tx) {
      return res.status(409).json({
        message: "Tip is still processing. Please try again in a moment.",
        code: "TIP_PENDING",
      });
    }

    const saved = await prisma.tipFeedback.upsert({
      where: { transactionId: tx.id },
      create: {
        transactionId: tx.id,
        businessId: tx.businessId,
        employeeId: tx.employeeId,
        locationId: tx.locationId,
        tableId: tx.tableId,
        stripeCheckoutSessionId: ctx.sessionId,
        rating: rating != null && Number.isFinite(rating) ? Math.trunc(rating) : null,
        comment: comment ? comment : null,
        tags,
        customerName,
      },
      update: {
        rating: rating != null && Number.isFinite(rating) ? Math.trunc(rating) : null,
        comment: comment ? comment : null,
        tags,
        customerName,
        stripeCheckoutSessionId: ctx.sessionId,
      },
      select: { id: true, transactionId: true, rating: true },
    });

    return res.json({ ok: true, feedbackId: saved.id, transactionId: saved.transactionId });
  } catch (err) {
    logServerError("feedback.submitTipFeedback", err);
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.tipFeedback),
    });
  }
}

