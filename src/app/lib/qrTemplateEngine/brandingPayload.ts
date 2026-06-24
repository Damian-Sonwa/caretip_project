import type { QrBrandingOptions } from "../businessBranding";
import type { QrStudioDesignExtras } from "../qrDesignSystem";
import {
  QR_TEMPLATE_FIELD_IDS,
  type QrTemplateBrandingPayload,
  type QrTemplateDefinition,
  type QrTemplateFieldId,
} from "./types";

export type QrTemplateProfileSlice = {
  registeredAddress?: string | null;
  location?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  website?: string | null;
};

function defaultVisibility(def: QrTemplateDefinition): Record<QrTemplateFieldId, boolean> {
  const vis = {} as Record<QrTemplateFieldId, boolean>;
  for (const field of QR_TEMPLATE_FIELD_IDS) {
    const supported = def.supportedFields.includes(field);
    vis[field] = supported && (def.defaultFieldVisibility[field] ?? false);
  }
  for (const req of def.requiredFields) {
    vis[req] = true;
  }
  return vis;
}

export function mergeFieldVisibility(
  def: QrTemplateDefinition,
  overrides?: Partial<Record<QrTemplateFieldId, boolean>>,
): Record<QrTemplateFieldId, boolean> {
  const base = defaultVisibility(def);
  if (!overrides) return base;
  const merged = { ...base };
  for (const field of QR_TEMPLATE_FIELD_IDS) {
    if (overrides[field] !== undefined && def.supportedFields.includes(field)) {
      merged[field] = overrides[field]!;
    }
  }
  for (const req of def.requiredFields) {
    merged[req] = true;
  }
  return merged;
}

export function buildQrTemplateBrandingPayload(input: {
  branding: QrBrandingOptions;
  profile?: QrTemplateProfileSlice | null;
  extras?: Pick<
    QrStudioDesignExtras,
    "ctaText" | "websiteUrl" | "socialInstagram" | "socialFacebook" | "templateFieldVisibility"
  > | null;
  template: QrTemplateDefinition;
}): QrTemplateBrandingPayload {
  const { branding, profile, extras, template } = input;
  const premium = branding.premium === true;

  const address =
    profile?.registeredAddress?.trim() || profile?.location?.trim() || null;
  const website = extras?.websiteUrl?.trim() || profile?.website?.trim() || null;

  return {
    premium,
    logoUrl: premium ? branding.centerLogoUrl : null,
    businessName: branding.businessName.trim(),
    tagline: premium ? branding.brandTagline?.trim() || null : null,
    welcomeMessage: premium ? branding.welcomeMessage?.trim() || null : null,
    thankYouMessage: premium ? branding.thankYouMessage?.trim() || null : null,
    ctaText: premium ? extras?.ctaText?.trim() || branding.ctaText?.trim() || "Scan to tip" : null,
    address: premium ? address : null,
    phone: premium ? profile?.contactPhone?.trim() || null : null,
    email: premium ? profile?.contactEmail?.trim() || null : null,
    website: premium ? website : null,
    socialInstagram: premium ? extras?.socialInstagram?.trim() || null : null,
    socialFacebook: premium ? extras?.socialFacebook?.trim() || null : null,
    primaryColor: branding.primaryColor,
    secondaryColor: branding.secondaryColor,
    qrAccentColor: branding.qrAccentColor?.trim() || branding.primaryColor,
    qrModuleLight: "#FFFFFF",
    fieldVisibility: mergeFieldVisibility(template, extras?.templateFieldVisibility),
  };
}
