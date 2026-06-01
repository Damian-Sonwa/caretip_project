import { motion } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";
import { useTipFlow } from "../../context/TipFlowContext";
import { ProfileAvatar } from "../../components/ui/profile-avatar";
import { getEmployeeById, getStaffBySlug, getStaffByBusinessEmployeeSlug } from "../../lib/api";
import { logClientError } from "../../lib/clientLog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CareTipLogo } from "../../components/CareTipLogo";
import { BusinessLogoMark } from "../../components/business/BusinessLogoMark";
import { DEV_BYPASS_ENABLED, DEV_MOCK } from "../../lib/devCustomerBypass";
import { hasRecentCustomerFlowEntry, markCustomerFlowEntered } from "../../lib/customerFlowGuard";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { formatEur } from "../../lib/formatEur";
import { customerFlowUi as cf } from "./customerFlowUi";

export function TipAmountPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get("employeeId");
  const returnSlug = searchParams.get("returnSlug");
  const returnBusinessSlug = searchParams.get("returnBusinessSlug");
  const returnEmployeeSlug = searchParams.get("returnEmployeeSlug");
  const directFromStaffQr = searchParams.get("direct") === "1";
  const {
    businessId,
    employeeName,
    employeeAvatar,
    tableQrSlug,
    setBusinessId,
    setEmployee,
    setAmount,
  } = useTipFlow();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [guardReady, setGuardReady] = useState(false);
  const [businessBrand, setBusinessBrand] = useState<{ logo: string | null; name: string } | null>(null);

  // Guard: don't redirect until we can confirm the context is invalid.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (import.meta.env.DEV) {
        if (!cancelled) setGuardReady(true);
        return;
      }
      if (hasRecentCustomerFlowEntry()) {
        if (!cancelled) setGuardReady(true);
        return;
      }
      // If a QR scan deep-linked directly to /tip-amount, validate via API before deciding.
      if (employeeId) {
        try {
          if (returnBusinessSlug && returnEmployeeSlug) {
            const s = await getStaffByBusinessEmployeeSlug(returnBusinessSlug, returnEmployeeSlug);
            if (cancelled) return;
            setBusinessId(s.businessId);
            setEmployee(s.id, s.name, s.avatar ?? undefined);
            setBusinessBrand({ logo: s.businessLogo ?? null, name: s.businessName });
          } else if (returnSlug) {
            const s = await getStaffBySlug(returnSlug);
            if (cancelled) return;
            setBusinessId(s.businessId);
            setEmployee(s.id, s.name, s.avatar ?? undefined);
            setBusinessBrand({ logo: s.businessLogo ?? null, name: s.businessName });
          } else {
            const emp = await getEmployeeById(employeeId);
            if (cancelled) return;
            setBusinessId(emp.businessId);
            setEmployee(emp.id, emp.name ?? t("tipFlow.common.teamMember"), emp.avatar ?? undefined);
            setBusinessBrand({
              logo: emp.businessLogo ?? null,
              name: String(emp.businessName ?? "").trim() || t("tipFlow.common.venue"),
            });
          }
          markCustomerFlowEntered();
          if (!cancelled) setGuardReady(true);
          return;
        } catch (err) {
          if (cancelled) return;
          logClientError("TipAmountPage.guard", err);
          navigate("/", { replace: true });
          return;
        }
      }
      // No employee id and no flow entry: confirmed invalid for this step.
      navigate(businessId ? `/qr-landing/${businessId}` : "/", { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [
    businessId,
    employeeId,
    navigate,
    returnSlug,
    returnBusinessSlug,
    returnEmployeeSlug,
    setBusinessId,
    setEmployee,
    t,
  ]);

  useEffect(() => {
    if (employeeId) return;
    if (DEV_BYPASS_ENABLED) {
      const qs = new URLSearchParams();
      qs.set("employeeId", DEV_MOCK.employeeId);
      navigate(`/tip-amount?${qs.toString()}`, { replace: true });
      return;
    }
    navigate(businessId ? `/qr-landing/${businessId}` : "/", { replace: true });
  }, [employeeId, businessId, navigate]);

  // Hydrate from API if context was cleared (refresh, directory QR, deep link)
  useEffect(() => {
    if (!employeeId) return;
    if (businessId && employeeName) return;
    let cancelled = false;
    (async () => {
      try {
        if (returnBusinessSlug && returnEmployeeSlug) {
          const s = await getStaffByBusinessEmployeeSlug(returnBusinessSlug, returnEmployeeSlug);
          if (cancelled) return;
          setBusinessId(s.businessId);
          setEmployee(s.id, s.name, s.avatar ?? undefined);
          setBusinessBrand({ logo: s.businessLogo ?? null, name: s.businessName });
          return;
        }
        if (returnSlug) {
          const s = await getStaffBySlug(returnSlug);
          if (cancelled) return;
          setBusinessId(s.businessId);
          setEmployee(s.id, s.name, s.avatar ?? undefined);
          setBusinessBrand({ logo: s.businessLogo ?? null, name: s.businessName });
          return;
        }
        const emp = await getEmployeeById(employeeId);
        if (cancelled) return;
        setBusinessId(emp.businessId);
        setEmployee(emp.id, emp.name ?? t("tipFlow.common.teamMember"), emp.avatar ?? undefined);
        setBusinessBrand({
          logo: emp.businessLogo ?? null,
          name: String(emp.businessName ?? "").trim() || t("tipFlow.common.venue"),
        });
      } catch (err) {
        logClientError("TipAmountPage", err);
        if (!cancelled) {
          setEmployee(employeeId, t("tipFlow.common.teamMember"));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    employeeId,
    returnSlug,
    returnBusinessSlug,
    returnEmployeeSlug,
    businessId,
    employeeName,
    setBusinessId,
    setEmployee,
    t,
  ]);

  if (!guardReady && !import.meta.env.DEV) {
    return <CareTipPageLoader variant="wait" message={t("tipFlow.tipAmount.validatingScan")} />;
  }

  const presetAmounts = [5, 10, 15];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setShowCustomInput(false);
    setCustomAmount("");
  };

  const handleCustomClick = () => {
    setShowCustomInput(true);
    setSelectedAmount(null);
  };

  const handleCustomInput = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setCustomAmount(value);
      setSelectedAmount(numValue);
    } else {
      setCustomAmount(value);
      setSelectedAmount(null);
    }
  };

  const handleBack = () => {
    if (returnBusinessSlug && returnEmployeeSlug) {
      navigate(
        `/${encodeURIComponent(returnBusinessSlug)}/${encodeURIComponent(returnEmployeeSlug)}?preview=1`
      );
      return;
    }
    if (returnSlug) {
      navigate(`/staff/${returnSlug}?preview=1`);
      return;
    }
    if (tableQrSlug) {
      navigate(`/table/${encodeURIComponent(tableQrSlug)}`);
      return;
    }
    navigate(businessId ? `/qr-landing/${businessId}` : "/");
  };

  const handleContinue = () => {
    if (selectedAmount) {
      setAmount(selectedAmount);
      navigate("/payment");
    }
  };

  if (!employeeId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">{t("tipFlow.tipAmount.redirecting")}</p>
      </div>
    );
  }

  return (
    <div className={selectedAmount ? cf.pageWithBottomCta : cf.page}>
      <div className={cf.stickyHeader}>
        <div className={cf.headerInner}>
          <button type="button" onClick={handleBack} className={cf.backButton}>
            {t("tipFlow.common.back")}
          </button>
          {businessBrand ? (
            <BusinessLogoMark
              logoPathOrUrl={businessBrand.logo}
              businessName={businessBrand.name}
              size="md"
              className="shrink-0"
            />
          ) : (
            <CareTipLogo size="xs" className="shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className={cf.headline}>{t("tipFlow.tipAmount.chooseTitle")}</h1>
            <p className={cf.subline}>
              {t("tipFlow.tipAmount.forEmployee", { name: employeeName ?? t("tipFlow.common.teamMember") })}
            </p>
            {directFromStaffQr ? (
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-primary">
                <ShieldCheck className="size-3.5 shrink-0" />
                {t("tipFlow.tipAmount.confirmStaffQr")}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className={cf.main}>
        {/* Selected Employee Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <Card
            className={`${cf.cardShadcn} border-border shadow-sm ${directFromStaffQr ? "ring-2 ring-primary/25 ring-offset-2 ring-offset-background" : ""}`}
          >
            <CardContent
              className={`flex items-center gap-4 ${directFromStaffQr ? "p-5 pt-6" : "p-4"}`}
            >
          <ProfileAvatar
            src={employeeAvatar}
            displayName={employeeName ?? t("tipFlow.common.teamMember")}
            className={`shrink-0 ring-4 ring-primary shadow-sm ${
              directFromStaffQr ? "h-24 w-24" : "h-16 w-16"
            }`}
          />
          <div>
            <p className="text-sm text-muted-foreground">
              {directFromStaffQr ? t("tipFlow.tipAmount.youreTipping") : t("tipFlow.tipAmount.tipping")}
            </p>
            <p className={`font-semibold text-foreground ${directFromStaffQr ? "text-xl" : "text-lg"}`}>
              {employeeName ?? t("tipFlow.common.teamMember")}
            </p>
          </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Preset tip amounts — same tile size/layout as former %-of-bill quick select */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("tipFlow.tipAmount.quickSelect")}</CardTitle>
            <CardDescription>{t("tipFlow.tipAmount.quickSelectDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {presetAmounts.map((amount, index) => (
                <motion.button
                  key={amount}
                  type="button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + index * 0.05 }}
                  onClick={() => handleAmountSelect(amount)}
                  className={`p-4 rounded-xl border-2 text-left transition-all min-h-[100px] flex flex-col justify-center ${
                    selectedAmount === amount
                      ? "border-accent bg-accent/10 shadow-lg"
                      : "border-border bg-card hover:border-accent/50 hover:shadow-md"
                  }`}
                >
                  <div className="text-2xl font-bold text-foreground mb-1">{formatEur(amount, { minFrac: 0, maxFrac: 0 })}</div>
                  <div className="text-sm text-muted-foreground">{t("tipFlow.tipAmount.tipAmountLabel")}</div>
                </motion.button>
              ))}
              <motion.button
                key="custom-card"
                type="button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + presetAmounts.length * 0.05 }}
                onClick={handleCustomClick}
                className={`${cf.selectableTile} flex flex-col justify-center ${
                  showCustomInput ? cf.selectableOn : cf.selectableIdle
                }`}
              >
                <div className="text-lg font-bold text-foreground">{t("tipFlow.tipAmount.chooseYourAmount")}</div>
              </motion.button>
            </div>
          </CardContent>
        </Card>

        {/* Custom Amount */}
        <Card className={`${cf.cardShadcn} border-border`}>
          <CardHeader className={`${cf.cardHeaderPadding} pb-2`}>
            <CardTitle className={cf.cardTitle}>{t("tipFlow.tipAmount.customTip")}</CardTitle>
            <CardDescription className={cf.cardDesc}>{t("tipFlow.tipAmount.customTipDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-6">
            {!showCustomInput ? (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={handleCustomClick}
                type="button"
                className={cf.dashedCustomTrigger}
              >
                <span className="text-sm font-medium text-muted-foreground">{t("tipFlow.tipAmount.enterCustom")}</span>
              </motion.button>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="relative">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                  €
                </div>
                <input
                  type="number"
                  placeholder={t("tipFlow.tipAmount.amountPlaceholder")}
                  value={customAmount}
                  onChange={(e) => handleCustomInput(e.target.value)}
                  className={`${cf.inputAmount} pl-11 text-2xl sm:text-3xl`}
                  autoFocus
                  step="0.01"
                  min="0"
                />
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Tip summary */}
        {selectedAmount && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={cf.cardAccentWash}>
              <CardContent className="px-5 pb-5 pt-6 sm:px-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("tipFlow.tipAmount.tipAmountLabel")}</span>
                  <span className="text-2xl font-bold text-foreground">{formatEur(selectedAmount)}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {selectedAmount && (
        <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cf.fixedBottomBar}>
          <div className={cf.fixedBottomInner}>
            <button type="button" onClick={handleContinue} className={cf.btnPrimaryLg}>
              {t("tipFlow.tipAmount.continuePayment")}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
