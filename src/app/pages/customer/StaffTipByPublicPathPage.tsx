import { useNavigate, useParams, Link, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { Heart, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTipFlow } from "../../context/TipFlowContext";
import { getStaffByBusinessEmployeeSlug, type StaffBySlugResponse } from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { CareTipLogo } from "../../components/CareTipLogo";
import { prefetchCustomerFlowRoutes } from "../../lib/prefetchCustomerRoutes";
import { CustomerFlowShell } from "./CustomerFlowShell";
import { ProfileAvatar } from "../../components/ui/profile-avatar";
import { BusinessLogoMark } from "../../components/business/BusinessLogoMark";
import { getRepeatTipDataForBusiness } from "../../lib/repeatTip";
import { markCustomerFlowEntered } from "../../lib/customerFlowGuard";
import { formatEur } from "../../lib/formatEur";
import { customerFlowUi as cf } from "./customerFlowUi";

const BRAND_ORANGE = "#e9781c";
const BLACK = "#000000";

/**
 * `/{businessSlug}/{employeeSlug}` — canonical human-readable employee tip entry.
 */
export function StaffTipByPublicPathPage() {
  const { t } = useTranslation();
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
    const schedule = () => prefetchCustomerFlowRoutes();
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(schedule, { timeout: 2500 });
      return () => cancelIdleCallback(id);
    }
    const id = window.setTimeout(schedule, 400);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const b = bizParam?.trim().toLowerCase();
    const e = empParam?.trim().toLowerCase();
    if (!b || !e) {
      setError(t("tipFlow.errors.invalidLink"));
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
  }, [bizParam, empParam, previewProfile, navigate, setBusinessId, setEmployee, setStaffTipReturnPath, t]);

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
      <CustomerFlowShell
        headerLogo={
          staff ? (
            <BusinessLogoMark
              logoPathOrUrl={staff.businessLogo}
              businessName={staff.businessName}
              size="customer"
              className="shrink-0"
            />
          ) : (
            <CareTipLogo size="xs" className="shrink-0" />
          )
        }
        title={t("tipFlow.staffLanding.leaveTip")}
        loading
        loadingMessage={
          previewProfile ? t("tipFlow.staffLanding.loadingProfile") : t("tipFlow.staffLanding.openingTipScreen")
        }
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

  return (
    <div className={cf.page}>
      <div
        className="h-36 w-full shrink-0 rounded-b-[32px] shadow-[0_18px_42px_-26px_rgba(15,23,42,0.45)]"
        style={{
          background: `linear-gradient(135deg, ${BRAND_ORANGE} 0%, ${BLACK} 100%)`,
        }}
        aria-hidden
      />
      <div className="caretip-container mx-auto max-w-xl -mt-14 space-y-5 pb-16 sm:-mt-16 sm:pb-20">
        <div className="flex justify-center">
          <BusinessLogoMark
            logoPathOrUrl={staff.businessLogo ?? null}
            businessName={staff.businessName}
            size="hero"
          />
        </div>
        <div className={`${cf.card} px-6 py-8 text-center sm:px-8 sm:py-9`}>
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

          {showRepeatPrompt && repeatAmount ? (
            <div className="mt-7 space-y-3">
              <button type="button" onClick={handleRepeatTip} className={`${cf.btnPrimaryLg} py-4 text-[0.9375rem]`}>
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
        </div>
      </div>
    </div>
  );
}
