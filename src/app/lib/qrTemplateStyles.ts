/** Shared QR template presets for canvas rendering and settings UI previews. */

export const QR_TEMPLATE_IDS = [
  "classic",
  "luxury",
  "modern",
  "nature",
  "corporate",
  "nightlife",
  "restaurant",
  "hotel",
] as const;

export const QR_BORDER_STYLE_IDS = ["none", "rounded", "double", "ornate", "minimal"] as const;

export const QR_SHAPE_IDS = ["square", "rounded", "circle"] as const;

export type QrTemplateId = (typeof QR_TEMPLATE_IDS)[number];
export type QrBorderStyleId = (typeof QR_BORDER_STYLE_IDS)[number];
export type QrShapeId = (typeof QR_SHAPE_IDS)[number];

export const DEFAULT_QR_TEMPLATE: QrTemplateId = "classic";
export const DEFAULT_QR_BORDER_STYLE: QrBorderStyleId = "rounded";
export const DEFAULT_QR_SHAPE: QrShapeId = "square";
export const DEFAULT_QR_BACKGROUND_COLOR = "#FFFFFF";

export type QrTemplatePreset = {
  id: QrTemplateId;
  labelKey: string;
  defaultBg: string;
  defaultAccentFrom: "primary" | "secondary" | "accent";
  lightText: boolean;
  topBand: boolean;
  topBandOpacity: number;
  cardRadius: number;
  titleWeight: string;
  titleSize: number;
  taglineSize: number;
  moduleLight: string;
};

export const QR_TEMPLATE_PRESETS: Record<QrTemplateId, QrTemplatePreset> = {
  classic: {
    id: "classic",
    labelKey: "business.branding.templates.classic",
    defaultBg: "#FFFFFF",
    defaultAccentFrom: "primary",
    lightText: false,
    topBand: true,
    topBandOpacity: 0.08,
    cardRadius: 8,
    titleWeight: "bold",
    titleSize: 14,
    taglineSize: 11,
    moduleLight: "#FFFFFF",
  },
  luxury: {
    id: "luxury",
    labelKey: "business.branding.templates.luxury",
    defaultBg: "#141414",
    defaultAccentFrom: "accent",
    lightText: true,
    topBand: true,
    topBandOpacity: 0.2,
    cardRadius: 12,
    titleWeight: "600",
    titleSize: 15,
    taglineSize: 11,
    moduleLight: "#FFFFFF",
  },
  modern: {
    id: "modern",
    labelKey: "business.branding.templates.modern",
    defaultBg: "#F8FAFC",
    defaultAccentFrom: "primary",
    lightText: false,
    topBand: false,
    topBandOpacity: 0,
    cardRadius: 16,
    titleWeight: "600",
    titleSize: 14,
    taglineSize: 11,
    moduleLight: "#F8FAFC",
  },
  nature: {
    id: "nature",
    labelKey: "business.branding.templates.nature",
    defaultBg: "#F4F7F0",
    defaultAccentFrom: "primary",
    lightText: false,
    topBand: true,
    topBandOpacity: 0.12,
    cardRadius: 10,
    titleWeight: "600",
    titleSize: 14,
    taglineSize: 11,
    moduleLight: "#FFFFFF",
  },
  corporate: {
    id: "corporate",
    labelKey: "business.branding.templates.corporate",
    defaultBg: "#FFFFFF",
    defaultAccentFrom: "secondary",
    lightText: false,
    topBand: true,
    topBandOpacity: 0.06,
    cardRadius: 6,
    titleWeight: "bold",
    titleSize: 13,
    taglineSize: 10,
    moduleLight: "#FFFFFF",
  },
  nightlife: {
    id: "nightlife",
    labelKey: "business.branding.templates.nightlife",
    defaultBg: "#0F0F14",
    defaultAccentFrom: "accent",
    lightText: true,
    topBand: true,
    topBandOpacity: 0.25,
    cardRadius: 14,
    titleWeight: "bold",
    titleSize: 15,
    taglineSize: 11,
    moduleLight: "#FFFFFF",
  },
  restaurant: {
    id: "restaurant",
    labelKey: "business.branding.templates.restaurant",
    defaultBg: "#FFF8F0",
    defaultAccentFrom: "primary",
    lightText: false,
    topBand: true,
    topBandOpacity: 0.1,
    cardRadius: 10,
    titleWeight: "600",
    titleSize: 14,
    taglineSize: 11,
    moduleLight: "#FFFFFF",
  },
  hotel: {
    id: "hotel",
    labelKey: "business.branding.templates.hotel",
    defaultBg: "#FAFAF8",
    defaultAccentFrom: "primary",
    lightText: false,
    topBand: true,
    topBandOpacity: 0.08,
    cardRadius: 12,
    titleWeight: "500",
    titleSize: 14,
    taglineSize: 11,
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
  topBand: boolean;
  topBandOpacity: number;
  cardRadius: number;
  titleWeight: string;
  titleSize: number;
  taglineSize: number;
};

export function normalizeQrTemplateId(value: string | null | undefined): QrTemplateId {
  const raw = String(value ?? "").trim().toLowerCase();
  return (QR_TEMPLATE_IDS as readonly string[]).includes(raw) ? (raw as QrTemplateId) : DEFAULT_QR_TEMPLATE;
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
  if (!opts.premium) {
    const preset = QR_TEMPLATE_PRESETS.classic;
    return {
      templateId: "classic",
      borderStyle: "rounded",
      shape: "square",
      backgroundColor: "#FFFFFF",
      accentColor: opts.primaryColor,
      moduleDark: "#000000",
      moduleLight: preset.moduleLight,
      lightText: false,
      topBand: true,
      topBandOpacity: preset.topBandOpacity,
      cardRadius: preset.cardRadius,
      titleWeight: preset.titleWeight,
      titleSize: preset.titleSize,
      taglineSize: preset.taglineSize,
    };
  }

  const templateId = normalizeQrTemplateId(opts.qrTemplate);
  const borderStyle = normalizeQrBorderStyleId(opts.qrBorderStyle);
  const shape = normalizeQrShapeId(opts.qrShape);
  const preset = QR_TEMPLATE_PRESETS[templateId];

  const accentColor =
    opts.qrAccentColor?.trim() ||
    (preset.defaultAccentFrom === "secondary"
      ? opts.secondaryColor
      : preset.defaultAccentFrom === "accent"
        ? opts.qrAccentColor?.trim() || opts.primaryColor
        : opts.primaryColor);

  const backgroundColor = opts.qrBackgroundColor?.trim() || preset.defaultBg;

  return {
    templateId,
    borderStyle,
    shape,
    backgroundColor,
    accentColor,
    moduleDark: opts.secondaryColor,
    moduleLight: preset.moduleLight,
    lightText: preset.lightText,
    topBand: preset.topBand,
    topBandOpacity: preset.topBandOpacity,
    cardRadius: preset.cardRadius,
    titleWeight: preset.titleWeight,
    titleSize: preset.titleSize,
    taglineSize: preset.taglineSize,
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
    radius: `${preset.cardRadius}px`,
  };
}
