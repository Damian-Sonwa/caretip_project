import { useNavigate, useParams, Link } from "react-router";
import { useEffect, useState } from "react";
import { useTipFlow } from "../../context/TipFlowContext";
import { getEmployeeById } from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";

/**
 * /qr/employee/:employeeId — Deep link by employee id (parallel to `/staff/:slug`).
 * Resolves the staff member and continues to the tip amount step.
 */
export function EmployeeQrEntryPage() {
  const navigate = useNavigate();
  const { employeeId } = useParams<{ employeeId: string }>();
  const { setBusinessId, setEmployee, setStaffProfileSlug } = useTipFlow();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = employeeId?.trim();
    if (!raw) {
      setError("Invalid link.");
      return;
    }
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const emp = await getEmployeeById(raw);
        if (cancelled) return;
        setBusinessId(emp.businessId);
        setEmployee(emp.id, emp.name, emp.avatar ?? undefined);
        setStaffProfileSlug(null);
        const qs = new URLSearchParams({ employeeId: emp.id });
        qs.set("direct", "1");
        navigate(`/tip-amount?${qs.toString()}`, { replace: true });
      } catch (e) {
        logClientError("EmployeeQrEntryPage", e);
        if (!cancelled) setError(toUserFriendlyMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [employeeId, navigate, setBusinessId, setEmployee, setStaffProfileSlug]);

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

  return <CareTipPageLoader variant="wait" message="Opening tip…" />;
}
