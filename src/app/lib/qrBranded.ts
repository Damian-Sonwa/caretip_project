/**
 * Canonical CareTip branded QR (Premium Branding v2).
 *
 * Premium venues embed logo, template styles, display name, and tagline.
 * Basic uses CareTip defaults. Footer always retains "Powered by CareTip".
 */

import caretipLogoUrl from "@/assets/brand/company_logo.png";
import { publicEmployeeTipUrl, qrEmployeeLegacyUrl } from "./appPublicUrl";
import { resolveMediaUrl } from "./mediaUrl";
import {
  CARETIP_QR_BRAND_HEX,
  type QrBrandingOptions,
} from "./businessBranding";
import {
  maxSafeLogoWidth,
  QR_ERROR_CORRECTION_LEVEL,
  QR_QUIET_ZONE_MODULES,
  scanSafeShapeCornerRadius,
  assessBrandingReliability,
  decodeQrFromCanvas,
  extractCanvasRegion,
  isQrExportAllowed,
  type QrReliabilityReport,
} from "./qrReliability";
import {
  applyDesignSystemOverrides,
  normalizeLayoutVariant,
  QR_LAYOUT_VARIANT_SCALES,
  resolveDesignSystem,
  type QrDesignSystem,
} from "./qrDesignSystem";
import {
  drawDesignBackground,
  drawDesignDecorations,
  drawHeaderVenueLogo,
} from "./qrBrandedDecorations";

import {
  resolveQrVisualStyle,
  type QrBorderStyleId,
  type QrTemplateId,
} from "./qrTemplateStyles";

import type { QrExportScale } from "./qrDesignExport";

export type { QrReliabilityReport } from "./qrReliability";
export {
  QR_QUIET_ZONE_MODULES,
  QR_ERROR_CORRECTION_LEVEL,
  QR_LOGO_MAX_AREA_RATIO,
  isQrExportAllowed,
} from "./qrReliability";

const BRAND_TOP_TEXT = "CareTip";
const BRAND_FOOTER_TEXT = "Powered by CareTip";
const QR_MODULE_DARK = "#000000";

let qrcodeModulePromise: Promise<typeof import("qrcode")> | null = null;

function loadQrCodeModule() {
  qrcodeModulePromise ??= import("qrcode");
  return qrcodeModulePromise;
}

/** Inner QR matrix width (px) — keep in sync across dashboard + PDF source images. */
export const CARETIP_BRANDED_QR_MATRIX_PX = 256;

export type BrandedQrLayoutMetrics = {
  qrSize: number;
  padding: number;
  qrDrawY: number;
  qrMargin: number;
  centerLogoMaxW: number;
  totalWidth: number;
  totalHeight: number;
  qrSafeBottom: number;
};

function resolveDesignForBrand(brand: QrBrandingOptions): QrDesignSystem {
  const templateId = (brand.qrTemplate ?? "classic") as QrTemplateId;
  const base = resolveDesignSystem(templateId);
  return applyDesignSystemOverrides(base, {
    layoutVariant: normalizeLayoutVariant(brand.layoutVariant ?? base.layout),
    qrBorderStyle: brand.qrBorderStyle,
    qrShape: brand.qrShape,
  });
}

export function computeBrandedQrLayoutMetrics(brand: QrBrandingOptions): BrandedQrLayoutMetrics {
  const design = resolveDesignForBrand(brand);
  const scales = QR_LAYOUT_VARIANT_SCALES[normalizeLayoutVariant(brand.layoutVariant ?? design.layout)];
  const padding = Math.round(24 * scales.cardScale);
  const qrSize = Math.round(CARETIP_BRANDED_QR_MATRIX_PX * scales.qrScale);
  const typoScale = scales.typoScale;

  const showHeaderLogo =
    brand.premium && brand.showVenueLogoHeader !== false && Boolean(brand.centerLogoUrl);
  const welcome = brand.premium && brand.welcomeMessage?.trim() ? brand.welcomeMessage.trim() : null;
  const tagline = brand.brandTagline ? truncateLabel(brand.brandTagline, 48) : null;
  const cta =
    brand.premium && (brand.ctaText?.trim() || "Scan to tip")
      ? truncateLabel(brand.ctaText?.trim() || "Scan to tip", 40)
      : null;
  const thankYou =
    brand.premium && brand.thankYouMessage?.trim()
      ? truncateLabel(brand.thankYouMessage.trim(), 60)
      : null;

  const logoHeaderBand = showHeaderLogo ? Math.round(44 * typoScale) : 0;
  const welcomeBand = welcome ? Math.round(14 * typoScale) : 0;
  const titleBand = Math.round((brand.premium ? 28 : 36) * typoScale);
  const taglineBand = tagline ? Math.round(14 * typoScale) : 0;
  const hotelStarsBand =
    brand.premium && design.templateId === "hotel" && brand.decorationsEnabled !== false
      ? Math.round(12 * typoScale)
      : 0;
  const gapBeforeQr = Math.round(10 * scales.cardScale);
  const ctaBand = cta ? Math.round(20 * typoScale) : 0;
  const thankYouBand = thankYou ? Math.round(12 * typoScale) : 0;
  const footerBand = Math.round(18 * typoScale);

  const topContent = logoHeaderBand + welcomeBand + titleBand + taglineBand + hotelStarsBand;
  const qrDrawY = padding + topContent + gapBeforeQr;
  const qrSafeBottom = qrDrawY + qrSize;
  const bottomContent = ctaBand + thankYouBand + footerBand + padding;
  const hasCustomLogo = brand.premium && Boolean(brand.centerLogoUrl);

  return {
    qrSize,
    padding,
    qrDrawY,
    qrMargin: QR_QUIET_ZONE_MODULES,
    centerLogoMaxW: maxSafeLogoWidth(qrSize, hasCustomLogo),
    totalWidth: qrSize + padding * 2,
    totalHeight: qrDrawY + qrSize + bottomContent,
    qrSafeBottom,
  };
}

const DEFAULT_QR_BRANDING: QrBrandingOptions = {
  premium: false,
  primaryColor: CARETIP_QR_BRAND_HEX,
  secondaryColor: "#000000",
  centerLogoUrl: null,
  businessName: BRAND_TOP_TEXT,
};

const centerLogoCache = new Map<string, Promise<HTMLImageElement | null>>();

function loadCenterLogoImage(url: string): Promise<HTMLImageElement | null> {
  const key = url.trim();
  if (!key) return Promise.resolve(null);
  let pending = centerLogoCache.get(key);
  if (!pending) {
    pending = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = key;
    });
    centerLogoCache.set(key, pending);
  }
  return pending;
}

let caretipLogoPromise: Promise<HTMLImageElement | null> | null = null;

function loadCaretipLogoImage(): Promise<HTMLImageElement | null> {
  if (!caretipLogoPromise) {
    caretipLogoPromise = loadCenterLogoImage(caretipLogoUrl);
  }
  return caretipLogoPromise;
}

function resolveQrBranding(opts?: Partial<QrBrandingOptions>): QrBrandingOptions {
  const premium = opts?.premium === true;
  const primaryColor = premium && opts?.primaryColor ? opts.primaryColor : CARETIP_QR_BRAND_HEX;
  const secondaryColor =
    premium && opts?.secondaryColor ? opts.secondaryColor : DEFAULT_QR_BRANDING.secondaryColor;
  const businessName = premium && opts?.businessName?.trim() ? opts.businessName.trim() : BRAND_TOP_TEXT;
  const rawLogo = premium && opts?.centerLogoUrl ? opts.centerLogoUrl : null;
  const centerLogoUrl = rawLogo ? resolveMediaUrl(rawLogo) ?? rawLogo : null;
  return {
    premium,
    primaryColor,
    secondaryColor,
    centerLogoUrl,
    businessName,
    brandTagline: premium ? opts?.brandTagline?.trim() || null : null,
    welcomeMessage: premium ? opts?.welcomeMessage?.trim() || null : null,
    thankYouMessage: premium ? opts?.thankYouMessage?.trim() || null : null,
    ctaText: premium ? opts?.ctaText?.trim() || "Scan to tip" : null,
    qrTemplate: opts?.qrTemplate,
    qrBorderStyle: opts?.qrBorderStyle,
    qrShape: opts?.qrShape,
    qrAccentColor: opts?.qrAccentColor,
    qrBackgroundColor: opts?.qrBackgroundColor,
    layoutVariant: opts?.layoutVariant,
    decorationsEnabled: opts?.decorationsEnabled,
    showVenueLogoHeader: opts?.showVenueLogoHeader,
  };
}

function truncateLabel(text: string, maxLen: number): string {
  const s = text.trim();
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen - 1)}…`;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return `rgba(235, 153, 44, ${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  style: QrBorderStyleId,
  color: string,
): void {
  if (style === "none") return;

  ctx.strokeStyle = color;
  if (style === "minimal") {
    ctx.lineWidth = 1;
    roundRectPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, radius);
    ctx.stroke();
    return;
  }
  if (style === "double") {
    ctx.lineWidth = 2;
    roundRectPath(ctx, x + 2, y + 2, w - 4, h - 4, radius);
    ctx.stroke();
    ctx.lineWidth = 1;
    roundRectPath(ctx, x + 8, y + 8, w - 16, h - 16, Math.max(0, radius - 4));
    ctx.stroke();
    return;
  }
  if (style === "ornate") {
    ctx.lineWidth = 3;
    roundRectPath(ctx, x + 2, y + 2, w - 4, h - 4, radius);
    ctx.stroke();
    const corner = 14;
    ctx.lineWidth = 2;
    const corners: [number, number, number, number][] = [
      [x + 6, y + 6, x + 6 + corner, y + 6],
      [x + 6, y + 6, x + 6, y + 6 + corner],
      [x + w - 6 - corner, y + 6, x + w - 6, y + 6],
      [x + w - 6, y + 6, x + w - 6, y + 6 + corner],
      [x + 6, y + h - 6, x + 6 + corner, y + h - 6],
      [x + 6, y + h - 6 - corner, x + 6, y + h - 6],
      [x + w - 6 - corner, y + h - 6, x + w - 6, y + h - 6],
      [x + w - 6, y + h - 6 - corner, x + w - 6, y + h - 6],
    ];
    for (const [x1, y1, x2, y2] of corners) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    return;
  }
  // rounded (default)
  ctx.lineWidth = 2;
  roundRectPath(ctx, x + 2, y + 2, w - 4, h - 4, radius);
  ctx.stroke();
}

function clipQrShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  shape: ReturnType<typeof resolveQrVisualStyle>["shape"],
): void {
  const r = scanSafeShapeCornerRadius(shape, size);
  if (r <= 0) return;
  roundRectPath(ctx, x, y, size, size, r);
  ctx.clip();
}

export function getEmployeeQrShareUrl(businessSlug: string, employeeSlug: string): string {
  return publicEmployeeTipUrl(businessSlug, employeeSlug);
}

export function getEmployeeQrLegacyShareUrl(employeeId: string): string {
  return qrEmployeeLegacyUrl(employeeId);
}

export type QrRenderOptions = {
  /** Output scale multiplier for high-res export (1–4). */
  scale?: QrExportScale;
};

function scaleCanvas(source: HTMLCanvasElement, scale: number): HTMLCanvasElement {
  if (scale <= 1) return source;
  const scaled = document.createElement("canvas");
  scaled.width = Math.round(source.width * scale);
  scaled.height = Math.round(source.height * scale);
  const ctx = scaled.getContext("2d");
  if (!ctx) return source;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, scaled.width, scaled.height);
  return scaled;
}

export async function renderBrandedQrUrlToCanvas(
  url: string,
  branding?: Partial<QrBrandingOptions>,
  renderOptions?: QrRenderOptions,
): Promise<HTMLCanvasElement | null> {
  const encoded = String(url ?? "").trim();
  if (!encoded || typeof document === "undefined") return null;

  const brand = resolveQrBranding(branding);
  const design = resolveDesignForBrand(brand);
  const scales = QR_LAYOUT_VARIANT_SCALES[normalizeLayoutVariant(brand.layoutVariant ?? design.layout)];
  const typo = design.typography;
  const typoScale = scales.typoScale;

  const visual = resolveQrVisualStyle({
    premium: brand.premium,
    primaryColor: brand.primaryColor,
    secondaryColor: brand.secondaryColor,
    qrTemplate: brand.qrTemplate,
    qrBorderStyle: brand.qrBorderStyle ?? design.frame,
    qrShape: brand.qrShape ?? design.qrStyle.shape,
    qrAccentColor: brand.qrAccentColor,
    qrBackgroundColor: brand.qrBackgroundColor,
  });

  const frameColor = visual.accentColor;
  const moduleDark = brand.premium ? visual.moduleDark : QR_MODULE_DARK;
  const topLabel = truncateLabel(brand.businessName, 32);
  const tagline = brand.brandTagline ? truncateLabel(brand.brandTagline, 48) : null;
  const welcome = brand.premium && brand.welcomeMessage?.trim() ? truncateLabel(brand.welcomeMessage.trim(), 80) : null;
  const ctaText = brand.premium ? truncateLabel(brand.ctaText?.trim() || "Scan to tip", 40) : null;
  const thankYou =
    brand.premium && brand.thankYouMessage?.trim()
      ? truncateLabel(brand.thankYouMessage.trim(), 60)
      : null;

  const layout = computeBrandedQrLayoutMetrics(brand);
  const { qrSize, padding, centerLogoMaxW, qrMargin, totalWidth, totalHeight, qrDrawY, qrSafeBottom } =
    layout;

  const canvas = document.createElement("canvas");
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  drawDesignBackground(ctx, totalWidth, totalHeight, visual.backgroundColor, frameColor, design);

  if (visual.topBand && visual.topBandOpacity > 0) {
    const bandH = padding + (brand.premium ? 80 * typoScale : 36);
    ctx.fillStyle = hexToRgba(frameColor, visual.topBandOpacity);
    ctx.fillRect(0, 0, totalWidth, bandH);
  }

  const borderStyle = (brand.qrBorderStyle ?? design.frame) as QrBorderStyleId;
  drawBorder(ctx, 0, 0, totalWidth, totalHeight, visual.cardRadius, borderStyle, frameColor);

  const decorationsOn = brand.premium && brand.decorationsEnabled !== false;
  drawDesignDecorations(
    ctx,
    totalWidth,
    totalHeight,
    frameColor,
    visual.lightText,
    design,
    decorationsOn,
    qrDrawY,
    qrSafeBottom,
  );

  const titleColor = visual.lightText ? "#F5F5F5" : frameColor;
  const mutedColor = visual.lightText ? "rgba(245,245,245,0.75)" : hexToRgba(frameColor, 0.75);
  const titleSize = Math.round(typo.titleSize * typoScale);
  const taglineSize = Math.round(typo.taglineSize * typoScale);
  const ctaSize = Math.round(typo.ctaSize * typoScale);
  const footerSize = Math.round(typo.footerSize * typoScale);

  let cursorY = padding;
  const centerX = totalWidth / 2;

  const showHeaderLogo =
    brand.premium && brand.showVenueLogoHeader !== false && Boolean(brand.centerLogoUrl);
  if (showHeaderLogo && brand.centerLogoUrl) {
    const headerLogo = await loadCenterLogoImage(brand.centerLogoUrl);
    if (headerLogo && headerLogo.naturalWidth > 0) {
      const logoH = Math.round(36 * typoScale);
      drawHeaderVenueLogo(ctx, headerLogo, centerX, cursorY, Math.round(72 * scales.cardScale), logoH);
      cursorY += logoH + Math.round(6 * typoScale);
    }
  }

  if (welcome) {
    ctx.fillStyle = mutedColor;
    ctx.font = `400 ${Math.max(9, taglineSize - 1)}px ${typo.taglineFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(welcome, centerX, cursorY);
    cursorY += Math.round(14 * typoScale);
  }

  ctx.fillStyle = titleColor;
  ctx.font = `${typo.titleWeight} ${titleSize}px ${typo.titleFont}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(topLabel, centerX, cursorY);
  cursorY += titleSize + Math.round(4 * typoScale);

  if (tagline) {
    ctx.fillStyle = mutedColor;
    ctx.font = `400 ${taglineSize}px ${typo.taglineFont}`;
    ctx.fillText(tagline, centerX, cursorY);
    cursorY += taglineSize + Math.round(2 * typoScale);
  }

  if (design.templateId === "hotel" && decorationsOn) {
    ctx.fillStyle = frameColor;
    ctx.font = `400 ${Math.max(9, taglineSize)}px ${typo.taglineFont}`;
    ctx.fillText("★ ★ ★ ★ ★", centerX, cursorY);
    cursorY += Math.round(12 * typoScale);
  }

  const qrCanvas = document.createElement("canvas");
  const { toCanvas } = await loadQrCodeModule();
  await toCanvas(qrCanvas, encoded, {
    width: qrSize,
    margin: qrMargin,
    color: { dark: moduleDark, light: visual.moduleLight },
    errorCorrectionLevel: QR_ERROR_CORRECTION_LEVEL,
  });

  ctx.save();
  clipQrShape(ctx, padding, qrDrawY, qrSize, visual.shape);
  ctx.drawImage(qrCanvas, padding, qrDrawY, qrSize, qrSize);
  ctx.restore();

  const logoPlacement = design.qrStyle.logoPlacement;
  const centerInQr = logoPlacement === "center" || logoPlacement === "both";
  const centerSrc = brand.centerLogoUrl ?? caretipLogoUrl;
  const logoImg = brand.centerLogoUrl
    ? await loadCenterLogoImage(centerSrc)
    : await loadCaretipLogoImage();
  if (centerInQr && logoImg && logoImg.naturalWidth > 0) {
    const markW = centerLogoMaxW;
    const ratio = logoImg.naturalHeight / logoImg.naturalWidth;
    const markH = ratio * markW;
    const cx = padding + qrSize / 2;
    const cy = qrDrawY + qrSize / 2;
    if (brand.centerLogoUrl) {
      ctx.fillStyle = visual.moduleLight;
      ctx.beginPath();
      ctx.arc(cx, cy, markW * 0.58, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.save();
    clipQrShape(ctx, padding, qrDrawY, qrSize, visual.shape);
    ctx.drawImage(logoImg, cx - markW / 2, cy - markH / 2, markW, markH);
    ctx.restore();
  } else if (!brand.centerLogoUrl && logoImg && logoImg.naturalWidth > 0) {
    const markW = centerLogoMaxW;
    const ratio = logoImg.naturalHeight / logoImg.naturalWidth;
    const markH = ratio * markW;
    const cx = padding + qrSize / 2;
    const cy = qrDrawY + qrSize / 2;
    ctx.save();
    clipQrShape(ctx, padding, qrDrawY, qrSize, visual.shape);
    ctx.drawImage(logoImg, cx - markW / 2, cy - markH / 2, markW, markH);
    ctx.restore();
  }

  let bottomY = qrSafeBottom + Math.round(8 * scales.cardScale);

  if (ctaText && brand.premium) {
    ctx.fillStyle = titleColor;
    ctx.font = `${typo.ctaWeight} ${ctaSize}px ${typo.titleFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(ctaText, centerX, bottomY);
    bottomY += ctaSize + Math.round(4 * typoScale);
  }

  if (thankYou) {
    ctx.fillStyle = mutedColor;
    ctx.font = `400 ${Math.max(9, footerSize)}px ${typo.taglineFont}`;
    ctx.fillText(thankYou, centerX, bottomY);
    bottomY += footerSize;
  }

  ctx.fillStyle = visual.lightText ? "rgba(245,245,245,0.9)" : hexToRgba(frameColor, 0.85);
  ctx.font = `600 ${footerSize}px system-ui, -apple-system, sans-serif`;
  ctx.textBaseline = "top";
  ctx.fillText(BRAND_FOOTER_TEXT, centerX, totalHeight - padding + Math.round(2 * typoScale));

  const scale = Math.min(4, Math.max(1, renderOptions?.scale ?? 1));
  return scaleCanvas(canvas, scale);
}

/** Generate → render → decode test for scan reliability. */
export async function validateBrandedQrReliability(
  url: string,
  branding?: Partial<QrBrandingOptions>,
): Promise<{ canvas: HTMLCanvasElement | null; report: QrReliabilityReport | null }> {
  const encoded = String(url ?? "").trim();
  if (!encoded || typeof document === "undefined") {
    return { canvas: null, report: null };
  }

  const brand = resolveQrBranding(branding);
  const layout = computeBrandedQrLayoutMetrics(brand);
  const canvas = await renderBrandedQrUrlToCanvas(url, branding, { scale: 1 });
  if (!canvas) return { canvas: null, report: null };

  const region = extractCanvasRegion(canvas, layout.padding, layout.qrDrawY, layout.qrSize);
  const decodedText = region ? await decodeQrFromCanvas(region) : null;

  const report = assessBrandingReliability(
    branding ?? {},
    decodedText,
    encoded,
    layout.centerLogoMaxW,
    layout.qrSize,
  );

  return { canvas, report };
}

export async function renderBrandedQrUrlToDataUrl(
  url: string,
  branding?: Partial<QrBrandingOptions>,
  renderOptions?: QrRenderOptions,
): Promise<string> {
  const canvas = await renderBrandedQrUrlToCanvas(url, branding, renderOptions);
  if (!canvas) return "";
  return canvas.toDataURL("image/png");
}

export async function renderBrandedQRToDataUrl(
  businessSlug: string,
  employeeSlug: string,
  branding?: Partial<QrBrandingOptions>,
): Promise<string> {
  return renderBrandedQrUrlToDataUrl(publicEmployeeTipUrl(businessSlug, employeeSlug), branding);
}

export async function renderBrandedQRToDataUrlLegacy(
  employeeId: string,
  branding?: Partial<QrBrandingOptions>,
): Promise<string> {
  return renderBrandedQrUrlToDataUrl(qrEmployeeLegacyUrl(employeeId), branding);
}

export async function downloadBrandedQR(
  businessSlug: string,
  employeeSlug: string,
  employeeName: string,
  branding?: Partial<QrBrandingOptions>,
): Promise<boolean> {
  const url = publicEmployeeTipUrl(businessSlug, employeeSlug);
  const { canvas, report } = await validateBrandedQrReliability(url, branding);
  if (!canvas || !isQrExportAllowed(report)) return false;
  const filename = `caretip-${employeeSlug}-${employeeName.replace(/\s+/g, "-").toLowerCase()}.png`;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }, "image/png");
  return true;
}

export async function downloadBrandedQRLegacy(
  employeeId: string,
  employeeName: string,
  branding?: Partial<QrBrandingOptions>,
): Promise<boolean> {
  const url = qrEmployeeLegacyUrl(employeeId);
  const { canvas, report } = await validateBrandedQrReliability(url, branding);
  if (!canvas || !isQrExportAllowed(report)) return false;
  const filename = `caretip-${employeeId.slice(0, 8)}-${employeeName.replace(/\s+/g, "-").toLowerCase()}.png`;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }, "image/png");
  return true;
}

export function downloadQrDataUrlPng(
  dataUrl: string,
  filename: string,
  opts?: { exportAllowed?: boolean },
): boolean {
  if (!dataUrl) return false;
  if (opts?.exportAllowed === false) return false;
  const base = filename.trim().replace(/[^\w.-]+/g, "_") || "caretip-qr";
  const name = base.toLowerCase().endsWith(".png") ? base : `${base}.png`;
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return true;
}

export function printQrDataUrl(
  dataUrl: string,
  heading: string,
  opts?: { exportAllowed?: boolean },
): boolean {
  if (!dataUrl) return false;
  if (opts?.exportAllowed === false) return false;
  if (!/^data:image\//i.test(dataUrl)) return false;

  const w = window.open("", "_blank");
  if (!w) return false;

  const doc = w.document;
  doc.documentElement.lang = "en";

  const meta = doc.createElement("meta");
  meta.setAttribute("charset", "utf-8");
  doc.head.appendChild(meta);

  doc.title = "CareTip QR";

  const style = doc.createElement("style");
  style.textContent = `
    body { font-family: system-ui, sans-serif; text-align: center; padding: 24px; margin: 0; }
    h1 { font-size: 1rem; font-weight: 600; margin: 0 0 16px; color: #111; }
    img { max-width: min(360px, 100%); height: auto; }
    @media print { body { padding: 12px; } }
  `;
  doc.head.appendChild(style);

  const h1 = doc.createElement("h1");
  h1.textContent = heading;
  doc.body.appendChild(h1);

  const img = doc.createElement("img");
  img.src = dataUrl;
  img.alt = "QR code";
  doc.body.appendChild(img);

  w.addEventListener("load", () => {
    window.setTimeout(() => w.print(), 200);
  });

  return true;
}
