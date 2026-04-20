/**
 * Branded QR with CareTip wordmark framing.
 * Encodes [VITE_APP_URL | NEXT_PUBLIC_APP_URL]/qr/employee/[employeeId]
 */

import QRCode from "qrcode";
import caretipLogoUrl from "@/assets/brand/company_logo.png";
import { qrEmployeeUrl } from "./appPublicUrl";

const BRAND_TEXT = "CareTip Limited";

const BRAND_ORANGE = "#e9932f";
const QR_MODULE_DARK = "#000000";

/** Same URL encoded in the QR image (use for clipboard / display). */
export function getEmployeeQrShareUrl(employeeId: string): string {
  return qrEmployeeUrl(employeeId);
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

async function renderBrandedQRToCanvas(employeeId: string): Promise<HTMLCanvasElement | null> {
  const url = qrEmployeeUrl(employeeId);
  const qrSize = 256;
  const padding = 24;
  const brandHeight = 40;
  const totalWidth = qrSize + padding * 2;
  const totalHeight = qrSize + padding * 2 + brandHeight * 2;

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
  ctx.fillText(BRAND_TEXT, totalWidth / 2, 28);

  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, url, {
    width: qrSize,
    margin: 2,
    color: { dark: QR_MODULE_DARK, light: "#ffffff" },
    errorCorrectionLevel: "H",
  });

  const qrDrawY = brandHeight + padding;
  ctx.drawImage(qrCanvas, padding, qrDrawY, qrSize, qrSize);

  const logoImg = await loadCaretipLogoImage();
  if (logoImg && logoImg.naturalWidth > 0) {
    const markW = 72;
    const ratio = logoImg.naturalHeight / logoImg.naturalWidth;
    const markH = ratio * markW;
    const cx = padding + qrSize / 2;
    const cy = qrDrawY + qrSize / 2;
    ctx.drawImage(logoImg, cx - markW / 2, cy - markH / 2, markW, markH);
  }

  ctx.fillStyle = BRAND_ORANGE;
  ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
  ctx.fillText(BRAND_TEXT, totalWidth / 2, totalHeight - 12);

  return canvas;
}

export async function renderBrandedQRToDataUrl(employeeId: string): Promise<string> {
  const canvas = await renderBrandedQRToCanvas(employeeId);
  if (!canvas) return "";
  return canvas.toDataURL("image/png");
}

export async function downloadBrandedQR(employeeId: string, employeeName: string): Promise<void> {
  const canvas = await renderBrandedQRToCanvas(employeeId);
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

/** Plain QR PNG from a data URL (table / location / storefront in dashboard). */
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

/** Open a new window and trigger print (table / location / storefront QR). Returns false if pop-up blocked. */
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
