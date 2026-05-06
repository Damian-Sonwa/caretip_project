import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as settingsController from "../controllers/settings.controller.js";

const router = Router();

router.get("/settings", authMiddleware, settingsController.getMySettings);
router.patch("/settings", authMiddleware, settingsController.patchMySettings);

export default router;

