import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as mediaController from "../controllers/media.controller.js";

const router = Router();

router.get("/secure-access", authMiddleware, mediaController.getSecureMediaAccess);
router.get("/secure-stream", authMiddleware, mediaController.streamSecureKycDocument);

export default router;
