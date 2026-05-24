import type { Request, Response } from "express";
import * as platformService from "../services/platform.service.js";
import * as businessService from "../services/business.service.js";
import { prisma } from "../prisma.js";
import * as platformAnalyticsService from "../services/platformAnalytics.service.js";
import {
  uploadPlatformBusinessLogoImage,
  uploadPlatformVerificationDocument,
} from "../services/upload.service.js";
import {
  logServerError,
  clientSafeMessage,
} from "../utils/httpErrors.js";
import { removeUploadedObjectByPublicUrlIfPossible } from "../lib/supabaseStorageClient.js";
import { sanitizeIanaTimezone, DEFAULT_BUSINESS_TIMEZONE } from "../utils/businessTime.js";
import { DateTime } from "luxon";

export async function getHealth(_req: Request, res: Response) {
  try {
    const [database, stripe] = await Promise.all([
      platformService.checkDatabaseHealth(),
      platformService.checkStripeHealth(),
    ]);
    return res.json({
      database,
      stripe,
    });
  } catch (err) {
    logServerError("platform.getHealth", err);
    return res.status(503).json({
      message: clientSafeMessage(err, "We couldn't verify payment setup. Please try again."),
    });
  }
}

export async function listTransactions(req: Request, res: Response) {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const take = Math.min(Math.max(Number(req.query.take) || 50, 1), 100);
    const skip = Math.max(Number(req.query.skip) || 0, 0);
    const result = await platformService.listGlobalTransactions({ q, take, skip });
    return res.json(result);
  } catch (err) {
    logServerError("platform.listTransactions", err);
    return res.status(500).json({
      message: clientSafeMessage(err, "We couldn't load global transactions. Try again."),
    });
  }
}

export async function getStats(_req: Request, res: Response) {
  try {
    const stats = await platformService.getGlobalPlatformStats();
    return res.json(stats);
  } catch (err) {
    logServerError("platform.getStats", err);
    // Never crash the platform admin dashboard on aggregation errors.
    // Return safe defaults so the UI can still render (and surface a FixPrompt).
    return res.json({
      totalVolumeEur: 0,
      totalVolumeEurFormatted: "0.00",
      transactionCount: 0,
      successTransactionCount: 0,
      businessesCount: 0,
      employeesCount: 0,
      locationsCount: 0,
      activeUsersCount: 0,
      businessesWithSuccessfulTips: 0,
      platformTotalTipsFromBusinessRollupEur: 0,
      platformTotalsConsistent: false,
      warning: clientSafeMessage(err, "We couldn't load platform statistics. Try again."),
    });
  }
}

export async function getAnalytics(req: Request, res: Response) {
  try {
    const days = req.query.days;
    const timezone =
      typeof req.query.timezone === "string"
        ? sanitizeIanaTimezone(req.query.timezone)
        : DEFAULT_BUSINESS_TIMEZONE;
    const data = await platformAnalyticsService.getPlatformAnalytics({ days, timezone });
    return res.json(data);
  } catch (err) {
    logServerError("platform.getAnalytics", err);
    // Safe empty analytics payload: charts must not break the admin dashboard.
    const rawDays = typeof req.query.days === "string" ? Number(req.query.days) : 30;
    const rangeDays = Number.isFinite(rawDays) ? Math.min(Math.max(Math.floor(rawDays), 7), 120) : 30;
    const timezone =
      typeof req.query.timezone === "string"
        ? sanitizeIanaTimezone(req.query.timezone)
        : DEFAULT_BUSINESS_TIMEZONE;
    const localEnd = DateTime.now().setZone(timezone).startOf("day");
    const localStart = localEnd.minus({ days: rangeDays - 1 });
    const growth: Array<{ date: string; newUsers: number; newBusinesses: number; newTips: number }> = [];
    const tipVolume: Array<{ date: string; tipsEur: number; tipCount: number }> = [];
    for (let i = 0; i < rangeDays; i += 1) {
      const iso = localStart.plus({ days: i }).toFormat("yyyy-MM-dd");
      growth.push({ date: iso, newUsers: 0, newBusinesses: 0, newTips: 0 });
      tipVolume.push({ date: iso, tipsEur: 0, tipCount: 0 });
    }
    return res.json({
      timezone,
      rangeDays,
      userDistribution: [
        { role: "business", count: 0 },
        { role: "employee", count: 0 },
        { role: "platform_admin", count: 0 },
      ],
      tipStatus: [
        { status: "success", count: 0 },
        { status: "pending", count: 0 },
        { status: "failed", count: 0 },
      ],
      growth,
      tipVolume,
      topBusinessesByTips: [],
      warning: clientSafeMessage(err, "We couldn't load analytics right now. Try again."),
    });
  }
}

/** SuperAdmin: all businesses with live KYC fields, tip totals, and staff/location counts. */
export async function listBusinesses(_req: Request, res: Response) {
  try {
    const businesses = await platformService.getAllBusinessActivity();
    return res.json({ businesses });
  } catch (err) {
    logServerError("platform.listBusinesses", err);
    // Safe empty list: keep dashboard usable even when DB/schema is out of sync.
    return res.json({
      businesses: [],
      warning: clientSafeMessage(err, "We couldn't load the business list. Try again."),
    });
  }
}

export async function uploadBusinessLogo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "id is required" });
    const file = req.file;
    if (!file?.buffer) {
      return res.status(400).json({ message: "File is required (multipart field name: file)" });
    }
    const existing = await prisma.business.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Business not found" });
    }
    const pathToStore = await uploadPlatformBusinessLogoImage(file.buffer, file.mimetype, id, file.originalname);
    try {
      await platformService.setBusinessLogoPath(id, pathToStore);
    } catch (dbErr) {
      await removeUploadedObjectByPublicUrlIfPossible(pathToStore);
      throw dbErr;
    }
    return res.json({ success: true, path: pathToStore });
  } catch (err) {
    logServerError("platform.uploadBusinessLogo", err);
    return res.status(500).json({
      message: clientSafeMessage(err, "We couldn't upload the logo. Try again."),
    });
  }
}

export async function uploadVerificationDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "id is required" });
    const file = req.file;
    if (!file?.buffer) {
      return res.status(400).json({ message: "File is required (multipart field name: file)" });
    }
    const existing = await prisma.business.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Business not found" });
    }
    const pathToStore = await uploadPlatformVerificationDocument(file.buffer, file.mimetype, id, file.originalname);
    try {
      await platformService.setBusinessVerificationDocumentPath(id, pathToStore);
    } catch (dbErr) {
      await removeUploadedObjectByPublicUrlIfPossible(pathToStore);
      throw dbErr;
    }
    return res.json({ success: true, path: pathToStore });
  } catch (err) {
    logServerError("platform.uploadVerificationDocument", err);
    return res.status(500).json({
      message: clientSafeMessage(err, "We couldn't upload the verification document. Try again."),
    });
  }
}

export async function verifyBusiness(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "id is required" });
    const body = req.body as { status?: string } | undefined;
    const raw = body?.status;
    const status =
      raw === "rejected" || raw === "pending" || raw === "verified" ? raw : "verified";
    await platformService.updateBusinessVerificationStatus(id, status);
    return res.json({ success: true });
  } catch (err) {
    logServerError("platform.verifyBusiness", err);
    return res.status(400).json({
      message: clientSafeMessage(err, "We couldn't update verification status. Try again."),
    });
  }
}

export async function getBusiness(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "id is required" });
    const b = await platformService.getBusinessForAdmin(id);
    if (!b) return res.status(404).json({ message: "Business not found" });
    return res.json({ business: b });
  } catch (err) {
    logServerError("platform.getBusiness", err);
    return res.status(500).json({
      message: clientSafeMessage(err, "We couldn't load that business. Try again."),
    });
  }
}

/** SuperAdmin: removes the business graph and all manager/staff `User` rows for that venue. */
export async function deleteBusiness(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "id is required" });
    await businessService.deleteBusinessCascadeUsers(id);
    return res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "Business not found") {
      return res.status(404).json({ message: msg });
    }
    if (
      msg.startsWith("Cannot delete") ||
      msg.includes("unexpected role") ||
      msg.includes("delete aborted")
    ) {
      return res.status(400).json({ message: msg });
    }
    logServerError("platform.deleteBusiness", err);
    return res.status(500).json({
      message: clientSafeMessage(err, "We couldn't delete that business. Try again."),
    });
  }
}

export async function listAuditLogs(req: Request, res: Response) {
  try {
    const take = Math.min(Math.max(Number(req.query.take) || 100, 1), 200);
    const skip = Math.max(Number(req.query.skip) || 0, 0);
    const result = await platformService.listAuditLogsForAdmin({ take, skip });
    return res.json(result);
  } catch (err) {
    logServerError("platform.listAuditLogs", err);
    return res.status(500).json({
      message: clientSafeMessage(err, "We couldn't load audit logs. Try again."),
    });
  }
}

export async function updateBusiness(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "id is required" });
    const body = req.body as Record<string, unknown>;
    const business = await platformService.updateBusinessKyc(id, {
      legalContactName:
        body.legalContactName !== undefined ? (body.legalContactName as string | null) : undefined,
      contactEmail: body.contactEmail !== undefined ? (body.contactEmail as string | null) : undefined,
      contactPhone: body.contactPhone !== undefined ? (body.contactPhone as string | null) : undefined,
      registeredAddress:
        body.registeredAddress !== undefined ? (body.registeredAddress as string | null) : undefined,
    });
    return res.json({ success: true, business });
  } catch (err) {
    logServerError("platform.updateBusiness", err);
    return res.status(400).json({
      message: clientSafeMessage(err, "We couldn't save business details. Try again."),
    });
  }
}

export async function listAnnouncements(req: Request, res: Response) {
  try {
    const take = Math.min(Math.max(Number(req.query.take) || 50, 1), 200);
    const skip = Math.max(Number(req.query.skip) || 0, 0);
    const result = await platformService.listAnnouncementsForAdmin({ take, skip });
    return res.json(result);
  } catch (err) {
    logServerError("platform.listAnnouncements", err);
    return res.status(500).json({
      message: clientSafeMessage(err, "We couldn't load announcement history. Try again."),
    });
  }
}

export async function sendAnnouncement(req: Request, res: Response) {
  try {
    const body = req.body as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title : "";
    const message = typeof body.message === "string" ? body.message : typeof body.body === "string" ? body.body : "";
    const url = typeof body.url === "string" ? body.url : undefined;
    const audienceRaw = typeof body.audience === "string" ? body.audience : "all";
    const audience: platformService.PlatformAnnouncementAudience =
      audienceRaw === "managers" ||
      audienceRaw === "employees" ||
      audienceRaw === "admins"
        ? audienceRaw
        : "all";
    if (!title.trim() || !message.trim()) {
      return res.status(400).json({ message: "title and message are required" });
    }
    const adminId = req.user?.userId ?? req.user?.id;
    if (!adminId) return res.status(401).json({ message: "Authentication required" });

    const priorityRaw = typeof body.priority === "string" ? body.priority : "normal";
    const priority = priorityRaw === "high" ? "high" : "normal";
    const channelsBody =
      body.channels && typeof body.channels === "object"
        ? (body.channels as Record<string, unknown>)
        : undefined;

    const result = await platformService.sendPlatformAnnouncement({
      title,
      body: message,
      url,
      audience,
      createdById: adminId,
      priority,
      channels: {
        inApp: channelsBody?.inApp !== false,
        push: channelsBody?.push !== false,
        email: channelsBody?.email === true,
      },
      announcementId:
        typeof body.announcementId === "string" ? body.announcementId : undefined,
    });
    return res.json({
      success: true,
      recipientCount: result.recipientCount,
      announcementId: result.announcementId,
      message: `Announcement queued for ${result.recipientCount} user(s).`,
    });
  } catch (err) {
    logServerError("platform.sendAnnouncement", err);
    return res.status(400).json({
      message: clientSafeMessage(err, "We couldn't send that announcement. Try again."),
    });
  }
}

export async function impersonate(req: Request, res: Response) {
  try {
    const adminId = req.user?.userId ?? req.user?.id;
    if (!adminId) return res.status(401).json({ message: "Authentication required" });
    const businessId = (req.body as { businessId?: string }).businessId;
    if (!businessId || typeof businessId !== "string") {
      return res.status(400).json({ message: "businessId is required" });
    }
    const result = await platformService.impersonateBusinessManager(adminId, businessId);
    return res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "Forbidden") {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    if (msg === "Business not found") {
      return res.status(404).json({ message: msg });
    }
    logServerError("platform.impersonate", err);
    return res.status(500).json({
      message: clientSafeMessage(err, "We couldn't open support view for that venue. Try again."),
    });
  }
}
