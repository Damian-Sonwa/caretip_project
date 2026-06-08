import { motion } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { useTipFlow } from "../../context/TipFlowContext";
import { createTipCheckoutSession, getEmployeeById, getStaffBySlug, getStaffByBusinessEmployeeSlug } from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { setPendingTipFromCheckout } from "../../lib/repeatTip";
import { ProfileAvatar } from "../../components/ui/profile-avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CareTipLogo } from "../../components/CareTipLogo";
import { BusinessLogoMark } from "../../components/business/BusinessLogoMark";
import { DEV_BYPASS_ENABLED, DEV_MOCK } from "../../lib/devCustomerBypass";
import { hasRecentCustomerFlowEntry, markCustomerFlowEntered } from "../../lib/customerFlowGuard";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { PaymentMethodsAvailable } from "../../components/payments/PaymentMethodsAvailable";
import { formatEur } from "../../lib/formatEur";
import { customerFlowUi as cf } from "./customerFlowUi";

export function PaymentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const employeeIdFromUrl = searchParams.get("employeeId");
  const returnSlugFromUrl = searchParams.get("returnSlug");
  const returnBusinessSlugFromUrl = searchParams.get("returnBusinessSlug");
  const returnEmployeeSlugFromUrl = searchParams.get("returnEmployeeSlug");
  const {
    amount: tipAmountCtx,
    employeeId: employeeIdCtx,
    employeeName,
    employeeAvatar,
    staffProfileSlug,
    staffTipReturnBusinessSlug,
    staffTipReturnEmployeeSlug,
    businessId,
    locationId,
    tableId,
    setBusinessId,
    setEmployee,
  } = useTipFlow();
  const [processing, setProcessing] = useState(false);
  const [guardReady, setGuardReady] = useState(false);
  const [contextHydrating, setContextHydrating] = useState(false);
  const [businessBrand, setBusinessBrand] = useState<{ logo: string | null; name: string } | null>(null);

  const resolvedEmployeeId = employeeIdCtx ?? employeeIdFromUrl;
  const tipAmountVal = tipAmountCtx ?? 15.3;
  /** Customer pays the tip only (no separate bill line). */
  const totalAmount = tipAmountVal;
  const missingContext = !resolvedEmployeeId || !businessId;

  // Guard: don't redirect until we can confirm the context is invalid.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (import.meta.env.DEV) {
        if (!cancelled) setGuardReady(true);
        return;
      }
      if (!resolvedEmployeeId) {
        navigate("/", { replace: true });
        return;
      }
      if (hasRecentCustomerFlowEntry() && businessId) {
        if (!cancelled) setGuardReady(true);
        return;
      }
      try {
        if (!businessId || !employeeName) {
          if (!cancelled) setContextHydrating(true);
          if (returnBusinessSlugFromUrl && returnEmployeeSlugFromUrl) {
            const s = await getStaffByBusinessEmployeeSlug(
              returnBusinessSlugFromUrl,
              returnEmployeeSlugFromUrl,
            );
            if (cancelled) return;
            setBusinessId(s.businessId);
            setEmployee(s.id, s.name, s.avatar ?? undefined);
          } else if (returnSlugFromUrl) {
            const s = await getStaffBySlug(returnSlugFromUrl);
            if (cancelled) return;
            setBusinessId(s.businessId);
            setEmployee(s.id, s.name, s.avatar ?? undefined);
          } else {
            const emp = await getEmployeeById(resolvedEmployeeId);
            if (cancelled) return;
            setBusinessId(emp.businessId);
            setEmployee(emp.id, emp.name ?? t("tipFlow.common.teamMember"), emp.avatar ?? undefined);
          }
        }
        markCustomerFlowEntered();
        if (!cancelled) setGuardReady(true);
      } catch (err) {
        if (cancelled) return;
        logClientError("PaymentPage.guard", err);
        navigate("/", { replace: true });
      } finally {
        if (!cancelled) setContextHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    businessId,
    employeeName,
    resolvedEmployeeId,
    navigate,
    returnBusinessSlugFromUrl,
    returnEmployeeSlugFromUrl,
    returnSlugFromUrl,
    setBusinessId,
    setEmployee,
    t,
  ]);

  // DEV-only: allow direct navigation without QR flow by seeding mock context.
  useEffect(() => {
    if (!DEV_BYPASS_ENABLED) return;
    if (resolvedEmployeeId && businessId) return;
    setBusinessId(DEV_MOCK.businessId);
    setEmployee(DEV_MOCK.employeeId, DEV_MOCK.employeeName, undefined);
  }, [businessId, resolvedEmployeeId, setBusinessId, setEmployee]);

  useEffect(() => {
    if (searchParams.get("canceled") === "1") {
      toast.message(t("tipFlow.payment.canceledTitle"), {
        description: t("tipFlow.payment.canceledDesc"),
      });
    }
  }, [searchParams, t]);

  // Hydrate name/avatar if context was partially cleared (same session)
  useEffect(() => {
    if (!resolvedEmployeeId) return;
    if (businessId && employeeName) return;
    let cancelled = false;
    (async () => {
      setContextHydrating(true);
      try {
        if (returnBusinessSlugFromUrl && returnEmployeeSlugFromUrl) {
          const s = await getStaffByBusinessEmployeeSlug(
            returnBusinessSlugFromUrl,
            returnEmployeeSlugFromUrl,
          );
          if (cancelled) return;
          setBusinessId(s.businessId);
          setEmployee(s.id, s.name, s.avatar ?? undefined);
          return;
        }
        if (returnSlugFromUrl) {
          const s = await getStaffBySlug(returnSlugFromUrl);
          if (cancelled) return;
          setBusinessId(s.businessId);
          setEmployee(s.id, s.name, s.avatar ?? undefined);
          return;
        }
        const emp = await getEmployeeById(resolvedEmployeeId);
        if (cancelled) return;
        setBusinessId(emp.businessId);
        setEmployee(emp.id, emp.name ?? t("tipFlow.common.teamMember"), emp.avatar ?? undefined);
      } catch (err) {
        logClientError("PaymentPage.hydrate", err);
      } finally {
        if (!cancelled) setContextHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    resolvedEmployeeId,
    businessId,
    employeeName,
    returnBusinessSlugFromUrl,
    returnEmployeeSlugFromUrl,
    returnSlugFromUrl,
    setBusinessId,
    setEmployee,
    t,
  ]);

  useEffect(() => {
    if (!resolvedEmployeeId) {
      setBusinessBrand(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const emp = await getEmployeeById(resolvedEmployeeId);
        if (cancelled) return;
        setBusinessBrand({
          logo: emp.businessLogo ?? null,
          name: String(emp.businessName ?? "").trim() || t("tipFlow.common.venue"),
        });
      } catch {
        if (!cancelled) setBusinessBrand(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resolvedEmployeeId, t]);

  if (!guardReady && !import.meta.env.DEV) {
    return <CareTipPageLoader variant="wait" message={t("tipFlow.payment.preparingCheckout")} />;
  }

  const handleBack = () => {
    const eid = resolvedEmployeeId;
    if (eid && staffTipReturnBusinessSlug && staffTipReturnEmployeeSlug) {
      const qs = new URLSearchParams({
        employeeId: eid,
        returnBusinessSlug: staffTipReturnBusinessSlug,
        returnEmployeeSlug: staffTipReturnEmployeeSlug,
        direct: "1",
      });
      navigate(`/tip-amount?${qs.toString()}`);
      return;
    }
    if (eid && staffProfileSlug) {
      navigate(
        `/tip-amount?employeeId=${encodeURIComponent(eid)}&returnSlug=${encodeURIComponent(staffProfileSlug)}&direct=1`,
      );
      return;
    }
    navigate(eid ? `/tip-amount?employeeId=${eid}` : "/");
  };

  const handlePayment = async () => {
    if (!resolvedEmployeeId || !businessId) return;

    setProcessing(true);
    try {
      const { sessionId, url } = await createTipCheckoutSession({
        amount: totalAmount,
        employeeId: resolvedEmployeeId,
        businessId,
        tipAmount: tipAmountVal,
        locationId: locationId ?? null,
        tableId: tableId ?? null,
      });
      if (!url) {
        toast.error(t("tipFlow.payment.checkoutStartError"));
        setProcessing(false);
        return;
      }
      // Store "pending repeat tip" data now; we only promote it after success verification.
      setPendingTipFromCheckout({
        sessionId,
        businessId,
        employeeId: resolvedEmployeeId,
        employeeName: employeeName ?? null,
        amount: tipAmountVal,
      });
      window.location.href = url;
    } catch (err) {
      logClientError("PaymentPage.checkout", err);
      toast.error(toUserFriendlyMessage(err));
      setProcessing(false);
    }
  };

  if (contextHydrating && !businessId) {
    return <CareTipPageLoader variant="wait" message={t("tipFlow.payment.preparingCheckout")} />;
  }

  return (
    <div className={!missingContext ? cf.pageWithBottomCta : cf.page}>
      <div className={cf.stickyHeader}>
        <div className={cf.headerInner}>
          <button
            type="button"
            onClick={handleBack}
            className={cf.backButton}
            disabled={processing}
          >
            {t("tipFlow.common.back")}
          </button>
          {businessBrand ? (
            <BusinessLogoMark
              logoPathOrUrl={businessBrand.logo}
              businessName={businessBrand.name}
              size="customer"
              className="shrink-0"
            />
          ) : (
            <CareTipLogo size="xs" className="shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className={cf.headline}>{t("tipFlow.payment.title")}</h1>
            <p className={cf.subline}>{t("tipFlow.payment.subtitle")}</p>
          </div>
        </div>
      </div>

      {missingContext ? (
        <div className={`${cf.main} text-center`}>
          <div className={`${cf.cardMuted} mx-auto max-w-md px-5 py-8 sm:px-8`}>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("tipFlow.payment.missingContext")}</p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className={`${cf.btnPrimaryLg} mt-6`}
            >
              {t("tipFlow.common.goHomeButton")}
            </button>
          </div>
        </div>
      ) : null}

      {!missingContext ? (
        <>
          <div className={cf.main}>
            <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <Card className={cf.cardShadcn}>
                <CardContent className="flex items-center gap-4 p-5 sm:p-6">
                  <ProfileAvatar
                    src={employeeAvatar}
                    displayName={employeeName ?? t("tipFlow.common.teamMember")}
                    className="h-16 w-16 shrink-0 ring-4 ring-primary shadow-sm"
                  />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("tipFlow.payment.payingTipTo")}</p>
                    <p className="font-semibold text-lg text-foreground">
                      {employeeName ?? t("tipFlow.common.teamMember")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
            >
              <Card className={cf.cardAccentWash}>
                <CardContent className="px-5 py-6 sm:px-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t("tipFlow.payment.tipFor", {
                          name: employeeName ?? t("tipFlow.common.teamMember"),
                        })}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {formatEur(tipAmountVal)}
                      </span>
                    </div>
                    <div className="border-t border-border/60 pt-3 flex items-center justify-between gap-4">
                      <span className="text-base font-semibold text-foreground">
                        {t("tipFlow.payment.amountToPay")}
                      </span>
                      <span className="text-3xl font-bold text-foreground tabular-nums">
                        {formatEur(totalAmount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <Card className={cf.cardShadcn}>
              <CardHeader className={`${cf.cardHeaderPadding} pb-2`}>
                <CardTitle className={cf.cardTitle}>{t("tipFlow.payment.selectMethodTitle")}</CardTitle>
                <CardDescription className={cf.cardDesc}>{t("tipFlow.payment.selectMethodDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5 sm:px-6">
                <PaymentMethodsAvailable />
              </CardContent>
            </Card>

            <Card className={`${cf.cardShadcn} border-primary/15`}>
              <CardContent className="px-5 py-4 text-sm leading-relaxed text-muted-foreground sm:px-6">
                {t("tipFlow.payment.stripeCardNote")}
              </CardContent>
            </Card>

            <Card className={`${cf.cardMuted} border-border/55`}>
              <CardContent className="flex items-start gap-3 px-5 py-4 sm:px-6">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">{t("tipFlow.payment.secureTitle")}</p>
                  <p>{t("tipFlow.payment.secureBody")}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cf.fixedBottomBar}>
            <div className={cf.fixedBottomInner}>
              <button type="button" onClick={handlePayment} disabled={processing} className={cf.btnAccentLg}>
                {processing ? (
                  <>
                    <span className="inline-block size-5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                    {t("tipFlow.payment.redirectingCheckout")}
                  </>
                ) : (
                  t("tipFlow.payment.payAmount", { amount: formatEur(totalAmount) })
                )}
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </div>
  );
}
