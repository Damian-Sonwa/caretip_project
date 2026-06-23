/**
 * QR Studio design systems — templates as composable layers, not just colors.
 */

import type { QrBorderStyleId, QrShapeId, QrTemplateId } from "./qrTemplateStyles";

export const QR_LAYOUT_VARIANT_IDS = [
  "table_tent",
  "poster",
  "counter",
  "window",
  "menu",
  "social",
] as const;

export type QrLayoutVariantId = (typeof QR_LAYOUT_VARIANT_IDS)[number];

export const DEFAULT_QR_LAYOUT_VARIANT: QrLayoutVariantId = "table_tent";

export type QrTypographyScale = {
  titleSize: number;
  titleWeight: string;
  titleFont: string;
  taglineSize: number;
  taglineFont: string;
  ctaSize: number;
  ctaWeight: string;
  footerSize: number;
};

export type QrDecorationLayer = {
  id: string;
  /** corners | frame | pattern | glow | accent */
  kind: "corners" | "frame" | "pattern" | "glow" | "accent";
  enabled: boolean;
};

export type QrDesignSystem = {
  templateId: QrTemplateId;
  layout: QrLayoutVariantId;
  typography: QrTypographyScale;
  decorations: QrDecorationLayer[];
  background: {
    style: "solid" | "gradient" | "texture";
    gradientAngle?: number;
    secondaryTint?: string;
  };
  frame: QrBorderStyleId;
  qrStyle: {
    shape: QrShapeId;
    eyeStyle: "square" | "rounded" | "dot";
    logoPlacement: "center" | "header" | "both";
  };
  contentPlacement: {
    logoY: "top";
    titleY: "upper";
    taglineY: "upper";
    qrY: "center";
    ctaY: "below_qr";
    footerY: "bottom";
  };
  industryLabelKey: string;
};

const BASE_TYPO: QrTypographyScale = {
  titleSize: 16,
  titleWeight: "700",
  titleFont: "Georgia, 'Times New Roman', serif",
  taglineSize: 11,
  taglineFont: "system-ui, -apple-system, sans-serif",
  ctaSize: 13,
  ctaWeight: "600",
  footerSize: 10,
};

function deco(
  id: string,
  kind: QrDecorationLayer["kind"],
  enabled = true,
): QrDecorationLayer {
  return { id, kind, enabled };
}

/** Industry-specific design systems keyed by template id. */
export const QR_DESIGN_SYSTEMS: Record<QrTemplateId, QrDesignSystem> = {
  classic: {
    templateId: "classic",
    layout: "table_tent",
    typography: { ...BASE_TYPO, titleFont: "system-ui, sans-serif", titleWeight: "700" },
    decorations: [deco("frame-minimal", "frame")],
    background: { style: "solid" },
    frame: "rounded",
    qrStyle: { shape: "square", eyeStyle: "square", logoPlacement: "both" },
    contentPlacement: {
      logoY: "top",
      titleY: "upper",
      taglineY: "upper",
      qrY: "center",
      ctaY: "below_qr",
      footerY: "bottom",
    },
    industryLabelKey: "business.qrStudio.design.industries.classic",
  },
  luxury: {
    templateId: "luxury",
    layout: "poster",
    typography: {
      ...BASE_TYPO,
      titleSize: 18,
      titleWeight: "600",
      titleFont: "'Cormorant Garamond', Georgia, serif",
      taglineSize: 11,
      ctaSize: 12,
    },
    decorations: [
      deco("gold-corners", "corners"),
      deco("luxury-frame", "frame"),
      deco("monogram-accent", "accent"),
    ],
    background: { style: "gradient", gradientAngle: 160, secondaryTint: "#1a1a1a" },
    frame: "ornate",
    qrStyle: { shape: "rounded", eyeStyle: "rounded", logoPlacement: "both" },
    contentPlacement: {
      logoY: "top",
      titleY: "upper",
      taglineY: "upper",
      qrY: "center",
      ctaY: "below_qr",
      footerY: "bottom",
    },
    industryLabelKey: "business.qrStudio.design.industries.luxury",
  },
  modern: {
    templateId: "modern",
    layout: "counter",
    typography: {
      ...BASE_TYPO,
      titleFont: "system-ui, sans-serif",
      titleWeight: "600",
      titleSize: 15,
    },
    decorations: [deco("minimal-line", "accent")],
    background: { style: "solid" },
    frame: "minimal",
    qrStyle: { shape: "rounded", eyeStyle: "rounded", logoPlacement: "header" },
    contentPlacement: {
      logoY: "top",
      titleY: "upper",
      taglineY: "upper",
      qrY: "center",
      ctaY: "below_qr",
      footerY: "bottom",
    },
    industryLabelKey: "business.qrStudio.design.industries.modern",
  },
  nature: {
    templateId: "nature",
    layout: "table_tent",
    typography: { ...BASE_TYPO, titleFont: "Georgia, serif" },
    decorations: [deco("leaf-pattern", "pattern"), deco("organic-frame", "frame")],
    background: { style: "gradient", gradientAngle: 180, secondaryTint: "#e8efe0" },
    frame: "rounded",
    qrStyle: { shape: "rounded", eyeStyle: "rounded", logoPlacement: "both" },
    contentPlacement: {
      logoY: "top",
      titleY: "upper",
      taglineY: "upper",
      qrY: "center",
      ctaY: "below_qr",
      footerY: "bottom",
    },
    industryLabelKey: "business.qrStudio.design.industries.cafe",
  },
  corporate: {
    templateId: "corporate",
    layout: "menu",
    typography: {
      ...BASE_TYPO,
      titleSize: 14,
      titleWeight: "700",
      titleFont: "system-ui, sans-serif",
    },
    decorations: [deco("corp-frame", "frame")],
    background: { style: "solid" },
    frame: "double",
    qrStyle: { shape: "square", eyeStyle: "square", logoPlacement: "header" },
    contentPlacement: {
      logoY: "top",
      titleY: "upper",
      taglineY: "upper",
      qrY: "center",
      ctaY: "below_qr",
      footerY: "bottom",
    },
    industryLabelKey: "business.qrStudio.design.industries.corporate",
  },
  nightlife: {
    templateId: "nightlife",
    layout: "window",
    typography: {
      ...BASE_TYPO,
      titleSize: 17,
      titleWeight: "800",
      titleFont: "system-ui, sans-serif",
      ctaSize: 14,
    },
    decorations: [deco("neon-glow", "glow"), deco("neon-lines", "accent")],
    background: { style: "gradient", gradientAngle: 135, secondaryTint: "#0a0a12" },
    frame: "rounded",
    qrStyle: { shape: "rounded", eyeStyle: "dot", logoPlacement: "both" },
    contentPlacement: {
      logoY: "top",
      titleY: "upper",
      taglineY: "upper",
      qrY: "center",
      ctaY: "below_qr",
      footerY: "bottom",
    },
    industryLabelKey: "business.qrStudio.design.industries.nightclub",
  },
  restaurant: {
    templateId: "restaurant",
    layout: "table_tent",
    typography: {
      ...BASE_TYPO,
      titleFont: "'Cormorant Garamond', Georgia, serif",
      titleSize: 17,
      taglineSize: 11,
    },
    decorations: [deco("gold-rule", "accent"), deco("dining-frame", "frame")],
    background: { style: "gradient", gradientAngle: 175, secondaryTint: "#fff5e8" },
    frame: "ornate",
    qrStyle: { shape: "rounded", eyeStyle: "rounded", logoPlacement: "both" },
    contentPlacement: {
      logoY: "top",
      titleY: "upper",
      taglineY: "upper",
      qrY: "center",
      ctaY: "below_qr",
      footerY: "bottom",
    },
    industryLabelKey: "business.qrStudio.design.industries.fineDining",
  },
  hotel: {
    templateId: "hotel",
    layout: "poster",
    typography: {
      ...BASE_TYPO,
      titleSize: 16,
      titleWeight: "500",
      titleFont: "'Cormorant Garamond', Georgia, serif",
      taglineSize: 10,
    },
    decorations: [deco("hospitality-corners", "corners"), deco("elegant-border", "frame")],
    background: { style: "solid" },
    frame: "double",
    qrStyle: { shape: "rounded", eyeStyle: "rounded", logoPlacement: "both" },
    contentPlacement: {
      logoY: "top",
      titleY: "upper",
      taglineY: "upper",
      qrY: "center",
      ctaY: "below_qr",
      footerY: "bottom",
    },
    industryLabelKey: "business.qrStudio.design.industries.hotel",
  },
};

export type QrLayoutVariantScale = {
  cardScale: number;
  qrScale: number;
  typoScale: number;
};

export const QR_LAYOUT_VARIANT_SCALES: Record<QrLayoutVariantId, QrLayoutVariantScale> = {
  table_tent: { cardScale: 1, qrScale: 1, typoScale: 1 },
  poster: { cardScale: 1.15, qrScale: 1.1, typoScale: 1.12 },
  counter: { cardScale: 1.05, qrScale: 1.05, typoScale: 1.05 },
  window: { cardScale: 1.2, qrScale: 1.15, typoScale: 1.15 },
  menu: { cardScale: 0.92, qrScale: 0.95, typoScale: 0.92 },
  social: { cardScale: 1, qrScale: 0.9, typoScale: 0.95 },
};

export function resolveDesignSystem(templateId: QrTemplateId): QrDesignSystem {
  return QR_DESIGN_SYSTEMS[templateId] ?? QR_DESIGN_SYSTEMS.classic;
}

export function normalizeLayoutVariant(value: string | null | undefined): QrLayoutVariantId {
  const raw = String(value ?? "").trim().toLowerCase();
  return (QR_LAYOUT_VARIANT_IDS as readonly string[]).includes(raw)
    ? (raw as QrLayoutVariantId)
    : DEFAULT_QR_LAYOUT_VARIANT;
}

export const QR_STUDIO_DESIGN_STORAGE_KEY = "caretip.qrStudio.designExtras";

export type QrStudioDesignExtras = {
  layoutVariant: QrLayoutVariantId;
  ctaText: string;
  websiteUrl: string;
  socialInstagram: string;
  socialFacebook: string;
  decorationsEnabled: boolean;
  showVenueLogoHeader: boolean;
};

export const DEFAULT_QR_STUDIO_EXTRAS: QrStudioDesignExtras = {
  layoutVariant: DEFAULT_QR_LAYOUT_VARIANT,
  ctaText: "Scan to tip",
  websiteUrl: "",
  socialInstagram: "",
  socialFacebook: "",
  decorationsEnabled: true,
  showVenueLogoHeader: true,
};

export function loadQrStudioDesignExtras(businessId: string): QrStudioDesignExtras {
  if (typeof window === "undefined") return DEFAULT_QR_STUDIO_EXTRAS;
  try {
    const raw = localStorage.getItem(`${QR_STUDIO_DESIGN_STORAGE_KEY}:${businessId}`);
    if (!raw) return DEFAULT_QR_STUDIO_EXTRAS;
    return { ...DEFAULT_QR_STUDIO_EXTRAS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_QR_STUDIO_EXTRAS;
  }
}

export function saveQrStudioDesignExtras(businessId: string, extras: QrStudioDesignExtras): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${QR_STUDIO_DESIGN_STORAGE_KEY}:${businessId}`, JSON.stringify(extras));
}

export function applyDesignSystemOverrides(
  system: QrDesignSystem,
  overrides: {
    layoutVariant?: QrLayoutVariantId;
    qrBorderStyle?: QrBorderStyleId;
    qrShape?: QrShapeId;
  },
): QrDesignSystem {
  return {
    ...system,
    layout: overrides.layoutVariant ?? system.layout,
    frame: overrides.qrBorderStyle ?? system.frame,
    qrStyle: {
      ...system.qrStyle,
      shape: overrides.qrShape ?? system.qrStyle.shape,
    },
  };
}

export function mergeQrStudioBranding(
  base: import("./businessBranding").QrBrandingOptions,
  extras: QrStudioDesignExtras,
): import("./businessBranding").QrBrandingOptions {
  return {
    ...base,
    layoutVariant: extras.layoutVariant,
    ctaText: extras.ctaText.trim() || "Scan to tip",
    decorationsEnabled: extras.decorationsEnabled,
    showVenueLogoHeader: extras.showVenueLogoHeader,
  };
}
