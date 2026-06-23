import type { Request, Response } from "express";
import { logServerError, clientSafeMessage } from "../utils/httpErrors.js";
import {
  recordFeatureUtilizationBatch,
  recordFeatureUtilization,
} from "../services/commercial/businessFeatureUtilization.service.js";
import { getManagerCommercialInsights } from "../services/commercial/platformCommercialIntelligence.service.js";
import { isCommercialFeatureKey } from "../services/commercial/commercialFeatureKeys.js";
import { prisma } from "../prisma.js";

async function resolveManagerBusinessId(req: Request): Promise<string | null> {
  const userId = req.user?.id;
  if (!userId) return null;
  const business = await prisma.business.findFirst({
    where: { userId },
    select: { id: true },
  });
  return business?.id ?? null;
}

export async function postFeatureUtilization(req: Request, res: Response) {
  try {
    const businessId = await resolveManagerBusinessId(req);
    if (!businessId) return res.status(403).json({ message: "Business not found" });

    const body = req.body as { featureKey?: string; featureKeys?: string[] };
    if (body.featureKey && isCommercialFeatureKey(body.featureKey)) {
      await recordFeatureUtilization(businessId, body.featureKey);
    } else if (Array.isArray(body.featureKeys)) {
      await recordFeatureUtilizationBatch(businessId, body.featureKeys);
    } else {
      return res.status(400).json({ message: "featureKey or featureKeys required" });
    }

    return res.json({ success: true });
  } catch (err) {
    logServerError("commercial.postFeatureUtilization", err);
    return res.status(500).json({
      message: clientSafeMessage(err, "Could not record feature usage."),
    });
  }
}

export async function getCommercialInsights(req: Request, res: Response) {
  try {
    const businessId = await resolveManagerBusinessId(req);
    if (!businessId) return res.status(403).json({ message: "Business not found" });

    const insights = await getManagerCommercialInsights(businessId);
    return res.json(insights);
  } catch (err) {
    logServerError("commercial.getCommercialInsights", err);
    return res.status(500).json({
      message: clientSafeMessage(err, "Could not load commercial insights."),
    });
  }
}
