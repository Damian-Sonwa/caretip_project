import { BusinessSubscriptionTier, Role } from "@prisma/client";
import type { Request } from "express";
import { prisma } from "../prisma.js";
import {
  type SubscriptionCapability,
  hasSubscriptionCapability,
  minimumTierForCapability,
} from "../config/subscriptionCapabilities.js";

export const SUBSCRIPTION_REQUIRED_CODE = "SUBSCRIPTION_REQUIRED" as const;

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
    select: { subscriptionTier: true },
  });
  return row?.subscriptionTier ?? BusinessSubscriptionTier.premium;
}

export async function getSubscriptionTierForManagerUserId(
  userId: string,
): Promise<BusinessSubscriptionTier | null> {
  const row = await prisma.business.findUnique({
    where: { userId },
    select: { subscriptionTier: true },
  });
  return row?.subscriptionTier ?? null;
}

export async function getSubscriptionTierForEmployeeUserId(
  userId: string,
): Promise<BusinessSubscriptionTier | null> {
  const employee = await prisma.employee.findFirst({
    where: { userId },
    select: { business: { select: { subscriptionTier: true } } },
  });
  return employee?.business.subscriptionTier ?? null;
}

export function businessHasCapability(
  tier: BusinessSubscriptionTier,
  capability: SubscriptionCapability,
): boolean {
  return hasSubscriptionCapability(tier, capability);
}

export function subscriptionRequiredPayload(capability: SubscriptionCapability) {
  return {
    success: false,
    code: SUBSCRIPTION_REQUIRED_CODE,
    capability,
    requiredTier: minimumTierForCapability(capability),
    message: "This feature requires a Premium subscription.",
  };
}
