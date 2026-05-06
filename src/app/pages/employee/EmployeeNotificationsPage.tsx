import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft } from "lucide-react";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { useSocket } from "../../hooks/useSocket";
import { getTipsByEmployee, type TipItem } from "../../lib/api";
import { logClientError } from "../../lib/clientLog";
import { formatTipNaira, formatTipDateTime } from "../../lib/employeeFormat";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";

const TEAL = "#EB992C";

interface NewTipPayload {
  tip: TipItem;
  employeeId: string;
  employeeName?: string;
  businessId: string;
  currentMonthTotal: number;
  monthlyGoal: number | null;
}

export function EmployeeNotificationsPage() {
  const { user, logout } = useRequireAuth();
  const [tips, setTips] = useState<TipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket(user?.role === "employee");

  useEffect(() => {
    if (!user || user.role !== "employee") return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getTipsByEmployee();
        if (!cancelled) setTips(data.tips ?? []);
      } catch (err) {
        logClientError("EmployeeNotificationsPage", err);
        if (!cancelled) setTips([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!socket || user?.role !== "employee") return;
    const onNew = (payload: NewTipPayload) => {
      if (user.employeeId && payload.employeeId !== user.employeeId) return;
      setTips((prev) => {
        const rest = prev.filter((t) => t.id !== payload.tip.id);
        return [payload.tip, ...rest];
      });
    };
    socket.on("new_tip", onNew);
    return () => {
      socket.off("new_tip", onNew);
    };
  }, [socket, user?.role, user?.employeeId]);

  if (!user || user.role !== "employee") return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/employee/dashboard"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
        </div>

        {loading ? (
          <CareTipPageLoader variant="section" message="Loading notifications…" />
        ) : tips.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">No tips yet.</p>
        ) : (
          <ul className="space-y-3">
            {tips.map((t) => (
              <li
                key={t.id}
                className="rounded-xl border border-border bg-card p-4 text-sm"
                style={{ borderLeftWidth: 4, borderLeftColor: TEAL }}
              >
                <p className="text-foreground">
                  You received {formatTipNaira(t.amount)} from a Customer at {formatTipDateTime(t.createdAt)}.
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
