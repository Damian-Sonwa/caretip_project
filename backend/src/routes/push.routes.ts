import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as pushController from "../controllers/push.controller.js";

const router = Router();

const pushTokenLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 40 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const uid = req.user?.userId ?? req.user?.id;
    return typeof uid === "string" && uid.trim() ? `user:${uid.trim()}` : `ip:${req.ip ?? "unknown"}`;
  },
  message: { message: "Too many push registration attempts. Try again later." },
});

const pushTestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many test notifications. Try again later." },
});

router.get("/config", pushController.getPushConfig);
router.post("/tokens", authMiddleware, pushTokenLimiter, pushController.registerToken);
router.delete("/tokens", authMiddleware, pushController.deleteToken);
router.delete("/tokens/all", authMiddleware, pushController.deleteAllTokens);
router.post("/test", authMiddleware, pushTestLimiter, pushController.sendTestNotification);

export default router;
