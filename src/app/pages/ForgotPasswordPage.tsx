import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Loader2 } from "lucide-react";
import { AuthRecoveryLayout } from "@/app/components/auth/AuthRecoveryLayout";
import { requestPasswordReset } from "@/app/lib/api";
import { toUserFriendlyMessage } from "@/app/lib/errorMessages";
import { logClientError } from "@/app/lib/clientLog";

import { caretipBtnPrimaryFull } from "@/lib/caretipButtonSystem";
import { cn } from "@/lib/utils";

export function ForgotPasswordPage() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(t("auth.forgot.errorInvalidEmail"));
      return;
    }
    setSubmitting(true);
    try {
      const loc = i18n.resolvedLanguage?.toLowerCase().startsWith("de") ? "de" : "en";
      await requestPasswordReset(trimmed, loc);
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
          <h1 className="caretip-auth-title !pt-0">{t("auth.forgot.sentTitle")}</h1>
          <p className="caretip-auth-subtitle !mt-2">
            {t("auth.forgot.sentBody", { email: email.trim() })}
          </p>
          <Link
            to="/login"
            className={cn(caretipBtnPrimaryFull, "caretip-auth-submit no-underline")}
          >
            {t("auth.forgot.backToLogin")}
          </Link>
        </div>
      </AuthRecoveryLayout>
    );
  }

  return (
    <AuthRecoveryLayout>
      <div className="space-y-6">
        <div className="caretip-auth-header !mb-5">
          <h1 className="caretip-auth-title !pt-0">{t("auth.forgot.title")}</h1>
          <p className="caretip-auth-subtitle">
            {t("auth.forgot.subtitle")}
          </p>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="caretip-auth-form" noValidate>
          <div>
            <label htmlFor="forgot-email" className="caretip-auth-label">
              {t("auth.forgot.emailLabel")}
            </label>
            <input
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="caretip-auth-field"
              placeholder="you@example.com"
            />
          </div>
          {error ? (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className={cn(caretipBtnPrimaryFull, "caretip-auth-submit gap-2 disabled:cursor-not-allowed")}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden />
                {t("auth.forgot.sending")}
              </>
            ) : (
              t("auth.forgot.sendResetLink")
            )}
          </button>
        </form>
      </div>
    </AuthRecoveryLayout>
  );
}
