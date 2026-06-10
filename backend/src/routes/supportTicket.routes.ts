import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware, requireRole, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import {
  supportTicketCreateLimiter,
  supportTicketReplyLimiter,
} from "../middleware/supportTicketRateLimit.middleware.js";
import * as supportTicketController from "../controllers/supportTicket.controller.js";

const router = Router();

router.post(
  "/tickets",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  supportTicketCreateLimiter,
  supportTicketController.createBusinessTicket,
);
router.get(
  "/tickets",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  supportTicketController.listBusinessTickets,
);
router.get(
  "/tickets/:ticketId",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  supportTicketController.getBusinessTicket,
);
router.post(
  "/tickets/:ticketId/messages",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  supportTicketReplyLimiter,
  supportTicketController.replyBusinessTicket,
);

export default router;
