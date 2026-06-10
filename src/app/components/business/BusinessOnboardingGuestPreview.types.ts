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
  /** Loads real team photos on review step when available. */
  businessId?: string;
};

export type TipPreviewStaffMember = {
  id: string;
  displayName: string;
  photoUrl: string | null;
  roleLabel: string;
  isLive: boolean;
};
