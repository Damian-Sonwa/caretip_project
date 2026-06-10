import type { Request, Response, NextFunction } from "express";
import { requireBusinessVerificationCapability } from "./requireBusinessVerificationCapability.middleware.js";

/**
 * @deprecated Prefer `requireBusinessVerificationCapability("receiveTips")` on go-live routes only.
 * Kept as an alias for legacy mounts that still require full go-live approval.
 */
export async function isApprovedBusiness(req: Request, res: Response, next: NextFunction) {
  return requireBusinessVerificationCapability("receiveTips")(req, res, next);
}
