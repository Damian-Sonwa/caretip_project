import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware, requireRole, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import { requireCompletedOnboarding } from "../middleware/requireCompletedOnboarding.middleware.js";
import * as billingController from "../controllers/billing.controller.js";

const router = Router();

const managerBilling = [
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  requireCompletedOnboarding,
] as const;

router.get("/billing", ...managerBilling, billingController.getMyBilling);
router.get("/billing/sync-status", ...managerBilling, billingController.getMyBillingSyncStatus);
router.post("/billing/checkout", ...managerBilling, billingController.postMyBillingCheckout);
router.post("/billing/portal", ...managerBilling, billingController.postMyBillingPortal);
router.post("/billing/cancel", ...managerBilling, billingController.postMyBillingCancel);

export default router;
