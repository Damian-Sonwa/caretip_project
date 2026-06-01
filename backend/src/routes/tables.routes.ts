import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware, requireRole, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import { isApprovedBusiness } from "../middleware/isApprovedBusiness.middleware.js";
import * as tablesController from "../controllers/tables.controller.js";
import { requireSubscriptionCapability } from "../middleware/requireSubscriptionCapability.middleware.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  isApprovedBusiness,
  requireSubscriptionCapability("tableQr"),
  tablesController.listTables,
);
router.post(
  "/",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  isApprovedBusiness,
  requireSubscriptionCapability("tableQr"),
  tablesController.createTable,
);

export default router;
