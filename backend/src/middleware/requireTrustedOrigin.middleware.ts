import type { Request, Response, NextFunction } from "express";
import { isCorsOriginAllowed } from "../config/cors.js";

function originFromReferer(referer: string | undefined): string | undefined {
  const trimmed = referer?.trim();
  if (!trimmed) return undefined;
  try {
    return new URL(trimmed).origin;
  } catch {
    return undefined;
  }
}

/** Resolve browser origin from `Origin`, falling back to `Referer`. */
export function resolveRequestOrigin(req: Request): string | undefined {
  const origin = req.get("origin")?.trim();
  if (origin) return origin;
  return originFromReferer(req.get("referer") ?? undefined);
}

/**
 * CSRF guard for cookie-authenticated auth routes.
 * Rejects cross-site requests with 403 when Origin/Referer is missing or not allowlisted.
 */
export function requireTrustedOrigin(req: Request, res: Response, next: NextFunction): void {
  const origin = resolveRequestOrigin(req);
  if (!origin || !isCorsOriginAllowed(origin)) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  next();
}
