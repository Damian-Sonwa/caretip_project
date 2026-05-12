import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import type { Role as PrismaRole } from "@prisma/client";
import { prisma } from "../prisma.js";

export interface JwtPayload {
  userId: string;
  id?: string; // Alias for userId (some JWT libs use id)
  email: string;
  role: PrismaRole;
  roleLabel?: "MANAGER" | "EMPLOYEE" | "SUPER_ADMIN";
  /** Present when a platform admin is acting as a business owner JWT. */
  impersonatedBy?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Stateless authentication: validates the access JWT only (no server session store per request).
 * Subscription / KYC gates belong in separate middleware (e.g. `isApprovedBusiness`).
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET not configured");
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Access token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ message: "Invalid or expired token", code: "TOKEN_INVALID" });
  }
}

export function requireRole(...roles: PrismaRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

/**
 * Admin-route gate based on JWT role claim.
 * Applies only where explicitly mounted (e.g. /api/platform).
 *
 * IMPORTANT:
 * - Does not replace DB-backed checks (see requirePlatformAdmin).
 * - If role claim is missing, logs a warning and returns 403 (does not crash).
 */
export function requireAdminRoleClaim(req: Request, res: Response, next: NextFunction) {
  const role = req.user?.role;
  if (!role) {
    console.warn("[rbac] Missing role claim on admin route", {
      userId: req.user?.userId ?? req.user?.id,
      path: req.originalUrl ?? req.url,
    });
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  // Support both the requested string "admin" and the app's canonical SUPER_ADMIN role.
  const s = String(role).trim().toLowerCase();
  if (s !== "admin" && role !== Role.SUPER_ADMIN) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  next();
}

/**
 * Enforces that the authenticated user's email is verified.
 * Kept separate from authMiddleware so public routes can still authenticate without this gate if needed.
 */
export async function requireVerifiedEmail(req: Request, res: Response, next: NextFunction) {
  const uid = req.user?.userId ?? req.user?.id;
  if (!uid) {
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    const row = await prisma.user.findUnique({
      where: { id: uid },
      select: { emailVerified: true, isActive: true, role: true, isPlatformAdmin: true },
    });
    if (!row || row.isActive !== true) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (row.emailVerified !== true) {
      return res.status(403).json({ message: "Email verification required" });
    }
    next();
  } catch {
    return res.status(503).json({ message: "Service temporarily unavailable" });
  }
}

/**
 * Platform / Super Admin routes only. Does **not** trust JWT role claims: always loads the user from PostgreSQL.
 * Requires: user exists, `role === SUPER_ADMIN`, `isPlatformAdmin === true`, `isActive === true`.
 */
export async function requirePlatformAdmin(req: Request, res: Response, next: NextFunction) {
  const uid = req.user?.userId ?? req.user?.id;
  if (!uid) {
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    const row = await prisma.user.findUnique({
      where: { id: uid },
      select: { id: true, role: true, isPlatformAdmin: true, isActive: true, emailVerified: true },
    });
    if (
      !row ||
      row.role !== Role.SUPER_ADMIN ||
      !row.isPlatformAdmin ||
      !row.isActive ||
      !row.emailVerified
    ) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  } catch {
    return res.status(503).json({ message: "Service temporarily unavailable" });
  }
}
