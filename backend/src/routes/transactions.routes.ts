import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware, requireRole, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import * as transactionsController from "../controllers/transactions.controller.js";

const router = Router();

router.get(
  "/export",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  transactionsController.exportTransactions
);

export default router;
