import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthRecoveryLayout } from "@/app/components/auth/AuthRecoveryLayout";
import { resetPasswordWithToken } from "@/app/lib/api";
import { isPasswordStrong } from "@/app/lib/passwordValidation";
import { toUserFriendlyMessage } from "@/app/lib/errorMessages";
import { logClientError } from "@/app/lib/clientLog";

const FIELD =
  "w-full rounded-lg border border-neutral-200 bg-[#F3F4F6] px-3 py-2.5 pr-11 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] shadow-none transition focus:border-[#EB992C] focus:outline-none focus:ring-[3px] focus:ring-[#EB992C]/25";

export function ResetPasswordPage() {
  const { token: tokenParam } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const rawToken = tokenParam ? decodeURIComponent(tokenParam) : "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const match = newPassword.length > 0 && newPassword === confirm;
  const strong = isPasswordStrong(newPassword);
  const canSubmit = match && strong && !submitting && rawToken.length > 0;

  const mismatchHint = useMemo(() => {
    if (confirm.length === 0) return null;
    if (newPassword === confirm) return null;
    return "Passwords do not match.";
  }, [newPassword, confirm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setSubmitting(true);
    try {
      await resetPasswordWithToken(rawToken, newPassword);
      setDone(true);
    } catch (err) {
      logClientError("ResetPasswordPage", err);
      setError(toUserFriendlyMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!rawToken) {
    return (
      <AuthRecoveryLayout>
        <p className="text-center text-sm text-red-600">This reset link is invalid.</p>
        <Link to="/forgot-password" className="mt-4 block text-center text-sm font-medium text-[#EB992C] hover:underline">
          Request a new link
        </Link>
      </AuthRecoveryLayout>
    );
  }

  if (done) {
    return (
      <AuthRecoveryLayout showFooterLink={false}>
        <div className="space-y-4 text-center">
          <h1 className="text-xl font-bold text-[#1F2937] sm:text-2xl">Password updated</h1>
          <p className="text-sm text-[#6B7280]">You can sign in with your new password.</p>
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#EB992C] text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            Back to login
          </button>
        </div>
      </AuthRecoveryLayout>
    );
  }

  return (
    <AuthRecoveryLayout>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-bold text-[#1F2937] sm:text-2xl">Set a new password</h1>
          <p className="text-sm text-[#6B7280]">Choose a strong password you haven&apos;t used elsewhere.</p>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label htmlFor="reset-new" className="mb-2 block text-left text-xs font-medium text-[#6B7280]">
              New password
            </label>
            <div className="relative">
              <input
                id="reset-new"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={FIELD}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1F2937]"
                onClick={() => setShowNew(!showNew)}
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="reset-confirm" className="mb-2 block text-left text-xs font-medium text-[#6B7280]">
              Confirm new password
            </label>
            <div className="relative">
              <input
                id="reset-confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={FIELD}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1F2937]"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {mismatchHint ? (
              <p className="mt-1 text-xs font-medium text-red-600">{mismatchHint}</p>
            ) : null}
          </div>
          {error ? (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <motion.button
            type="submit"
            disabled={!canSubmit}
            whileHover={canSubmit ? { y: -3 } : undefined}
            whileTap={canSubmit ? { scale: 0.98 } : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#EB992C] text-sm font-semibold text-white shadow-md transition-[box-shadow,transform] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden />
                Saving…
              </>
            ) : (
              "Update password"
            )}
          </motion.button>
          {!strong && newPassword.length > 0 ? (
            <p className="text-center text-xs text-[#6B7280]">
              Use 8+ characters with upper, lower, number, and special (e.g. @#$%).
            </p>
          ) : null}
        </form>
      </div>
    </AuthRecoveryLayout>
  );
}
