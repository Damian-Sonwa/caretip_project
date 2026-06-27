import type { BusinessAccountStatus } from "../hooks/useAuth";

export type BusinessVerificationUiStatus =
  | BusinessAccountStatus
  | "pending"
  | "verified"
  | "rejected"
  | null
  | undefined;

export type BusinessVerificationCapabilityFlags = {
  canAccessSetupFeatures: boolean;
  canGenerateQrCodes: boolean;
  canActivateTipping: boolean;
  canReceiveTips: boolean;
};

function normalizeStatus(
  status: BusinessVerificationUiStatus,
): "pending" | "verified" | "rejected" | null {
  if (status === "APPROVED" || status === "verified") return "verified";
  if (status === "REJECTED" || status === "rejected") return "rejected";
  if (status === "PENDING" || status === "pending") return "pending";
  return null;
}

/** Mirrors backend `resolveBusinessVerificationCapabilities` for UI gating. */
export function resolveBusinessVerificationCapabilities(
  status: BusinessVerificationUiStatus,
  opts?: { impersonating?: boolean },
): BusinessVerificationCapabilityFlags {
  if (opts?.impersonating) {
    return {
      canAccessSetupFeatures: true,
      canGenerateQrCodes: true,
      canActivateTipping: true,
      canReceiveTips: true,
    };
  }

  const normalized = normalizeStatus(status);
  const verified = normalized === "verified";

  return {
    canAccessSetupFeatures: normalized != null && normalized !== "rejected",
    canGenerateQrCodes: verified,
    canActivateTipping: verified,
    canReceiveTips: verified,
  };
}

export function canUseProductionQr(status: BusinessVerificationUiStatus, impersonating?: boolean): boolean {
  return resolveBusinessVerificationCapabilities(status, { impersonating }).canGenerateQrCodes;
}

export type QrStudioVerificationPhase = "in_review" | "action_required" | "rejected";

/** QR Studio verification empty state — submitted docs awaiting admin vs still needs action. */
export function resolveQrStudioVerificationPhase(
  status: BusinessVerificationUiStatus,
): QrStudioVerificationPhase {
  if (status === "REJECTED" || status === "rejected") return "rejected";
  if (status === "PENDING" || status === "pending") return "in_review";
  return "action_required";
}
