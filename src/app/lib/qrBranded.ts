/**
 * Canonical CareTip branded QR (single visual system).
 *
 * All scannable QRs — employee, business storefront, table, location — use the same layout:
 * white field, orange frame + wordmark bands, high-contrast modules, optional small center logo,
 * error correction H for logo tolerance.
 *
 * Use {@link renderBrandedQrUrlToDataUrl} for any encoded URL; use {@link renderBrandedQRToDataUrl}
 * for canonical staff `/{businessSlug}/{employeeSlug}` (or {@link renderBrandedQRToDataUrlLegacy} for `/qr/employee/:id`).
 */

import QRCode from "qrcode";
import caretipLogoUrl from "@/assets/brand/company_logo.png";
import { publicEmployeeTipUrl, qrEmployeeLegacyUrl } from "./appPublicUrl";

export const CARETIP_QR_BRAND_HEX = "#e9932f";

const BRAND_TOP_TEXT = "CareTip";
const BRAND_FOOTER_TEXT = "Powered by CareTip";
const BRAND_ORANGE = CARETIP_QR_BRAND_HEX;
const QR_MODULE_DARK = "#000000";

/** Inner QR matrix width (px) — keep in sync across dashboard + PDF source images. */
export const CARETIP_BRANDED_QR_MATRIX_PX = 256;

const LAYOUT = {
  qrSize: CARETIP_BRANDED_QR_MATRIX_PX,
  padding: 24,
  brandBand: 40,
  /** Center mark width (px); keep modest for scan reliability with errorCorrectionLevel H. */
  centerLogoMaxW: 56,
  qrMargin: 2,
} as const;

/** Same URL encoded in the QR image (use for clipboard / display). */
export function getEmployeeQrShareUrl(businessSlug: string, employeeSlug: string): string {
  return publicEmployeeTipUrl(businessSlug, employeeSlug);
}

/** Legacy `/qr/employee/:id` share URL when slug pair is unavailable. */
export function getEmployeeQrLegacyShareUrl(employeeId: string): string {
  return qrEmployeeLegacyUrl(employeeId);
}

let logoImagePromise: Promise<HTMLImageElement | null> | null = null;

function loadCaretipLogoImage(): Promise<HTMLImageElement | null> {
  if (!logoImagePromise) {
    logoImagePromise = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = caretipLogoUrl;
    });
  }
  return logoImagePromise;
}

/**
 * Renders the branded QR canvas for any absolute or same-origin URL string.
 * Returns null if `document` / canvas is unavailable or URL is empty.
 */
export async function renderBrandedQrUrlToCanvas(url: string): Promise<HTMLCanvasElement | null> {
  const encoded = String(url ?? "").trim();
  if (!encoded || typeof document === "undefined") return null;

  const { qrSize, padding, brandBand, centerLogoMaxW, qrMargin } = LAYOUT;
  const totalWidth = qrSize + padding * 2;
  const totalHeight = qrSize + padding * 2 + brandBand * 2;

  const canvas = document.createElement("canvas");
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  ctx.strokeStyle = BRAND_ORANGE;
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, totalWidth - 4, totalHeight - 4);

  ctx.fillStyle = BRAND_ORANGE;
  ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(BRAND_TOP_TEXT, totalWidth / 2, 28);

  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, encoded, {
    width: qrSize,
    margin: qrMargin,
    color: { dark: QR_MODULE_DARK, light: "#ffffff" },
    errorCorrectionLevel: "H",
  });

  const qrDrawY = brandBand + padding;
  ctx.drawImage(qrCanvas, padding, qrDrawY, qrSize, qrSize);

  const logoImg = await loadCaretipLogoImage();
  if (logoImg && logoImg.naturalWidth > 0) {
    const markW = centerLogoMaxW;
    const ratio = logoImg.naturalHeight / logoImg.naturalWidth;
    const markH = ratio * markW;
    const cx = padding + qrSize / 2;
    const cy = qrDrawY + qrSize / 2;
    ctx.drawImage(logoImg, cx - markW / 2, cy - markH / 2, markW, markH);
  }

  ctx.fillStyle = BRAND_ORANGE;
  ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
  ctx.fillText(BRAND_FOOTER_TEXT, totalWidth / 2, totalHeight - 10);

  return canvas;
}

export async function renderBrandedQrUrlToDataUrl(url: string): Promise<string> {
  const canvas = await renderBrandedQrUrlToCanvas(url);
  if (!canvas) return "";
  return canvas.toDataURL("image/png");
}

/** Staff tipping QR for canonical `/{businessSlug}/{employeeSlug}`. */
export async function renderBrandedQRToDataUrl(businessSlug: string, employeeSlug: string): Promise<string> {
  return renderBrandedQrUrlToDataUrl(publicEmployeeTipUrl(businessSlug, employeeSlug));
}

/** Legacy staff QR (`/qr/employee/:id`) when slugs are missing. */
export async function renderBrandedQRToDataUrlLegacy(employeeId: string): Promise<string> {
  return renderBrandedQrUrlToDataUrl(qrEmployeeLegacyUrl(employeeId));
}

export async function downloadBrandedQR(
  businessSlug: string,
  employeeSlug: string,
  employeeName: string
): Promise<void> {
  const canvas = await renderBrandedQrUrlToCanvas(publicEmployeeTipUrl(businessSlug, employeeSlug));
  if (!canvas) return;
  const filename = `caretip-${employeeSlug}-${employeeName.replace(/\s+/g, "-").toLowerCase()}.png`;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }, "image/png");
}

/** Download branded staff QR using legacy `/qr/employee/:id` when venue or staff slug is missing. */
export async function downloadBrandedQRLegacy(employeeId: string, employeeName: string): Promise<void> {
  const canvas = await renderBrandedQrUrlToCanvas(qrEmployeeLegacyUrl(employeeId));
  if (!canvas) return;
  const filename = `caretip-${employeeId.slice(0, 8)}-${employeeName.replace(/\s+/g, "-").toLowerCase()}.png`;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }, "image/png");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain QR PNG from a data URL (legacy name — works for any PNG data URL from this module). */
export function downloadQrDataUrlPng(dataUrl: string, filename: string): void {
  if (!dataUrl) return;
  const base = filename.trim().replace(/[^\w.-]+/g, "_") || "caretip-qr";
  const name = base.toLowerCase().endsWith(".png") ? base : `${base}.png`;
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** Open a new window and trigger print. */
export function printQrDataUrl(dataUrl: string, heading: string): boolean {
  if (!dataUrl) return false;
  const w = window.open("", "_blank");
  if (!w) return false;
  const h = escapeHtml(heading);
  w.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>CareTip QR</title>
  <style>
    body { font-family: system-ui, sans-serif; text-align: center; padding: 24px; margin: 0; }
    h1 { font-size: 1rem; font-weight: 600; margin: 0 0 16px; color: #111; }
    img { max-width: min(360px, 100%); height: auto; }
    @media print { body { padding: 12px; } }
  </style>
</head>
<body>
  <h1>${h}</h1>
  <img src="${dataUrl}" alt="QR code" />
  <script>
    window.onload = function () {
      setTimeout(function () { window.print(); }, 200);
    };
  </script>
</body>
</html>`);
  w.document.close();
  return true;
}
