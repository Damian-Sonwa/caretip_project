import type { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { CLIENT_FALLBACK, clientSafeMessage, logServerError } from "../utils/httpErrors.js";
import { isPrismaPoolTimeout } from "../utils/prismaErrors.js";

const DEFAULT_SETTINGS = {
  tipReceivedNotifications: true,
  summaryEmails: false,
  systemAlerts: true,
  notifyNewLogin: true,
} as const;

function getUserId(req: Request): string | null {
  const uid = req.user?.userId ?? req.user?.id;
  return typeof uid === "string" && uid.trim() ? uid.trim() : null;
}

export async function getMySettings(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        preferredLocale: true,
        settings: true,
      },
    });
    const row = user?.settings;
    return res.json({
      ...(row ?? DEFAULT_SETTINGS),
      preferredLocale: user?.preferredLocale ?? null,
    });
  } catch (err) {
    logServerError("settings.getMySettings", err);
    if (isPrismaPoolTimeout(err)) {
      return res.status(503).json({
        message: "The server is busy. Please try again in a moment.",
      });
    }
    return res.status(500).json({ message: clientSafeMessage(err, CLIENT_FALLBACK.generic) });
  }
}

export async function patchMySettings(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const body = req.body as Record<string, unknown>;
    const data = {
      ...(body.tipReceivedNotifications !== undefined
        ? { tipReceivedNotifications: Boolean(body.tipReceivedNotifications) }
        : {}),
      ...(body.summaryEmails !== undefined ? { summaryEmails: Boolean(body.summaryEmails) } : {}),
      ...(body.systemAlerts !== undefined ? { systemAlerts: Boolean(body.systemAlerts) } : {}),
      ...(body.notifyNewLogin !== undefined ? { notifyNewLogin: Boolean(body.notifyNewLogin) } : {}),
    };

    const updated = await prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    const allPushPrefsOff =
      updated.tipReceivedNotifications === false &&
      updated.systemAlerts === false &&
      updated.notifyNewLogin === false;
    if (allPushPrefsOff) {
      const { removeAllPushDeviceTokensForUser } = await import(
        "../services/push/pushNotification.service.js"
      );
      await removeAllPushDeviceTokensForUser(userId);
    }

    if (body.preferredLocale !== undefined) {
      const pl = body.preferredLocale;
      if (pl === null) {
        await prisma.user.update({ where: { id: userId }, data: { preferredLocale: null } });
      } else if (typeof pl === "string") {
        const t = pl.trim().toLowerCase();
        if (t === "en" || t === "de") {
          await prisma.user.update({ where: { id: userId }, data: { preferredLocale: t } });
        }
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLocale: true },
    });

    return res.json({ ...updated, preferredLocale: user?.preferredLocale ?? null });
  } catch (err) {
    logServerError("settings.patchMySettings", err);
    return res.status(400).json({ message: clientSafeMessage(err, CLIENT_FALLBACK.generic) });
  }
}
