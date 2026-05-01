import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Building2, Globe2, ImagePlus, Loader2, MapPin, Phone } from "lucide-react";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import { patchBusinessProfile, uploadMyBusinessLogo } from "../lib/api";

export function BusinessOnboardingPage() {
  const navigate = useNavigate();
  const { setHasCompletedOnboarding, refetchUser } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [legalBusinessName, setLegalBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const canContinue = useMemo(() => {
    if (step === 1) return legalBusinessName.trim().length > 1 && businessType.trim().length > 0;
    if (step === 2) return registeredAddress.trim().length > 3;
    return true;
  }, [step, legalBusinessName, businessType, registeredAddress]);

  const saveStep = async (targetStep: 1 | 2 | 3) => {
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

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-white dark:bg-neutral-950">
      <Navigation />
      <main className="flex flex-1 items-center justify-center px-4 py-14">
        <div className="w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="rounded-3xl border border-gray-200 bg-white p-8 shadow-[0_18px_50px_rgba(0,0,0,0.06)] dark:border-neutral-800 dark:bg-neutral-950"
          >
            <div className="mb-8">
              <p className="text-sm font-semibold text-primary">Business onboarding</p>
              <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl">
                Set up your business profile
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                This information powers your business profile. You can edit it later.
              </p>
              <div className="mt-5 flex items-center justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                <span className={step === 1 ? "text-neutral-900 dark:text-neutral-100" : ""}>Step 1 of 3</span>
                <span className={step === 2 ? "text-neutral-900 dark:text-neutral-100" : ""}>Step 2 of 3</span>
                <span className={step === 3 ? "text-neutral-900 dark:text-neutral-100" : ""}>Step 3 of 3</span>
              </div>
            </div>

            {step === 1 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <OnboardingField
                  icon={<Building2 className="h-4 w-4 text-primary" />}
                  label="Legal business name"
                  placeholder="e.g. CareTip Hospitality Ltd"
                  value={legalBusinessName}
                  onChange={setLegalBusinessName}
                />
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </span>
                    Business type
                  </span>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-medium text-neutral-900 shadow-none transition focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/25 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                  >
                    <option value="">Select a type</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Salon">Salon</option>
                    <option value="Bar">Bar</option>
                    <option value="Cafe">Cafe</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <OnboardingField
                  icon={<MapPin className="h-4 w-4 text-primary" />}
                  label="Address"
                  placeholder="Street, city, postal code"
                  value={registeredAddress}
                  onChange={setRegisteredAddress}
                />
                <OnboardingField
                  icon={<Phone className="h-4 w-4 text-primary" />}
                  label="Phone number"
                  placeholder="Optional"
                  value={contactPhone}
                  onChange={setContactPhone}
                />
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                      <ImagePlus className="h-4 w-4 text-primary" />
                    </span>
                    Logo upload
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-medium text-neutral-900 shadow-none transition focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/25 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                  <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                    Optional. PNG or JPEG works best.
                  </p>
                </label>
                <OnboardingField
                  icon={<Globe2 className="h-4 w-4 text-primary" />}
                  label="Website"
                  placeholder="Optional"
                  value={website}
                  onChange={setWebsite}
                />
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={async () => {
                  if (step === 1) {
                    navigate("/dashboard", { replace: true });
                    return;
                  }
                  setStep((s) => (s === 2 ? 1 : 2));
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-neutral-900 shadow-none transition hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={async () => {
                  setBusy(true);
                  try {
                    if (!canContinue) return;

                    if (step !== 3) {
                      await saveStep(step);
                      setStep((s) => (s === 1 ? 2 : 3));
                      return;
                    }

                    await saveStep(3);
                    const saved = await setHasCompletedOnboarding(true);
                    if (!saved?.hasCompletedOnboarding) {
                      toast.error("We could not finish onboarding. Please try again.");
                      return;
                    }
                    await refetchUser();
                    navigate("/dashboard", { replace: true });
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={!canContinue}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(235,153,44,0.28)] transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  <>
                    {step === 3 ? "Finish setup" : "Continue"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer variant="minimal" surface="dark" />
    </div>
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
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
          {props.icon}
        </span>
        {props.label}
      </span>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-medium text-neutral-900 shadow-none transition focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/25 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
      />
    </label>
  );
}

