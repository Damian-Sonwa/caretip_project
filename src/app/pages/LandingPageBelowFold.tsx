import { HospitalityTeamsUnifiedSection } from "../components/landing/HospitalityTeamsUnifiedSection";
import { SimpleSetupSection } from "../components/landing/SimpleSetupSection";
import { EmployeeLandingSection } from "../components/landing/EmployeeLandingSection";
import { BusinessLandingSection } from "../components/landing/BusinessLandingSection";
import { LandingFeaturesSection } from "../components/landing/LandingFeaturesSection";
import { PaymentsSection } from "../components/landing/PaymentsSection";
import { LandingRealLifeSection } from "../components/landing/LandingRealLifeSection";
import { LandingSocialProofSection } from "../components/landing/LandingSocialProofSection";
import { LandingMotivationSection } from "../components/landing/LandingMotivationSection";
import { LandingFinalCtaSection } from "../components/landing/LandingFinalCtaSection";

/** Reversible: set true to restore #social-proof (PDF adjustment — hide testimonials & trust stats). */
export const SHOW_LANDING_SOCIAL_PROOF = false;

/** Below-the-fold landing sections — mount eagerly; images/animations may still lazy-load internally. */
export function LandingPageBelowFold() {
  return (
    <>
      <HospitalityTeamsUnifiedSection />

      <BusinessLandingSection />
      <EmployeeLandingSection />

      <LandingFeaturesSection />
      <PaymentsSection />

      <LandingRealLifeSection />
      <LandingMotivationSection />

      <SimpleSetupSection />

      {SHOW_LANDING_SOCIAL_PROOF ? <LandingSocialProofSection /> : null}

      <LandingFinalCtaSection />
    </>
  );
}
