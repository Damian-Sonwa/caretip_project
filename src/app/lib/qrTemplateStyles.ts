/** QR template IDs, border/shape presets, and visual-style helpers for the Template Engine. */

import {
  ART_DECO_NOIR_TEMPLATE_ID,
  CHAMPAGNE_SALON_CLASSIC_TEMPLATE_ID,
  CHAMPAGNE_SALON_TEMPLATE_ID,
  COPPER_HEARTH_TEMPLATE_ID,
  EMERALD_SANCTUARY_TEMPLATE_ID,
  GALLERY_PAVILION_TEMPLATE_ID,
  GRAND_ATELIER_NOIR_TEMPLATE_ID,
  GRAND_ATELIER_TEMPLATE_ID,
  INDUSTRY_TEMPLATE_ID,
  POC_LUXURY_SHELL_TEMPLATE_ID,
  ROSE_GOLD_SALON_TEMPLATE_ID,
  ROYAL_SUITE_PLATINUM_TEMPLATE_ID,
  ROYAL_SUITE_TEMPLATE_ID,
  SAPPHIRE_PAVILION_TEMPLATE_ID,
  SERENITY_SPA_TEMPLATE_ID,
  VELVET_LOUNGE_NOIR_TEMPLATE_ID,
  VELVET_LOUNGE_TEMPLATE_ID,
} from "./qrTemplateEngine/registry";

export const QR_ENGINE_TEMPLATE_IDS = [
  INDUSTRY_TEMPLATE_ID,
  VELVET_LOUNGE_TEMPLATE_ID,
  GRAND_ATELIER_TEMPLATE_ID,
  ROYAL_SUITE_TEMPLATE_ID,
  CHAMPAGNE_SALON_TEMPLATE_ID,
  SERENITY_SPA_TEMPLATE_ID,
  ART_DECO_NOIR_TEMPLATE_ID,
  GALLERY_PAVILION_TEMPLATE_ID,
  VELVET_LOUNGE_NOIR_TEMPLATE_ID,
  GRAND_ATELIER_NOIR_TEMPLATE_ID,
  ROYAL_SUITE_PLATINUM_TEMPLATE_ID,
  CHAMPAGNE_SALON_CLASSIC_TEMPLATE_ID,
  EMERALD_SANCTUARY_TEMPLATE_ID,
  SAPPHIRE_PAVILION_TEMPLATE_ID,
  COPPER_HEARTH_TEMPLATE_ID,
  ROSE_GOLD_SALON_TEMPLATE_ID,
  POC_LUXURY_SHELL_TEMPLATE_ID,
] as const;

/** Gallery-visible template IDs — mirrors `listGalleryTemplates()` in registry. */
export const QR_TEMPLATE_IDS = [
  VELVET_LOUNGE_NOIR_TEMPLATE_ID,
  GRAND_ATELIER_NOIR_TEMPLATE_ID,
  ROYAL_SUITE_PLATINUM_TEMPLATE_ID,
  CHAMPAGNE_SALON_CLASSIC_TEMPLATE_ID,
  EMERALD_SANCTUARY_TEMPLATE_ID,
  SAPPHIRE_PAVILION_TEMPLATE_ID,
  COPPER_HEARTH_TEMPLATE_ID,
  ROSE_GOLD_SALON_TEMPLATE_ID,
] as const;

/** @deprecated Legacy color-variation layouts removed — normalized to `industry`. */
export const LEGACY_QR_TEMPLATE_IDS = [
  "classic",
  "luxury",
  "modern",
  "nature",
  "corporate",
  "nightlife",
  "restaurant",
  "hotel",
] as const;

export type LegacyQrTemplateId = (typeof LEGACY_QR_TEMPLATE_IDS)[number];
export type QrEngineTemplateId = (typeof QR_ENGINE_TEMPLATE_IDS)[number];
export type QrTemplateId = QrEngineTemplateId;

export const QR_BORDER_STYLE_IDS = ["none", "rounded", "double", "ornate", "minimal"] as const;

export const QR_SHAPE_IDS = ["square", "rounded", "circle"] as const;

export type QrBorderStyleId = (typeof QR_BORDER_STYLE_IDS)[number];
export type QrShapeId = (typeof QR_SHAPE_IDS)[number];

export const DEFAULT_QR_TEMPLATE: QrTemplateId = VELVET_LOUNGE_NOIR_TEMPLATE_ID;
export const DEFAULT_QR_BORDER_STYLE: QrBorderStyleId = "rounded";
export const DEFAULT_QR_SHAPE: QrShapeId = "square";
export const DEFAULT_QR_BACKGROUND_COLOR = "#FFFFFF";

export type QrTemplatePreset = {
  id: QrTemplateId;
  labelKey: string;
  defaultBg: string;
  defaultAccentFrom: "primary" | "secondary" | "accent";
  lightText: boolean;
  moduleLight: string;
};

export const QR_TEMPLATE_PRESETS: Record<QrTemplateId, QrTemplatePreset> = {
  [INDUSTRY_TEMPLATE_ID]: {
    id: INDUSTRY_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.luxuryGold",
    defaultBg: "#1A1A1A",
    defaultAccentFrom: "primary",
    lightText: true,
    moduleLight: "#FFFFFF",
  },
  [VELVET_LOUNGE_TEMPLATE_ID]: {
    id: VELVET_LOUNGE_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.velvetLounge",
    defaultBg: "#0a0a0a",
    defaultAccentFrom: "primary",
    lightText: true,
    moduleLight: "#FFFFFF",
  },
  [GRAND_ATELIER_TEMPLATE_ID]: {
    id: GRAND_ATELIER_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.grandAtelier",
    defaultBg: "#1a1410",
    defaultAccentFrom: "primary",
    lightText: true,
    moduleLight: "#FFFFFF",
  },
  [ROYAL_SUITE_TEMPLATE_ID]: {
    id: ROYAL_SUITE_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.royalSuite",
    defaultBg: "#0c2848",
    defaultAccentFrom: "accent",
    lightText: true,
    moduleLight: "#FFFFFF",
  },
  [CHAMPAGNE_SALON_TEMPLATE_ID]: {
    id: CHAMPAGNE_SALON_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.champagneSalon",
    defaultBg: "#f5f0e8",
    defaultAccentFrom: "primary",
    lightText: false,
    moduleLight: "#FFFFFF",
  },
  [SERENITY_SPA_TEMPLATE_ID]: {
    id: SERENITY_SPA_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.serenitySpa",
    defaultBg: "#ebe4d8",
    defaultAccentFrom: "primary",
    lightText: false,
    moduleLight: "#FFFFFF",
  },
  [ART_DECO_NOIR_TEMPLATE_ID]: {
    id: ART_DECO_NOIR_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.artDecoNoir",
    defaultBg: "#141414",
    defaultAccentFrom: "primary",
    lightText: true,
    moduleLight: "#FFFFFF",
  },
  [GALLERY_PAVILION_TEMPLATE_ID]: {
    id: GALLERY_PAVILION_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.galleryPavilion",
    defaultBg: "#f8f8f8",
    defaultAccentFrom: "primary",
    lightText: false,
    moduleLight: "#FFFFFF",
  },
  [VELVET_LOUNGE_NOIR_TEMPLATE_ID]: {
    id: VELVET_LOUNGE_NOIR_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.velvetLoungeNoir",
    defaultBg: "#1a0a10",
    defaultAccentFrom: "primary",
    lightText: true,
    moduleLight: "#FFFFFF",
  },
  [GRAND_ATELIER_NOIR_TEMPLATE_ID]: {
    id: GRAND_ATELIER_NOIR_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.grandAtelierNoir",
    defaultBg: "#0c0c0c",
    defaultAccentFrom: "primary",
    lightText: true,
    moduleLight: "#FFFFFF",
  },
  [ROYAL_SUITE_PLATINUM_TEMPLATE_ID]: {
    id: ROYAL_SUITE_PLATINUM_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.royalSuitePlatinum",
    defaultBg: "#0a1424",
    defaultAccentFrom: "accent",
    lightText: true,
    moduleLight: "#FFFFFF",
  },
  [CHAMPAGNE_SALON_CLASSIC_TEMPLATE_ID]: {
    id: CHAMPAGNE_SALON_CLASSIC_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.champagneSalonClassic",
    defaultBg: "#faf6ef",
    defaultAccentFrom: "primary",
    lightText: false,
    moduleLight: "#FFFFFF",
  },
  [EMERALD_SANCTUARY_TEMPLATE_ID]: {
    id: EMERALD_SANCTUARY_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.emeraldSanctuary",
    defaultBg: "#0f2a22",
    defaultAccentFrom: "primary",
    lightText: true,
    moduleLight: "#FFFFFF",
  },
  [SAPPHIRE_PAVILION_TEMPLATE_ID]: {
    id: SAPPHIRE_PAVILION_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.sapphirePavilion",
    defaultBg: "#0f2848",
    defaultAccentFrom: "accent",
    lightText: true,
    moduleLight: "#FFFFFF",
  },
  [COPPER_HEARTH_TEMPLATE_ID]: {
    id: COPPER_HEARTH_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.copperHearth",
    defaultBg: "#2a1810",
    defaultAccentFrom: "primary",
    lightText: true,
    moduleLight: "#FFFFFF",
  },
  [ROSE_GOLD_SALON_TEMPLATE_ID]: {
    id: ROSE_GOLD_SALON_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.roseGoldSalon",
    defaultBg: "#fdf6f4",
    defaultAccentFrom: "primary",
    lightText: false,
    moduleLight: "#FFFFFF",
  },
  [POC_LUXURY_SHELL_TEMPLATE_ID]: {
    id: POC_LUXURY_SHELL_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.pocLuxury",
    defaultBg: "#0A0A0A",
    defaultAccentFrom: "primary",
    lightText: true,
    moduleLight: "#FFFFFF",
  },
};

export type ResolvedQrVisualStyle = {
  templateId: QrTemplateId;
  borderStyle: QrBorderStyleId;
  shape: QrShapeId;
  backgroundColor: string;
  accentColor: string;
  moduleDark: string;
  moduleLight: string;
  lightText: boolean;
};

const LEGACY_SET = new Set<string>(LEGACY_QR_TEMPLATE_IDS);
const ENGINE_SET = new Set<string>(QR_ENGINE_TEMPLATE_IDS);

export function isLegacyQrTemplateId(value: string | null | undefined): boolean {
  return LEGACY_SET.has(String(value ?? "").trim().toLowerCase());
}

export function normalizeQrTemplateId(value: string | null | undefined): QrTemplateId {
  const raw = String(value ?? "").trim().toLowerCase();
  if (isLegacyQrTemplateId(raw)) return DEFAULT_QR_TEMPLATE;
  if (ENGINE_SET.has(raw)) return raw as QrTemplateId;
  return DEFAULT_QR_TEMPLATE;
}

export function normalizeQrBorderStyleId(value: string | null | undefined): QrBorderStyleId {
  const raw = String(value ?? "").trim().toLowerCase();
  return (QR_BORDER_STYLE_IDS as readonly string[]).includes(raw)
    ? (raw as QrBorderStyleId)
    : DEFAULT_QR_BORDER_STYLE;
}

export function normalizeQrShapeId(value: string | null | undefined): QrShapeId {
  const raw = String(value ?? "").trim().toLowerCase();
  return (QR_SHAPE_IDS as readonly string[]).includes(raw) ? (raw as QrShapeId) : DEFAULT_QR_SHAPE;
}

export function resolveQrVisualStyle(opts: {
  premium: boolean;
  primaryColor: string;
  secondaryColor: string;
  qrTemplate?: string | null;
  qrBorderStyle?: string | null;
  qrShape?: string | null;
  qrAccentColor?: string | null;
  qrBackgroundColor?: string | null;
}): ResolvedQrVisualStyle {
  const templateId = normalizeQrTemplateId(opts.qrTemplate);
  const preset = QR_TEMPLATE_PRESETS[templateId];
  const borderStyle = normalizeQrBorderStyleId(opts.qrBorderStyle);
  const shape = normalizeQrShapeId(opts.qrShape);

  const accentColor =
    opts.qrAccentColor?.trim() ||
    (preset.defaultAccentFrom === "secondary" ? opts.secondaryColor : opts.primaryColor);

  const backgroundColor = opts.qrBackgroundColor?.trim() || preset.defaultBg;

  return {
    templateId,
    borderStyle,
    shape,
    backgroundColor,
    accentColor,
    moduleDark: opts.premium ? opts.secondaryColor : "#000000",
    moduleLight: preset.moduleLight,
    lightText: preset.lightText,
  };
}

export function qrShapeCornerRadius(shape: QrShapeId, qrSize: number): number {
  if (shape === "circle") return qrSize / 2;
  if (shape === "rounded") return Math.round(qrSize * 0.12);
  return 0;
}

export function previewStyleForTemplate(
  templateId: QrTemplateId,
  accentColor: string,
  backgroundColor?: string,
): { bg: string; accent: string; lightText: boolean; radius: string } {
  const preset = QR_TEMPLATE_PRESETS[templateId];
  return {
    bg: backgroundColor || preset.defaultBg,
    accent: accentColor,
    lightText: preset.lightText,
    radius: "0px",
  };
}
