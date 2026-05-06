import { useNavigate, useParams, Link, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { Heart, Building2, Sparkles } from "lucide-react";
import { useTipFlow } from "../../context/TipFlowContext";
import { getStaffByBusinessEmployeeSlug, type StaffBySlugResponse } from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { ProfileAvatar } from "../../components/ui/profile-avatar";
import { BusinessLogoMark } from "../../components/business/BusinessLogoMark";
import { getRepeatTipDataForBusiness } from "../../lib/repeatTip";
import { markCustomerFlowEntered } from "../../lib/customerFlowGuard";
import { formatEur } from "../../lib/formatEur";

const BRAND_ORANGE = "#EB992C";
const BLACK = "#000000";

/**
 * `/{businessSlug}/{employeeSlug}` — canonical human-readable employee tip entry.
 */
export function StaffTipByPublicPathPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const previewProfile = searchParams.get("preview") === "1";
  const { businessSlug: bizParam, employeeSlug: empParam } = useParams<{
    businessSlug: string;
    employeeSlug: string;
  }>();
  const { setBusinessId, setEmployee, setStaffTipReturnPath, setAmount } = useTipFlow();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffBySlugResponse | null>(null);
  const [showRepeatPrompt, setShowRepeatPrompt] = useState(false);
  const [repeatAmount, setRepeatAmount] = useState<number | null>(null);

  useEffect(() => {
    const b = bizParam?.trim().toLowerCase();
    const e = empParam?.trim().toLowerCase();
    if (!b || !e) {
      setError("Invalid link.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getStaffByBusinessEmployeeSlug(b, e);
        if (cancelled) return;
        setBusinessId(data.businessId);
        setEmployee(data.id, data.name, data.avatar ?? undefined);
        setStaffTipReturnPath(b, e);
        if (!previewProfile) {
          const d = getRepeatTipDataForBusiness(data.businessId);
          if (d && d.employeeId === data.id) {
            setRepeatAmount(d.lastAmount);
            setShowRepeatPrompt(true);
            setStaff(data);
            return;
          }
          const qs = new URLSearchParams({
            employeeId: data.id,
            returnBusinessSlug: b,
            returnEmployeeSlug: e,
            direct: "1",
          });
          navigate(`/tip-amount?${qs.toString()}`, { replace: true });
          return;
        }
        setStaff(data);
      } catch (err) {
        logClientError("StaffTipByPublicPathPage", err);
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
  }, [bizParam, empParam, previewProfile, navigate, setBusinessId, setEmployee, setStaffTipReturnPath]);

  const handleLeaveTip = () => {
    if (!staff || !bizParam?.trim() || !empParam?.trim()) return;
    const b = bizParam.trim().toLowerCase();
    const e = empParam.trim().toLowerCase();
    const qs = new URLSearchParams({
      employeeId: staff.id,
      returnBusinessSlug: b,
      returnEmployeeSlug: e,
      direct: "1",
    });
    navigate(`/tip-amount?${qs.toString()}`);
  };

  const handleRepeatTip = () => {
    if (!staff || repeatAmount == null || !bizParam?.trim() || !empParam?.trim()) return;
    setBusinessId(staff.businessId);
    setEmployee(staff.id, staff.name, staff.avatar ?? undefined);
    setStaffTipReturnPath(bizParam.trim().toLowerCase(), empParam.trim().toLowerCase());
    setAmount(repeatAmount);
    markCustomerFlowEntered();
    navigate("/payment");
  };

  if (loading) {
    return (
      <CareTipPageLoader
        variant="wait"
        message={previewProfile ? "Loading profile…" : "Opening tip screen…"}
      />
    );
  }

  if (error || !staff) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <p className="mb-2 text-center text-sm font-medium text-destructive">{error ?? "Not found"}</p>
        <Link to="/" className="text-primary hover:underline text-sm">
          Go home
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
    <div className="min-h-screen bg-background pb-12">
      <div
        className="h-36 w-full"
        style={{
          background: `linear-gradient(135deg, ${BRAND_ORANGE} 0%, ${BLACK} 100%)`,
        }}
      />
      <div className="max-w-md mx-auto px-4 -mt-16 relative">
        <div className="mb-4 flex justify-center">
          <BusinessLogoMark
            logoPathOrUrl={staff.businessLogo ?? null}
            businessName={staff.businessName}
            size="lg"
            className="rounded-2xl shadow-md ring-2 ring-background"
          />
        </div>
        <div className="bg-card rounded-2xl border border-border shadow-lg p-6 text-center">
          <div className="mx-auto mb-4" style={{ boxShadow: `0 0 0 2px ${BRAND_ORANGE}` }}>
            <ProfileAvatar
              src={staff.avatar}
              displayName={staff.name}
              className="mx-auto h-28 w-28 ring-4 ring-background"
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{staff.name}</h1>
          <p className="text-sm font-medium mt-1" style={{ color: BRAND_ORANGE }}>
            {staff.jobTitle}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-3 text-muted-foreground text-sm">
            <Building2 className="w-4 h-4 shrink-0" />
            <span>{staff.businessName}</span>
          </div>

          {staff.bio ? (
            <p className="text-sm text-muted-foreground mt-4 text-left leading-relaxed">{staff.bio}</p>
          ) : null}

          {goal != null && goal > 0 ? (
            <div className="mt-6 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" style={{ color: BRAND_ORANGE }} />
                <span className="text-sm font-semibold text-foreground">Monthly goal</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>
                  {formatEur(staff.currentMonthTotal)} / {formatEur(goal)}
                </span>
                {progress != null ? <span>{Math.round(progress)}%</span> : null}
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progress ?? 0}%`,
                    backgroundColor: BRAND_ORANGE,
                  }}
                />
              </div>
            </div>
          ) : null}

          {showRepeatPrompt && repeatAmount ? (
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleRepeatTip}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-md transition-colors hover:bg-primary-hover"
              >
                <Heart className="w-5 h-5" />
                Tip again ({formatEur(repeatAmount)})
              </button>
              <button
                type="button"
                onClick={handleLeaveTip}
                className="w-full rounded-xl border border-border bg-background py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Choose different amount
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLeaveTip}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-md transition-colors hover:bg-primary-hover"
            >
              <Heart className="w-5 h-5" />
              Leave a tip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
