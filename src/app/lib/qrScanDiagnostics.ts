/**
 * QR scan validation diagnostics — layout, decode, and payload measurements.
 * Used for auditing per-employee pass/fail variance under identical templates.
 */

import type { QrBrandingOptions } from "./businessBranding";
import type { BrandedQrLayoutMetrics } from "./qrBranded";
import {
  decodeQrFromCanvasRobust,
  extractCanvasRegion,
  QR_QUIET_ZONE_MODULES,
  type QrReliabilityReport,
} from "./qrReliability";
import { engineTemplateLayoutMetrics } from "./qrTemplateEngine";
import { normalizeQrTemplateId } from "./qrTemplateStyles";

export type QrScanDiagnostics = {
  templateId: string;
  employeeId: string | null;
  employeeSlug: string | null;
  expectedUrl: string;
  urlLength: number;
  /** Estimated QR version from payload length (ISO 18004 heuristic). */
  estimatedQrVersion: number;
  canvasWidth: number;
  canvasHeight: number;
  exportScale: number;
  layout: BrandedQrLayoutMetrics;
  extractRegion: { x: number; y: number; size: number };
  quietZoneModules: number;
  quietZonePx: number;
  logoMaxWidthPx: number;
  logoAreaRatio: number;
  decodeSuccess: boolean;
  decodedText: string | null;
  /** Isolated matrix decode (same URL/size, no card compositing) — separates pipeline vs payload issues. */
  isolatedMatrixDecode: string | null;
  scanValidationResult: QrReliabilityReport["grade"];
  warnings: QrReliabilityReport["warnings"];
  layoutShiftDetected: boolean;
  layoutShiftReason: string | null;
};

/** ISO 18004 version estimate from alphanumeric byte mode capacity (level H). */
export function estimateQrVersion(url: string): number {
  const len = url.trim().length;
  const capacities = [0, 17, 32, 53, 78, 106, 134, 154, 192, 230, 271, 321, 367, 425, 458, 520, 586, 644, 718, 792, 858, 929, 1003, 1091, 1171, 1273, 1367, 1465, 1528, 1628, 1732, 1840, 1952, 2068, 2188, 2303, 2431, 2563, 2699, 2809, 2953];
  for (let v = 1; v < capacities.length; v++) {
    if (len <= capacities[v]!) return v;
  }
  return 40;
}

/** Extract QR matrix region with sub-pixel accurate bounds and quiet-zone padding. */
export function extractQrMatrixRegion(
  source: HTMLCanvasElement,
  layout: Pick<BrandedQrLayoutMetrics, "qrDrawX" | "qrDrawY" | "qrSize" | "qrMargin">,
  scale = 1,
): HTMLCanvasElement | null {
  const padPx = Math.max(2, Math.round((layout.qrSize / 45) * layout.qrMargin * scale));
  const x = Math.max(0, Math.floor(layout.qrDrawX * scale) - padPx);
  const y = Math.max(0, Math.floor(layout.qrDrawY * scale) - padPx);
  const rawSize = Math.ceil(layout.qrSize * scale) + padPx * 2;
  const size = Math.min(rawSize, source.width - x, source.height - y);
  if (size <= 0) return null;
  return extractCanvasRegion(source, x, y, size);
}

async function decodeIsolatedMatrix(
  url: string,
  qrSizePx: number,
  moduleDark: string,
): Promise<string | null> {
  if (typeof document === "undefined") return null;
  const qrCanvas = document.createElement("canvas");
  const { toCanvas } = await import("qrcode");
  await toCanvas(qrCanvas, url, {
    width: qrSizePx,
    margin: QR_QUIET_ZONE_MODULES,
    color: { dark: moduleDark, light: "#FFFFFF" },
    errorCorrectionLevel: "H",
  });
  return decodeQrFromCanvasRobust(qrCanvas);
}

/** Decode raw QR matrix (no card compositing) — confirms payload is valid when composite extract fails. */
export async function decodeIsolatedQrMatrix(
  url: string,
  qrSizePx: number,
  moduleDark: string,
): Promise<string | null> {
  return decodeIsolatedMatrix(url, qrSizePx, moduleDark);
}

export async function collectQrScanDiagnostics(opts: {
  url: string;
  branding: Partial<QrBrandingOptions>;
  canvas: HTMLCanvasElement;
  decodeCanvas: HTMLCanvasElement;
  exportScale: number;
  report: QrReliabilityReport;
  layout: BrandedQrLayoutMetrics;
  employeeId?: string | null;
  employeeSlug?: string | null;
  referenceLayout?: BrandedQrLayoutMetrics | null;
}): Promise<QrScanDiagnostics> {
  const brand = opts.branding;
  const templateId = normalizeQrTemplateId(brand.qrTemplate);
  const layout = opts.layout;

  const extractRegion = {
    x: Math.floor(layout.qrDrawX),
    y: Math.floor(layout.qrDrawY),
    size: Math.ceil(layout.qrSize),
  };

  const region = extractQrMatrixRegion(opts.decodeCanvas, layout, 1);
  const isolatedMatrixDecode = await decodeIsolatedMatrix(
    opts.url,
    layout.qrSize,
    brand.premium ? (brand.secondaryColor ?? "#000000") : "#000000",
  );

  let layoutShiftDetected = false;
  let layoutShiftReason: string | null = null;
  if (opts.referenceLayout) {
    const ref = opts.referenceLayout;
    const deltas = {
      qrSize: layout.qrSize - ref.qrSize,
      qrDrawX: layout.qrDrawX - ref.qrDrawX,
      qrDrawY: layout.qrDrawY - ref.qrDrawY,
    };
    if (deltas.qrSize !== 0 || Math.abs(deltas.qrDrawX) > 0.5 || Math.abs(deltas.qrDrawY) > 0.5) {
      layoutShiftDetected = true;
      layoutShiftReason = `Δsize=${deltas.qrSize}px Δx=${deltas.qrDrawX.toFixed(2)}px Δy=${deltas.qrDrawY.toFixed(2)}px`;
    }
  }

  const quietZonePx = Math.round((layout.qrSize / 45) * layout.qrMargin);

  return {
    templateId,
    employeeId: opts.employeeId ?? null,
    employeeSlug: opts.employeeSlug ?? null,
    expectedUrl: opts.url,
    urlLength: opts.url.length,
    estimatedQrVersion: estimateQrVersion(opts.url),
    canvasWidth: opts.canvas.width,
    canvasHeight: opts.canvas.height,
    exportScale: opts.exportScale,
    layout,
    extractRegion,
    quietZoneModules: layout.qrMargin,
    quietZonePx,
    logoMaxWidthPx: layout.centerLogoMaxW,
    logoAreaRatio: layout.centerLogoMaxW / layout.qrSize,
    decodeSuccess: opts.report.decodeSuccess,
    decodedText: opts.report.decodedText,
    isolatedMatrixDecode,
    scanValidationResult: opts.report.grade,
    warnings: opts.report.warnings,
    layoutShiftDetected,
    layoutShiftReason,
  };
}

/** DEV-only structured log for comparing pass vs fail cards side by side. */
export function logQrScanDiagnostics(label: string, diag: QrScanDiagnostics): void {
  if (!import.meta.env.DEV) return;
  console.groupCollapsed(
    `[QR scan] ${label} — ${diag.scanValidationResult}${diag.decodeSuccess ? "" : " (FAILED)"}`,
  );
  console.table({
    templateId: diag.templateId,
    employeeId: diag.employeeId,
    employeeSlug: diag.employeeSlug,
    urlLength: diag.urlLength,
    qrVersion: diag.estimatedQrVersion,
    canvas: `${diag.canvasWidth}×${diag.canvasHeight}`,
    exportScale: diag.exportScale,
    qrSize: diag.layout.qrSize,
    qrPosition: `(${diag.layout.qrDrawX.toFixed(2)}, ${diag.layout.qrDrawY.toFixed(2)})`,
    quietZonePx: diag.quietZonePx,
    logoMaxPx: diag.logoMaxWidthPx,
    logoRatio: `${(diag.logoAreaRatio * 100).toFixed(1)}%`,
    layoutShift: diag.layoutShiftDetected ? diag.layoutShiftReason : "none",
    decode: diag.decodeSuccess ? "pass" : diag.warnings.join(", "),
    isolatedDecode: diag.isolatedMatrixDecode ? "pass" : "fail",
  });
  console.debug("expectedUrl", diag.expectedUrl);
  console.debug("decodedText", diag.decodedText);
  console.groupEnd();
}

/** Compare layout metrics across employees — should be identical for zone-based templates. */
export function layoutMetricsFingerprint(templateId: string, canvasHeight?: number): string | null {
  const m = engineTemplateLayoutMetrics(templateId, canvasHeight);
  if (!m) return null;
  return `${m.qrSize.toFixed(2)}@${m.qrDrawX.toFixed(2)},${m.qrDrawY.toFixed(2)}`;
}
