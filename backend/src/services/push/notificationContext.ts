import { onQrScanActivity } from "./notification.triggers.js";

/** Fire-and-forget QR scan notification for a verified business (public tipping flows). */
export function notifyQrScanForBusiness(params: {
  businessId: string;
  locationName?: string;
  tableName?: string;
  qrSlug?: string;
}): void {
  onQrScanActivity(params);
}
