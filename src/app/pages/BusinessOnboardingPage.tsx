import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { useAuth, getPostAuthRedirect } from "../hooks/useAuth";
import { getAuthSessionFlags } from "../lib/authSessionBootstrap";
import { useRegisterGlobalAppInit } from "../lib/globalAppLoading";
import { GlobalAppLoadingHold } from "../components/GlobalAppLoadingHold";
import { toast } from "sonner";
import { fetchBusinessProfile, patchBusinessProfile, uploadMyBusinessLogo, createBillingCheckoutSession } from "../lib/api";
import {
  clearCheckoutIntent,
  peekCheckoutIntent,
  primeCheckoutSyncExpectation,
  shouldIncludeTrialForIntent,
} from "../lib/checkoutIntent";
import { isOnboardingCompleted, resolveResumeOnboardingStep } from "../lib/onboardingProgress";
import { toUserFriendlyMessage } from "../lib/errorMessages";
import { isApiSubscriptionRequiredError } from "../lib/apiError";
import { logClientError } from "../lib/clientLog";
import { cn } from "@/lib/utils";
import type { OnboardingStep } from "../components/business/BusinessOnboardingProgress";
import {
  BusinessOnboardingFootnote,
  BusinessOnboardingHeader,
  BusinessOnboardingProgressHeader,
} from "../components/business/BusinessOnboardingShell";
import { BusinessOnboardingGuestPreview } from "../components/business/BusinessOnboardingGuestPreview";
import { BusinessOnboardingLogoUpload } from "../components/business/BusinessOnboardingLogoUpload";
import { BusinessOnboardingFinishCta } from "../components/business/BusinessOnboardingFinishCta";
import { BusinessOnboardingReviewSummary } from "../components/business/BusinessOnboardingReviewSummary";
import {
  BusinessOnboardingSelectField,
  BusinessOnboardingTextField,
} from "../components/business/BusinessOnboardingFormField";
import {
  onboardingContinueBtn,
  onboardingDisplayFont,
  onboardingHeadline,
  onboardingSubhead,
} from "../components/business/businessOnboardingUi";
import { BUSINESS_TYPE_OPTIONS } from "../lib/businessVenueOptions";

const PAGE_HEADLINE_KEYS = [
  "business.onboarding.stepTitle.businessDetails",
  "business.onboarding.stepTitle.brandingSetup",
  "business.onboarding.finalStep.headline",
] as const;

const PAGE_DESC_KEYS = [
  "business.onboarding.stepHint.businessDetails",
  "business.onboarding.stepHint.brandingSetup",
  "business.onboarding.finalStep.description",
] as const;

export function BusinessOnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, sessionValidated, setHasCompletedOnboarding, refetchUser, logout } = useAuth();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [syncingOnboarding, setSyncingOnboarding] = useState(true);

  const [legalBusinessName, setLegalBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [savedLogoPath, setSavedLogoPath] = useState<string | null>(null);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(savedLogoPath);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile, savedLogoPath]);

  useEffect(() => {
    if (!sessionValidated || !user) return;

    if (isOnboardingCompleted(user)) {
      navigate(getPostAuthRedirect(user), { replace: true });
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const { onboardingStatusFromServer } = getAuthSessionFlags();
        const fresh = onboardingStatusFromServer ? user : await refetchUser();
        if (cancelled) return;

        if (fresh && isOnboardingCompleted(fresh)) {
          navigate(getPostAuthRedirect(fresh), { replace: true });
          return;
        }

        const profile = await fetchBusinessProfile({ silent: true }).catch(() => null);
        if (cancelled) return;

        if (profile) {
          setLegalBusinessName(profile.name ?? "");
          setBusinessType(profile.type ?? "");
          setRegisteredAddress(profile.registeredAddress ?? "");
          setContactPhone(profile.contactPhone ?? "");
          setWebsite(profile.website ?? "");
          setSavedLogoPath(profile.logo ?? null);
          setEmployeeCount(profile.employeeCount ?? 0);
          setStep(resolveResumeOnboardingStep(profile, profile.onboardingStep ?? fresh?.onboardingStep));
        } else if (fresh?.onboardingStep) {
          setStep(fresh.onboardingStep);
        }
      } catch (err) {
        logClientError("BusinessOnboardingPage.syncOnboarding", err);
      } finally {
        if (!cancelled) setSyncingOnboarding(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, refetchUser, sessionValidated, user]);

  const canContinue = useMemo(() => {
    if (step === 1) return legalBusinessName.trim().length > 1 && businessType.trim().length > 0;
    if (step === 2) return registeredAddress.trim().length > 3;
    return true;
  }, [step, legalBusinessName, businessType, registeredAddress]);

  const previewData = useMemo(
    () => ({
      legalBusinessName,
      businessType,
      registeredAddress,
      contactPhone,
      website,
      logoFile,
      savedLogoPath,
      employeeCount,
      onboardingStep: 3 as OnboardingStep,
      businessId: user?.businessId,
    }),
    [
      legalBusinessName,
      businessType,
      registeredAddress,
      contactPhone,
      website,
      logoFile,
      savedLogoPath,
      employeeCount,
      user?.businessId,
    ],
  );

  const saveStep = async (targetStep: OnboardingStep) => {
    if (targetStep === 1) {
      await patchBusinessProfile({
        legalBusinessName: legalBusinessName.trim(),
        businessType: businessType.trim() || null,
      });
      return;
    }
    if (targetStep === 2) {
      await patchBusinessProfile({
        registeredAddress: registeredAddress.trim() || null,
        contactPhone: contactPhone.trim() || null,
        website: website.trim() || null,
      });
      if (logoFile) {
        try {
          const uploaded = await uploadMyBusinessLogo(logoFile);
          setSavedLogoPath(uploaded.path ?? null);
        } catch (err) {
          setLogoFile(null);
          if (isApiSubscriptionRequiredError(err)) {
            toast.info(t("business.onboarding.toastLogoDeferred"));
          } else {
            toast.error(toUserFriendlyMessage(err));
          }
        }
      }
      return;
    }
  };

  const handleAuthFailure = () => {
    logout();
    toast.error(t("business.onboarding.toastSessionExpired"));
    navigate("/login", { replace: true });
  };

  const goBack = () => {
    if (busy || step === 1) return;
    setStep((s) => (s === 2 ? 1 : 2));
  };

  const goForward = async () => {
    if (busy || !canContinue) return;
    setBusy(true);
    try {
      if (step !== 3) {
        await saveStep(step);
        setStep((s) => (s === 1 ? 2 : 3));
        return;
      }
      const updated = await setHasCompletedOnboarding(true);
      const refreshed = (await refetchUser()) ?? updated;
      if (!refreshed) {
        toast.success(t("business.onboarding.toastSavedLoadingDashboard"));
        navigate("/dashboard", { replace: true });
        return;
      }

      const checkoutIntent = peekCheckoutIntent();
      if (checkoutIntent && checkoutIntent.planKey !== "enterprise") {
        try {
          primeCheckoutSyncExpectation(checkoutIntent.planKey);
          const session = await createBillingCheckoutSession({
            planKey: checkoutIntent.planKey,
            billingCycle: checkoutIntent.billingCycle,
            includeTrial: shouldIncludeTrialForIntent(checkoutIntent),
            checkoutFlow: "onboarding",
          });
          clearCheckoutIntent();
          if (session.url) {
            window.location.assign(session.url);
            return;
          }
          toast.error(t("business.billing.checkoutNoUrl"));
        } catch (err) {
          toast.error(toUserFriendlyMessage(err) || t("business.billing.checkoutError"));
        }
      }

      navigate(getPostAuthRedirect(refreshed), { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Authentication required") || msg.includes("Invalid or expired token")) {
        handleAuthFailure();
        return;
      }
      toast.error(toUserFriendlyMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const redirectingToDashboard = Boolean(user && isOnboardingCompleted(user));
  const pageInitBlocking = syncingOnboarding || redirectingToDashboard;

  useRegisterGlobalAppInit("onboarding-init", pageInitBlocking);

  if (pageInitBlocking) {
    return <GlobalAppLoadingHold />;
  }

  const isReviewStep = step === 3;

  return (
    <div className="business-onboarding-page flex min-h-screen flex-col">
      <BusinessOnboardingHeader />

      <main className="business-onboarding-main flex-1">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="business-onboarding-shell mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"
        >
          <div className="space-y-8 lg:space-y-10">
            <BusinessOnboardingProgressHeader step={step} />

            <div
              className={cn(
                "business-onboarding-split",
                isReviewStep ? "business-onboarding-split--final" : "business-onboarding-split--entry",
              )}
            >
              <div className="business-onboarding-workspace min-w-0 space-y-8">
                <header className="space-y-2">
                  <h1
                    id="onboarding-page-title"
                    className={onboardingHeadline}
                    style={{ fontFamily: onboardingDisplayFont }}
                  >
                    {t(PAGE_HEADLINE_KEYS[step - 1])}
                  </h1>
                  <p className={onboardingSubhead}>{t(PAGE_DESC_KEYS[step - 1])}</p>
                </header>

                <section className="space-y-6" aria-labelledby="onboarding-page-title">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {step === 1 ? (
                        <>
                          <BusinessOnboardingTextField
                            label={t("business.onboarding.fields.legalName")}
                            placeholder={t("business.onboarding.fields.legalNamePlaceholder")}
                            value={legalBusinessName}
                            onChange={setLegalBusinessName}
                          />
                          <BusinessOnboardingSelectField
                            label={t("business.onboarding.fields.businessType")}
                            value={businessType}
                            onChange={setBusinessType}
                            placeholder={t("business.onboarding.fields.businessTypePlaceholder")}
                          >
                            {BUSINESS_TYPE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {t(opt.labelKey)}
                              </option>
                            ))}
                          </BusinessOnboardingSelectField>
                        </>
                      ) : null}

                      {step === 2 ? (
                        <>
                          <BusinessOnboardingLogoUpload file={logoFile} onFile={setLogoFile} />
                          <BusinessOnboardingTextField
                            label={t("business.onboarding.fields.address")}
                            placeholder={t("business.onboarding.fields.addressPlaceholder")}
                            value={registeredAddress}
                            onChange={setRegisteredAddress}
                          />
                          <BusinessOnboardingTextField
                            label={t("business.onboarding.fields.phone")}
                            placeholder={t("business.onboarding.fields.phonePlaceholder")}
                            value={contactPhone}
                            onChange={setContactPhone}
                          />
                          <BusinessOnboardingTextField
                            label={t("business.onboarding.fields.website")}
                            placeholder={t("business.onboarding.fields.optional")}
                            value={website}
                            onChange={setWebsite}
                          />
                        </>
                      ) : null}

                      {step === 3 ? (
                        <BusinessOnboardingReviewSummary
                          legalBusinessName={legalBusinessName}
                          businessType={businessType}
                          registeredAddress={registeredAddress}
                          contactPhone={contactPhone}
                          website={website}
                          logoPreviewUrl={logoPreviewUrl}
                        />
                      ) : null}
                    </motion.div>
                  </AnimatePresence>

                  {!isReviewStep ? (
                    <div className="space-y-4 pt-2">
                      <button
                        type="button"
                        onClick={() => void goForward()}
                        disabled={!canContinue || busy}
                        aria-busy={busy}
                        className={cn(onboardingContinueBtn, "w-full sm:max-w-md")}
                      >
                        {busy ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            {t("business.onboarding.actions.saving")}
                          </>
                        ) : (
                          t("business.onboarding.actions.continue")
                        )}
                      </button>
                    </div>
                  ) : null}

                  {step > 1 && !isReviewStep ? (
                    <button
                      type="button"
                      onClick={goBack}
                      disabled={busy}
                      className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                      {t("business.onboarding.actions.back")}
                    </button>
                  ) : null}
                </section>
              </div>

              {isReviewStep ? (
                <>
                  <aside
                    className="business-onboarding-preview-aside min-w-0"
                    aria-label={t("business.onboarding.preview.panelAria")}
                  >
                    <BusinessOnboardingGuestPreview {...previewData} variant="final" />
                  </aside>
                  <div className="business-onboarding-finish-slot min-w-0">
                    <BusinessOnboardingFinishCta
                      busy={busy}
                      disabled={!canContinue}
                      onFinish={() => void goForward()}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={busy}
                    className="business-onboarding-back-slot text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    {t("business.onboarding.actions.back")}
                  </button>
                </>
              ) : null}
            </div>

            <BusinessOnboardingFootnote />
          </div>
        </motion.div>
      </main>
    </div>
  );
}
