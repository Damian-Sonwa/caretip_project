import type { Request, Response } from "express";
import * as platformService from "../services/platform.service.js";
import { prisma } from "../prisma.js";
import {
  logServerError,
  clientSafeMessage,
} from "../utils/httpErrors.js";

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
      message: clientSafeMessage(err, "We couldn't check database or payment status. Try again."),
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
    return res.status(500).json({
      message: clientSafeMessage(err, "We couldn't load platform statistics. Try again."),
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
    return res.status(500).json({
      message: clientSafeMessage(err, "We couldn't load the business list. Try again."),
    });
  }
}

export async function uploadBusinessLogo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "id is required" });
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "File is required (multipart field name: file)" });
    }
    const existing = await prisma.business.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Business not found" });
    }
    const publicPath = `/uploads/platform/businesses/${id}/${file.filename}`;
    await platformService.setBusinessLogoPath(id, publicPath);
    return res.json({ success: true, path: publicPath });
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
    if (!file) {
      return res.status(400).json({ message: "File is required (multipart field name: file)" });
    }
    const existing = await prisma.business.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Business not found" });
    }
    const publicPath = `/uploads/platform/businesses/${id}/${file.filename}`;
    await platformService.setBusinessVerificationDocumentPath(id, publicPath);
    return res.json({ success: true, path: publicPath });
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
