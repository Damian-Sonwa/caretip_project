import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as notificationsController from "../controllers/notifications.controller.js";

const router = Router();

router.get("/", authMiddleware, notificationsController.listMine);
router.get("/unread-count", authMiddleware, notificationsController.unreadCount);
router.post("/read-all", authMiddleware, notificationsController.markAllRead);
router.patch("/:id/read", authMiddleware, notificationsController.markRead);
router.delete("/:id", authMiddleware, notificationsController.deleteOne);

export default router;
