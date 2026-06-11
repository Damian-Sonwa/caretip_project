import { Router } from "express";
import { authMiddleware, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import * as notificationsController from "../controllers/notifications.controller.js";

const router = Router();

router.get("/", authMiddleware, requireVerifiedEmail, notificationsController.listMine);
router.get("/unread-count", authMiddleware, requireVerifiedEmail, notificationsController.unreadCount);
router.post("/read-all", authMiddleware, requireVerifiedEmail, notificationsController.markAllRead);
router.patch("/:id/read", authMiddleware, requireVerifiedEmail, notificationsController.markRead);
router.delete("/:id", authMiddleware, requireVerifiedEmail, notificationsController.deleteOne);

export default router;
