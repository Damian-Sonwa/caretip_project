import { motion } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import { ChevronLeft, ShieldCheck } from "lucide-react";
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

export function TipAmountPage() {
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
            setEmployee(emp.id, emp.name ?? "Team Member", emp.avatar ?? undefined);
            setBusinessBrand({
              logo: emp.businessLogo ?? null,
              name: String(emp.businessName ?? "").trim() || "Venue",
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
        setEmployee(emp.id, emp.name ?? "Team Member", emp.avatar ?? undefined);
        setBusinessBrand({
          logo: emp.businessLogo ?? null,
          name: String(emp.businessName ?? "").trim() || "Venue",
        });
      } catch (err) {
        logClientError("TipAmountPage", err);
        if (!cancelled) {
          setEmployee(employeeId, "Team Member");
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
  ]);

  if (!guardReady && !import.meta.env.DEV) {
    return <CareTipPageLoader variant="wait" message="Validating scan…" />;
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
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="mx-auto max-w-2xl px-4 py-4 lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1280px] lg:px-8 xl:px-10 2xl:px-12">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-lg p-2 hover:bg-muted transition-colors"
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
              <h1 className="text-lg font-semibold text-foreground">Choose Tip Amount</h1>
              <p className="text-xs text-muted-foreground">For {employeeName ?? "Team Member"}</p>
              {directFromStaffQr ? (
                <p className="text-xs mt-1 flex items-center gap-1 text-primary font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  Confirm this is who you meant to tip
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1280px] lg:px-8 xl:px-10 2xl:px-12 py-8 space-y-6 lg:space-y-8 xl:space-y-10">
        {/* Selected Employee Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <Card
            className={`border-border shadow-sm ${
              directFromStaffQr ? "border-2 border-primary/40" : ""
            }`}
          >
            <CardContent
              className={`flex items-center gap-4 ${directFromStaffQr ? "p-5 pt-6" : "p-4"}`}
            >
          <ProfileAvatar
            src={employeeAvatar}
            displayName={employeeName ?? "Team Member"}
            className={`shrink-0 ring-4 ring-primary shadow-sm ${
              directFromStaffQr ? "h-24 w-24" : "h-16 w-16"
            }`}
          />
          <div>
            <p className="text-sm text-muted-foreground">
              {directFromStaffQr ? "You’re tipping" : "Tipping"}
            </p>
            <p className={`font-semibold text-foreground ${directFromStaffQr ? "text-xl" : "text-lg"}`}>
              {employeeName ?? "Team Member"}
            </p>
          </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Preset tip amounts — same tile size/layout as former %-of-bill quick select */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick select</CardTitle>
            <CardDescription>Choose a preset tip amount</CardDescription>
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
                  <div className="text-sm text-muted-foreground">Tip amount</div>
                </motion.button>
              ))}
              <motion.button
                key="custom-card"
                type="button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + presetAmounts.length * 0.05 }}
                onClick={handleCustomClick}
                className={`p-4 rounded-xl border-2 text-left transition-all min-h-[100px] flex flex-col justify-center ${
                  showCustomInput
                    ? "border-accent bg-accent/10 shadow-lg"
                    : "border-border bg-card hover:border-accent/50 hover:shadow-md"
                }`}
              >
                <div className="text-lg font-bold text-foreground">Choose Your Amount</div>
              </motion.button>
            </div>
          </CardContent>
        </Card>

        {/* Custom Amount */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Custom Tip</CardTitle>
            <CardDescription>Enter any amount you prefer</CardDescription>
          </CardHeader>
          <CardContent>
          {!showCustomInput ? (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={handleCustomClick}
              className="w-full p-4 rounded-xl border-2 border-dashed border-border bg-muted/30 hover:border-accent/50 transition-all"
            >
              <span className="text-sm text-muted-foreground">Enter custom amount</span>
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                €
              </div>
              <input
                type="number"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => handleCustomInput(e.target.value)}
                className="w-full pl-10 pr-4 py-4 rounded-xl border-2 border-accent bg-card text-2xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
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
            <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-primary/10 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tip amount</span>
                  <span className="text-2xl font-bold text-foreground">{formatEur(selectedAmount)}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Fixed Bottom CTA */}
      {selectedAmount && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4"
        >
          <div className="max-w-2xl mx-auto lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1280px] lg:px-8 xl:px-10 2xl:px-12">
            <button
              onClick={handleContinue}
              className="w-full bg-accent text-white rounded-xl py-4 font-semibold text-lg hover:bg-accent/90 transition-all shadow-lg"
            >
              Continue to Payment
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
