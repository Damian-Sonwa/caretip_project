import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { authMiddleware, requireAdminRoleClaim, requirePlatformAdmin } from "../middleware/auth.middleware.js";
import { auditPlatformAccess } from "../middleware/audit.middleware.js";
import {
  platformUploadLogo,
  platformUploadVerification,
} from "../middleware/platformUpload.middleware.js";
import * as platformController from "../controllers/platform.controller.js";

const router = Router();

router.use(authMiddleware, requireAdminRoleClaim, requirePlatformAdmin, auditPlatformAccess);

function multerHandler(
  mw: (req: Request, res: Response, next: NextFunction) => void,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    mw(req, res, (err: unknown) => {
      if (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        return res.status(400).json({ message: msg });
      }
      next();
    });
  };
}

router.get("/health", platformController.getHealth);
router.get("/stats", platformController.getStats);
router.get("/analytics", platformController.getAnalytics);
router.get("/transactions", platformController.listTransactions);
router.get("/audit-logs", platformController.listAuditLogs);
router.get("/businesses", platformController.listBusinesses);
router.get("/businesses/:id", platformController.getBusiness);
router.delete("/businesses/:id", platformController.deleteBusiness);
router.patch("/businesses/:id/verify", platformController.verifyBusiness);
router.patch("/businesses/:id", platformController.updateBusiness);
router.post(
  "/businesses/:id/logo",
  multerHandler(platformUploadLogo),
  platformController.uploadBusinessLogo,
);
router.post(
  "/businesses/:id/verification-document",
  multerHandler(platformUploadVerification),
  platformController.uploadVerificationDocument,
);
router.post("/impersonate", platformController.impersonate);

export default router;
