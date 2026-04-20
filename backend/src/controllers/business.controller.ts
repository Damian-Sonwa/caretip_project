import type { Request, Response } from "express";
import * as businessService from "../services/business.service.js";
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
