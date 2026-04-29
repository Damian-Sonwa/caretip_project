import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { AuthRecoveryLayout } from "@/app/components/auth/AuthRecoveryLayout";
import { requestPasswordReset } from "@/app/lib/api";
import { toUserFriendlyMessage } from "@/app/lib/errorMessages";
import { logClientError } from "@/app/lib/clientLog";

const FIELD =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-none transition focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/25 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-400";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordReset(trimmed);
      setSent(true);
    } catch (err) {
      logClientError("ForgotPasswordPage", err);
      setError(toUserFriendlyMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthRecoveryLayout showFooterLink={false}>
        <div className="space-y-4 text-center">
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-2xl">Check your inbox</h1>
          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            If an account exists for <span className="font-medium text-neutral-900 dark:text-neutral-100">{email.trim()}</span>, we sent a
            link to reset your password. The link expires in one hour.
          </p>
          <Link
            to="/login"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            Back to login
          </Link>
        </div>
      </AuthRecoveryLayout>
    );
  }

  return (
    <AuthRecoveryLayout>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-2xl">Reset your password</h1>
          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            Enter your email and we&apos;ll send you a link to get back into your account.
          </p>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="forgot-email" className="mb-2 block text-left text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Email address
            </label>
            <input
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={FIELD}
              placeholder="you@example.com"
            />
          </div>
          {error ? (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={submitting ? undefined : { y: -3 }}
            whileTap={submitting ? undefined : { scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white shadow-md transition-[box-shadow,transform] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden />
                Sending…
              </>
            ) : (
              "Send reset link"
            )}
          </motion.button>
        </form>
      </div>
    </AuthRecoveryLayout>
  );
}
