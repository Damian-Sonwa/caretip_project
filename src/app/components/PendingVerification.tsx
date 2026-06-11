import { BusinessKycVerificationPage } from "../pages/business/BusinessKycVerificationPage";

/**
 * `/verification-pending` — business verification status (MVP: admin review; upload UI optional).
 */
export function PendingVerification() {
  return (
    <div className="min-h-screen bg-background">
      <BusinessKycVerificationPage />
    </div>
  );
}
