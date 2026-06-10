import { useCallback, useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AuthRole } from "@/components/ui/sign-in-card-2";
import { googleOAuthWebClientId } from "@/app/lib/googleOAuthWebClientId";

type AuthOAuthButtonsProps = {
  isLogin: boolean;
  role: AuthRole;
  formBusy: boolean;
  name: string;
  inviteCode: string;
  onGoogleCredential: (idToken: string) => void;
};

/**
 * Google OAuth only (ID token → POST /api/auth/oauth).
 * Styled for light auth card.
 */
export function AuthOAuthButtons({
  isLogin,
  role,
  formBusy,
  name,
  inviteCode,
  onGoogleCredential,
}: AuthOAuthButtonsProps) {
  const { t } = useTranslation();
  const googleClientId = googleOAuthWebClientId();
  const [gsiOriginError, setGsiOriginError] = useState(false);
  const [gsiMounted, setGsiMounted] = useState(false);
  const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    setGsiMounted(true);
  }, []);

  const onGoogleError = useCallback(() => {
    setGsiOriginError(true);
    if (siteOrigin) {
      toast.error(t("auth.oauth.googleOriginError", { origin: siteOrigin }), {
        id: "caretip-google-gsi-error",
      });
    }
  }, [siteOrigin, t]);

  const canOAuthSignUp =
    isLogin ||
    (role === "business" && true) ||
    (role === "employee" && inviteCode.trim().length > 0 && name.trim().length > 0);

  if (!googleClientId?.trim()) {
    return (
      <p className="text-center text-[11px] text-neutral-600 dark:text-neutral-400">
        {t("auth.oauth.envHintBefore")}{" "}
        <code className="rounded bg-gray-50 px-1 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
          VITE_GOOGLE_CLIENT_ID
        </code>{" "}
        {t("auth.oauth.envHintOr")}{" "}
        <code className="rounded bg-gray-50 px-1 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
          NEXT_PUBLIC_GOOGLE_CLIENT_ID
        </code>{" "}
        {t("auth.oauth.envHintAfter")}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "caretip-auth-oauth flex w-full justify-center [&>div]:!w-full [&_iframe]:!mx-auto",
        !isLogin && !canOAuthSignUp && "pointer-events-none opacity-40",
        gsiOriginError && "opacity-60",
      )}
      title={!isLogin && !canOAuthSignUp ? t("auth.oauth.signupBlockedTitle") : undefined}
    >
      {gsiMounted ? (
        <GoogleLogin
          onSuccess={(cred) => {
            setGsiOriginError(false);
            if (cred.credential) onGoogleCredential(cred.credential);
          }}
          onError={onGoogleError}
          useOneTap={false}
          theme="outline"
          size="large"
          width={400}
          text={isLogin ? "continue_with" : "signup_with"}
          shape="rectangular"
        />
      ) : (
        <div className="caretip-auth-oauth-mount" aria-hidden />
      )}
    </div>
  );
}
