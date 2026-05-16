import { useNavigate, useParams, Link, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Heart, Building2, Sparkles } from "lucide-react";
import { useTipFlow } from "../../context/TipFlowContext";
import { getStaffBySlug, type StaffBySlugResponse } from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { ProfileAvatar } from "../../components/ui/profile-avatar";
import { getRepeatTipDataForBusiness } from "../../lib/repeatTip";
import { markCustomerFlowEntered } from "../../lib/customerFlowGuard";
import { formatEur } from "../../lib/formatEur";
import { customerFlowUi as cf } from "./customerFlowUi";

const BRAND_ORANGE = "#EB992C";
const BLACK = "#000000";

/**
 * /staff/:slug — Individual QR (Path A).
 * Default: skip the profile step and open tip amount with employee context (verify on that screen).
 * ?preview=1 — full profile + "Leave a tip" (e.g. back navigation from tip flow).
 */
export function StaffLandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const previewProfile = searchParams.get("preview") === "1";
  const { slug: slugParam } = useParams<{ slug: string }>();
  const { setBusinessId, setEmployee, setStaffProfileSlug, setAmount } = useTipFlow();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffBySlugResponse | null>(null);
  const [showRepeatPrompt, setShowRepeatPrompt] = useState(false);
  const [repeatAmount, setRepeatAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!slugParam?.trim()) {
      setError(t("tipFlow.errors.invalidLink"));
      setLoading(false);
      return;
    }
    const slug = slugParam.trim();
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getStaffBySlug(slug);
        if (cancelled) return;
        setBusinessId(data.businessId);
        setEmployee(data.id, data.name, data.avatar ?? undefined);
        setStaffProfileSlug(slug);
        if (!previewProfile) {
          const d = getRepeatTipDataForBusiness(data.businessId);
          if (d && d.employeeId === data.id) {
            setRepeatAmount(d.lastAmount);
            setShowRepeatPrompt(true);
            setStaff(data);
            return;
          }
          navigate(
            `/tip-amount?employeeId=${encodeURIComponent(data.id)}&returnSlug=${encodeURIComponent(slug)}&direct=1`,
            { replace: true }
          );
          return;
        }
        setStaff(data);
      } catch (err) {
        logClientError("StaffLandingPage", err);
        if (!cancelled) {
          setError(toUserFriendlyMessage(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [
    slugParam,
    previewProfile,
    navigate,
    setBusinessId,
    setEmployee,
    setStaffProfileSlug,
  ]);

  const handleLeaveTip = () => {
    if (!staff || !slugParam?.trim()) return;
    navigate(
      `/tip-amount?employeeId=${encodeURIComponent(staff.id)}&returnSlug=${encodeURIComponent(slugParam.trim())}&direct=1`
    );
  };

  const handleRepeatTip = () => {
    if (!staff || repeatAmount == null || !slugParam?.trim()) return;
    setBusinessId(staff.businessId);
    setEmployee(staff.id, staff.name, staff.avatar ?? undefined);
    setStaffProfileSlug(slugParam.trim());
    setAmount(repeatAmount);
    markCustomerFlowEntered();
    navigate("/payment");
  };

  if (loading) {
    return (
      <CareTipPageLoader
        variant="wait"
        message={previewProfile ? t("tipFlow.staffLanding.loadingProfile") : t("tipFlow.staffLanding.openingTipScreen")}
      />
    );
  }

  if (error || !staff) {
    return (
      <div className={cf.stateCenter}>
        <p className={cf.stateError}>{error ?? t("tipFlow.common.notFound")}</p>
        <Link to="/" className="mt-4 text-sm font-semibold text-primary underline-offset-2 hover:underline">
          {t("tipFlow.staffLanding.goHome")}
        </Link>
      </div>
    );
  }

  const goal = staff.monthlyGoal;
  const progress =
    goal != null && goal > 0
      ? Math.min(100, (staff.currentMonthTotal / goal) * 100)
      : null;

  return (
    <div className={cf.page}>
      <div
        className="h-36 w-full shrink-0 rounded-b-[32px] shadow-[0_18px_42px_-26px_rgba(15,23,42,0.45)]"
        style={{
          background: `linear-gradient(135deg, ${BRAND_ORANGE} 0%, ${BLACK} 100%)`,
        }}
        aria-hidden
      />
      <div className="caretip-container mx-auto max-w-xl -mt-14 space-y-0 pb-16 sm:-mt-16 sm:pb-20">
        <motion.div
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`${cf.cardShadcn} border border-border/60 bg-card px-6 py-8 text-center shadow-[0_14px_42px_-22px_rgba(15,23,42,0.2)]`}
        >
          <div
            className="mx-auto mb-5 inline-flex rounded-full"
            style={{ boxShadow: `0 0 0 3px ${BRAND_ORANGE}33` }}
          >
            <ProfileAvatar
              src={staff.avatar}
              displayName={staff.name}
              className="mx-auto size-[7.25rem] ring-[6px] ring-background"
            />
          </div>
          <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground">{staff.name}</h1>
          <p className="mt-1.5 text-sm font-semibold" style={{ color: BRAND_ORANGE }}>
            {staff.jobTitle}
          </p>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="size-4 shrink-0" aria-hidden />
            <span>{staff.businessName}</span>
          </div>

          {staff.bio ? <p className="mt-5 text-left text-sm leading-relaxed text-muted-foreground">{staff.bio}</p> : null}

          {goal != null && goal > 0 ? (
            <div className="mt-7 rounded-2xl border border-border/60 bg-muted/20 px-4 py-4 text-left">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="size-4 shrink-0" style={{ color: BRAND_ORANGE }} aria-hidden />
                <span className="text-sm font-semibold text-foreground">{t("tipFlow.staffLanding.monthlyGoalTitle")}</span>
              </div>
              <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                <span>
                  {formatEur(staff.currentMonthTotal)} / {formatEur(goal)}
                </span>
                {progress != null ? <span className="tabular-nums">{Math.round(progress)}%</span> : null}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-[width]"
                  style={{
                    width: `${progress ?? 0}%`,
                    backgroundColor: BRAND_ORANGE,
                  }}
                />
              </div>
            </div>
          ) : null}

          {showRepeatPrompt && repeatAmount ? (
            <div className="mt-7 space-y-3">
              <button
                type="button"
                onClick={handleRepeatTip}
                className={`${cf.btnPrimaryLg} py-4 text-[0.9375rem]`}
              >
                <Heart className="size-5 shrink-0" aria-hidden />
                {t("tipFlow.staffLanding.tipAgainWithAmount", { amount: formatEur(repeatAmount) })}
              </button>
              <button type="button" onClick={handleLeaveTip} className={`${cf.btnSecondaryLg} py-3.5 text-sm`}>
                {t("tipFlow.staffLanding.chooseDifferentAmount")}
              </button>
            </div>
          ) : (
            <button type="button" onClick={handleLeaveTip} className={`${cf.btnPrimaryLg} mt-7 py-4 text-[0.9375rem]`}>
              <Heart className="size-5 shrink-0" aria-hidden />
              {t("tipFlow.qrLanding.leaveTip")}
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
