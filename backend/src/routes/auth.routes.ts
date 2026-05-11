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
router.post(
  "/resend-verification-email",
  authLoginLimiter,
  authController.resendVerificationEmail
);
router.post(
  "/resend-verification-email/session",
  authLoginLimiter,
  authMiddleware,
  authController.resendVerificationEmailForSession
);
router.post("/oauth", authLoginLimiter, authController.oauth);
router.post("/activate-employee", authLoginLimiter, authController.activateEmployee);
router.get(
  "/activate-employee-branding",
  authController.activateEmployeeBrandingPreview
);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/verify-email", authController.verifyEmail);
router.post("/forgot-password", authForgotPasswordLimiter, authController.forgotPassword);
router.post("/reset-password", authResetPasswordLimiter, authController.resetPassword);
router.post("/change-password", authMiddleware, authController.changePassword);
router.patch("/me", authMiddleware, authController.patchMe);

// 2FA (TOTP) management (does not change login flow by itself)
router.get("/2fa/status", authMiddleware, authController.twoFactorStatus);
router.post("/2fa/setup", authMiddleware, authController.twoFactorSetup);
router.post("/2fa/enable", authMiddleware, authController.twoFactorEnable);
router.post("/2fa/disable", authMiddleware, authController.twoFactorDisable);

export default router;
