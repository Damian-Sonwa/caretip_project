import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import { fetchBusinessProfile } from "../lib/api";
import { useSocket } from "./useSocket";
import { logClientError } from "../lib/clientLog";

function mapVerificationStatus(
  v: "pending" | "verified" | "rejected" | undefined,
): "PENDING" | "APPROVED" | "REJECTED" | undefined {
  if (v === "pending") return "PENDING";
  if (v === "verified") return "APPROVED";
  if (v === "rejected") return "REJECTED";
  return undefined;
}

/**
 * Keeps manager `user.status` in sync and surfaces approval/rejection toasts.
 */
export function useBusinessVerificationRealtime(enabled: boolean): void {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const prevStatusRef = useRef(user?.status);
  const { socket } = useSocket(enabled);

  useEffect(() => {
    prevStatusRef.current = user?.status;
  }, [user?.status]);

  useEffect(() => {
    if (!enabled || !user || user.role !== "business" || user.impersonation) return;

    const sync = async () => {
      try {
        const p = await fetchBusinessProfile({ silent: true });
        const next = mapVerificationStatus(p.verificationStatus);
        if (!next) return;

        const prev = prevStatusRef.current;
        updateUser({ status: next });
        prevStatusRef.current = next;

        if (prev === "PENDING" && next === "APPROVED") {
          toast.success(t("business.verification.approvedToastTitle"), {
            description: t("business.verification.approvedToastBody"),
            duration: 8000,
          });
        } else if (prev === "PENDING" && next === "REJECTED") {
          toast.error(t("business.verification.rejectedToastTitle"), {
            description: t("business.verification.rejectedToastBody"),
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
    return () => {
      socket.off("verification_updated", onUpdate);
    };
  }, [enabled, socket, t, updateUser, user?.id, user?.impersonation, user?.role]);
}
