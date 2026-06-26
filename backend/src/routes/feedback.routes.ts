import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware, requireRole, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import { requireCompletedOnboarding } from "../middleware/requireCompletedOnboarding.middleware.js";
import { feedbackTipRateLimit } from "../middleware/securityRateLimit.middleware.js";
import * as feedbackController from "../controllers/feedback.controller.js";
import {
  requireFeature,
  requireOperationalSubscription,
} from "../services/subscriptionEntitlement.service.js";

const router = Router();

router.post("/tip", feedbackTipRateLimit, feedbackController.submitTipFeedback);

router.get(
  "/business",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  requireCompletedOnboarding,
  requireOperationalSubscription(),
  requireFeature("customerFeedback"),
  feedbackController.listBusinessFeedback,
);

export default router;

