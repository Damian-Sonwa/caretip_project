import { motion } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import { ChevronLeft, CreditCard, Smartphone, Lock } from "lucide-react";
import { toast } from "sonner";
import { useTipFlow } from "../../context/TipFlowContext";
import { createTipCheckoutSession, getEmployeeById } from "../../lib/api";
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
import { formatEur } from "../../lib/formatEur";

export function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    amount: tipAmountCtx,
    employeeId,
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
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [guardReady, setGuardReady] = useState(false);
  const [businessBrand, setBusinessBrand] = useState<{ logo: string | null; name: string } | null>(null);

  const tipAmountVal = tipAmountCtx ?? 15.3;
  /** Customer pays the tip only (no separate bill line). */
  const totalAmount = tipAmountVal;

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
      if (!employeeId) {
        navigate("/", { replace: true });
        return;
      }
      try {
        // If the tab refreshed mid-flow, rehydrate minimal context before allowing.
        if (!businessId || !employeeName) {
          const emp = await getEmployeeById(employeeId);
          if (cancelled) return;
          setBusinessId(emp.businessId);
          setEmployee(emp.id, emp.name ?? "Team Member", emp.avatar ?? undefined);
        }
        markCustomerFlowEntered();
        if (!cancelled) setGuardReady(true);
      } catch (err) {
        if (cancelled) return;
        logClientError("PaymentPage.guard", err);
        navigate("/", { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId, employeeId, employeeName, navigate, setBusinessId, setEmployee]);

  // DEV-only: allow direct navigation without QR flow by seeding mock context.
  useEffect(() => {
    if (!DEV_BYPASS_ENABLED) return;
    if (employeeId && businessId) return;
    setBusinessId(DEV_MOCK.businessId);
    setEmployee(DEV_MOCK.employeeId, DEV_MOCK.employeeName, undefined);
  }, [businessId, employeeId, setBusinessId, setEmployee]);

  useEffect(() => {
    if (searchParams.get("canceled") === "1") {
      toast.message("Payment canceled", {
        description: "You can choose a method and try again when you're ready.",
      });
    }
  }, [searchParams]);

  // Hydrate name/avatar if context was partially cleared (same session)
  useEffect(() => {
    if (!employeeId) return;
    if (businessId && employeeName) return;
    let cancelled = false;
    (async () => {
      try {
        const emp = await getEmployeeById(employeeId);
        if (cancelled) return;
        setBusinessId(emp.businessId);
        setEmployee(emp.id, emp.name ?? "Team Member", emp.avatar ?? undefined);
      } catch (err) {
        logClientError("PaymentPage.hydrate", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [employeeId, businessId, employeeName, setBusinessId, setEmployee]);

  useEffect(() => {
    if (!employeeId) {
      setBusinessBrand(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const emp = await getEmployeeById(employeeId);
        if (cancelled) return;
        setBusinessBrand({
          logo: emp.businessLogo ?? null,
          name: String(emp.businessName ?? "").trim() || "Venue",
        });
      } catch {
        if (!cancelled) setBusinessBrand(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  if (!guardReady && !import.meta.env.DEV) {
    return <CareTipPageLoader variant="wait" message="Preparing checkout…" />;
  }

  const paymentMethods = [
    {
      id: "apple-pay",
      name: "Apple Pay",
      icon: "🍎",
      description: "Pay with Apple Pay",
      available: true,
    },
    {
      id: "google-pay",
      name: "Google Pay",
      icon: "🅖",
      description: "Pay with Google Pay",
      available: true,
    },
    {
      id: "card",
      name: "Credit / Debit Card",
      icon: <CreditCard className="w-6 h-6 text-accent" />,
      description: "Visa, Mastercard, Amex",
      available: true,
    },
  ];

  const handleBack = () => {
    if (employeeId && staffTipReturnBusinessSlug && staffTipReturnEmployeeSlug) {
      const qs = new URLSearchParams({
        employeeId,
        returnBusinessSlug: staffTipReturnBusinessSlug,
        returnEmployeeSlug: staffTipReturnEmployeeSlug,
        direct: "1",
      });
      navigate(`/tip-amount?${qs.toString()}`);
      return;
    }
    if (employeeId && staffProfileSlug) {
      navigate(
        `/tip-amount?employeeId=${encodeURIComponent(employeeId)}&returnSlug=${encodeURIComponent(staffProfileSlug)}&direct=1`,
      );
      return;
    }
    navigate(employeeId ? `/tip-amount?employeeId=${employeeId}` : "/");
  };

  const handlePayment = async () => {
    if (!selectedMethod || !employeeId || !businessId) return;

    setProcessing(true);
    try {
      const { sessionId, url } = await createTipCheckoutSession({
        amount: totalAmount,
        employeeId,
        businessId,
        tipAmount: tipAmountVal,
        locationId: locationId ?? null,
        tableId: tableId ?? null,
      });
      if (!url) {
        toast.error("Could not start checkout. Please try again.");
        setProcessing(false);
        return;
      }
      // Store "pending repeat tip" data now; we only promote it after success verification.
      setPendingTipFromCheckout({
        sessionId,
        businessId,
        employeeId,
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

  const missingContext = !employeeId || !businessId;

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="mx-auto max-w-2xl px-4 py-4 lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1280px] lg:px-8 xl:px-10 2xl:px-12">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-lg p-2 hover:bg-muted transition-colors"
              disabled={processing}
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
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
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground">Payment</h1>
              <p className="text-xs text-muted-foreground">Choose payment method</p>
            </div>
          </div>
        </div>
      </div>

      {missingContext ? (
        <div className="max-w-2xl mx-auto px-4 lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1280px] lg:px-8 xl:px-10 2xl:px-12 py-8 text-center text-sm text-muted-foreground">
          <p className="mb-4">Missing tip context. Go back and select an amount first.</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-primary font-medium underline"
          >
            Go home
          </button>
        </div>
      ) : null}

      {!missingContext ? (
        <>
          <div className="max-w-2xl mx-auto px-4 lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1280px] lg:px-8 xl:px-10 2xl:px-12 py-8 space-y-6 lg:space-y-8 xl:space-y-10">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <Card className="border-border shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <ProfileAvatar
                    src={employeeAvatar}
                    displayName={employeeName ?? "Team Member"}
                    className="h-16 w-16 shrink-0 ring-4 ring-primary shadow-sm"
                  />
                  <div>
                    <p className="text-sm text-muted-foreground">Paying tip to</p>
                    <p className="font-semibold text-lg text-foreground">
                      {employeeName ?? "Team Member"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-primary/10 shadow-sm">
                <CardContent className="pt-6 pb-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Tip for {employeeName ?? "Team Member"}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {formatEur(tipAmountVal)}
                      </span>
                    </div>
                    <div className="border-t border-border/60 pt-3 flex items-center justify-between gap-4">
                      <span className="text-base font-semibold text-foreground">Amount to pay</span>
                      <span className="text-3xl font-bold text-foreground tabular-nums">
                        {formatEur(totalAmount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <Card className="border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Select payment method</CardTitle>
                <CardDescription>Choose how you&apos;d like to pay</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {paymentMethods.map((method, index) => (
                  <motion.button
                    key={method.id}
                    type="button"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedMethod(method.id)}
                    disabled={!method.available || processing}
                    className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 min-h-[72px] ${
                      selectedMethod === method.id
                        ? "border-accent bg-accent/10 shadow-lg"
                        : "border-border bg-card hover:border-accent/50 hover:shadow-md"
                    } ${!method.available ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center text-2xl shrink-0">
                      {typeof method.icon === "string" ? method.icon : method.icon}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-semibold text-foreground">{method.name}</div>
                      <div className="text-sm text-muted-foreground">{method.description}</div>
                    </div>
                    {selectedMethod === method.id && (
                      <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </motion.button>
                ))}
              </CardContent>
            </Card>

            {selectedMethod === "card" ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <Card className="border-border shadow-sm">
                  <CardContent className="py-4 text-sm text-muted-foreground">
                    You will enter card details on Stripe&apos;s secure checkout page. We never store your card
                    number.
                  </CardContent>
                </Card>
              </motion.div>
            ) : null}

            <Card className="border-border shadow-sm bg-muted/30">
              <CardContent className="flex items-start gap-3 py-4">
                <Lock className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Secure payment</p>
                  <p>
                    Apple Pay, Google Pay, and cards are processed by Stripe. You will confirm on the next screen.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {selectedMethod ? (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4"
            >
              <div className="max-w-2xl mx-auto lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1280px] lg:px-8 xl:px-10 2xl:px-12">
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full bg-accent text-white rounded-xl py-4 font-semibold text-lg hover:bg-accent/90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Redirecting to secure checkout…
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-5 h-5" />
                      Pay {formatEur(totalAmount)}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
