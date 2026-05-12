import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware, requireRole, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import { isApprovedBusiness } from "../middleware/isApprovedBusiness.middleware.js";
import * as businessController from "../controllers/business.controller.js";
import { businessUploadLogo } from "../middleware/businessUpload.middleware.js";
import { clientSafeMessage } from "../utils/httpErrors.js";

const router = Router();

/** Public: validate an invite code before sign-up. */
router.get("/invite/validate", businessController.validateInvite);

/** Pending managers may read their own profile to poll KYC status; not gated by isApprovedBusiness. */
router.get("/profile", authMiddleware, requireRole(Role.MANAGER), businessController.getMyProfile);
router.patch(
  "/profile",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  businessController.patchMyProfile
);
router.put(
  "/profile",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  businessController.putMyProfile
);
router.post(
  "/profile/logo",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  (req, res, next) =>
    businessUploadLogo(req, res, (err: unknown) => {
      if (err) {
        return res.status(400).json({
          message: clientSafeMessage(
            err instanceof Error ? err : new Error(String(err)),
            "We couldn't upload your logo. Please try again.",
          ),
        });
      }
      next();
    }),
  businessController.uploadMyLogo
);

router.post(
  "/profile/slug/regenerate",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  businessController.regenerateBusinessSlug
);

router.post(
  "/generate-invite",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  businessController.generateInvite
);

/** Legacy aliases — primary handler is `GET /api/business/me/stats` on the main app (see index.ts). */
router.get(
  "/stats/me",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  businessController.getMyStats
);
router.get("/stats", authMiddleware, requireVerifiedEmail, isApprovedBusiness, businessController.getStats);
router.get(
  "/stats/:businessId",
  authMiddleware,
  requireVerifiedEmail,
  isApprovedBusiness,
  businessController.getStats
);

router.get("/:businessId", businessController.getById);

export default router;
