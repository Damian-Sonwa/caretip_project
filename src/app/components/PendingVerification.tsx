import { BusinessKycVerificationPage } from "../pages/business/BusinessKycVerificationPage";

/**
 * `/verification-pending` — manager KYC upload + live status (Sprint 3).
 */
export function PendingVerification() {
  return (
    <div className="min-h-screen bg-background">
      <BusinessKycVerificationPage />
    </div>
  );
}
