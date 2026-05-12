import type { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../prisma.js";

/**
 * Authorization (business verification / KYC), not authentication.
 * Mount after `authMiddleware` so `req.user` is trusted from the access JWT.
 */
export async function isApprovedBusiness(req: Request, res: Response, next: NextFunction) {
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
    return next();
  }

  try {
    const business = await prisma.business.findUnique({
      where: { userId: uid },
      select: { verificationStatus: true },
    });
    if (!business) {
      return res.status(403).json({ message: "Account pending verification." });
    }
    if (business.verificationStatus !== "verified") {
      return res.status(403).json({ message: "Account pending verification." });
    }
    return next();
  } catch {
    return res.status(503).json({ message: "Service temporarily unavailable" });
  }
}
