import { Router } from "express";
import { authMiddleware, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import * as settingsController from "../controllers/settings.controller.js";

const router = Router();

router.get("/settings", authMiddleware, requireVerifiedEmail, settingsController.getMySettings);
router.patch("/settings", authMiddleware, requireVerifiedEmail, settingsController.patchMySettings);

export default router;

