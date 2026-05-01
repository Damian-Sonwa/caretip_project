import type { Request, Response } from "express";
import * as businessService from "../services/business.service.js";
import { prisma } from "../prisma.js";
import {
  logServerError,
  clientSafeMessage,
  CLIENT_FALLBACK,
} from "../utils/httpErrors.js";

export async function generateInvite(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const result = await businessService.generateInviteCode(userId);
    return res.json(result);
  } catch (err) {
    logServerError("business.generateInvite", err);
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.business),
    });
  }
}

export async function getMyProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const profile = await businessService.getManagerBusinessProfile(userId);
    if (!profile) {
      return res.status(404).json({ message: "Business not found" });
    }
    return res.json(profile);
  } catch (err) {
    logServerError("business.getMyProfile", err);
    return res.status(404).json({
      message: clientSafeMessage(err, "We couldn't load your business profile."),
    });
  }
}

export async function validateInvite(req: Request, res: Response) {
  try {
    const code = typeof req.query?.code === "string" ? req.query.code : "";
    const r = await businessService.validateInviteCode(code);
    if (!r.ok) {
      return res.status(400).json({ ok: false, message: "Invalid or expired invite code" });
    }
    return res.json({ ok: true, businessName: r.businessName });
  } catch (err) {
    logServerError("business.validateInvite", err);
    return res.status(400).json({
      ok: false,
      message: clientSafeMessage(err, CLIENT_FALLBACK.business),
    });
  }
}

export async function patchMyProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const body = req.body as Record<string, unknown>;
    await businessService.updateManagerBusinessProfile(userId, {
      legalBusinessName: typeof body.legalBusinessName === "string" ? body.legalBusinessName : undefined,
      businessType: body.businessType === undefined ? undefined : (body.businessType as string | null),
      registeredAddress:
        body.registeredAddress === undefined ? undefined : (body.registeredAddress as string | null),
      contactPhone: body.contactPhone === undefined ? undefined : (body.contactPhone as string | null),
      website: body.website === undefined ? undefined : (body.website as string | null),
    });
    const profile = await businessService.getManagerBusinessProfile(userId);
    return res.json(profile);
  } catch (err) {
    logServerError("business.patchMyProfile", err);
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.business),
    });
  }
}

export async function regenerateBusinessSlug(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const r = await businessService.regenerateManagerBusinessSlug(userId);
    return res.json(r);
  } catch (err) {
    logServerError("business.regenerateBusinessSlug", err);
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.business),
    });
  }
}

export async function uploadMyLogo(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const b = await businessService.getBusinessByUserId(userId);
    if (!b) {
      return res.status(404).json({ message: "Business not found" });
    }
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      return res.status(400).json({ message: "File is required (multipart field name: file)" });
    }
    const publicPath = `/uploads/businesses/${b.id}/${file.filename}`;
    await prisma.business.update({ where: { id: b.id }, data: { logoPath: publicPath } });
    return res.json({ success: true, path: publicPath });
  } catch (err) {
    logServerError("business.uploadMyLogo", err);
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.business),
    });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const { businessId } = req.params;
    if (!businessId) {
      return res.status(400).json({ message: "businessId is required" });
    }
    const business = await businessService.getBusinessById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }
    return res.json(business);
  } catch (err) {
    logServerError("business.getById", err);
    return res.status(404).json({
      message: clientSafeMessage(err, "We couldn't find this business."),
    });
  }
}

export async function getMyStats(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const business = await businessService.getBusinessIdForManagerUser(userId);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }
    const tf = req.query.timeframe;
    const timeframe =
      tf === "week" || tf === "month" || tf === "year" || tf === "all"
        ? tf
        : "month";
    const stats = await businessService.getBusinessStats(business.id, timeframe);
    return res.json(stats);
  } catch (err) {
    logServerError("business.getMyStats", err);
    return res.status(500).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.business),
    });
  }
}

export async function getStats(req: Request, res: Response) {
  try {
    const businessId = req.params.businessId ?? req.query.businessId;
    if (!businessId || typeof businessId !== "string") {
      return res.status(400).json({ message: "businessId is required" });
    }
    const tf = req.query.timeframe;
    const timeframe =
      tf === "week" || tf === "month" || tf === "year" || tf === "all"
        ? tf
        : "month";
    const stats = await businessService.getBusinessStats(businessId, timeframe);
    return res.json(stats);
  } catch (err) {
    logServerError("business.getStats", err);
    return res.status(404).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.business),
    });
  }
}
