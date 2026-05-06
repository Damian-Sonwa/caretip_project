import type { Request, Response } from "express";
import { readFile, unlink } from "node:fs/promises";
import * as businessService from "../services/business.service.js";
import { prisma } from "../prisma.js";
import {
  logServerError,
  clientSafeMessage,
  CLIENT_FALLBACK,
} from "../utils/httpErrors.js";
import {
  isCloudinaryConfiguredForUpload,
  tryUploadBusinessLogoToCloudinary,
} from "../services/upload.service.js";

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

function parseProfileBody(body: Record<string, unknown>): Parameters<typeof businessService.updateManagerBusinessProfile>[1] {
  const name =
    typeof body.name === "string"
      ? body.name
      : typeof body.businessName === "string"
        ? body.businessName
        : undefined;
  return {
    name,
    legalBusinessName: typeof body.legalBusinessName === "string" ? body.legalBusinessName : undefined,
    businessType: body.businessType === undefined ? undefined : (body.businessType as string | null),
    location: body.location === undefined ? undefined : (body.location as string | null),
    registeredAddress:
      body.registeredAddress === undefined ? undefined : (body.registeredAddress as string | null),
    contactPhone: body.contactPhone === undefined ? undefined : (body.contactPhone as string | null),
    website: body.website === undefined ? undefined : (body.website as string | null),
  };
}

export async function patchMyProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const body = req.body as Record<string, unknown>;
    await businessService.updateManagerBusinessProfile(userId, parseProfileBody(body));
    const profile = await businessService.getManagerBusinessProfile(userId);
    return res.json(profile);
  } catch (err) {
    logServerError("business.patchMyProfile", err);
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.business),
    });
  }
}

/** Same as PATCH — REST clients may use PUT for full profile replace-style updates. */
export async function putMyProfile(req: Request, res: Response) {
  return patchMyProfile(req, res);
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
    let logoPathToStore = publicPath;

    /** Multer disk storage sets `path`; if Cloudinary fails, keep the uploaded file path. */
    if (isCloudinaryConfiguredForUpload() && typeof file.path === "string" && file.path.length > 0) {
      try {
        const buf = await readFile(file.path);
        const cloudUrl = await tryUploadBusinessLogoToCloudinary(buf);
        if (cloudUrl) {
          logoPathToStore = cloudUrl;
          await unlink(file.path).catch(() => {
            /* best-effort remove temp Multer file */
          });
        }
      } catch (cloudErr) {
        // Misconfigured CREDs, outages, signing errors, etc. — avoid blocking venue saves while Cloudinary is fixed.
        logServerError("business.uploadMyLogo.cloudinary_fallback_disk", cloudErr);
        logoPathToStore = publicPath;
      }
    }

    await prisma.business.update({
      where: { id: b.id },
      data: { logoPath: logoPathToStore },
    });
    return res.json({ success: true, path: logoPathToStore });
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
