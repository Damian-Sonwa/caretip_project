import type { Request, Response } from "express";
import {
  getPublicFirebaseWebConfig,
  registerPushDeviceToken,
  removeAllPushDeviceTokensForUser,
  removePushDeviceToken,
  sendTestPushToUser,
} from "../services/push/pushNotification.service.js";
import { isFcmConfigured } from "../services/push/fcmAdmin.js";
import { CLIENT_FALLBACK, clientSafeMessage, logServerError } from "../utils/httpErrors.js";

function getUserId(req: Request): string | null {
  const uid = req.user?.userId ?? req.user?.id;
  return typeof uid === "string" && uid.trim() ? uid.trim() : null;
}

/** Public Firebase web config (no secrets). */
export async function getPushConfig(_req: Request, res: Response) {
  const config = getPublicFirebaseWebConfig();
  if (!config) {
    return res.status(503).json({
      message: "Push notifications are not configured.",
      code: "FCM_NOT_CONFIGURED",
    });
  }
  return res.json(config);
}

export async function registerToken(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const body = req.body as Record<string, unknown>;
    const token = typeof body.token === "string" ? body.token : "";
    if (!token.trim()) {
      return res.status(400).json({ message: "token is required" });
    }
    const ua = typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined;
    await registerPushDeviceToken(userId, token, ua);
    return res.status(204).send();
  } catch (err) {
    logServerError("push.registerToken", err);
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.generic),
    });
  }
}

export async function deleteToken(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const body = req.body as Record<string, unknown>;
    const token = typeof body.token === "string" ? body.token : "";
    if (!token.trim()) {
      return res.status(400).json({ message: "token is required" });
    }
    await removePushDeviceToken(userId, token);
    return res.status(204).send();
  } catch (err) {
    logServerError("push.deleteToken", err);
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.generic),
    });
  }
}

export async function deleteAllTokens(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    await removeAllPushDeviceTokensForUser(userId);
    return res.status(204).send();
  } catch (err) {
    logServerError("push.deleteAllTokens", err);
    return res.status(500).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.generic),
    });
  }
}

function isPushTestApiEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" || process.env.ENABLE_PUSH_TEST === "true"
  );
}

/** Sends a test push to the authenticated user's registered device tokens (non-production only). */
export async function sendTestNotification(req: Request, res: Response) {
  try {
    if (!isPushTestApiEnabled()) {
      return res.status(404).json({ message: "Not found" });
    }
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!getPublicFirebaseWebConfig()) {
      return res.status(503).json({
        message: "Push notifications are not configured.",
        code: "FCM_NOT_CONFIGURED",
      });
    }
    if (!isFcmConfigured()) {
      return res.status(503).json({
        message: "FCM server credentials are not configured.",
        code: "FCM_ADMIN_NOT_CONFIGURED",
      });
    }
    const result = await sendTestPushToUser(userId);
    if (!result.sent) {
      const status = result.tokenCount === 0 ? 400 : 502;
      return res.status(status).json(result);
    }
    return res.json(result);
  } catch (err) {
    logServerError("push.sendTestNotification", err);
    return res.status(500).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.generic),
    });
  }
}
