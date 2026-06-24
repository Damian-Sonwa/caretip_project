/**
 * QR scan reliability — contrast, quiet zone, logo limits, decode verification.
 */

import type { QrBrandingOptions } from "./businessBranding";
import {
  normalizeQrShapeId,
  resolveQrVisualStyle,
  type QrShapeId,
} from "./qrTemplateStyles";

/** ISO 18004 recommends ≥4 modules quiet zone. */
export const QR_QUIET_ZONE_MODULES = 4;

/** Branded CareTip QRs always use level H (~30% recovery). */
export const QR_ERROR_CORRECTION_LEVEL = "H" as const;

/** Max center logo width as fraction of QR matrix edge. */
export const QR_LOGO_MAX_AREA_RATIO = 0.2;

/** WCAG-inspired module contrast thresholds. */
export const QR_MIN_CONTRAST_RATIO = 3;
export const QR_GOOD_CONTRAST_RATIO = 4.5;
export const QR_EXCELLENT_CONTRAST_RATIO = 7;

/**
 * Circle clips cut finder patterns — render as safe rounded-square instead.
 * ~18% corner radius keeps all finder/alignment modules intact on a 256px matrix.
 */
export const QR_SAFE_ROUNDED_RADIUS_RATIO = 0.18;

export type QrQualityGrade = "excellent" | "good" | "risky" | "unscannable";

export type QrReliabilityWarningCode =
  | "low_contrast"
  | "unsafe_colors"
  | "logo_too_large"
  | "circle_shape_sanitized"
  | "decode_failed"
  | "url_mismatch";

export type QrReliabilityReport = {
  grade: QrQualityGrade;
  decodeSuccess: boolean;
  decodedText: string | null;
  expectedUrl: string;
  contrastRatio: number;
  logoAreaRatio: number;
  quietZoneModules: number;
  errorCorrectionLevel: typeof QR_ERROR_CORRECTION_LEVEL;
  requestedShape: QrShapeId;
  effectiveShape: QrShapeId;
  shapeSanitized: boolean;
  warnings: QrReliabilityWarningCode[];
  exportAllowed: boolean;
};

function parseHexRgb(hex: string): [number, number, number] | null {
  const h = String(hex ?? "")
    .trim()
    .replace("#", "");
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return [r, g, b];
}

function relativeLuminance(hex: string): number {
  const rgb = parseHexRgb(hex);
  if (!rgb) return 0;
  const channels = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

/** Contrast ratio between QR dark and light modules. */
export function qrModuleContrastRatio(moduleDark: string, moduleLight: string): number {
  const l1 = relativeLuminance(moduleDark);
  const l2 = relativeLuminance(moduleLight);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function isQrModuleContrastSafe(moduleDark: string, moduleLight: string): boolean {
  return qrModuleContrastRatio(moduleDark, moduleLight) >= QR_MIN_CONTRAST_RATIO;
}

/** Circle → rounded-square so finder patterns are never clipped. */
export function resolveScanSafeQrShape(shape: QrShapeId): {
  effectiveShape: QrShapeId;
  shapeSanitized: boolean;
} {
  if (shape === "circle") {
    return { effectiveShape: "rounded", shapeSanitized: true };
  }
  return { effectiveShape: shape, shapeSanitized: false };
}

export function scanSafeShapeCornerRadius(shape: QrShapeId, qrSize: number): number {
  const { effectiveShape, shapeSanitized } = resolveScanSafeQrShape(shape);
  if (shapeSanitized) {
    return Math.round(qrSize * QR_SAFE_ROUNDED_RADIUS_RATIO);
  }
  if (effectiveShape === "rounded") {
    return Math.round(qrSize * 0.12);
  }
  return 0;
}

export function maxSafeLogoWidth(qrSize: number, hasCustomLogo: boolean): number {
  const cap = Math.floor(qrSize * QR_LOGO_MAX_AREA_RATIO);
  return hasCustomLogo ? cap : Math.min(cap, Math.floor(qrSize * 0.15));
}

function normalizeUrlForCompare(url: string): string {
  try {
    const u = new URL(url.trim());
    const path = u.pathname.replace(/\/+$/, "") || "/";
    return `${u.origin}${path}${u.search}`;
  } catch {
    return url.trim().replace(/\/+$/, "");
  }
}

async function decodeQrImageData(imageData: ImageData): Promise<string | null> {
  if (typeof document === "undefined") return null;
  try {
    const { default: jsQR } = await import("jsqr");
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });
    return result?.data?.trim() || null;
  } catch {
    return null;
  }
}

export function extractCanvasRegion(
  source: HTMLCanvasElement,
  x: number,
  y: number,
  size: number,
): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, x, y, size, size, 0, 0, size, size);
  return canvas;
}

export async function decodeQrFromCanvas(canvas: HTMLCanvasElement): Promise<string | null> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return decodeQrImageData(imageData);
}

export function buildReliabilityReport(opts: {
  expectedUrl: string;
  decodedText: string | null;
  moduleDark: string;
  moduleLight: string;
  logoAreaRatio: number;
  requestedShape: QrShapeId;
  shapeSanitized: boolean;
}): QrReliabilityReport {
  const warnings: QrReliabilityWarningCode[] = [];
  const contrastRatio = qrModuleContrastRatio(opts.moduleDark, opts.moduleLight);

  if (!isQrModuleContrastSafe(opts.moduleDark, opts.moduleLight)) {
    warnings.push("unsafe_colors");
    if (contrastRatio < QR_MIN_CONTRAST_RATIO) {
      warnings.push("low_contrast");
    }
  } else if (contrastRatio < QR_GOOD_CONTRAST_RATIO) {
    warnings.push("low_contrast");
  }

  if (opts.logoAreaRatio > QR_LOGO_MAX_AREA_RATIO + 0.001) {
    warnings.push("logo_too_large");
  }

  if (opts.shapeSanitized) {
    warnings.push("circle_shape_sanitized");
  }

  const decodeSuccess =
    Boolean(opts.decodedText) &&
    normalizeUrlForCompare(opts.decodedText!) === normalizeUrlForCompare(opts.expectedUrl);

  if (!opts.decodedText) {
    warnings.push("decode_failed");
  } else if (!decodeSuccess) {
    warnings.push("url_mismatch");
    warnings.push("decode_failed");
  }

  let grade: QrQualityGrade;
  if (!decodeSuccess) {
    grade = "unscannable";
  } else if (warnings.length === 0 && contrastRatio >= QR_EXCELLENT_CONTRAST_RATIO) {
    grade = "excellent";
  } else if (
    warnings.length === 0 ||
    (warnings.length === 1 && warnings[0] === "circle_shape_sanitized")
  ) {
    grade = contrastRatio >= QR_GOOD_CONTRAST_RATIO ? "good" : "risky";
  } else {
    grade = "risky";
  }

  if (warnings.includes("decode_failed")) {
    grade = "unscannable";
  }

  return {
    grade,
    decodeSuccess,
    decodedText: opts.decodedText,
    expectedUrl: opts.expectedUrl,
    contrastRatio,
    logoAreaRatio: opts.logoAreaRatio,
    quietZoneModules: QR_QUIET_ZONE_MODULES,
    errorCorrectionLevel: QR_ERROR_CORRECTION_LEVEL,
    requestedShape: opts.requestedShape,
    effectiveShape: opts.shapeSanitized ? "rounded" : opts.requestedShape,
    shapeSanitized: opts.shapeSanitized,
    warnings: [...new Set(warnings)],
    exportAllowed: decodeSuccess,
  };
}

export function assessBrandingReliability(
  branding: Partial<QrBrandingOptions>,
  decodedText: string | null,
  expectedUrl: string,
  logoWidthPx: number,
  qrSizePx: number,
): QrReliabilityReport {
  const premium = branding.premium === true;
  const visual = resolveQrVisualStyle({
    premium,
    primaryColor: branding.primaryColor ?? "#EB992C",
    secondaryColor: branding.secondaryColor ?? "#000000",
    qrTemplate: branding.qrTemplate,
    qrBorderStyle: branding.qrBorderStyle,
    qrShape: branding.qrShape,
    qrAccentColor: branding.qrAccentColor,
    qrBackgroundColor: branding.qrBackgroundColor,
  });

  const moduleDark = premium ? visual.moduleDark : "#000000";
  const requestedShape = normalizeQrShapeId(branding.qrShape);
  const { shapeSanitized } = resolveScanSafeQrShape(visual.shape);
  const logoAreaRatio = logoWidthPx / qrSizePx;
  const hasCustomLogo = premium && Boolean(branding.centerLogoUrl);

  return buildReliabilityReport({
    expectedUrl,
    decodedText,
    moduleDark,
    moduleLight: visual.moduleLight,
    logoAreaRatio: hasCustomLogo ? logoAreaRatio : logoAreaRatio * 0.5,
    requestedShape,
    shapeSanitized,
  });
}

export function isQrExportAllowed(report: QrReliabilityReport | null | undefined): boolean {
  return Boolean(report?.exportAllowed);
}
