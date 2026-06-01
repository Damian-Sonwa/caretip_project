import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware, requireRole, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import { isApprovedBusiness } from "../middleware/isApprovedBusiness.middleware.js";
import { requireCompletedOnboarding } from "../middleware/requireCompletedOnboarding.middleware.js";
import * as tipsController from "../controllers/tips.controller.js";

const router = Router();

router.get(
  "/business",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  isApprovedBusiness,
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
router.post("/create-intent", tipsController.createIntent);

export default router;
