import type { Request, Response } from "express";
import * as tablesService from "../services/tables.service.js";
import * as tippingContextService from "../services/tippingContext.service.js";
import { logServerError, clientSafeMessage, CLIENT_FALLBACK } from "../utils/httpErrors.js";
import { QR_SCAN_TYPES, recordQrScanEvent } from "../services/qr/qrScanEvent.service.js";

const VERIFICATION_REQUIRED_MSG = "QR code generation will be enabled after admin verification.";

/** GET /api/tipping-context/location/:locationId — public (venue QR). */
export async function getLocationById(req: Request, res: Response) {
  try {
    const { locationId } = req.params;
    if (!locationId?.trim()) {
      return res.status(400).json({ message: "locationId is required" });
    }
    const ctx = await tippingContextService.getPublicLocationContext(locationId.trim());
    if (!ctx) {
      return res.status(404).json({ message: "Location not found" });
    }
    if ("locked" in ctx) {
      return res.status(403).json({ message: VERIFICATION_REQUIRED_MSG });
    }
    recordQrScanEvent({
      businessId: ctx.business.id,
      scanType: QR_SCAN_TYPES.LOCATION,
      locationId: ctx.location.id,
      req,
    });
    void import("../services/push/notificationContext.js").then(({ notifyQrScanForBusiness }) => {
      notifyQrScanForBusiness({
        businessId: ctx.business.id,
        locationName: ctx.location.name,
      });
    });
    return res.json(ctx);
  } catch (err) {
    logServerError("tippingContext.getLocationById", err);
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.business),
    });
  }
}

/** GET /api/tipping-context/table/:tableId — public (table QR by id). */
export async function getTableById(req: Request, res: Response) {
  try {
    const { tableId } = req.params;
    if (!tableId?.trim()) {
      return res.status(400).json({ message: "tableId is required" });
    }
    const ctx = await tippingContextService.getPublicTableContextById(tableId.trim());
    if (!ctx) {
      return res.status(404).json({ message: "Table not found" });
    }
    if ("locked" in ctx) {
      return res.status(403).json({ message: VERIFICATION_REQUIRED_MSG });
    }
    recordQrScanEvent({
      businessId: ctx.business.id,
      scanType: QR_SCAN_TYPES.TABLE_ID,
      locationId: ctx.location.id,
      tableId: ctx.table.id,
      qrSlug: ctx.table.qrSlug,
      req,
    });
    void import("../services/push/notificationContext.js").then(({ notifyQrScanForBusiness }) => {
      notifyQrScanForBusiness({
        businessId: ctx.business.id,
        locationName: ctx.location.name,
        tableName: ctx.table.name,
        qrSlug: ctx.table.qrSlug,
      });
    });
    return res.json(ctx);
  } catch (err) {
    logServerError("tippingContext.getTableById", err);
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.business),
    });
  }
}

export async function getByQrSlug(req: Request, res: Response) {
  try {
    const { qrSlug } = req.params;
    if (!qrSlug || typeof qrSlug !== "string") {
      return res.status(400).json({ message: "qrSlug is required" });
    }
    const ctx = await tablesService.getTippingContextByQrSlug(qrSlug);
    if (!ctx) {
      return res.status(404).json({ message: "Table not found for this code" });
    }
    if ("locked" in ctx) {
      return res.status(403).json({ message: VERIFICATION_REQUIRED_MSG });
    }
    recordQrScanEvent({
      businessId: ctx.businessId,
      scanType: QR_SCAN_TYPES.TABLE_SLUG,
      locationId: ctx.locationId,
      tableId: ctx.tableId,
      qrSlug,
      req,
    });
    void import("../services/push/notificationContext.js").then(({ notifyQrScanForBusiness }) => {
      notifyQrScanForBusiness({
        businessId: ctx.businessId,
        locationName: ctx.locationName,
        tableName: ctx.tableName,
        qrSlug,
      });
    });
    return res.json({
      locationName: ctx.locationName,
      tableName: ctx.tableName,
      businessId: ctx.businessId,
      locationId: ctx.locationId,
      tableId: ctx.tableId,
      businessName: ctx.businessName,
    });
  } catch (err) {
    logServerError("tippingContext.getByQrSlug", err);
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.business),
    });
  }
}
