import type { QrTemplateDefinition } from "./types";

import industryCaretipBg from "@/assets/qr-templates/backgrounds/industry-caretip-design.jpg";
import vipLoungeBg from "@/assets/qr-templates/backgrounds/vip-lounge.jpg";
import cityCafeBg from "@/assets/qr-templates/backgrounds/city-cafe.jpg";
import beachResortBg from "@/assets/qr-templates/backgrounds/beach-resort.jpg";
import scandinavianBg from "@/assets/qr-templates/backgrounds/scandinavian.jpg";
import spaRetreatBg from "@/assets/qr-templates/backgrounds/spa-retreat.jpg";
import artDecoNoirBg from "@/assets/qr-templates/backgrounds/premium-noir.jpg";
import galleryPavilionBg from "@/assets/qr-templates/backgrounds/gallery-white.jpg";

import {
  ART_DECO_NOIR_IMAGE_ZONES,
  BEACH_RESORT_IMAGE_ZONES,
  CITY_CAFE_IMAGE_ZONES,
  GALLERY_PAVILION_IMAGE_ZONES,
  LUXURY_GOLD_IMAGE_ZONES,
  PROCEDURAL_HOSPITALITY_ZONES,
  SCANDINAVIAN_IMAGE_ZONES,
  SPA_RETREAT_IMAGE_ZONES,
  VIP_LOUNGE_IMAGE_ZONES,
  champagneSalonPositions,
  darkLuxuryPositions,
  luxuryShellBase,
} from "./luxuryTemplateShared";

/** Proof-of-concept template — decorative shell only, all business data injected at runtime. */
export const POC_LUXURY_SHELL_TEMPLATE_ID = "poc-luxury-shell";

/** Gold-frame image shell from CareTip-design.jpg. */
export const INDUSTRY_TEMPLATE_ID = "industry";

export const VELVET_LOUNGE_TEMPLATE_ID = "velvet-lounge";
export const GRAND_ATELIER_TEMPLATE_ID = "grand-atelier";
export const ROYAL_SUITE_TEMPLATE_ID = "royal-suite";
export const CHAMPAGNE_SALON_TEMPLATE_ID = "champagne-salon";
export const SERENITY_SPA_TEMPLATE_ID = "serenity-spa";
export const ART_DECO_NOIR_TEMPLATE_ID = "art-deco-noir";
export const GALLERY_PAVILION_TEMPLATE_ID = "gallery-pavilion";

/** Canvas-drawn luxury shells (paired with image templates in the gallery). */
export const VELVET_LOUNGE_NOIR_TEMPLATE_ID = "velvet-lounge-noir";
export const GRAND_ATELIER_NOIR_TEMPLATE_ID = "grand-atelier-noir";
export const ROYAL_SUITE_PLATINUM_TEMPLATE_ID = "royal-suite-platinum";
export const CHAMPAGNE_SALON_CLASSIC_TEMPLATE_ID = "champagne-salon-classic";
export const EMERALD_SANCTUARY_TEMPLATE_ID = "emerald-sanctuary";
export const SAPPHIRE_PAVILION_TEMPLATE_ID = "sapphire-pavilion";
export const COPPER_HEARTH_TEMPLATE_ID = "copper-hearth";
export const ROSE_GOLD_SALON_TEMPLATE_ID = "rose-gold-salon";

/** First-generation image shells — archived from gallery; engine + export still supported. */
const ARCHIVED_IMAGE_GALLERY = false as const;

export const QR_TEMPLATE_ENGINE_REGISTRY: readonly QrTemplateDefinition[] = [
  luxuryShellBase({
    id: INDUSTRY_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.luxuryGold",
    descriptionKey: "business.qrStudio.templateEngine.luxuryGoldDesc",
    gallery: ARCHIVED_IMAGE_GALLERY,
    background: { kind: "image", src: industryCaretipBg },
    zones: LUXURY_GOLD_IMAGE_ZONES,
    positions: darkLuxuryPositions(),
  }),
  luxuryShellBase({
    id: VELVET_LOUNGE_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.velvetLounge",
    descriptionKey: "business.qrStudio.templateEngine.velvetLoungeDesc",
    gallery: ARCHIVED_IMAGE_GALLERY,
    background: { kind: "image", src: vipLoungeBg },
    zones: VIP_LOUNGE_IMAGE_ZONES,
    positions: darkLuxuryPositions(),
  }),
  luxuryShellBase({
    id: GRAND_ATELIER_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.grandAtelier",
    descriptionKey: "business.qrStudio.templateEngine.grandAtelierDesc",
    gallery: ARCHIVED_IMAGE_GALLERY,
    background: { kind: "image", src: cityCafeBg },
    zones: CITY_CAFE_IMAGE_ZONES,
    positions: darkLuxuryPositions(),
  }),
  luxuryShellBase({
    id: ROYAL_SUITE_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.royalSuite",
    descriptionKey: "business.qrStudio.templateEngine.royalSuiteDesc",
    gallery: ARCHIVED_IMAGE_GALLERY,
    background: { kind: "image", src: beachResortBg },
    zones: BEACH_RESORT_IMAGE_ZONES,
    positions: darkLuxuryPositions(),
  }),
  luxuryShellBase({
    id: CHAMPAGNE_SALON_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.champagneSalon",
    descriptionKey: "business.qrStudio.templateEngine.champagneSalonDesc",
    gallery: ARCHIVED_IMAGE_GALLERY,
    background: { kind: "image", src: scandinavianBg },
    zones: SCANDINAVIAN_IMAGE_ZONES,
    positions: champagneSalonPositions(),
  }),
  luxuryShellBase({
    id: SERENITY_SPA_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.serenitySpa",
    descriptionKey: "business.qrStudio.templateEngine.serenitySpaDesc",
    gallery: ARCHIVED_IMAGE_GALLERY,
    background: { kind: "image", src: spaRetreatBg },
    zones: SPA_RETREAT_IMAGE_ZONES,
    positions: champagneSalonPositions(),
  }),
  luxuryShellBase({
    id: ART_DECO_NOIR_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.artDecoNoir",
    descriptionKey: "business.qrStudio.templateEngine.artDecoNoirDesc",
    gallery: ARCHIVED_IMAGE_GALLERY,
    background: { kind: "image", src: artDecoNoirBg },
    zones: ART_DECO_NOIR_IMAGE_ZONES,
    positions: darkLuxuryPositions(),
  }),
  luxuryShellBase({
    id: GALLERY_PAVILION_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.galleryPavilion",
    descriptionKey: "business.qrStudio.templateEngine.galleryPavilionDesc",
    gallery: ARCHIVED_IMAGE_GALLERY,
    background: { kind: "image", src: galleryPavilionBg },
    zones: GALLERY_PAVILION_IMAGE_ZONES,
    positions: champagneSalonPositions(),
  }),
  luxuryShellBase({
    id: VELVET_LOUNGE_NOIR_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.velvetLoungeNoir",
    descriptionKey: "business.qrStudio.templateEngine.velvetLoungeNoirDesc",
    gallery: true,
    background: { kind: "procedural", variant: "velvet-lounge" },
    zones: PROCEDURAL_HOSPITALITY_ZONES,
    positions: darkLuxuryPositions(),
  }),
  luxuryShellBase({
    id: GRAND_ATELIER_NOIR_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.grandAtelierNoir",
    descriptionKey: "business.qrStudio.templateEngine.grandAtelierNoirDesc",
    gallery: true,
    background: { kind: "procedural", variant: "grand-atelier" },
    zones: PROCEDURAL_HOSPITALITY_ZONES,
    positions: darkLuxuryPositions(),
  }),
  luxuryShellBase({
    id: ROYAL_SUITE_PLATINUM_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.royalSuitePlatinum",
    descriptionKey: "business.qrStudio.templateEngine.royalSuitePlatinumDesc",
    gallery: true,
    background: { kind: "procedural", variant: "royal-suite" },
    zones: PROCEDURAL_HOSPITALITY_ZONES,
    positions: darkLuxuryPositions(),
  }),
  luxuryShellBase({
    id: CHAMPAGNE_SALON_CLASSIC_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.champagneSalonClassic",
    descriptionKey: "business.qrStudio.templateEngine.champagneSalonClassicDesc",
    gallery: true,
    background: { kind: "procedural", variant: "champagne-salon" },
    zones: PROCEDURAL_HOSPITALITY_ZONES,
    positions: champagneSalonPositions(),
  }),
  luxuryShellBase({
    id: EMERALD_SANCTUARY_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.emeraldSanctuary",
    descriptionKey: "business.qrStudio.templateEngine.emeraldSanctuaryDesc",
    gallery: true,
    background: { kind: "procedural", variant: "emerald-sanctuary" },
    zones: PROCEDURAL_HOSPITALITY_ZONES,
    positions: darkLuxuryPositions(),
  }),
  luxuryShellBase({
    id: SAPPHIRE_PAVILION_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.sapphirePavilion",
    descriptionKey: "business.qrStudio.templateEngine.sapphirePavilionDesc",
    gallery: true,
    background: { kind: "procedural", variant: "sapphire-pavilion" },
    zones: PROCEDURAL_HOSPITALITY_ZONES,
    positions: darkLuxuryPositions(),
  }),
  luxuryShellBase({
    id: COPPER_HEARTH_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.copperHearth",
    descriptionKey: "business.qrStudio.templateEngine.copperHearthDesc",
    gallery: true,
    background: { kind: "procedural", variant: "copper-hearth" },
    zones: PROCEDURAL_HOSPITALITY_ZONES,
    positions: darkLuxuryPositions(),
  }),
  luxuryShellBase({
    id: ROSE_GOLD_SALON_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.roseGoldSalon",
    descriptionKey: "business.qrStudio.templateEngine.roseGoldSalonDesc",
    gallery: true,
    background: { kind: "procedural", variant: "rose-gold-salon" },
    zones: PROCEDURAL_HOSPITALITY_ZONES,
    positions: champagneSalonPositions(),
  }),
  luxuryShellBase({
    id: POC_LUXURY_SHELL_TEMPLATE_ID,
    labelKey: "business.qrStudio.templateEngine.pocLuxury",
    descriptionKey: "business.qrStudio.templateEngine.pocLuxuryDesc",
    gallery: false,
    background: { kind: "procedural", variant: "poc-luxury-shell" },
    zones: PROCEDURAL_HOSPITALITY_ZONES,
    positions: darkLuxuryPositions(),
  }),
] as const;

const BY_ID = new Map(QR_TEMPLATE_ENGINE_REGISTRY.map((t) => [t.id, t]));

export function isEngineTemplateId(id: string | null | undefined): boolean {
  return BY_ID.has(String(id ?? "").trim());
}

export function getEngineTemplate(id: string): QrTemplateDefinition | null {
  return BY_ID.get(id.trim()) ?? null;
}

export function listEngineTemplates(): readonly QrTemplateDefinition[] {
  return QR_TEMPLATE_ENGINE_REGISTRY;
}

/** Templates shown in branding / QR Studio gallery. */
export function listGalleryTemplates(): readonly QrTemplateDefinition[] {
  return QR_TEMPLATE_ENGINE_REGISTRY.filter((t) => t.gallery !== false);
}

/** Generation-2 scan-first default for new businesses and Starter tier. */
export const GALLERY_DEFAULT_TEMPLATE_ID = VELVET_LOUNGE_NOIR_TEMPLATE_ID;

/** Archived from gallery — still render for businesses that selected them previously. */
export const ARCHIVED_GALLERY_TEMPLATE_IDS = [
  INDUSTRY_TEMPLATE_ID,
  VELVET_LOUNGE_TEMPLATE_ID,
  GRAND_ATELIER_TEMPLATE_ID,
  ROYAL_SUITE_TEMPLATE_ID,
  CHAMPAGNE_SALON_TEMPLATE_ID,
  SERENITY_SPA_TEMPLATE_ID,
  ART_DECO_NOIR_TEMPLATE_ID,
  GALLERY_PAVILION_TEMPLATE_ID,
] as const;
