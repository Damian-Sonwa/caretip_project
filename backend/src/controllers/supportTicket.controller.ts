import type { Request, Response } from "express";
import {
  addAdminReply,
  addBusinessReply,
  createSupportTicket,
  getBusinessSupportTicket,
  getPlatformSupportTicket,
  listBusinessSupportTickets,
  listPlatformSupportTickets,
  parseSupportCategory,
  parseSupportStatus,
  updateSupportTicketStatus,
} from "../services/supportTicket.service.js";
import { logServerError } from "../utils/httpErrors.js";
import { supportTicketHttpError } from "../utils/supportTicketErrors.js";

function userIdFromReq(req: Request): string | null {
  return req.user?.userId ?? req.user?.id ?? null;
}

export async function createBusinessTicket(req: Request, res: Response) {
  try {
    const userId = userIdFromReq(req);
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const subject = typeof req.body?.subject === "string" ? req.body.subject : "";
    const message = typeof req.body?.message === "string" ? req.body.message : "";
    const category = parseSupportCategory(
      typeof req.body?.category === "string" ? req.body.category : "",
    );
    if (!category) return res.status(400).json({ message: "Invalid category" });

    const ticket = await createSupportTicket({ userId, subject, category, message });
    return res.status(201).json({ ticket });
  } catch (err) {
    const mapped = supportTicketHttpError(
      err,
      "We couldn't submit your support request. Try again.",
    );
    if (mapped.status >= 500) {
      logServerError("supportTicket.createBusinessTicket", err);
    }
    return res.status(mapped.status).json({ message: mapped.message });
  }
}

export async function listBusinessTickets(req: Request, res: Response) {
  try {
    const userId = userIdFromReq(req);
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const status =
      typeof req.query.status === "string" ? parseSupportStatus(req.query.status) : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    const tickets = await listBusinessSupportTickets(userId, {
      status: status ?? undefined,
      search,
    });
    return res.json({ tickets });
  } catch (err) {
    logServerError("supportTicket.listBusinessTickets", err);
    const mapped = supportTicketHttpError(err, "We couldn't load your support tickets.");
    return res.status(mapped.status).json({ message: mapped.message });
  }
}

export async function getBusinessTicket(req: Request, res: Response) {
  try {
    const userId = userIdFromReq(req);
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const ticket = await getBusinessSupportTicket(userId, req.params.ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    return res.json({ ticket });
  } catch (err) {
    logServerError("supportTicket.getBusinessTicket", err);
    const mapped = supportTicketHttpError(err, "We couldn't load that ticket.");
    return res.status(mapped.status).json({ message: mapped.message });
  }
}

export async function replyBusinessTicket(req: Request, res: Response) {
  try {
    const userId = userIdFromReq(req);
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const body = typeof req.body?.body === "string" ? req.body.body : "";
    const ticket = await addBusinessReply({ userId, ticketId: req.params.ticketId, body });
    return res.json({ ticket });
  } catch (err) {
    const mapped = supportTicketHttpError(err, "We couldn't send your reply.");
    if (mapped.status >= 500) {
      logServerError("supportTicket.replyBusinessTicket", err);
    }
    return res.status(mapped.status).json({ message: mapped.message });
  }
}

export async function listPlatformTickets(req: Request, res: Response) {
  try {
    const status =
      typeof req.query.status === "string" ? parseSupportStatus(req.query.status) : undefined;
    const category =
      typeof req.query.category === "string" ? parseSupportCategory(req.query.category) : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    const tickets = await listPlatformSupportTickets({
      status: status ?? undefined,
      category: category ?? undefined,
      search,
    });
    return res.json({ tickets });
  } catch (err) {
    logServerError("supportTicket.listPlatformTickets", err);
    const mapped = supportTicketHttpError(err, "We couldn't load support tickets.");
    return res.status(mapped.status).json({ message: mapped.message });
  }
}

export async function getPlatformTicket(req: Request, res: Response) {
  try {
    const ticket = await getPlatformSupportTicket(req.params.ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    return res.json({ ticket });
  } catch (err) {
    logServerError("supportTicket.getPlatformTicket", err);
    const mapped = supportTicketHttpError(err, "We couldn't load that ticket.");
    return res.status(mapped.status).json({ message: mapped.message });
  }
}

export async function replyPlatformTicket(req: Request, res: Response) {
  try {
    const adminUserId = userIdFromReq(req);
    if (!adminUserId) return res.status(401).json({ message: "Authentication required" });
    const body = typeof req.body?.body === "string" ? req.body.body : "";
    const ticket = await addAdminReply({
      adminUserId,
      ticketId: req.params.ticketId,
      body,
    });
    return res.json({ ticket });
  } catch (err) {
    const mapped = supportTicketHttpError(err, "We couldn't send your reply.");
    if (mapped.status >= 500) {
      logServerError("supportTicket.replyPlatformTicket", err);
    }
    return res.status(mapped.status).json({ message: mapped.message });
  }
}

export async function patchPlatformTicketStatus(req: Request, res: Response) {
  try {
    const adminUserId = userIdFromReq(req);
    if (!adminUserId) return res.status(401).json({ message: "Authentication required" });
    const status = parseSupportStatus(
      typeof req.body?.status === "string" ? req.body.status : "",
    );
    if (!status) return res.status(400).json({ message: "Invalid status" });

    const ticket = await updateSupportTicketStatus({
      adminUserId,
      ticketId: req.params.ticketId,
      status,
    });
    return res.json({ ticket });
  } catch (err) {
    const mapped = supportTicketHttpError(err, "We couldn't update ticket status.");
    if (mapped.status >= 500) {
      logServerError("supportTicket.patchPlatformTicketStatus", err);
    }
    return res.status(mapped.status).json({ message: mapped.message });
  }
}
