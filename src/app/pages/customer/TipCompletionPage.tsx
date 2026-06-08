import { motion } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, LogOut, Users } from "lucide-react";
import { CareTipLogo } from "../../components/CareTipLogo";
import { clearCustomerFlowEntry } from "../../lib/customerFlowGuard";
import { useTipFlow } from "../../context/TipFlowContext";
import { customerFlowUi as cf } from "./customerFlowUi";
import { Card, CardContent } from "@/components/ui/card";

export function TipCompletionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { reset } = useTipFlow();

  const [completion] = useState(() => ({
    tippedName: searchParams.get("tippedName")?.trim() || undefined,
    feedbackSubmitted: searchParams.get("feedbackSubmitted") === "1",
    businessId: searchParams.get("businessId")?.trim() || undefined,
    businessSlug: searchParams.get("businessSlug")?.trim() || undefined,
  }));

  useEffect(() => {
    if (!completion.tippedName && !completion.businessId) {
      navigate("/", { replace: true });
    }
  }, [completion.businessId, completion.tippedName, navigate]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("feedbackSubmitted");
    next.delete("tippedName");
    next.delete("businessId");
    next.delete("businessSlug");
    if ([...next.keys()].length < [...searchParams.keys()].length) {
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const displayName = completion.tippedName ?? t("tipFlow.common.aTeamMember");

  const tipAnother = () => {
    clearCustomerFlowEntry();
    reset();
    if (completion.businessId) {
      navigate(`/qr-landing/${encodeURIComponent(completion.businessId)}`, { replace: true });
      return;
    }
    if (completion.businessSlug) {
      navigate(`/${encodeURIComponent(completion.businessSlug)}`, { replace: true });
      return;
    }
    navigate("/", { replace: true });
  };

  const exit = () => {
    clearCustomerFlowEntry();
    reset();
    navigate("/", { replace: true });
  };

  return (
    <div className={cf.page}>
      <div className={cf.stickyHeader}>
        <div className={cf.headerInner}>
          <CareTipLogo size="xs" className="h-11 max-h-11 min-h-0 w-auto max-w-[5.5rem] shrink-0" />
        </div>
      </div>

      <div className={`${cf.main} max-w-lg py-10 sm:py-14`}>
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10 ring-8 ring-primary/8"
          aria-hidden
        >
          <CheckCircle2 className="size-10 text-primary" />
        </motion.div>

        <Card className={`${cf.cardAccentWash} border-primary/20`}>
          <CardContent className="space-y-5 p-6 sm:p-8">
            <div className="space-y-2 text-center">
              <h1 className="text-balance text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {t("tipFlow.completion.thankYouTipping", { name: displayName })}
              </h1>
              {completion.feedbackSubmitted ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("tipFlow.completion.feedbackReceived")}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <button type="button" onClick={tipAnother} className={`${cf.btnPrimaryLg} py-3.5 text-sm`}>
                <Users className="size-5 shrink-0" aria-hidden />
                {t("tipFlow.completion.tipAnotherMember")}
              </button>
              <button type="button" onClick={exit} className={`${cf.btnSecondaryLg} py-3.5 text-sm`}>
                <LogOut className="size-5 shrink-0" aria-hidden />
                {t("tipFlow.completion.exit")}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
