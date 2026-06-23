import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware, requireRole, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import { requireCompletedOnboarding } from "../middleware/requireCompletedOnboarding.middleware.js";
import * as transactionsController from "../controllers/transactions.controller.js";
import { requireFeature } from "../services/subscriptionEntitlement.service.js";

const router = Router();

router.get(
  "/export",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  requireCompletedOnboarding,
  requireFeature("csvExport"),
  transactionsController.exportTransactions
);

export default router;
