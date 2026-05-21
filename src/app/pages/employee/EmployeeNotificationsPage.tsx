import { useEffect, useMemo, useReducer, useState } from "react";
import { Bell, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { useSocket } from "../../hooks/useSocket";
import { getTipsByEmployee, type TipItem } from "../../lib/api";
import { logClientError } from "../../lib/clientLog";
import { formatTipNaira, formatTipDateTime } from "../../lib/employeeFormat";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { Button } from "../../components/ui/button";
import { cn } from "@/lib/utils";
import { EmployeePageHeader } from "../../components/employee/EmployeePageHeader";
import { EmployeeEmptyState } from "../../components/employee/EmployeeEmptyState";
import { employeeUi } from "../../components/employee/employeeDashboardUi";
import { resolveEmployeeTipsWithDevPreview } from "../../lib/devAnalyticsMocks";
import {
  getEmployeeReadIdsRecord,
  markAllEmployeeTipsRead,
  markEmployeeTipsRead,
  removeEmployeeTipsFromStore,
  subscribeEmployeeNotifications,
  syncEmployeeNotificationTips,
  recordNewEmployeeTip,
} from "../../lib/employeeNotificationStore";

interface NewTipPayload {
  tip: TipItem;
  employeeId: string;
  employeeName?: string;
  businessId: string;
  currentMonthTotal: number;
  monthlyGoal: number | null;
}

export function EmployeeNotificationsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useRequireAuth();
  const [tips, setTips] = useState<TipItem[]>([]);
  const [displayTips, setDisplayTips] = useState<TipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket(user?.role === "employee");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [, syncReadState] = useReducer((n: number) => n + 1, 0);
  const readIds = getEmployeeReadIdsRecord();

  useEffect(() => subscribeEmployeeNotifications(() => syncReadState()), []);

  useEffect(() => {
    if (!user || user.role !== "employee") return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getTipsByEmployee();
        if (!cancelled) {
          const apiTips = data.tips ?? [];
          setTips(apiTips);
          const resolved = resolveEmployeeTipsWithDevPreview(apiTips, {
            totalEarningsEur: data.totalEarningsEur,
            totalSupporters: data.totalSupporters,
          });
          setDisplayTips(resolved);
          if (user.employeeId) {
            syncEmployeeNotificationTips(user.employeeId, resolved);
          }
        }
      } catch (err) {
        logClientError("EmployeeNotificationsPage", err);
        if (!cancelled) {
          setTips([]);
          setDisplayTips([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (loading || !user?.employeeId || displayTips.length === 0) return;
    markAllEmployeeTipsRead();
  }, [loading, user?.employeeId, displayTips.length]);

  useEffect(() => {
    if (!socket || user?.role !== "employee") return;
    const onNew = (payload: NewTipPayload) => {
      if (user.employeeId && payload.employeeId !== user.employeeId) return;
      if (user.employeeId) recordNewEmployeeTip(user.employeeId, payload.tip);
      setTips((prev) => {
        const rest = prev.filter((tipRow) => tipRow.id !== payload.tip.id);
        return [payload.tip, ...rest];
      });
      setDisplayTips((prev) => {
        const rest = prev.filter((tipRow) => tipRow.id !== payload.tip.id);
        return [payload.tip, ...rest];
      });
    };
    socket.on("new_tip", onNew);
    return () => {
      socket.off("new_tip", onNew);
    };
  }, [socket, user?.role, user?.employeeId]);

  const allIds = useMemo(() => displayTips.map((tipRow) => tipRow.id), [displayTips]);

  if (!user || user.role !== "employee") return null;

  const allSelected = selectedIds.length > 0 && selectedIds.length === allIds.length;
  const hasSelection = selectedIds.length > 0;

  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.length === allIds.length ? [] : allIds));
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const enterSelectionMode = (preselectId?: string) => {
    setSelectionMode(true);
    if (preselectId) {
      setSelectedIds((prev) => (prev.includes(preselectId) ? prev : [preselectId, ...prev]));
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const confirmDelete = (ids: string[]) => {
    const count = ids.length;
    if (count === 0) return;
    const prompt =
      count === 1
        ? t("employee.notifications.toastDeletePromptOne")
        : t("employee.notifications.toastDeletePromptMany", { count });
    toast(prompt, {
      action: {
        label: t("employee.notifications.actionDelete"),
        onClick: () => {
          setTips((prev) => prev.filter((tipRow) => !ids.includes(tipRow.id)));
          setDisplayTips((prev) => prev.filter((tipRow) => !ids.includes(tipRow.id)));
          setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
          removeEmployeeTipsFromStore(ids);
          toast.success(t("employee.notifications.toastDeleted"));
        },
      },
      cancel: {
        label: t("employee.notifications.actionCancel"),
        onClick: () => {},
      },
    });
  };

  const confirmMarkRead = (ids: string[]) => {
    const count = ids.length;
    if (count === 0) return;
    const prompt =
      count === 1
        ? t("employee.notifications.toastMarkReadPromptOne")
        : t("employee.notifications.toastMarkReadPromptMany", { count });
    toast(prompt, {
      action: {
        label: t("employee.notifications.actionMarkRead"),
        onClick: () => {
          markEmployeeTipsRead(ids);
          setSelectedIds([]);
          toast.success(t("employee.notifications.toastMarkedRead"));
        },
      },
      cancel: {
        label: t("employee.notifications.actionCancel"),
        onClick: () => {},
      },
    });
  };

  return (
    <div className={employeeUi.page}>
      <div className={employeeUi.pageInner}>
        <EmployeePageHeader
          title={t("employee.notifications.title")}
          description={t("employee.notifications.manageHint")}
          backAriaLabel={t("employee.notifications.backAria")}
          leading={
            <div className={employeeUi.iconTileMuted}>
              <Bell className="h-5 w-5" aria-hidden />
            </div>
          }
        />

        {loading ? (
          <CareTipPageLoader variant="section" message={t("employee.notifications.loading")} />
        ) : displayTips.length === 0 ? (
          <div className={employeeUi.cardStatic}>
            <EmployeeEmptyState
              icon={<Bell className="h-6 w-6" aria-hidden />}
              title={t("employee.notifications.emptyTitle")}
              description={t("employee.notifications.emptySubtitle")}
            />
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {selectionMode ? (
                <label className="flex items-center gap-3 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-neutral-300 accent-primary"
                    aria-label={t("employee.notifications.selectAllAria")}
                  />
                  {t("employee.notifications.selectAll")}
                </label>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                {selectionMode ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className={employeeUi.btnSecondary}
                      onClick={() => confirmMarkRead(selectedIds)}
                      disabled={!hasSelection}
                    >
                      {t("employee.notifications.markRead")}
                    </Button>
                    {hasSelection ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => confirmDelete(selectedIds)}
                      >
                        {t("employee.notifications.deleteSelected")}
                      </Button>
                    ) : null}
                    <Button type="button" variant="outline" className={employeeUi.btnSecondary} onClick={exitSelectionMode}>
                      {t("employee.notifications.done")}
                    </Button>
                  </>
                ) : (
                  <Button type="button" variant="outline" className={employeeUi.btnSecondary} onClick={() => enterSelectionMode()}>
                    {t("employee.notifications.select")}
                  </Button>
                )}
              </div>
            </div>

            <ul className="space-y-3">
              {displayTips.map((tipRow) => {
                const selected = selectedIds.includes(tipRow.id);
                const isRead = Boolean(readIds[tipRow.id]);
                return (
                  <li
                    key={tipRow.id}
                    className={cn(
                      employeeUi.listItem,
                      employeeUi.listRow,
                      selected && employeeUi.listItemSelected,
                      selected && "border-l-4 border-l-primary",
                    )}
                  >
                    <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
                      {selectionMode ? (
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelected(tipRow.id)}
                          className="h-4 w-4 rounded border-neutral-300 accent-primary"
                          aria-label={t("employee.notifications.selectRowAria")}
                        />
                      ) : null}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p
                            className={cn(
                              "truncate text-base font-semibold sm:text-lg",
                              isRead ? "text-muted-foreground" : "text-foreground",
                            )}
                          >
                            {t("employee.notifications.newTipTitle")}
                          </p>
                          <p className="shrink-0 text-xs text-muted-foreground">
                            {formatTipDateTime(tipRow.createdAt, i18n.language)}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t("employee.notifications.tipBody", { amount: formatTipNaira(tipRow.amount) })}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!selectionMode) {
                            enterSelectionMode(tipRow.id);
                            return;
                          }
                          confirmDelete([tipRow.id]);
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-red-500"
                        aria-label={t("employee.notifications.deleteRowAria")}
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
