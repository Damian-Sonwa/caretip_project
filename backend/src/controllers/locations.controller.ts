import type { Request, Response } from "express";
import * as locationsService from "../services/locations.service.js";
import { logServerError, clientSafeMessage, CLIENT_FALLBACK } from "../utils/httpErrors.js";

export async function listLocations(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const locations = await locationsService.listLocationsForBusinessUser(userId);
    return res.json(locations);
  } catch (err) {
    logServerError("locations.list", err);
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.business),
    });
  }
}

export async function createLocation(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const name = req.body?.name;
    if (typeof name !== "string") {
      return res.status(400).json({ message: "name is required" });
    }
    const description =
      typeof req.body?.description === "string" ? req.body.description : undefined;
    const location = await locationsService.createLocationForBusinessUser(userId, name, description);
    return res.status(201).json(location);
  } catch (err) {
    logServerError("locations.create", err);
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.business),
    });
  }
}
