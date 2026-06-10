import type { BusinessVerificationStatus } from "@prisma/client";

/** Product capabilities gated by admin KYC / go-live approval. */
export type BusinessVerificationCapability =
  | "setup"
  | "qrCodes"
  | "activateTipping"
  | "receiveTips";

export type BusinessVerificationCapabilityFlags = {
  /** Venue setup: staff, locations, tables, profile, dashboard, invites. */
  canAccessSetupFeatures: boolean;
  /** Production QR URLs / slug regeneration for public guest flows. */
  canGenerateQrCodes: boolean;
  /** Public tipping surfaces (QR landing, staff directory) may activate. */
  canActivateTipping: boolean;
  /** Stripe checkout and tip ledger acceptance. */
  canReceiveTips: boolean;
};

export const GO_LIVE_REQUIRED_CODE = "GO_LIVE_REQUIRED" as const;
export const GO_LIVE_REQUIRED_MESSAGE =
  "This feature is available after your venue is approved to go live.";

type ResolveOpts = {
  impersonating?: boolean;
  superAdmin?: boolean;
};

/**
 * Verification is a go-live gate, not a platform-access gate.
 * Pending managers may configure the venue; public tipping stays locked until `verified`.
 */
export function resolveBusinessVerificationCapabilities(
  status: BusinessVerificationStatus | null | undefined,
  opts?: ResolveOpts,
): BusinessVerificationCapabilityFlags {
  if (opts?.impersonating || opts?.superAdmin) {
    return {
      canAccessSetupFeatures: true,
      canGenerateQrCodes: true,
      canActivateTipping: true,
      canReceiveTips: true,
    };
  }

  const verified = status === "verified";
  const hasBusiness = status != null;

  return {
    canAccessSetupFeatures: hasBusiness && status !== "rejected",
    canGenerateQrCodes: verified,
    canActivateTipping: verified,
    canReceiveTips: verified,
  };
}

export function hasBusinessVerificationCapability(
  status: BusinessVerificationStatus | null | undefined,
  capability: Exclude<BusinessVerificationCapability, "setup">,
  opts?: ResolveOpts,
): boolean {
  const flags = resolveBusinessVerificationCapabilities(status, opts);
  switch (capability) {
    case "qrCodes":
      return flags.canGenerateQrCodes;
    case "activateTipping":
      return flags.canActivateTipping;
    case "receiveTips":
      return flags.canReceiveTips;
    default:
      return false;
  }
}
