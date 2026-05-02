import { motion } from "motion/react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { Building2, MapPin, Users, DollarSign, Home, Search } from "lucide-react";
import { useTipFlow } from "../../context/TipFlowContext";
import {
  getBusinessById,
  getEmployeeById,
  getBusinessStaffDirectory,
  getTippingContextByQrSlug,
  type BusinessDirectoryEmployee,
  type BusinessInfo,
  type EmployeeDetail,
} from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { ProfileAvatar } from "../../components/ui/profile-avatar";
import { CareTipLogo } from "../../components/CareTipLogo";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { resolveMediaUrl } from "../../lib/mediaUrl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEV_BYPASS_ENABLED, DEV_MOCK } from "../../lib/devCustomerBypass";
import { markCustomerFlowEntered } from "../../lib/customerFlowGuard";
import { getRepeatTipDataForBusiness } from "../../lib/repeatTip";

const BRAND_ORANGE = "#EB992C";
const presetAmounts = [5, 10, 15, 20];

export function QRLandingPage() {
  const navigate = useNavigate();
  const { businessId, qrSlug } = useParams<{ businessId?: string; qrSlug?: string }>();
  const [searchParams] = useSearchParams();
  const employeeIdParam = searchParams.get("employeeId");

  const {
    setBusinessId,
    setEmployee,
    setAmount,
    setTippingVenue,
    setStaffProfileSlug,
    setStaffTipReturnPath,
    tippingLocationName,
    tippingTableName,
  } = useTipFlow();

  const [businessData, setBusinessData] = useState<BusinessInfo | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  /** Public staff list when business has a directory slug (general business QR). */
  const [poolEmployees, setPoolEmployees] = useState<BusinessDirectoryEmployee[] | null>(null);
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolQuery, setPoolQuery] = useState("");

  const [repeatCard, setRepeatCard] = useState<{
    employee: EmployeeDetail;
    amount: number;
    timestamp: number;
  } | null>(null);
  const [repeatDismissed, setRepeatDismissed] = useState(false);

  useEffect(() => {
    if (!businessId && !employeeIdParam && !qrSlug) {
      setBusinessId(null);
      setTippingVenue(null);
      setLoading(false);
      return;
    }

    const run = async () => {
      setLoading(true);
      setError(null);
      setSelectedEmployee(null);
      setBusinessData(null);
      try {
        let targetBusinessId: string | null = businessId ?? null;

        if (qrSlug) {
          const ctx = await getTippingContextByQrSlug(qrSlug);
          targetBusinessId = ctx.businessId;
          setBusinessId(ctx.businessId);
          setTippingVenue({
            locationId: ctx.locationId,
            tableId: ctx.tableId,
            locationName: ctx.locationName,
            tableName: ctx.tableName,
            qrSlug,
          });
          markCustomerFlowEntered();
        } else {
          setTippingVenue(null);
        }

        if (employeeIdParam) {
          const emp = await getEmployeeById(employeeIdParam);
          if (qrSlug && emp.businessId !== targetBusinessId) {
            setError("This team member does not belong to this venue.");
            return;
          }
          setBusinessId(emp.businessId);
          setSelectedEmployee(emp);
          setEmployee(emp.id, emp.name ?? "Valued Team Member", emp.avatar ?? undefined);
          markCustomerFlowEntered();
          if (!targetBusinessId) {
            targetBusinessId = emp.businessId;
          }
        } else if (targetBusinessId) {
          const business = await getBusinessById(targetBusinessId);
          if (!business) {
            setError("Business not found.");
            return;
          }
          setBusinessId(targetBusinessId);
          setBusinessData({
            ...business,
            slug: business.slug ?? null,
            location: business.location ?? "Downtown",
            type: business.type ?? "Restaurant",
          });
          markCustomerFlowEntered();
        }
      } catch (err) {
        logClientError("QRLandingPage", err);
        setError(toUserFriendlyMessage(err));
        setBusinessData(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [
    businessId,
    employeeIdParam,
    qrSlug,
    setBusinessId,
    setEmployee,
    setTippingVenue,
  ]);

  useEffect(() => {
    const slug = businessData?.slug?.trim().toLowerCase();
    if (!slug || selectedEmployee) {
      setPoolEmployees(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setPoolLoading(true);
      try {
        const res = await getBusinessStaffDirectory(slug);
        if (!cancelled) setPoolEmployees(res.employees ?? []);
      } catch (e) {
        logClientError("QRLandingPage.directory", e);
        if (!cancelled) setPoolEmployees([]);
      } finally {
        if (!cancelled) setPoolLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessData?.slug, selectedEmployee]);

  // Repeat tip: check local last-tip data for this business and validate employee still exists.
  useEffect(() => {
    if (!businessData?.id || selectedEmployee || employeeIdParam) {
      setRepeatCard(null);
      return;
    }
    if (repeatDismissed) return;
    const d = getRepeatTipDataForBusiness(businessData.id);
    if (!d) {
      setRepeatCard(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const emp = await getEmployeeById(d.employeeId);
        if (cancelled) return;
        if (!emp || emp.businessId !== businessData.id) {
          setRepeatCard(null);
          return;
        }
        setRepeatCard({ employee: emp, amount: d.lastAmount, timestamp: d.timestamp });
      } catch (e) {
        if (!cancelled) setRepeatCard(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessData?.id, selectedEmployee, employeeIdParam, repeatDismissed]);

  const filteredPool = useMemo(() => {
    const list = poolEmployees ?? [];
    const q = poolQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (e) => e.name.toLowerCase().includes(q) || e.jobTitle.toLowerCase().includes(q)
    );
  }, [poolEmployees, poolQuery]);

  useEffect(() => {
    if (employeeIdParam && selectedEmployee) {
      document.title = `Tip ${selectedEmployee.name || "Valued Team Member"} - CareTip Limited`;
    } else if (businessData) {
      document.title = `${businessData.name} - CareTip Limited`;
    }
    return () => {
      document.title = "CareTip Limited";
    };
  }, [selectedEmployee, businessData, employeeIdParam]);

  const goToSelectEmployee = () => {
    const slug = businessData?.slug?.trim();
    if (slug) {
      navigate(`/${encodeURIComponent(slug)}`);
      return;
    }
    navigate("/");
  };

  const pickEmployeeFromPool = (emp: BusinessDirectoryEmployee) => {
    if (!businessData) return;
    setBusinessId(businessData.id);
    setEmployee(emp.id, emp.name, emp.avatar ?? undefined);
    const qs = new URLSearchParams({ employeeId: emp.id });
    const bizSlug = businessData.slug?.trim();
    const empSlug = emp.slug?.trim();
    if (bizSlug && empSlug) {
      setStaffTipReturnPath(bizSlug, empSlug);
      qs.set("returnBusinessSlug", bizSlug);
      qs.set("returnEmployeeSlug", empSlug);
      qs.set("direct", "1");
    } else {
      setStaffProfileSlug(emp.slug ?? null);
      if (emp.slug) {
        qs.set("returnSlug", emp.slug);
        qs.set("direct", "1");
      }
    }
    navigate(`/tip-amount?${qs.toString()}`);
  };

  const showInlinePool =
    Boolean(businessData?.slug?.trim()) && !poolLoading && (poolEmployees?.length ?? 0) > 0;

  const goHome = () => {
    window.location.href = "/";
  };

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

  const handleContinueToPayment = () => {
    if (selectedAmount && selectedEmployee) {
      setAmount(selectedAmount);
      navigate("/payment");
    }
  };

  if (!businessId && !employeeIdParam && !qrSlug) {
    if (DEV_BYPASS_ENABLED) {
      // DEV-only: allow opening /qr-landing directly.
      // We don't hit the API here; we just seed minimal mock context and let
      // the tester jump straight to other pages.
      setBusinessId(DEV_MOCK.businessId);
      setEmployee(DEV_MOCK.employeeId, DEV_MOCK.employeeName, undefined);
      setAmount(DEV_MOCK.amount);
      setTippingVenue(DEV_MOCK.venue);
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="w-full max-w-md space-y-4">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Development bypass</CardTitle>
                <CardDescription>Direct routing is enabled in local development only.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  type="button"
                  onClick={() => navigate(`/tip-amount?employeeId=${encodeURIComponent(DEV_MOCK.employeeId)}`)}
                  className="w-full rounded-xl bg-accent py-3.5 font-semibold text-white shadow-sm hover:bg-accent/90 transition-colors"
                >
                  Open tip amount
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/payment")}
                  className="w-full rounded-xl border border-border bg-background py-3.5 font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Open payment
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/rating?session_id=${encodeURIComponent(DEV_MOCK.sessionId)}`)}
                  className="w-full text-sm font-semibold text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  Open rating / feedback
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }
    // Production: no direct entry to an empty QR landing page.
    navigate("/", { replace: true });
    return null;
  }

  if (loading && !employeeIdParam) {
    return <CareTipPageLoader variant="wait" message="Loading…" />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <p className="mb-2 text-center text-sm font-medium text-destructive">{error}</p>
        <button
          onClick={goHome}
          className="mt-4 px-6 py-3 rounded-xl flex items-center gap-2 font-medium text-white"
          style={{ backgroundColor: BRAND_ORANGE }}
        >
          <Home className="w-5 h-5" />
          Go Home
        </button>
      </div>
    );
  }

  const displayName = selectedEmployee?.name?.trim() || "Valued Team Member";
  const displayRole = selectedEmployee?.role?.trim() || "Team Member";

  if (employeeIdParam && loading) {
    const venueMsg =
      tippingLocationName && tippingTableName
        ? `You are at ${tippingLocationName}, ${tippingTableName}. Loading…`
        : "Loading…";
    return <CareTipPageLoader variant="wait" message={venueMsg} />;
  }

  if (selectedEmployee) {
    const monthlyGoal = selectedEmployee.monthlyGoal;
    const currentTotal = selectedEmployee.currentMonthTotal;
    const goalProgress =
      monthlyGoal != null && monthlyGoal > 0 ? Math.min(100, (currentTotal / monthlyGoal) * 100) : 0;

    return (
      <div className="min-h-screen bg-background pb-32">
        <div className="sticky top-0 z-10 border-b border-border/40 bg-background/95 backdrop-blur-lg shadow-sm">
          <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-3.5 lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1280px] lg:px-8 xl:px-10 2xl:px-12">
            <CareTipLogo size="xs" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold text-foreground">Tip {displayName}</h1>
              <p className="text-xs text-muted-foreground">{displayRole}</p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-2xl space-y-7 px-4 py-10 lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1280px] lg:px-8 xl:px-10 2xl:px-12 lg:space-y-9 xl:space-y-10">
          {tippingLocationName && tippingTableName ? (
            <p className="text-sm text-center text-muted-foreground/80">
              🏠 You are at {tippingLocationName}, {tippingTableName}.
            </p>
          ) : null}

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <Card className="border border-border/50 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
              <CardContent className="flex items-center gap-5 bg-white p-6 sm:p-7 dark:bg-neutral-900">
                <ProfileAvatar
                  src={selectedEmployee.avatar}
                  displayName={displayName}
                  className="h-24 w-24 shrink-0 ring-2 ring-primary/30 shadow-lg sm:h-28 sm:w-28"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground/80 mb-1">Tipping</p>
                  <p className="text-2xl font-bold text-foreground mb-2">{displayName}</p>
                  <p className="text-sm text-muted-foreground/90">{displayRole}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="border border-border/50 shadow-md overflow-hidden">
              <CardContent className="py-6 px-6">
                {monthlyGoal != null && monthlyGoal > 0 ? (
                  <>
                    <p className="mb-4 text-sm font-semibold text-foreground/90">
                      🎯 Help {displayName.split(" ")[0]} reach their monthly goal!
                    </p>
                    <div className="h-3 overflow-hidden rounded-full bg-muted/60">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${goalProgress}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full rounded-full bg-primary shadow-sm"
                      />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground/80 font-medium">
                      €{currentTotal.toFixed(0)} of €{Number(monthlyGoal).toFixed(0)} this month
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground/90">
                    ✨ Your tip goes directly to {displayName.split(" ")[0]}!
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <Card className="border border-border/50 shadow-md">
            <CardHeader className="pb-3 px-6 pt-6">
              <CardTitle className="text-lg font-bold">Select Tip Amount</CardTitle>
              <CardDescription className="text-sm">Choose a preset tip or enter a custom amount</CardDescription>
            </CardHeader>
            <CardContent className="px-6">
              <div className="grid grid-cols-2 gap-3">
                {presetAmounts.map((amount, index) => (
                  <motion.button
                    key={amount}
                    type="button"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + index * 0.05 }}
                    onClick={() => handleAmountSelect(amount)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all min-h-[110px] flex flex-col justify-center font-semibold ${
                      selectedAmount === amount
                        ? "border-primary bg-primary/10 shadow-lg text-foreground"
                        : "border-border/50 bg-card/60 hover:border-primary/40 hover:shadow-lg hover:bg-card text-foreground"
                    }`}
                  >
                    <div className="text-3xl font-bold mb-1">€{amount}</div>
                    <div className="text-xs text-muted-foreground/70">Tip amount</div>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 shadow-md">
            <CardHeader className="pb-3 px-6 pt-6">
              <CardTitle className="text-lg font-bold">Custom Amount</CardTitle>
              <CardDescription className="text-sm">Want to tip a different amount?</CardDescription>
            </CardHeader>
            <CardContent className="px-6">
              {!showCustomInput ? (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleCustomClick}
                  className="w-full rounded-2xl border-2 border-dashed border-border/50 bg-muted/20 transition-all hover:border-primary/40 hover:bg-muted/40"
                >
                  <DollarSign className="w-7 h-7 text-muted-foreground/50 mx-auto mb-2" />
                  <span className="text-sm text-muted-foreground/80 font-medium">Enter custom amount</span>
                </motion.button>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold text-muted-foreground/40">
                    €
                  </div>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={customAmount}
                    onChange={(e) => handleCustomInput(e.target.value)}
                    className="w-full pl-11 pr-5 py-5 rounded-2xl border-2 border-border/50 bg-card text-3xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
                    autoFocus
                    step="0.01"
                    min="0"
                  />
                </motion.div>
              )}
            </CardContent>
          </Card>

          {selectedAmount && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border border-border/50 bg-card shadow-lg">
                <CardContent className="pt-7 px-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-muted-foreground/80">Total Tip</span>
                    <span className="text-4xl font-bold text-primary">
                      €{selectedAmount.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {selectedAmount ? (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-0 left-0 right-0 border-t border-border/20 bg-background/95 backdrop-blur-lg px-4 py-4 shadow-lg"
          >
            <div className="mx-auto max-w-2xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1280px] lg:px-8 xl:px-10 2xl:px-12">
              <button
                type="button"
                onClick={handleContinueToPayment}
                className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
              >
                Continue to Payment
              </button>
            </div>
          </motion.div>
        ) : null}
      </div>
    );
  }

  if (!businessData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <p className="mb-2 text-sm font-medium text-destructive">Business not found.</p>
        <button onClick={goHome} className="text-primary hover:underline text-sm">
          Go Home
        </button>
      </div>
    );
  }

  const businessLogoSrc = resolveMediaUrl(businessData.logo);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="sticky top-0 z-10 border-b border-border/30 bg-background/95 backdrop-blur-lg shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-3.5 lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1280px] lg:px-8 xl:px-10 2xl:px-12">
          <CareTipLogo size="sm" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-foreground">{businessData.name}</h1>
            <p className="text-xs text-muted-foreground">Select a team member to tip</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-8 px-4 py-10 lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1280px] lg:px-8 xl:px-10 2xl:px-12 lg:space-y-10 xl:space-y-12">
        {tippingLocationName && tippingTableName ? (
          <p className="text-center text-sm text-muted-foreground/80 px-2">
            🏠 You are at <span className="font-semibold text-foreground">{tippingLocationName}</span>, <span className="font-semibold text-foreground">{tippingTableName}</span>.
          </p>
        ) : null}

        {repeatCard ? (
          <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <Card className="border border-border/40 shadow-md">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Welcome back</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tip{" "}
                      <span className="font-semibold text-foreground">
                        {repeatCard.employee.name ?? "Team Member"}
                      </span>{" "}
                      again?
                    </p>
                    <p className="mt-2 text-xs font-semibold text-primary">
                      Last tip: €{repeatCard.amount.toFixed(2)}
                    </p>
                  </div>
                  <ProfileAvatar
                    src={repeatCard.employee.avatar}
                    displayName={repeatCard.employee.name ?? "Team Member"}
                    className="h-12 w-12 shrink-0 ring-2 ring-primary/30"
                  />
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setBusinessId(businessData.id);
                      setEmployee(
                        repeatCard.employee.id,
                        repeatCard.employee.name ?? "Team Member",
                        repeatCard.employee.avatar ?? undefined,
                      );
                      setAmount(repeatCard.amount);
                      markCustomerFlowEntered();
                      navigate("/payment");
                    }}
                    className="w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-white shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl active:scale-95"
                  >
                    Tip again
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRepeatDismissed(true);
                      setRepeatCard(null);
                    }}
                    className="w-full rounded-2xl border border-border/50 bg-card/60 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-card"
                  >
                    Choose different staff
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div className="relative">
            <Card className="overflow-hidden border border-border/40 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <div className="relative h-56 bg-gray-50 dark:bg-neutral-900">
                {businessLogoSrc ? (
                  <img
                    src={businessLogoSrc}
                    alt={businessData.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{ backgroundColor: BRAND_ORANGE }}
                  >
                    <Building2 className="h-20 w-20 text-white/80" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <CardContent className="space-y-5 p-7 md:p-8">
                <div>
                  <h2 className="mb-3 text-3xl font-bold text-foreground">{businessData.name}</h2>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground/90">
                    <div className="flex items-center gap-2 font-medium">
                      <MapPin className="h-5 w-5 shrink-0 text-primary" />
                      <span>{businessData.location}</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <Building2 className="h-5 w-5 shrink-0 text-primary" />
                      <span>{businessData.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-muted/20 p-4">
                  <Users className="h-6 w-6 shrink-0 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {businessData.employeeCount} team members ready to serve you
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {businessData.slug?.trim() && poolLoading ? (
          <Card className="border-border shadow-sm">
            <CardContent className="space-y-3 py-6">
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((k) => (
                  <div key={k} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {showInlinePool ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="border border-border/40 shadow-md overflow-hidden">
              <CardHeader className="pb-4 px-6 pt-6">
                <CardTitle className="text-lg font-bold">Who served you?</CardTitle>
                <CardDescription className="text-sm">
                  Select the team member you'd like to tip
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 px-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" />
                  <input
                    type="search"
                    placeholder="Search by name or role…"
                    value={poolQuery}
                    onChange={(e) => setPoolQuery(e.target.value)}
                    className="w-full rounded-2xl border border-border/50 bg-card py-3.5 pl-11 pr-4 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 transition-colors"
                    autoComplete="off"
                  />
                </div>
                {filteredPool.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground/60">No matches found.</p>
                ) : (
                  <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {filteredPool.map((emp, index) => (
                      <motion.li
                        key={emp.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <button
                          type="button"
                          onClick={() => pickEmployeeFromPool(emp)}
                          className="flex w-full flex-col items-center gap-3 rounded-2xl border border-border/50 bg-card/60 p-4 text-center transition-all hover:border-primary/40 hover:shadow-lg hover:bg-card active:scale-95"
                        >
                          <ProfileAvatar
                            src={emp.avatar}
                            displayName={emp.name}
                            className="h-24 w-24 ring-2 ring-primary/30"
                          />
                          <span className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
                            {emp.name}
                          </span>
                          <span className="line-clamp-2 text-xs text-muted-foreground/70">
                            {emp.jobTitle}
                          </span>
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : null}

        {businessData.slug?.trim() && !poolLoading && poolEmployees?.length === 0 ? (
          <Card className="border border-border/30 bg-muted/10 shadow-sm">
            <CardContent className="py-6 text-center text-sm text-muted-foreground/70 font-medium">
              No public team list is available yet. You can still browse the directory to find team members.
            </CardContent>
          </Card>
        ) : null}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08 }}
        >
          <Card className="border border-border/40 shadow-md">
            <CardHeader className="pb-4 px-6 pt-6">
              <CardTitle className="text-lg font-bold">💝 Leave a Tip</CardTitle>
              <CardDescription className="text-sm">
                Your appreciation goes directly to the team member. It's quick, secure, and easy.
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        {showInlinePool ? (
          <p className="text-center text-sm text-muted-foreground/70 px-2">
            Want to browse more team members?{" "}
            <button
              type="button"
              onClick={goToSelectEmployee}
              className="font-semibold text-primary underline underline-offset-2 transition-colors hover:opacity-90"
            >
              Open full directory
            </button>
          </p>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <button
              type="button"
              onClick={goToSelectEmployee}
              className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl active:scale-95"
            >
              {businessData.slug?.trim() ? "Browse All Team Members" : "Select Team Member"}
            </button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border border-border/30 bg-gray-50 shadow-sm dark:bg-neutral-900">
            <CardContent className="flex items-center justify-center gap-3 py-5 text-center text-xs text-muted-foreground/70 font-medium">
              <svg className="h-5 w-5 shrink-0 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Secure payment powered by CareTip Limited
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
