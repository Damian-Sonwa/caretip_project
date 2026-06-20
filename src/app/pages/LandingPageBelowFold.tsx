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
import { DeferredBelowFold } from "@/lib/publicRouteDefer";
/** Reversible: set true to restore #social-proof (PDF adjustment — hide testimonials & trust stats). */
export const SHOW_LANDING_SOCIAL_PROOF = false;

/** Below-the-fold landing sections — lazy-loaded after hero paints. */
export function LandingPageBelowFold() {
  return (
    <>
      <DeferredBelowFold minHeight="52rem" rootMargin="320px 0px">
        <HospitalityTeamsUnifiedSection />
        <SimpleSetupSection />
      </DeferredBelowFold>
      <DeferredBelowFold minHeight="44rem" rootMargin="240px 0px">
        <EmployeeLandingSection />
        <BusinessLandingSection />
      </DeferredBelowFold>
      <DeferredBelowFold minHeight="36rem" rootMargin="240px 0px">
        <LandingFeaturesSection />
        <PaymentsSection />
      </DeferredBelowFold>
      <DeferredBelowFold minHeight="40rem" rootMargin="200px 0px">
        <LandingRealLifeSection />
        <LandingMotivationSection />
      </DeferredBelowFold>
      {SHOW_LANDING_SOCIAL_PROOF ? (
        <DeferredBelowFold minHeight="24rem" rootMargin="200px 0px">
          <LandingSocialProofSection />
        </DeferredBelowFold>
      ) : null}
      <DeferredBelowFold minHeight="18rem" rootMargin="200px 0px">
        <LandingFinalCtaSection />
      </DeferredBelowFold>
    </>
  );
}