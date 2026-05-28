import type { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import type { SubscriptionCapability } from "../config/subscriptionCapabilities.js";
import {
  businessHasCapability,
  getSubscriptionTierForEmployeeUserId,
  getSubscriptionTierForManagerUserId,
  subscriptionBypass,
  subscriptionRequiredPayload,
} from "../services/subscriptionEntitlement.service.js";

async function resolveTierForRequest(req: Request) {
  const uid = req.user?.userId ?? req.user?.id;
  if (!uid) return null;
  if (req.user?.role === Role.EMPLOYEE) {
    return getSubscriptionTierForEmployeeUserId(uid);
  }
  if (req.user?.role === Role.MANAGER) {
    return getSubscriptionTierForManagerUserId(uid);
  }
  return null;
}

export function requireSubscriptionCapability(capability: SubscriptionCapability) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (subscriptionBypass(req)) {
      return next();
    }
    const uid = req.user?.userId ?? req.user?.id;
    if (!uid) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const tier = await resolveTierForRequest(req);
    if (!tier) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    if (businessHasCapability(tier, capability)) {
      return next();
    }
    return res.status(403).json(subscriptionRequiredPayload(capability));
  };
}
