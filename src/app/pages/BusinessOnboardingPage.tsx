import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, Building2, Users, QrCode, Loader2 } from "lucide-react";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { useAuth } from "../hooks/useAuth";

export function BusinessOnboardingPage() {
  const navigate = useNavigate();
  const { setHasCompletedOnboarding } = useAuth();
  const [teamSize, setTeamSize] = useState("");
  const [locations, setLocations] = useState("");
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);

  const canContinue = useMemo(() => true, []);

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
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold text-primary">Business onboarding</p>
              <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl">
                A few quick questions
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                This helps CareTip set up your workspace. You can change everything later.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <OnboardingField
                icon={<Users className="h-4 w-4 text-primary" />}
                label="Team size"
                placeholder="e.g. 12"
                value={teamSize}
                onChange={setTeamSize}
              />
              <OnboardingField
                icon={<Building2 className="h-4 w-4 text-primary" />}
                label="Locations"
                placeholder="e.g. 1"
                value={locations}
                onChange={setLocations}
              />
              <OnboardingField
                icon={<QrCode className="h-4 w-4 text-primary" />}
                label="First goal"
                placeholder="e.g. Launch QR codes"
                value={goal}
                onChange={setGoal}
              />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={async () => {
                  setBusy(true);
                  await setHasCompletedOnboarding(true);
                  navigate("/dashboard", { replace: true });
                  setBusy(false);
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
                    Continue to dashboard
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  navigate("/dashboard", { replace: true });
                }}
                className="text-sm font-semibold text-neutral-600 underline-offset-2 hover:underline dark:text-neutral-400"
              >
                Skip for now
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

