import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  authLoginLimiter,
  authForgotPasswordLimiter,
  authResetPasswordLimiter,
} from "../middleware/rateLimit.middleware.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authLoginLimiter, authController.login);
/** Same handler as POST /login — preferred name for sign-in clients. */
router.post("/signin", authLoginLimiter, authController.login);
router.post("/oauth", authLoginLimiter, authController.oauth);
router.post("/activate-employee", authLoginLimiter, authController.activateEmployee);
router.get("/verify-email", authController.verifyEmail);
router.post("/forgot-password", authForgotPasswordLimiter, authController.forgotPassword);
router.post("/reset-password", authResetPasswordLimiter, authController.resetPassword);
router.post("/change-password", authMiddleware, authController.changePassword);

export default router;
