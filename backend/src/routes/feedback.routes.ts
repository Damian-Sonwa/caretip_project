import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware, requireRole, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import { requireCompletedOnboarding } from "../middleware/requireCompletedOnboarding.middleware.js";
import * as feedbackController from "../controllers/feedback.controller.js";

const router = Router();

router.post("/tip", feedbackController.submitTipFeedback);

router.get(
  "/business",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  requireCompletedOnboarding,
  feedbackController.listBusinessFeedback,
);

export default router;

