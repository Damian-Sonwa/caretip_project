import { motion } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Star } from "lucide-react";
import { toast } from "sonner";
import { useTipFlow } from "../../context/TipFlowContext";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { clearCustomerFlowEntry } from "../../lib/customerFlowGuard";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { TipPaymentProcessingView } from "./TipPaymentProcessingView";
import { formatEur } from "../../lib/formatEur";
import { customerFlowUi as cf } from "./customerFlowUi";
import { DEV_BYPASS_ENABLED, DEV_MOCK } from "../../lib/devCustomerBypass";
import { useVerifiedTipSession, isVerifiedTipSessionReady } from "../../hooks/useVerifiedTipSession";

export function SuccessPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { amount, employeeName, reset } = useTipFlow();

  const sessionId = searchParams.get("session_id")?.trim() ?? "";
  const isDevMockSession = DEV_BYPASS_ENABLED && sessionId === DEV_MOCK.sessionId;
  const effectiveSessionId = isDevMockSession ? DEV_MOCK.sessionId : sessionId;

  const verification = useVerifiedTipSession(effectiveSessionId, {
    enabled: Boolean(effectiveSessionId.trim()),
    allowDevMock: isDevMockSession,
  });
  const verified = isVerifiedTipSessionReady(verification);

  const tipAmount = amount != null && Number.isFinite(amount) && amount > 0 ? amount : null;
  const displayEmployeeName =
    verification.phase === "ready"
      ? verification.context.employee?.name ?? employeeName
      : employeeName;

  useEffect(() => {
    if (!sessionId) {
      navigate("/", { replace: true });
    }
  }, [navigate, sessionId]);

  useEffect(() => {
    if (verification.phase === "expired" || verification.phase === "unpaid" || verification.phase === "error") {
      toast.message(t("tipFlow.completion.notVerifiedTitle"), {
        description: toUserFriendlyMessage(verification.phase === "error" ? verification.message : undefined),
      });
      navigate("/", { replace: true });
    }
  }, [navigate, t, verification]);

  const goToRating = () => {
    if (!sessionId) {
      navigate("/", { replace: true });
      return;
    }
    navigate(`/rating?session_id=${encodeURIComponent(sessionId)}`);
  };

  const leavePage = () => {
    clearCustomerFlowEntry();
    reset();
    navigate("/", { replace: true });
  };

  if (verification.phase === "loading") {
    return <CareTipPageLoader variant="wait" message={t("tipFlow.loading.tipDetails")} />;
  }

  if (verification.phase === "pending") {
    return <TipPaymentProcessingView employeeName={employeeName ?? undefined} />;
  }

  if (
    verification.phase === "expired" ||
    verification.phase === "unpaid" ||
    verification.phase === "error"
  ) {
    return null;
  }

  if (!verified) {
    return <CareTipPageLoader variant="wait" message={t("tipFlow.loading.verifyingPayment")} />;
  }

  return (
    <div className={cf.page}>
      <div className={`${cf.main} max-w-xl py-10 sm:py-14`}>
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 22,
            delay: 0.06,
          }}
          className="mx-auto mb-8 flex size-28 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-[0_14px_40px_-16px_rgba(15,23,42,0.35)] ring-8 ring-primary/10"
          aria-hidden
        >
          <Check className="h-[3.15rem] w-[3.15rem] shrink-0 text-primary-foreground" strokeWidth={2.75} />
        </motion.div>

        <motion.div
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 text-center"
        >
          <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("tipFlow.success.headline")}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{t("tipFlow.success.thankYou")}</p>
          {tipAmount != null ? (
            <p className="mt-5 font-bold tabular-nums text-primary text-4xl tracking-tight sm:text-[2.65rem]">
              {formatEur(tipAmount)}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-muted-foreground">
            {t("tipFlow.success.sentTo", {
              name: displayEmployeeName ?? t("tipFlow.common.theTeamMember"),
            })}
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className={`${cf.cardMuted} mb-6 px-5 py-6 sm:px-7`}
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("tipFlow.success.receipt")}
          </p>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">{t("tipFlow.success.transactionId")}</span>
              <span className="font-mono text-xs text-foreground">{t("tipFlow.success.demoTransactionId")}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">{t("tipFlow.success.dateTime")}</span>
              <span className="text-foreground">{t("tipFlow.success.demoDateTime")}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">{t("tipFlow.success.paymentMethod")}</span>
              <span className="text-foreground">{t("tipFlow.success.demoPaymentMethod")}</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-border/55 pt-3">
              <span className="font-semibold text-foreground">{t("tipFlow.success.tipAmount")}</span>
              <span className="text-lg font-bold tabular-nums text-foreground">
                {tipAmount != null ? formatEur(tipAmount) : "—"}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
          className={cf.completionActions}
        >
          <button type="button" onClick={goToRating} className={cf.completionPrimaryBtn}>
            <Star className="size-5 shrink-0" aria-hidden />
            {t("tipFlow.success.leaveFeedback")}
          </button>
          <button type="button" onClick={leavePage} className={cf.completionTextAction}>
            {t("tipFlow.success.leavePage")}
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10 text-center text-xs leading-relaxed text-muted-foreground"
        >
          {t("tipFlow.success.emailReceipt")}
        </motion.p>
      </div>
    </div>
  );
}
