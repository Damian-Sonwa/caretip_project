import { BusinessSubscriptionTier, Role, SubscriptionStatus } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { mapPlanKeyToBusinessTier } from "../lib/subscription/mapSubscriptionPlanKey.js";
import { logTrialSync } from "../lib/subscription/trialSyncDebugLog.js";
import {
  type FeatureKey,
  type SubscriptionCapability,
  hasSubscriptionCapability,
  minimumTierForCapability,
} from "../config/subscriptionCapabilities.js";

export const SUBSCRIPTION_REQUIRED_CODE = "SUBSCRIPTION_REQUIRED" as const;

const DEFAULT_TIER = BusinessSubscriptionTier.basic;

export function subscriptionBypass(req: Request): boolean {
  if (req.user?.impersonatedBy) return true;
  if (req.user?.role === Role.SUPER_ADMIN) return true;
  return false;
}

export async function getSubscriptionTierForBusinessId(
  businessId: string,
): Promise<BusinessSubscriptionTier> {
  const row = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      subscriptionTier: true,
      subscription: { select: { status: true, planKey: true } },
    },
  });
  if (!row) return DEFAULT_TIER;

  // Trialing Stripe subscriptions grant full plan access (same as active).
  if (row.subscription?.status === SubscriptionStatus.trialing) {
    const tier = mapPlanKeyToBusinessTier(row.subscription.planKey);
    logTrialSync("entitlement.tier_from_trialing_mirror", {
      businessId,
      mirrorStatus: row.subscription.status,
      planKey: row.subscription.planKey,
      resolvedTier: tier,
    });
    return tier;
  }

  return row.subscriptionTier ?? DEFAULT_TIER;
}

export async function getSubscriptionTierForManagerUserId(
  userId: string,
): Promise<BusinessSubscriptionTier | null> {
  const row = await prisma.business.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!row) return null;
  return getSubscriptionTierForBusinessId(row.id);
}

export async function getSubscriptionTierForEmployeeUserId(
  userId: string,
): Promise<BusinessSubscriptionTier | null> {
  const employee = await prisma.employee.findFirst({
    where: { userId },
    select: { businessId: true },
  });
  if (!employee) return null;
  return getSubscriptionTierForBusinessId(employee.businessId);
}

export function hasFeatureForTier(tier: BusinessSubscriptionTier, featureKey: FeatureKey): boolean {
  return hasSubscriptionCapability(tier, featureKey);
}

export async function hasFeature(businessId: string, featureKey: FeatureKey): Promise<boolean> {
  const tier = await getSubscriptionTierForBusinessId(businessId);
  return hasFeatureForTier(tier, featureKey);
}

export async function resolveBusinessIdForRequest(req: Request): Promise<string | null> {
  const uid = req.user?.userId ?? req.user?.id;
  if (!uid) return null;
  if (req.user?.role === Role.MANAGER) {
    const row = await prisma.business.findUnique({
      where: { userId: uid },
      select: { id: true },
    });
    return row?.id ?? null;
  }
  if (req.user?.role === Role.EMPLOYEE) {
    const row = await prisma.employee.findFirst({
      where: { userId: uid },
      select: { businessId: true },
    });
    return row?.businessId ?? null;
  }
  return null;
}

export async function hasFeatureForRequest(req: Request, featureKey: FeatureKey): Promise<boolean> {
  if (subscriptionBypass(req)) return true;
  const businessId = await resolveBusinessIdForRequest(req);
  if (!businessId) return false;
  return hasFeature(businessId, featureKey);
}

export function businessHasCapability(
  tier: BusinessSubscriptionTier,
  capability: SubscriptionCapability,
): boolean {
  return hasSubscriptionCapability(tier, capability);
}

export function subscriptionRequiredPayload(capability: SubscriptionCapability | FeatureKey) {
  return {
    success: false,
    code: SUBSCRIPTION_REQUIRED_CODE,
    capability,
    requiredTier: minimumTierForCapability(capability),
    message: "This feature requires a Premium subscription.",
  };
}

/** Strip goal fields from tips/dashboard payloads when employeeGoals is not entitled. */
export function maskEmployeeGoalsInResponse<T extends Record<string, unknown>>(
  body: T,
  includeGoals: boolean,
): T {
  if (includeGoals) return body;
  return {
    ...body,
    goal: null,
    monthlyGoal: null,
  };
}

/**
 * Express middleware — returns 403 with SUBSCRIPTION_REQUIRED when the business tier lacks the feature.
 */
export function requireFeature(featureKey: FeatureKey) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (subscriptionBypass(req)) {
      return next();
    }
    const uid = req.user?.userId ?? req.user?.id;
    if (!uid) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const businessId = await resolveBusinessIdForRequest(req);
    if (!businessId) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    if (await hasFeature(businessId, featureKey)) {
      return next();
    }
    return res.status(403).json(subscriptionRequiredPayload(featureKey));
  };
}

/**
 * Controller helper — send 403 when feature is missing. Returns true when allowed to proceed.
 */
export async function enforceFeatureForRequest(
  req: Request,
  res: Response,
  featureKey: FeatureKey,
): Promise<boolean> {
  if (subscriptionBypass(req)) return true;
  const businessId = await resolveBusinessIdForRequest(req);
  if (!businessId) {
    res.status(403).json({ message: "Insufficient permissions" });
    return false;
  }
  if (await hasFeature(businessId, featureKey)) return true;
  res.status(403).json(subscriptionRequiredPayload(featureKey));
  return false;
}
