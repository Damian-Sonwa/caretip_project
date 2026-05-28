import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware, requireRole, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import * as goalController from "../controllers/goal.controller.js";
import { requireSubscriptionCapability } from "../middleware/requireSubscriptionCapability.middleware.js";

const router = Router();

const goalsPremium = requireSubscriptionCapability("employeeGoals");

router.get("/", authMiddleware, requireVerifiedEmail, requireRole(Role.EMPLOYEE), goalsPremium, goalController.listMyGoals);
router.post("/", authMiddleware, requireVerifiedEmail, requireRole(Role.EMPLOYEE), goalsPremium, goalController.createMyGoal);
router.put(
  "/:goalId",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.EMPLOYEE),
  goalsPremium,
  goalController.updateMyGoal
);
router.post(
  "/:goalId/archive",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.EMPLOYEE),
  goalsPremium,
  goalController.archiveMyGoal
);
router.delete(
  "/:goalId",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.EMPLOYEE),
  goalsPremium,
  goalController.deleteMyGoalById
);

export default router;

