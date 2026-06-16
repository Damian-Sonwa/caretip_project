import type { Request, Response } from "express";
import { Role } from "@prisma/client";
import {
  loadKycDiskStreamPayload,
  resolveSecureKycMediaAccess,
} from "../services/secureMedia.service.js";
import { clientSafeMessage, logServerError } from "../utils/httpErrors.js";

export async function getSecureMediaAccess(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const ref = typeof req.query.ref === "string" ? req.query.ref.trim() : "";
    if (!ref) {
      return res.status(400).json({ message: "ref is required" });
    }

    const access = await resolveSecureKycMediaAccess(ref, userId, req.user?.role as Role | undefined);
    return res.json({
      url: access.url,
      mode: access.mode,
      ...(access.mode === "signed" ? { expiresIn: access.expiresIn } : {}),
    });
  } catch (err) {
    logServerError("media.getSecureMediaAccess", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (/permission|invalid document/i.test(msg)) {
      return res.status(403).json({ message: clientSafeMessage(err, "Access denied.") });
    }
    return res.status(400).json({
      message: clientSafeMessage(err, "We couldn't access this document."),
    });
  }
}

export async function streamSecureKycDocument(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const ref = typeof req.query.ref === "string" ? req.query.ref.trim() : "";
    if (!ref) {
      return res.status(400).json({ message: "ref is required" });
    }

    const access = await resolveSecureKycMediaAccess(ref, userId, req.user?.role as Role | undefined);
    if (access.mode === "signed") {
      return res.redirect(access.url);
    }

    const { buffer, contentType } = loadKycDiskStreamPayload(ref);
    res.setHeader("Content-Type", contentType);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Cache-Control", "private, no-store");
    return res.send(buffer);
  } catch (err) {
    logServerError("media.streamSecureKycDocument", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (/permission|invalid document/i.test(msg)) {
      return res.status(403).json({ message: clientSafeMessage(err, "Access denied.") });
    }
    return res.status(404).json({
      message: clientSafeMessage(err, "Document not found."),
    });
  }
}
