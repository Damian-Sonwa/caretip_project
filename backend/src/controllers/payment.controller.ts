import type { Request, Response } from "express";
import {
  createTipCheckoutSession,
  getTipCheckoutContext,
  isStripeConfigured,
} from "../services/stripe.service.js";
import { prisma } from "../prisma.js";
import { logServerError, clientSafeMessage, CLIENT_FALLBACK } from "../utils/httpErrors.js";
import { absolutizePublicMediaPath } from "../utils/publicMediaUrl.js";

/**
 * POST /api/payments/create-tip-session
 * Public — guest tipping (no auth).
 */
export async function createTipSession(req: Request, res: Response) {
  try {
    const body = req.body as Record<string, unknown>;
    const employeeId = typeof body.employeeId === "string" ? body.employeeId : "";
    const businessId = typeof body.businessId === "string" ? body.businessId : "";
    const amount = Number(body.amount);
    const tipAmount =
      body.tipAmount != null && body.tipAmount !== "" ? Number(body.tipAmount) : undefined;
    const locationId =
      typeof body.locationId === "string" ? body.locationId : undefined;
    const tableId = typeof body.tableId === "string" ? body.tableId : undefined;
    const customerName =
      typeof body.customerName === "string" ? body.customerName : undefined;
    const feedback = typeof body.feedback === "string" ? body.feedback : undefined;

    if (!employeeId || !businessId) {
      return res.status(400).json({ message: "employeeId and businessId are required" });
    }
    if (Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "amount must be a positive number" });
    }
    if (
      tipAmount != null &&
      !Number.isNaN(tipAmount) &&
      Math.abs(tipAmount - amount) > 0.001
    ) {
      return res.status(400).json({ message: "tipAmount must match amount" });
    }

    if (!isStripeConfigured()) {
      return res.status(503).json({
        message: "Payment processing is not configured yet.",
        code: "STRIPE_NOT_CONFIGURED",
      });
    }

    const result = await createTipCheckoutSession({
      amount,
      employeeId,
      businessId,
      tipAmount,
      locationId: locationId ?? null,
      tableId: tableId ?? null,
      customerName: customerName ?? null,
      feedback: feedback ?? null,
    });

    return res.json({
      sessionId: result.sessionId,
      url: result.url,
    });
  } catch (err) {
    logServerError("payment.createTipSession", err);
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.payment),
    });
  }
}

/**
 * GET /api/payments/tip-session/:sessionId
 * Public — resolve Stripe Checkout session into tip context + transaction id (when available).
 */
export async function getTipSessionContext(req: Request, res: Response) {
  try {
    const sessionId = String(req.params.sessionId ?? "").trim();
    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }
    if (!isStripeConfigured()) {
      return res.status(503).json({
        message: "Payment processing is not configured yet.",
        code: "STRIPE_NOT_CONFIGURED",
      });
    }

    const ctx = await getTipCheckoutContext(sessionId);
    const piId = ctx.paymentIntentId;
    const tx = piId
      ? await prisma.transaction.findFirst({
          where: { stripePaymentIntentId: piId, status: "success" },
          select: { id: true, employeeId: true, businessId: true, locationId: true, tableId: true },
        })
      : null;

    const employee = ctx.employeeId
      ? await prisma.employee.findUnique({
          where: { id: ctx.employeeId },
          select: { id: true, name: true, avatar: true },
        })
      : null;

    const employeePayload = employee
      ? {
          id: employee.id,
          name: employee.name,
          avatar: absolutizePublicMediaPath(employee.avatar),
        }
      : null;

    // Webhook may not have persisted the Transaction yet; client can retry briefly.
    if (!tx) {
      return res.status(202).json({
        status: "pending",
        sessionId: ctx.sessionId,
        paymentIntentId: ctx.paymentIntentId,
        employee: employeePayload,
        businessId: ctx.businessId,
        locationId: ctx.locationId,
        tableId: ctx.tableId,
        customerName: ctx.customerName,
      });
    }

    return res.json({
      status: "ready",
      sessionId: ctx.sessionId,
      paymentIntentId: ctx.paymentIntentId,
      transactionId: tx.id,
      employee: employeePayload,
      businessId: tx.businessId,
      locationId: tx.locationId,
      tableId: tx.tableId,
      customerName: ctx.customerName,
    });
  } catch (err) {
    logServerError("payment.getTipSessionContext", err);
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.payment),
    });
  }
}
