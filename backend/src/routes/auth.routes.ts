import { Router } from "express";
import { authMiddleware, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import {
  loginRateLimit,
  registerCombinedRateLimit,
  forgotPasswordRateLimit,
  resetPasswordRateLimit,
  resendVerificationRateLimit,
  resendVerificationSessionRateLimit,
  oauthRateLimit,
  activateEmployeeRateLimit,
} from "../middleware/authRateLimit.middleware.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", registerCombinedRateLimit, authController.register);
router.post("/login", loginRateLimit, authController.login);
/** Same handler as POST /login — preferred name for sign-in clients. */
router.post("/signin", loginRateLimit, authController.login);
router.post(
  "/resend-verification-email",
  resendVerificationRateLimit,
  authController.resendVerificationEmail
);
router.post(
  "/resend-verification-email/session",
  authMiddleware,
  resendVerificationSessionRateLimit,
  authController.resendVerificationEmailForSession
);
router.post("/oauth", oauthRateLimit, authController.oauth);
router.post("/activate-employee", activateEmployeeRateLimit, authController.activateEmployee);
router.get(
  "/activate-employee-branding",
  authController.activateEmployeeBrandingPreview
);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/verify-email", authController.verifyEmail);
router.post("/forgot-password", forgotPasswordRateLimit, authController.forgotPassword);
router.post("/reset-password", resetPasswordRateLimit, authController.resetPassword);
router.post("/change-password", authMiddleware, authController.changePassword);
router.patch("/me", authMiddleware, requireVerifiedEmail, authController.patchMe);

// 2FA (TOTP) management (does not change login flow by itself)
router.get("/2fa/status", authMiddleware, authController.twoFactorStatus);
router.post("/2fa/setup", authMiddleware, authController.twoFactorSetup);
router.post("/2fa/enable", authMiddleware, authController.twoFactorEnable);
router.post("/2fa/disable", authMiddleware, authController.twoFactorDisable);

export default router;
