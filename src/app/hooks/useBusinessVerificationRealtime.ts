import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import { fetchBusinessProfile } from "../lib/api";
import { useSocket } from "./useSocket";
import { logClientError } from "../lib/clientLog";
import type { OnboardingVerificationStatus } from "../lib/api";

/**
 * Syncs split verification fields and surfaces onboarding approval toasts.
 * KYC toasts are suppressed while document upload remains behind MVP flag.
 */
export function useBusinessVerificationRealtime(enabled: boolean): void {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const prevOnboardingRef = useRef(user?.onboardingVerificationStatus);
  const { socket } = useSocket(enabled);

  useEffect(() => {
    prevOnboardingRef.current = user?.onboardingVerificationStatus;
  }, [user?.onboardingVerificationStatus]);

  useEffect(() => {
    if (!enabled || !user || user.role !== "business" || user.impersonation) return;

    const sync = async () => {
      try {
        const p = await fetchBusinessProfile({ silent: true });
        const prev = prevOnboardingRef.current;
        const next = p.onboardingVerificationStatus as OnboardingVerificationStatus | undefined;

        updateUser({
          onboardingVerificationStatus: p.onboardingVerificationStatus,
        });
        prevOnboardingRef.current = next;

        const wasPending =
          prev === "submitted" || prev === "draft" || prev === undefined;
        if (wasPending && next === "approved") {
          toast.success(t("business.onboardingVerification.approvedToastTitle"), {
            description: t("business.onboardingVerification.approvedToastBody"),
            duration: 8000,
          });
        } else if (prev !== "rejected" && next === "rejected") {
          toast.error(t("business.onboardingVerification.rejectedToastTitle"), {
            description: t("business.onboardingVerification.rejectedToastBody"),
            duration: 10000,
          });
        }
      } catch (err) {
        logClientError("useBusinessVerificationRealtime", err);
      }
    };

    void sync();

    if (!socket) return;
    const onUpdate = () => void sync();
    socket.on("verification_updated", onUpdate);
    socket.on("platform_verification_updated", onUpdate);
    return () => {
      socket.off("verification_updated", onUpdate);
      socket.off("platform_verification_updated", onUpdate);
    };
  }, [enabled, socket, t, updateUser, user?.id, user?.impersonation, user?.role]);
}
