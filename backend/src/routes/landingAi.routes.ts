import { Router } from "express";
import * as landingAiController from "../controllers/landingAi.controller.js";
import {
  authMiddleware,
  requireAdminRoleClaim,
  requirePlatformAdmin,
} from "../middleware/auth.middleware.js";
import {
  landingAiChatLimiter,
  landingAiEventsLimiter,
} from "../middleware/landingAiRateLimit.middleware.js";

const router = Router();

router.post("/chat", landingAiChatLimiter, landingAiController.landingAiChat);
router.post("/events", landingAiEventsLimiter, landingAiController.landingAiTrackEvent);
router.get(
  "/diagnostics",
  authMiddleware,
  requireAdminRoleClaim,
  requirePlatformAdmin,
  landingAiController.landingAiDiagnostics,
);

export default router;
