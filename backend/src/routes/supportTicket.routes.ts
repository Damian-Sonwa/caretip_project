import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware, requireRole, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import { isApprovedBusiness } from "../middleware/isApprovedBusiness.middleware.js";
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
  isApprovedBusiness,
  supportTicketCreateLimiter,
  supportTicketController.createBusinessTicket,
);
router.get(
  "/tickets",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  isApprovedBusiness,
  supportTicketController.listBusinessTickets,
);
router.get(
  "/tickets/:ticketId",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  isApprovedBusiness,
  supportTicketController.getBusinessTicket,
);
router.post(
  "/tickets/:ticketId/messages",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  isApprovedBusiness,
  supportTicketReplyLimiter,
  supportTicketController.replyBusinessTicket,
);

export default router;
