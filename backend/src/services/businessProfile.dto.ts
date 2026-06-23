import { absolutizePublicMediaPath } from "../utils/publicMediaUrl.js";
import type { BusinessSubscriptionTier, BusinessVerificationStatus } from "@prisma/client";
import {
  toPublicGuestBrandingDto,
  type PublicGuestBrandingDto,
} from "./businessBranding.dto.js";

/** Fields safe for unauthenticated tipping / QR landing consumers. */
export type PublicBusinessProfileDto = {
  businessId: string;
  businessName: string;
  slug: string;
  logo: string | null;
  coverImage: string | null;
  publicLocation: string | null;
  description: string | null;
  /** Legacy aliases used by the SPA tipping flow. */
  id: string;
  name: string;
  location: string | null;
  type: string | null;
  /** Guest-facing premium branding (tier-resolved server-side). */
  branding: PublicGuestBrandingDto;
};

/** Manager-authenticated profile (includes operational / KYC fields). */
export type ManagerBusinessProfileDto = PublicBusinessProfileDto & {
  verificationStatus: BusinessVerificationStatus;
  subscriptionTier: BusinessSubscriptionTier;
  employeeCount: number;
  contactPhone: string | null;
  registeredAddress: string | null;
  website: string | null;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  businessType: string | null;
  location: string | null;
  registeredAddress: string | null;
  verificationStatus: BusinessVerificationStatus;
  subscriptionTier: BusinessSubscriptionTier;
  contactPhone: string | null;
  website: string | null;
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
};

export function toPublicBusinessProfileDto(
  business: BusinessRow,
  opts?: { employeeCount?: never },
): PublicBusinessProfileDto {
  void opts;
  const logo = absolutizePublicMediaPath(business.logoPath ?? null);
  const publicLocation = business.location ?? null;
  const branding = toPublicGuestBrandingDto(business);
  return {
    businessId: business.id,
    businessName: business.name,
    slug: business.slug,
    logo,
    coverImage: branding.bannerImagePath,
    publicLocation,
    description: business.businessType ?? null,
    id: business.id,
    name: business.name,
    location: publicLocation,
    type: business.businessType ?? null,
    branding,
  };
}

export function toManagerBusinessProfileDto(
  business: BusinessRow,
  employeeCount: number,
): ManagerBusinessProfileDto {
  return {
    ...toPublicBusinessProfileDto(business),
    verificationStatus: business.verificationStatus,
    subscriptionTier: business.subscriptionTier,
    employeeCount,
    contactPhone: business.contactPhone ?? null,
    registeredAddress: business.registeredAddress ?? null,
    website: business.website ?? null,
  };
}

/** Sensitive keys that must never appear on the public business-by-id API. */
export const MANAGER_ONLY_BUSINESS_FIELDS = [
  "verificationStatus",
  "subscriptionTier",
  "employeeCount",
  "contactPhone",
  "registeredAddress",
  "website",
] as const;

export function publicDtoHasSensitiveFields(dto: Record<string, unknown>): boolean {
  return MANAGER_ONLY_BUSINESS_FIELDS.some((k) => dto[k] !== undefined);
}
