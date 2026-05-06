import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Bell, ChevronLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { useSocket } from "../../hooks/useSocket";
import { getTipsByEmployee, type TipItem } from "../../lib/api";
import { logClientError } from "../../lib/clientLog";
import { formatTipNaira, formatTipDateTime } from "../../lib/employeeFormat";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { Button } from "../../components/ui/button";
import { cn } from "@/lib/utils";

const BRAND_ORANGE = "#EB992C";

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [readIds, setReadIds] = useState<Record<string, true>>({});

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

  const allIds = useMemo(() => tips.map((t) => t.id), [tips]);
  const allSelected = selectedIds.length > 0 && selectedIds.length === allIds.length;
  const hasSelection = selectedIds.length > 0;

  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.length === allIds.length ? [] : allIds));
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const confirmDelete = (ids: string[]) => {
    const count = ids.length;
    if (count === 0) return;
    toast(`Delete ${count === 1 ? "this notification" : `${count} notifications`}?`, {
      action: {
        label: "Delete",
        onClick: () => {
          setTips((prev) => prev.filter((t) => !ids.includes(t.id)));
          setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
          setReadIds((prev) => {
            const next: Record<string, true> = { ...prev };
            for (const id of ids) delete next[id];
            return next;
          });
          toast.success("Deleted");
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const confirmMarkRead = (ids: string[]) => {
    const count = ids.length;
    if (count === 0) return;
    toast(`Mark ${count === 1 ? "this notification" : `${count} notifications`} as read?`, {
      action: {
        label: "Mark read",
        onClick: () => {
          setReadIds((prev) => {
            const next: Record<string, true> = { ...prev };
            for (const id of ids) next[id] = true;
            return next;
          });
          setSelectedIds([]);
          toast.success("Marked as read");
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
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
          <div className="py-14 text-center">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-semibold text-foreground">You&apos;re all caught up!</p>
            <p className="mt-2 text-sm text-muted-foreground">New tip activity will show up here.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <label className="flex items-center gap-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 accent-[#EB992C]"
                  aria-label="Select all notifications"
                />
                Select all
              </label>

              <div className="flex items-center gap-2">
                {hasSelection ? (
                  <>
                    <Button type="button" variant="outline" onClick={() => confirmMarkRead(selectedIds)}>
                      Mark as read
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => confirmDelete(selectedIds)}
                    >
                      Delete selected
                    </Button>
                  </>
                ) : null}
              </div>
            </div>

            <ul className="space-y-3">
              {tips.map((t) => {
                const selected = selectedIds.includes(t.id);
                const isRead = Boolean(readIds[t.id]);
                return (
                  <li
                    key={t.id}
                    className={cn(
                      "rounded-2xl bg-white border border-gray-50 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)]",
                      selected && "bg-orange-50/30 ring-1 ring-[#EB992C]/20",
                    )}
                    style={selected ? { borderLeftWidth: 4, borderLeftColor: BRAND_ORANGE } : undefined}
                  >
                    <div className="flex items-center gap-3 px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelected(t.id)}
                        className="h-4 w-4 rounded border-gray-300 accent-[#EB992C]"
                        aria-label="Select notification"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className={cn("truncate text-lg font-semibold", isRead ? "text-muted-foreground" : "text-foreground")}>
                            New tip received
                          </p>
                          <p className="shrink-0 text-xs text-muted-foreground">{formatTipDateTime(t.createdAt)}</p>
                        </div>
                        <p className={cn("mt-1 text-sm", isRead ? "text-muted-foreground" : "text-muted-foreground")}>
                          You received {formatTipNaira(t.amount)} from a customer.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => confirmDelete([t.id])}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-red-500"
                        aria-label="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
