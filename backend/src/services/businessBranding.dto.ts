import type { BusinessSubscriptionTier } from "@prisma/client";
import { hasSubscriptionCapability } from "../config/subscriptionCapabilities.js";
import { absolutizePublicMediaPath } from "../utils/publicMediaUrl.js";
import {
  DEFAULT_BRAND_PRIMARY_COLOR,
  DEFAULT_BRAND_SECONDARY_COLOR,
  normalizeBrandHexColor,
} from "../lib/brandColorValidation.js";
import {
  DEFAULT_QR_BACKGROUND_COLOR,
  DEFAULT_QR_BORDER_STYLE,
  DEFAULT_QR_SHAPE,
  DEFAULT_QR_TEMPLATE,
  normalizeQrBorderStyle,
  normalizeQrShape,
  normalizeQrTemplate,
  type QrBorderStyle,
  type QrShape,
  type QrTemplate,
} from "../lib/qrBrandingValidation.js";

export type BusinessBrandingRow = {
  id: string;
  name: string;
  logoPath: string | null;
  bannerImagePath: string | null;
  brandPrimaryColor: string | null;
  brandSecondaryColor: string | null;
  welcomeMessage: string | null;
  thankYouMessage: string | null;
  brandDisplayName: string | null;
  brandTagline: string | null;
  qrTemplate: string;
  qrBorderStyle: string;
  qrShape: string;
  qrAccentColor: string | null;
  qrBackgroundColor: string | null;
  subscriptionTier: BusinessSubscriptionTier;
};

/** Manager settings panel — includes edit permission hint. */
export type BusinessBrandingSettingsDto = {
  logoPath: string | null;
  bannerImagePath: string | null;
  brandPrimaryColor: string;
  brandSecondaryColor: string;
  welcomeMessage: string | null;
  thankYouMessage: string | null;
  brandDisplayName: string | null;
  brandTagline: string | null;
  qrTemplate: QrTemplate;
  qrBorderStyle: QrBorderStyle;
  qrShape: QrShape;
  qrAccentColor: string;
  qrBackgroundColor: string;
  canEdit: boolean;
};

/** Guest-facing branding resolved server-side (no raw subscription tier). */
export type PublicGuestBrandingDto = {
  premium: boolean;
  businessName: string;
  brandDisplayName: string | null;
  brandTagline: string | null;
  logoPath: string | null;
  bannerImagePath: string | null;
  brandPrimaryColor: string;
  brandSecondaryColor: string;
  welcomeMessage: string | null;
  thankYouMessage: string | null;
  qrTemplate: QrTemplate;
  qrBorderStyle: QrBorderStyle;
  qrShape: QrShape;
  qrAccentColor: string;
  qrBackgroundColor: string;
};

export const BUSINESS_BRANDING_SELECT = {
  id: true,
  name: true,
  logoPath: true,
  bannerImagePath: true,
  brandPrimaryColor: true,
  brandSecondaryColor: true,
  welcomeMessage: true,
  thankYouMessage: true,
  brandDisplayName: true,
  brandTagline: true,
  qrTemplate: true,
  qrBorderStyle: true,
  qrShape: true,
  qrAccentColor: true,
  qrBackgroundColor: true,
  subscriptionTier: true,
} as const;

export function isPremiumBrandingTier(tier: BusinessSubscriptionTier): boolean {
  return hasSubscriptionCapability(tier, "brandingCustomization");
}

export function resolveBrandDisplayName(row: Pick<BusinessBrandingRow, "name" | "brandDisplayName">): string {
  const custom = row.brandDisplayName?.trim();
  return custom || row.name;
}

function resolveQrAccentColor(
  row: Pick<BusinessBrandingRow, "qrAccentColor" | "brandPrimaryColor">,
  premium: boolean,
): string {
  if (!premium) return DEFAULT_BRAND_PRIMARY_COLOR;
  const accent = normalizeBrandHexColor(row.qrAccentColor, "");
  if (accent) return accent;
  return normalizeBrandHexColor(row.brandPrimaryColor, DEFAULT_BRAND_PRIMARY_COLOR);
}

function resolveQrBackgroundColor(
  row: Pick<BusinessBrandingRow, "qrBackgroundColor">,
  premium: boolean,
): string {
  if (!premium) return DEFAULT_QR_BACKGROUND_COLOR;
  return normalizeBrandHexColor(row.qrBackgroundColor, DEFAULT_QR_BACKGROUND_COLOR);
}

export function toBusinessBrandingSettingsDto(
  row: BusinessBrandingRow,
  canEdit: boolean,
): BusinessBrandingSettingsDto {
  const premium = isPremiumBrandingTier(row.subscriptionTier);
  return {
    logoPath: absolutizePublicMediaPath(row.logoPath ?? null),
    bannerImagePath: absolutizePublicMediaPath(row.bannerImagePath ?? null),
    brandPrimaryColor: normalizeBrandHexColor(row.brandPrimaryColor, DEFAULT_BRAND_PRIMARY_COLOR),
    brandSecondaryColor: normalizeBrandHexColor(row.brandSecondaryColor, DEFAULT_BRAND_SECONDARY_COLOR),
    welcomeMessage: row.welcomeMessage?.trim() || null,
    thankYouMessage: row.thankYouMessage?.trim() || null,
    brandDisplayName: row.brandDisplayName?.trim() || null,
    brandTagline: row.brandTagline?.trim() || null,
    qrTemplate: premium ? normalizeQrTemplate(row.qrTemplate) : DEFAULT_QR_TEMPLATE,
    qrBorderStyle: premium ? normalizeQrBorderStyle(row.qrBorderStyle) : DEFAULT_QR_BORDER_STYLE,
    qrShape: premium ? normalizeQrShape(row.qrShape) : DEFAULT_QR_SHAPE,
    qrAccentColor: resolveQrAccentColor(row, premium),
    qrBackgroundColor: resolveQrBackgroundColor(row, premium),
    canEdit,
  };
}

export function toPublicGuestBrandingDto(
  row: Pick<
    BusinessBrandingRow,
    | "name"
    | "logoPath"
    | "bannerImagePath"
    | "brandPrimaryColor"
    | "brandSecondaryColor"
    | "welcomeMessage"
    | "thankYouMessage"
    | "brandDisplayName"
    | "brandTagline"
    | "qrTemplate"
    | "qrBorderStyle"
    | "qrShape"
    | "qrAccentColor"
    | "qrBackgroundColor"
    | "subscriptionTier"
  >,
): PublicGuestBrandingDto {
  const premium = isPremiumBrandingTier(row.subscriptionTier);
  const logo = absolutizePublicMediaPath(row.logoPath ?? null);

  if (!premium) {
    return {
      premium: false,
      businessName: row.name,
      brandDisplayName: null,
      brandTagline: null,
      logoPath: logo,
      bannerImagePath: null,
      brandPrimaryColor: DEFAULT_BRAND_PRIMARY_COLOR,
      brandSecondaryColor: DEFAULT_BRAND_SECONDARY_COLOR,
      welcomeMessage: null,
      thankYouMessage: null,
      qrTemplate: DEFAULT_QR_TEMPLATE,
      qrBorderStyle: DEFAULT_QR_BORDER_STYLE,
      qrShape: DEFAULT_QR_SHAPE,
      qrAccentColor: DEFAULT_BRAND_PRIMARY_COLOR,
      qrBackgroundColor: DEFAULT_QR_BACKGROUND_COLOR,
    };
  }

  return {
    premium: true,
    businessName: row.name,
    brandDisplayName: row.brandDisplayName?.trim() || null,
    brandTagline: row.brandTagline?.trim() || null,
    logoPath: logo,
    bannerImagePath: absolutizePublicMediaPath(row.bannerImagePath ?? null),
    brandPrimaryColor: normalizeBrandHexColor(row.brandPrimaryColor, DEFAULT_BRAND_PRIMARY_COLOR),
    brandSecondaryColor: normalizeBrandHexColor(row.brandSecondaryColor, DEFAULT_BRAND_SECONDARY_COLOR),
    welcomeMessage: row.welcomeMessage?.trim() || null,
    thankYouMessage: row.thankYouMessage?.trim() || null,
    qrTemplate: normalizeQrTemplate(row.qrTemplate),
    qrBorderStyle: normalizeQrBorderStyle(row.qrBorderStyle),
    qrShape: normalizeQrShape(row.qrShape),
    qrAccentColor: resolveQrAccentColor(row, true),
    qrBackgroundColor: resolveQrBackgroundColor(row, true),
  };
}
