/**
 * Export-only QR design customization — does not persist to venue branding settings.
 * Merges local overrides on top of saved branding at render/export time.
 */

import type { QrBrandingOptions } from "./businessBranding";
import {
  DEFAULT_QR_BACKGROUND_COLOR,
  DEFAULT_QR_BORDER_STYLE,
  DEFAULT_QR_SHAPE,
  DEFAULT_QR_TEMPLATE,
  normalizeQrBorderStyleId,
  normalizeQrShapeId,
  normalizeQrTemplateId,
  type QrBorderStyleId,
  type QrShapeId,
  type QrTemplateId,
} from "./qrTemplateStyles";

export const QR_EXPORT_DESIGN_VERSION = 1 as const;
export const QR_EXPORT_DESIGN_FILE_EXT = ".caretip-qr-design.json";

export type QrExportScale = 1 | 2 | 3 | 4;

/** Local export-studio overrides — never written to branding API fields. */
export type QrExportCustomization = {
  presetName?: string;
  qrTemplate?: QrTemplateId;
  qrBorderStyle?: QrBorderStyleId;
  qrShape?: QrShapeId;
  qrAccentColor?: string;
  qrBackgroundColor?: string;
  displayName?: string;
  tagline?: string | null;
  scale: QrExportScale;
};

export type QrExportDesignFile = {
  version: typeof QR_EXPORT_DESIGN_VERSION;
  presetName: string;
  customization: QrExportCustomization;
  exportedAt: string;
};

export const DEFAULT_QR_EXPORT_CUSTOMIZATION: QrExportCustomization = {
  scale: 2,
};

export function mergeQrBrandingForExport(
  base: QrBrandingOptions,
  custom: QrExportCustomization,
): QrBrandingOptions {
  return {
    ...base,
    businessName: custom.displayName?.trim() || base.businessName,
    brandTagline:
      custom.tagline !== undefined ? (custom.tagline?.trim() || null) : base.brandTagline,
    qrTemplate: custom.qrTemplate ?? base.qrTemplate,
    qrBorderStyle: custom.qrBorderStyle ?? base.qrBorderStyle,
    qrShape: custom.qrShape ?? base.qrShape,
    qrAccentColor: custom.qrAccentColor?.trim() || base.qrAccentColor,
    qrBackgroundColor: custom.qrBackgroundColor?.trim() || base.qrBackgroundColor,
  };
}

export function customizationFromBaseBranding(base: QrBrandingOptions): QrExportCustomization {
  return {
    qrTemplate: base.qrTemplate ?? DEFAULT_QR_TEMPLATE,
    qrBorderStyle: base.qrBorderStyle ?? DEFAULT_QR_BORDER_STYLE,
    qrShape: base.qrShape ?? DEFAULT_QR_SHAPE,
    qrAccentColor: base.qrAccentColor ?? base.primaryColor,
    qrBackgroundColor: base.qrBackgroundColor ?? DEFAULT_QR_BACKGROUND_COLOR,
    displayName: base.businessName,
    tagline: base.brandTagline ?? null,
    scale: 2,
  };
}

export function parseQrExportDesignFile(raw: unknown): QrExportDesignFile {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid design file.");
  }
  const row = raw as Record<string, unknown>;
  if (row.version !== QR_EXPORT_DESIGN_VERSION) {
    throw new Error("Unsupported design file version.");
  }
  const customization = row.customization;
  if (!customization || typeof customization !== "object") {
    throw new Error("Design file is missing customization.");
  }
  const c = customization as Record<string, unknown>;
  const scale = Number(c.scale);
  const validScale: QrExportScale =
    scale === 1 || scale === 2 || scale === 3 || scale === 4 ? scale : 2;

  return {
    version: QR_EXPORT_DESIGN_VERSION,
    presetName: String(row.presetName ?? "Imported design").trim() || "Imported design",
    exportedAt: String(row.exportedAt ?? new Date().toISOString()),
    customization: {
      presetName: String(c.presetName ?? row.presetName ?? "").trim() || undefined,
      qrTemplate: c.qrTemplate ? normalizeQrTemplateId(String(c.qrTemplate)) : undefined,
      qrBorderStyle: c.qrBorderStyle
        ? normalizeQrBorderStyleId(String(c.qrBorderStyle))
        : undefined,
      qrShape: c.qrShape ? normalizeQrShapeId(String(c.qrShape)) : undefined,
      qrAccentColor: typeof c.qrAccentColor === "string" ? c.qrAccentColor.trim() : undefined,
      qrBackgroundColor:
        typeof c.qrBackgroundColor === "string" ? c.qrBackgroundColor.trim() : undefined,
      displayName: typeof c.displayName === "string" ? c.displayName : undefined,
      tagline:
        c.tagline === null || typeof c.tagline === "string"
          ? (c.tagline as string | null)
          : undefined,
      scale: validScale,
    },
  };
}

export async function readQrExportDesignFile(file: File): Promise<QrExportDesignFile> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Design file is not valid JSON.");
  }
  return parseQrExportDesignFile(parsed);
}
