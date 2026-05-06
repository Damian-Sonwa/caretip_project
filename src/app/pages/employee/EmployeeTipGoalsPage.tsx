import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft } from "lucide-react";

import { useRequireAuth } from "../../hooks/useRequireAuth";
import { getTipsByEmployee, type EmployeeGoalProgress } from "../../lib/api";
import { logClientError } from "../../lib/clientLog";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { EmployeeGoalCard } from "../../components/employee/EmployeeGoalCard";

export function EmployeeTipGoalsPage() {
  const { user } = useRequireAuth();
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState<EmployeeGoalProgress | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getTipsByEmployee();
      setGoal(data.goal ?? null);
    } catch (e) {
      logClientError("EmployeeTipGoalsPage.refresh", e);
      setGoal(null);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== "employee") return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await refresh();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh, user?.role, user?.id]);

  if (!user || user.role !== "employee") return null;
  if (loading) return <CareTipPageLoader />;

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/employee/dashboard" className="rounded-lg p-2 transition-colors hover:bg-muted" aria-label="Back">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-foreground">Tip goals</h1>
          <p className="text-sm text-muted-foreground">Set a target and track your progress.</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <EmployeeGoalCard goal={goal} onUpdated={() => void refresh()} />
      </div>
    </div>
  );
}

