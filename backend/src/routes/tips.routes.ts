import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware, requireRole, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import { legacyPaymentIntentLimiter } from "../middleware/rateLimit.middleware.js";
import { requireCompletedOnboarding } from "../middleware/requireCompletedOnboarding.middleware.js";
import * as tipsController from "../controllers/tips.controller.js";

const router = Router();

router.get(
  "/business",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  requireCompletedOnboarding,
  tipsController.getByBusiness
);

router.get(
  "/employee",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.EMPLOYEE),
  tipsController.getByEmployee
);

router.get(
  "/employee/list",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.EMPLOYEE),
  tipsController.listByEmployee
);
/** Legacy PI flow — unused by PaymentPage (Checkout is canonical). Public + rate-limited. */
router.post("/create-intent", legacyPaymentIntentLimiter, tipsController.createIntent);

export default router;
