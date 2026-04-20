import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware, requireRole, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import * as tipsController from "../controllers/tips.controller.js";

const router = Router();

router.get(
  "/employee",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.EMPLOYEE),
  tipsController.getByEmployee
);
router.post("/create-intent", tipsController.createIntent);

export default router;
