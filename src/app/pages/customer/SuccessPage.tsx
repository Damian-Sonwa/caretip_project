import { motion } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Star, Home, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useTipFlow } from "../../context/TipFlowContext";
import { getTipSessionContext } from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { promotePendingTipToRepeatTip } from "../../lib/repeatTip";
import { clearCustomerFlowEntry, markCustomerFlowEntered } from "../../lib/customerFlowGuard";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { formatEur } from "../../lib/formatEur";
import { customerFlowUi as cf } from "./customerFlowUi";

export function SuccessPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { amount, employeeName, reset } = useTipFlow();
  const [verified, setVerified] = useState(false);

  const sessionId = searchParams.get("session_id")?.trim() ?? "";

  const tipAmount = amount ?? 15.3;

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

  // Production guard: /success should only render after verified successful payment.
  useEffect(() => {
    if (import.meta.env.DEV) {
      setVerified(true);
      return;
    }
    if (!sessionId) {
      navigate("/", { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const ctx = await getTipSessionContext(sessionId);
        if (cancelled) return;
        if (ctx.status === "ready") {
          markCustomerFlowEntered();
          // Promote the last checkout into repeat-tip storage (client-side only).
          promotePendingTipToRepeatTip({
            sessionId,
            verifiedBusinessId: ctx.businessId,
            verifiedEmployee: ctx.employee ? { id: ctx.employee.id, name: ctx.employee.name } : null,
          });
          setVerified(true);
          return;
        }
        navigate("/", { replace: true });
      } catch (err) {
        if (cancelled) return;
        logClientError("SuccessPage.verify", err);
        toast.error(toUserFriendlyMessage(err));
        navigate("/", { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, sessionId]);

  if (!verified) {
    return <CareTipPageLoader variant="wait" message={t("tipFlow.success.validatingPayment")} />;
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
          <p className="mt-5 font-bold tabular-nums text-primary text-4xl tracking-tight sm:text-[2.65rem]">
            {formatEur(tipAmount)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("tipFlow.success.sentTo", {
              name: employeeName ?? t("tipFlow.common.theTeamMember"),
            })}
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className={`${cf.cardMuted} mb-6 px-5 py-6 sm:px-7`}
        >
          <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("tipFlow.success.receipt")}
          </h3>
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
              <span className="text-lg font-bold tabular-nums text-foreground">{formatEur(tipAmount)}</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 }}>
          <button
            type="button"
            onClick={goToRating}
            className={`${cf.btnSecondaryLg} border-primary/25 bg-primary/[0.06] py-4 text-base text-primary hover:bg-primary/[0.1]`}
          >
            <Star className="size-5 shrink-0" aria-hidden />
            {t("tipFlow.success.leaveFeedback")}
          </button>
        </motion.div>

        <motion.div
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.52 }}
          className="mt-5 space-y-3"
        >
          <button type="button" onClick={leavePage} className={cf.btnPrimaryLg}>
            <LogOut className="size-5 shrink-0" aria-hidden />
            {t("tipFlow.success.leavePage")}
          </button>
          <p className="text-center">
            <button
              type="button"
              onClick={leavePage}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              <Home className="size-4 shrink-0" aria-hidden />
              {t("tipFlow.success.backHome")}
            </button>
          </p>
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
