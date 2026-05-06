import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware, requireRole, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import * as goalController from "../controllers/goal.controller.js";

const router = Router();

router.get("/", authMiddleware, requireVerifiedEmail, requireRole(Role.EMPLOYEE), goalController.listMyGoals);
router.post("/", authMiddleware, requireVerifiedEmail, requireRole(Role.EMPLOYEE), goalController.createMyGoal);
router.put(
  "/:goalId",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.EMPLOYEE),
  goalController.updateMyGoal
);
router.post(
  "/:goalId/archive",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.EMPLOYEE),
  goalController.archiveMyGoal
);
router.delete(
  "/:goalId",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.EMPLOYEE),
  goalController.deleteMyGoalById
);

export default router;

