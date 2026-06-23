import type { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../prisma.js";
import { managerHasCompletedOnboarding } from "../services/auth.service.js";
import { requireFeature, subscriptionBypass } from "../services/subscriptionEntitlement.service.js";

const requireBrandingCustomization = requireFeature("brandingCustomization");

/**
 * Logo upload during manager onboarding is allowed on any tier.
 * After onboarding is complete, branding requires `brandingCustomization` (premium+).
 */
export async function requireBusinessLogoUpload(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (subscriptionBypass(req)) {
    next();
    return;
  }

  const uid = req.user?.userId ?? req.user?.id;
  if (!uid) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  if (req.user?.role === Role.MANAGER) {
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: {
        role: true,
        hasCompletedOnboarding: true,
        onboardingCompletedAt: true,
      },
    });
    if (user && !managerHasCompletedOnboarding(user)) {
      next();
      return;
    }
  }

  void requireBrandingCustomization(req, res, next);
}
