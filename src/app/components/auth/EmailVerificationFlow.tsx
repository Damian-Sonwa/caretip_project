import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  EmailVerificationSuccessScreen,
  EmailVerificationVerifyingScreen,
} from "@/app/components/auth/EmailVerificationSuccessScreen";
import { markEmailVerificationUrlComplete } from "@/app/lib/emailVerificationRedirect";
import { verifyEmailWithToken } from "@/app/lib/api";
import { toUserFriendlyMessage } from "@/app/lib/errorMessages";
import { authDebug } from "@/app/lib/authDebugLog";

type VerifyPhase = "verifying" | "success";

/** Token link from email — verify once, then show success until user continues to login. */
export function VerifyEmailFromToken({ token }: { token: string }) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<VerifyPhase>("verifying");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await verifyEmailWithToken(token);
        if (cancelled) return;
        authDebug("email_verify", { phase: "api_ok" });
        markEmailVerificationUrlComplete();
        setPhase("success");
      } catch (e) {
        if (cancelled) return;
        const msg = toUserFriendlyMessage(e);
        authDebug("email_verify", { phase: "error", message: msg });
        navigate("/verify-email", { replace: true, state: { verifyError: msg } });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  if (phase === "success") {
    return <EmailVerificationSuccessScreen />;
  }

  return <EmailVerificationVerifyingScreen />;
}

/** Refresh-safe `?verified=1` — show success screen (no automatic navigation). */
export function VerifyEmailConfirmedView() {
  return <EmailVerificationSuccessScreen />;
}
