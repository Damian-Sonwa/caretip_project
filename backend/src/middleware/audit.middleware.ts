import type { Request, Response, NextFunction } from "express";
import * as auditService from "../services/audit.service.js";

/**
 * Logs a platform admin API access after `requirePlatformAdmin` succeeds.
 * Place **after** `requirePlatformAdmin` on specific routes, or use {@link auditPlatformAccess}.
 */
export function auditAdminAction(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const uid = req.user?.userId ?? req.user?.id;
    if (uid) {
      const meta = JSON.stringify({
        method: req.method,
        path: req.originalUrl ?? req.url,
      });
      void auditService.writeAuditLog({ userId: uid, action, metadata: meta });
    }
    next();
  };
}

/** Generic audit entry for any authenticated platform route segment. */
export function auditPlatformAccess(req: Request, res: Response, next: NextFunction) {
  const uid = req.user?.userId ?? req.user?.id;
  if (uid) {
    void auditService.writeAuditLog({
      userId: uid,
      action: "platform.api",
      metadata: JSON.stringify({
        method: req.method,
        path: req.originalUrl ?? req.url,
      }),
    });
  }
  next();
}
