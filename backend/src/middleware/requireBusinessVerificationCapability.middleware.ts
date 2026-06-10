import type { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../prisma.js";
import {
  GO_LIVE_REQUIRED_CODE,
  GO_LIVE_REQUIRED_MESSAGE,
  hasBusinessVerificationCapability,
  type BusinessVerificationCapability,
} from "../config/businessVerificationCapabilities.js";

/**
 * Go-live gate — use only for public tipping / QR production capabilities.
 * Setup routes should NOT mount this middleware.
 */
export function requireBusinessVerificationCapability(
  capability: Exclude<BusinessVerificationCapability, "setup">,
) {
  return async function requireBusinessVerificationCapabilityMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const uid = req.user?.userId ?? req.user?.id;
    if (!uid) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (req.user?.impersonatedBy) {
      return next();
    }

    const role = req.user?.role;
    if (role === Role.SUPER_ADMIN) {
      return next();
    }

    if (role !== Role.MANAGER) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    try {
      const business = await prisma.business.findUnique({
        where: { userId: uid },
        select: { verificationStatus: true },
      });
      if (!business) {
        return res.status(403).json({
          message: GO_LIVE_REQUIRED_MESSAGE,
          code: GO_LIVE_REQUIRED_CODE,
        });
      }
      if (
        !hasBusinessVerificationCapability(business.verificationStatus, capability, {
          impersonating: Boolean(req.user?.impersonatedBy),
        })
      ) {
        return res.status(403).json({
          message: GO_LIVE_REQUIRED_MESSAGE,
          code: GO_LIVE_REQUIRED_CODE,
        });
      }
      return next();
    } catch {
      return res.status(503).json({ message: "Service temporarily unavailable" });
    }
  };
}
