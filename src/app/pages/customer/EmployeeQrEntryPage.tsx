import { useNavigate, useParams, Link } from "react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useTipFlow } from "../../context/TipFlowContext";
import { getEmployeeById } from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileAvatar } from "../../components/ui/profile-avatar";
import { getRepeatTipDataForBusiness } from "../../lib/repeatTip";
import { markCustomerFlowEntered } from "../../lib/customerFlowGuard";
import { formatEur } from "../../lib/formatEur";

/**
 * /qr/employee/:employeeId — Deep link by employee id (parallel to `/staff/:slug`).
 * Resolves the staff member and continues to the tip amount step.
 */
export function EmployeeQrEntryPage() {
  const navigate = useNavigate();
  const { employeeId } = useParams<{ employeeId: string }>();
  const { setBusinessId, setEmployee, setStaffProfileSlug, setAmount } = useTipFlow();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [emp, setEmp] = useState<{ id: string; name: string; avatar?: string | null; businessId: string } | null>(
    null
  );
  const [repeatAmount, setRepeatAmount] = useState<number | null>(null);
  const [repeatDismissed, setRepeatDismissed] = useState(false);

  useEffect(() => {
    const raw = employeeId?.trim();
    if (!raw) {
      setError("Invalid link.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const emp = await getEmployeeById(raw);
        if (cancelled) return;
        setEmp(emp);
        setBusinessId(emp.businessId);
        setEmployee(emp.id, emp.name, emp.avatar ?? undefined);
        setStaffProfileSlug(null);
        const d = getRepeatTipDataForBusiness(emp.businessId);
        if (d && d.employeeId === emp.id && !repeatDismissed) {
          setRepeatAmount(d.lastAmount);
          setLoading(false);
          return;
        }
        const qs = new URLSearchParams({ employeeId: emp.id });
        qs.set("direct", "1");
        navigate(`/tip-amount?${qs.toString()}`, { replace: true });
      } catch (e) {
        logClientError("EmployeeQrEntryPage", e);
        if (!cancelled) setError(toUserFriendlyMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [employeeId, navigate, repeatDismissed, setBusinessId, setEmployee, setStaffProfileSlug]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <p className="mb-2 text-center text-sm font-medium text-destructive">{error}</p>
        <Link to="/" className="text-primary hover:underline text-sm">
          Go home
        </Link>
      </div>
    );
  }

  if (loading) {
    return <CareTipPageLoader variant="wait" message="Opening tip…" />;
  }

  if (!emp || repeatAmount == null) {
    return <CareTipPageLoader variant="wait" message="Opening tip…" />;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Card className="border border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Welcome back</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tip <span className="font-semibold text-foreground">{emp.name ?? "Team Member"}</span> again?
                  </p>
                  <p className="mt-2 text-xs font-semibold text-primary">Last tip: {formatEur(repeatAmount)}</p>
                </div>
                <ProfileAvatar
                  src={emp.avatar ?? undefined}
                  displayName={emp.name ?? "Team Member"}
                  className="h-12 w-12 shrink-0 ring-2 ring-primary/20"
                />
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setBusinessId(emp.businessId);
                    setEmployee(emp.id, emp.name, emp.avatar ?? undefined);
                    setStaffProfileSlug(null);
                    setAmount(repeatAmount);
                    markCustomerFlowEntered();
                    navigate("/payment");
                  }}
                  className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
                >
                  Tip again
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRepeatDismissed(true);
                    const qs = new URLSearchParams({ employeeId: emp.id });
                    qs.set("direct", "1");
                    navigate(`/tip-amount?${qs.toString()}`, { replace: true });
                  }}
                  className="w-full rounded-xl border border-border bg-background py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Choose different amount
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
