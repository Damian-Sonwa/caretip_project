import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware, requireRole, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import { requireCompletedOnboarding } from "../middleware/requireCompletedOnboarding.middleware.js";
import * as commercialController from "../controllers/commercial.controller.js";

const router = Router();

router.post(
  "/feature-utilization",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  requireCompletedOnboarding,
  commercialController.postFeatureUtilization,
);

router.get(
  "/insights",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  requireCompletedOnboarding,
  commercialController.getCommercialInsights,
);

export default router;
