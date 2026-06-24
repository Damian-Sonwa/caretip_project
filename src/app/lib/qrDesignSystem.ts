/**
 * QR Studio design extras — layout variants and localStorage overrides.
 * Template rendering is handled exclusively by the Template Engine (`qrTemplateEngine/`).
 */

import type { QrTemplateFieldId } from "./qrTemplateEngine/types";

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
  /** Per-field visibility overrides for engine templates (localStorage). */
  templateFieldVisibility: Partial<Record<QrTemplateFieldId, boolean>>;
};

export const DEFAULT_QR_STUDIO_EXTRAS: QrStudioDesignExtras = {
  layoutVariant: DEFAULT_QR_LAYOUT_VARIANT,
  ctaText: "Scan to tip",
  websiteUrl: "",
  socialInstagram: "",
  socialFacebook: "",
  decorationsEnabled: true,
  showVenueLogoHeader: true,
  templateFieldVisibility: {},
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
    websiteUrl: extras.websiteUrl.trim() || base.websiteUrl || null,
    socialInstagram: extras.socialInstagram.trim() || null,
    socialFacebook: extras.socialFacebook.trim() || null,
    templateFieldVisibility: extras.templateFieldVisibility,
  };
}
