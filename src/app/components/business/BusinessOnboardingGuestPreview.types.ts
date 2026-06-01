import type { OnboardingStep } from "./BusinessOnboardingProgress";

export type GuestPreviewData = {
  legalBusinessName: string;
  businessType: string;
  registeredAddress: string;
  contactPhone: string;
  website: string;
  logoFile: File | null;
  /** Persisted logo from profile (shown before step-3 upload). */
  savedLogoPath: string | null;
  employeeCount: number;
  onboardingStep: OnboardingStep;
};
