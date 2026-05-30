import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Globe2,
  ImagePlus,
  Loader2,
  MapPin,
  Phone,
} from "lucide-react";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { useAuth } from "../hooks/useAuth";
import { AppLoader } from "../components/AppLoader";
import { toast } from "sonner";
import { patchBusinessProfile, uploadMyBusinessLogo } from "../lib/api";
import { toUserFriendlyMessage } from "../lib/errorMessages";
import { logClientError } from "../lib/clientLog";
import { caretipBtnPrimary } from "@/lib/caretipButtonSystem";
import { cn } from "@/lib/utils";
import { BusinessOnboardingAside } from "../components/business/BusinessOnboardingAside";
import type { OnboardingStep } from "../components/business/BusinessOnboardingProgress";

const STEP_DESC_KEYS = [
  "business.onboarding.stepDesc.businessDetails",
  "business.onboarding.stepDesc.locationDetails",
  "business.onboarding.stepDesc.verificationFinish",
] as const;

export function BusinessOnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, authStatus, setHasCompletedOnboarding, refetchUser, logout } = useAuth();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [syncingOnboarding, setSyncingOnboarding] = useState(true);

  const [legalBusinessName, setLegalBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  /** Sync onboarding completion from the API — never rely on stale localStorage alone. */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const fresh = await refetchUser();
        if (cancelled) return;
        if (fresh?.hasCompletedOnboarding) {
          navigate("/dashboard", { replace: true });
          return;
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
  }, [navigate, refetchUser]);

  const canContinue = useMemo(() => {
    if (step === 1) return legalBusinessName.trim().length > 1 && businessType.trim().length > 0;
    if (step === 2) return registeredAddress.trim().length > 3;
    return true;
  }, [step, legalBusinessName, businessType, registeredAddress]);

  const saveStep = async (targetStep: OnboardingStep) => {
    // Save progressively to the Business table. This is the only source of truth.
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
      });
      return;
    }
    await patchBusinessProfile({
      website: website.trim() || null,
    });
    if (logoFile) {
      await uploadMyBusinessLogo(logoFile);
    }
  };

  const handleAuthFailure = () => {
    logout();
    toast.error(t("business.onboarding.toastSessionExpired"));
    navigate("/login", { replace: true });
  };

  if (authStatus === "initializing" || syncingOnboarding || user?.hasCompletedOnboarding) {
    return <AppLoader />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="business-onboarding-page relative flex min-h-screen flex-col overflow-x-hidden font-sans"
    >
      <Navigation />
      <main className="business-onboarding-main">
        <div className="business-onboarding-split">
          <BusinessOnboardingAside step={step} />

          <section
            className="business-onboarding-form-panel"
            aria-labelledby="business-onboarding-step-heading"
          >
            <div className="business-onboarding-form-card">
              <div className="mb-6">
                <p className="business-onboarding-form-panel__step-meta">
                  {t("business.onboarding.formStepLabel", { current: step, total: 3 })}
                </p>
                <p className="business-onboarding-form-panel__steps-remaining lg:hidden">
                  {3 - step === 0
                    ? t("business.onboarding.stepsRemaining.final")
                    : t("business.onboarding.stepsRemaining", { count: 3 - step })}
                </p>
                <h2
                  id="business-onboarding-step-heading"
                  className="business-onboarding-form-panel__step-title"
                >
                  {t(STEP_DESC_KEYS[step - 1])}
                </h2>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                >
                  {step === 1 ? (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <OnboardingField
                        icon={<Building2 className="h-4 w-4 text-primary" />}
                        label={t("business.onboarding.fields.legalName")}
                        placeholder={t("business.onboarding.fields.legalNamePlaceholder")}
                        value={legalBusinessName}
                        onChange={setLegalBusinessName}
                      />
                      <label className="block">
                        <span className="business-onboarding-field-label">
                          <span className="business-onboarding-field-icon">
                            <Building2 className="h-4 w-4 text-primary" />
                          </span>
                          {t("business.onboarding.fields.businessType")}
                        </span>
                        <select
                          value={businessType}
                          onChange={(e) => setBusinessType(e.target.value)}
                          className="business-onboarding-input"
                        >
                          <option value="">{t("business.onboarding.fields.businessTypePlaceholder")}</option>
                          <option value="Restaurant">{t("business.onboarding.businessTypes.restaurant")}</option>
                          <option value="Hotel">{t("business.onboarding.businessTypes.hotel")}</option>
                          <option value="Salon">{t("business.onboarding.businessTypes.salon")}</option>
                          <option value="Bar">{t("business.onboarding.businessTypes.bar")}</option>
                          <option value="Cafe">{t("business.onboarding.businessTypes.cafe")}</option>
                          <option value="Other">{t("business.onboarding.businessTypes.other")}</option>
                        </select>
                      </label>
                    </div>
                  ) : null}

                  {step === 2 ? (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <OnboardingField
                        icon={<MapPin className="h-4 w-4 text-primary" />}
                        label={t("business.onboarding.fields.address")}
                        placeholder={t("business.onboarding.fields.addressPlaceholder")}
                        value={registeredAddress}
                        onChange={setRegisteredAddress}
                      />
                      <OnboardingField
                        icon={<Phone className="h-4 w-4 text-primary" />}
                        label={t("business.onboarding.fields.phone")}
                        placeholder={t("business.onboarding.fields.optional")}
                        value={contactPhone}
                        onChange={setContactPhone}
                      />
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <label className="block">
                        <span className="business-onboarding-field-label">
                          <span className="business-onboarding-field-icon">
                            <ImagePlus className="h-4 w-4 text-primary" />
                          </span>
                          {t("business.onboarding.fields.logo")}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                          className="business-onboarding-input file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary"
                        />
                        <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                          {t("business.onboarding.fields.logoHint")}
                        </p>
                      </label>
                      <OnboardingField
                        icon={<Globe2 className="h-4 w-4 text-primary" />}
                        label={t("business.onboarding.fields.website")}
                        placeholder={t("business.onboarding.fields.optional")}
                        value={website}
                        onChange={setWebsite}
                      />
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>

              <div className="business-onboarding-actions mt-8 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
                <button
                  type="button"
                  onClick={async () => {
                    if (busy) return;
                    if (step === 1) return;
                    setStep((s) => (s === 2 ? 1 : 2));
                  }}
                  disabled={step === 1}
                  className={cn(
                    "business-onboarding-back inline-flex w-full min-w-0 shrink-0 items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-5 py-3.5 text-sm font-bold text-neutral-900 shadow-none transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-6 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900",
                  )}
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                  {t("business.onboarding.actions.back")}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (busy) return;
                    setBusy(true);
                    try {
                      if (!canContinue) return;

                      if (step !== 3) {
                        await saveStep(step);
                        setStep((s) => (s === 1 ? 2 : 3));
                        return;
                      }

                      await saveStep(3);
                      await setHasCompletedOnboarding(true);
                      const refreshed = await refetchUser();
                      if (!refreshed) {
                        toast.success(t("business.onboarding.toastSavedLoadingDashboard"));
                      }
                      navigate("/dashboard", { replace: true });
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
                  }}
                  disabled={!canContinue || busy}
                  aria-busy={busy}
                  className={cn(
                    caretipBtnPrimary,
                    "business-onboarding-continue",
                    "w-full min-w-0 max-w-full shrink px-5",
                    "sm:ml-auto sm:flex-1 sm:basis-0 sm:px-6",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      {t("business.onboarding.actions.saving")}
                    </>
                  ) : (
                    <>
                      {step === 3
                        ? t("business.onboarding.actions.finish")
                        : t("business.onboarding.actions.continue")}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer variant="minimal" surface="dark" />
    </motion.div>
  );
}

function OnboardingField(props: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="business-onboarding-field-label">
        <span className="business-onboarding-field-icon">{props.icon}</span>
        {props.label}
      </span>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className="business-onboarding-input"
      />
    </label>
  );
}
