import { useCallback, useEffect, useRef, useState } from "react";
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
  const [buttonWidth, setButtonWidth] = useState(320);
  const containerRef = useRef<HTMLDivElement>(null);
  const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    setGsiMounted(true);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const syncWidth = () => {
      const w = el.getBoundingClientRect().width;
      setButtonWidth(Math.min(400, Math.max(240, Math.floor(w))));
    };

    const ro = new ResizeObserver(syncWidth);
    ro.observe(el);
    syncWidth();
    return () => ro.disconnect();
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
      <p className="text-center text-[11px] text-muted-foreground">
        {t("auth.oauth.envHintBefore")}{" "}
        <code className="rounded bg-muted px-1 text-foreground">
          VITE_GOOGLE_CLIENT_ID
        </code>{" "}
        {t("auth.oauth.envHintOr")}{" "}
        <code className="rounded bg-muted px-1 text-foreground">
          NEXT_PUBLIC_GOOGLE_CLIENT_ID
        </code>{" "}
        {t("auth.oauth.envHintAfter")}
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "caretip-auth-oauth flex w-full justify-center",
        !isLogin && !canOAuthSignUp && "pointer-events-none opacity-40",
        gsiOriginError && "opacity-60",
      )}
      title={!isLogin && !canOAuthSignUp ? t("auth.oauth.signupBlockedTitle") : undefined}
    >
      {gsiMounted ? (
        <GoogleLogin
          key={buttonWidth}
          onSuccess={(cred) => {
            setGsiOriginError(false);
            if (cred.credential) onGoogleCredential(cred.credential);
          }}
          onError={onGoogleError}
          useOneTap={false}
          theme="outline"
          size="large"
          width={buttonWidth}
          logo_alignment="left"
          text={isLogin ? "continue_with" : "signup_with"}
          shape="rectangular"
        />
      ) : (
        <div className="caretip-auth-oauth-mount" aria-hidden />
      )}
    </div>
  );
}
