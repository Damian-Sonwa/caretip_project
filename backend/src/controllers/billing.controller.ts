import type { Request, Response } from "express";
import { SubscriptionPlanKey } from "@prisma/client";
import * as businessService from "../services/business.service.js";
import { prisma } from "../prisma.js";
import {
  createManagerCheckoutSession,
  createManagerPortalSession,
  getBillingStatusForBusiness,
  getBillingTimelineForBusiness,
  scheduleManagerCancelAtPeriodEnd,
} from "../services/managerBilling.service.js";
import { CLIENT_FALLBACK, clientSafeMessage, logServerError } from "../utils/httpErrors.js";

function getUserId(req: Request): string | null {
  const uid = req.user?.userId ?? req.user?.id;
  return typeof uid === "string" && uid.trim() ? uid.trim() : null;
}

function parsePlanKey(raw: unknown): SubscriptionPlanKey | null {
  if (raw === "basic" || raw === "premium" || raw === "enterprise") return raw;
  return null;
}

function parseBillingCycle(raw: unknown): "monthly" | "yearly" | undefined {
  if (raw === "monthly" || raw === "yearly") return raw;
  return undefined;
}

type ManagerBusinessContext =
  | {
      ok: true;
      userId: string;
      businessId: string;
      email: string;
      businessName: string;
    }
  | { ok: false; status: number; message: string };

async function resolveManagerBusiness(req: Request): Promise<ManagerBusinessContext> {
  const userId = getUserId(req);
  if (!userId) return { ok: false, status: 401, message: "Authentication required" };

  const business = await businessService.getBusinessByUserId(userId);
  if (!business) {
    return { ok: false, status: 404, message: "Business not found" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user?.email) {
    return { ok: false, status: 404, message: "User not found" };
  }

  return {
    ok: true,
    userId,
    businessId: business.id,
    email: user.email,
    businessName: business.name,
  };
}

export async function getMyBilling(req: Request, res: Response) {
  try {
    const ctx = await resolveManagerBusiness(req);
    if (!ctx.ok) {
      return res.status(ctx.status).json({ message: ctx.message });
    }

    const status = await getBillingStatusForBusiness(ctx.businessId);
    if (!status) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    const events = await getBillingTimelineForBusiness(ctx.businessId);

    return res.json({ ...status, events });
  } catch (err) {
    logServerError("billing.getMyBilling", err);
    return res.status(500).json({ message: clientSafeMessage(err, CLIENT_FALLBACK.generic) });
  }
}

export async function postMyBillingCheckout(req: Request, res: Response) {
  try {
    const ctx = await resolveManagerBusiness(req);
    if (!ctx.ok) {
      return res.status(ctx.status).json({ message: ctx.message });
    }

    const planKey = parsePlanKey(req.body?.planKey);
    if (!planKey) {
      return res.status(400).json({ message: "planKey must be basic, premium, or enterprise" });
    }

    const billingCycle = parseBillingCycle(req.body?.billingCycle);
    const session = await createManagerCheckoutSession({
      businessId: ctx.businessId,
      managerEmail: ctx.email,
      businessName: ctx.businessName,
      planKey,
      billingCycle,
    });

    return res.json(session);
  } catch (err) {
    logServerError("billing.postMyBillingCheckout", err);
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("not enabled") || message.includes("not configured")) {
      return res.status(503).json({ message });
    }
    return res.status(400).json({ message: clientSafeMessage(err, CLIENT_FALLBACK.generic) });
  }
}

export async function postMyBillingPortal(req: Request, res: Response) {
  try {
    const ctx = await resolveManagerBusiness(req);
    if (!ctx.ok) {
      return res.status(ctx.status).json({ message: ctx.message });
    }

    const status = await getBillingStatusForBusiness(ctx.businessId);
    if (!status?.stripeCustomerId) {
      return res.status(400).json({ message: "No Stripe customer linked to this account" });
    }

    const portal = await createManagerPortalSession({ stripeCustomerId: status.stripeCustomerId });
    return res.json(portal);
  } catch (err) {
    logServerError("billing.postMyBillingPortal", err);
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("not enabled") || message.includes("not configured")) {
      return res.status(503).json({ message });
    }
    return res.status(400).json({ message: clientSafeMessage(err, CLIENT_FALLBACK.generic) });
  }
}

export async function postMyBillingCancel(req: Request, res: Response) {
  try {
    const ctx = await resolveManagerBusiness(req);
    if (!ctx.ok) {
      return res.status(ctx.status).json({ message: ctx.message });
    }

    const atPeriodEnd = req.body?.atPeriodEnd !== false;
    if (!atPeriodEnd) {
      return res.status(400).json({ message: "Immediate cancellation is not supported. Use atPeriodEnd: true." });
    }

    const result = await scheduleManagerCancelAtPeriodEnd({ businessId: ctx.businessId });
    return res.json({
      status: "scheduled",
      cancelAtPeriodEnd: result.cancelAtPeriodEnd,
      cancellationEffective: result.cancellationEffective,
    });
  } catch (err) {
    logServerError("billing.postMyBillingCancel", err);
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("not enabled") || message.includes("No active Stripe")) {
      return res.status(400).json({ message });
    }
    return res.status(400).json({ message: clientSafeMessage(err, CLIENT_FALLBACK.generic) });
  }
}
