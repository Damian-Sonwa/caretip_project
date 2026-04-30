import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, KeyRound, Loader2 } from "lucide-react";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { validateInviteCode } from "../lib/api";
import { toUserFriendlyMessage } from "../lib/errorMessages";
import { logClientError } from "../lib/clientLog";

export function JoinPage() {
  const navigate = useNavigate();
  const params = useParams();
  const prefilledCode = useMemo(() => (params.code ? String(params.code) : ""), [params.code]);
  const [code, setCode] = useState(prefilledCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = code.trim();
    if (!cleaned) return;
    setError("");
    setBusy(true);
    try {
      await validateInviteCode(cleaned);
      navigate(`/signup?role=employee&inviteCode=${encodeURIComponent(cleaned)}`, { replace: true });
    } catch (err) {
      logClientError("JoinPage.validateInvite", err);
      setError(toUserFriendlyMessage(err) || "Invalid or expired invite code");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-white dark:bg-neutral-950">
      <Navigation />
      <main className="flex flex-1 items-center justify-center px-4 py-14">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="w-full max-w-lg"
        >
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-[0_18px_50px_rgba(0,0,0,0.06)] dark:border-neutral-800 dark:bg-neutral-950">
            <div className="mb-6">
              <p className="text-sm font-semibold text-primary">Join your team</p>
              <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl">
                Enter your invite code
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                Your manager will give you a code. It connects your account to the right business.
              </p>
            </div>

            <form onSubmit={handleContinue} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Invite code
                </span>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    inputMode="numeric"
                    placeholder="e.g. 123456"
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm font-semibold tracking-wider text-neutral-900 shadow-none transition focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/25 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                    autoComplete="one-time-code"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={!code.trim() || busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(235,153,44,0.28)] transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Checking…
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {error ? (
              <p className="mt-3 text-center text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
            ) : null}

            <div className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
              Already have an account?{" "}
              <Link to="/login?role=employee" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer variant="minimal" surface="dark" />
    </div>
  );
}

