import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Check, ChevronLeft, Pencil, Plus, Trash2 } from "lucide-react";

import { useRequireAuth } from "../../hooks/useRequireAuth";
import {
  archiveMyGoal,
  createMyGoal,
  deleteMyGoalById,
  listMyGoals,
  updateMyGoal,
  type EmployeeGoalRow,
  type GoalPeriod,
} from "../../lib/api";
import { logClientError } from "../../lib/clientLog";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { cn } from "@/lib/utils";

const PERIOD_LABEL: Record<GoalPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

function formatEur(value: number): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" }).format(value);
  } catch {
    return `€${value.toFixed(2)}`;
  }
}

export function EmployeeTipGoalsPage() {
  const { user } = useRequireAuth();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<EmployeeGoalRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeGoalRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyGoalId, setBusyGoalId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<GoalPeriod>("monthly");
  const [startDate, setStartDate] = useState("");

  const refresh = useCallback(async () => {
    try {
      const data = await listMyGoals();
      setGoals(data.goals ?? []);
      setLoadError(null);
    } catch (e) {
      logClientError("EmployeeTipGoalsPage.refresh", e);
      setGoals([]);
      setLoadError(e instanceof Error ? e.message : "Failed to load goals.");
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

  const openCreate = () => {
    setEditing(null);
    setName("");
    setAmount("");
    setPeriod("monthly");
    setStartDate(new Date().toISOString().slice(0, 10));
    setOpen(true);
  };

  const openEdit = (g: EmployeeGoalRow) => {
    setEditing(g);
    setName(g.name ?? "");
    setAmount(String(g.goalAmount ?? ""));
    setPeriod(g.goalPeriod);
    setStartDate(g.startDate);
    setOpen(true);
  };

  const sortedGoals = useMemo(() => {
    const copy = [...goals];
    copy.sort((a, b) => {
      if (a.status !== b.status) return a.status === "active" ? -1 : 1;
      return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
    });
    return copy;
  }, [goals]);

  const empty = sortedGoals.length === 0;

  if (!user || user.role !== "employee") return null;
  if (loading) return <CareTipPageLoader />;

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link to="/employee/dashboard" className="rounded-lg p-2 transition-colors hover:bg-muted" aria-label="Back">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold text-foreground">Tip goals</h1>
          <p className="text-sm text-muted-foreground">Set a target and track your progress.</p>
        </div>
      </div>

      <Card className="w-full rounded-3xl border border-gray-100 bg-white p-0 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">Manage goals</h2>
            <p className="mt-1 text-sm text-muted-foreground">Create, edit, archive, or delete your tip goals.</p>
          </div>
          <Button type="button" onClick={openCreate} className="rounded-2xl bg-[#EB992C] text-white hover:bg-[#d88926]">
            <Plus className="mr-2 h-4 w-4" />
            New Goal
          </Button>
        </div>

        {loadError ? (
          <div className="px-6 py-8">
            <div className="rounded-2xl border border-gray-100 bg-muted/20 p-5">
              <p className="text-sm font-semibold text-foreground">Couldn&apos;t load goals</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {loadError}
              </p>
              <div className="mt-4 flex gap-2">
                <Button type="button" variant="outline" onClick={() => void refresh()}>
                  Retry
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {empty ? (
          <div className="px-6 py-12">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <div className="relative">
                <div className="h-28 w-28 rounded-3xl bg-muted/40 ring-1 ring-black/[0.04]" />
                <svg
                  viewBox="0 0 64 64"
                  aria-hidden
                  className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/60"
                  fill="none"
                >
                  <path
                    d="M20 44V28c0-1.1.9-2 2-2h20c1.1 0 2 .9 2 2v16"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M24 26l8-8 8 8"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M26 46h12"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3 className="mt-6 text-base font-semibold text-foreground">No goals set yet</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Add your first goal to start tracking your tipping progress.
              </p>
              <div className="mt-6">
                <Button type="button" onClick={openCreate} className="rounded-2xl bg-[#EB992C] text-white hover:bg-[#d88926]">
                  <Plus className="mr-2 h-4 w-4" />
                  New Goal
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/20 text-left">
                  <th className="whitespace-nowrap px-6 py-3 text-[12px] font-semibold tracking-wide text-muted-foreground">
                    Goal Name
                  </th>
                  <th className="whitespace-nowrap px-6 py-3 text-[12px] font-semibold tracking-wide text-muted-foreground">
                    Target (€)
                  </th>
                  <th className="whitespace-nowrap px-6 py-3 text-[12px] font-semibold tracking-wide text-muted-foreground">
                    Period
                  </th>
                  <th className="whitespace-nowrap px-6 py-3 text-[12px] font-semibold tracking-wide text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedGoals.map((g) => (
                  <tr key={g.id} className="border-t border-gray-100">
                    <td className="px-6 py-4 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{g.name}</span>
                        {g.status === "archived" ? (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            Archived
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground">{formatEur(Number(g.goalAmount) || 0)}</td>
                    <td className="px-6 py-4 text-foreground">{PERIOD_LABEL[g.goalPeriod]}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(g)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-muted"
                          aria-label="Edit goal"
                          disabled={busyGoalId === g.id}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (g.status === "archived") return;
                            if (!window.confirm("Archive this goal? You can keep it for records.")) return;
                            setBusyGoalId(g.id);
                            void (async () => {
                              try {
                                await archiveMyGoal(g.id);
                                await refresh();
                              } catch (e) {
                                logClientError("EmployeeTipGoalsPage.archive", e);
                              } finally {
                                setBusyGoalId(null);
                              }
                            })();
                          }}
                          className={cn(
                            "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-muted",
                            g.status === "archived" && "opacity-40 cursor-not-allowed",
                          )}
                          aria-label="Archive goal"
                          disabled={busyGoalId === g.id || g.status === "archived"}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!window.confirm("Delete this goal? This can't be undone.")) return;
                            setBusyGoalId(g.id);
                            void (async () => {
                              try {
                                await deleteMyGoalById(g.id);
                                await refresh();
                              } catch (e) {
                                logClientError("EmployeeTipGoalsPage.delete", e);
                              } finally {
                                setBusyGoalId(null);
                              }
                            })();
                          }}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-red-500 transition-colors hover:bg-red-50"
                          aria-label="Delete goal"
                          disabled={busyGoalId === g.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit goal" : "Create new goal"}</DialogTitle>
            <DialogDescription>Set a target amount and a period for tracking.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="goal-name">Goal name</Label>
              <Input
                id="goal-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My weekly target"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-amount">Target (€)</Label>
              <Input
                id="goal-amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="300"
              />
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as GoalPeriod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-start">Start date</Label>
              <Input id="goal-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => {
                const n = parseFloat(amount);
                if (!name.trim()) return;
                if (Number.isNaN(n) || n < 0) return;
                if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) return;
                setSaving(true);
                void (async () => {
                  try {
                    if (editing) {
                      await updateMyGoal(editing.id, { name: name.trim(), goalAmount: n, goalPeriod: period, startDate: startDate.trim() });
                    } else {
                      await createMyGoal({ name: name.trim(), goalAmount: n, goalPeriod: period, startDate: startDate.trim() });
                    }
                    setOpen(false);
                    await refresh();
                  } catch (e) {
                    logClientError("EmployeeTipGoalsPage.saveGoal", e);
                  } finally {
                    setSaving(false);
                  }
                })();
              }}
              className="rounded-2xl bg-[#EB992C] text-white hover:bg-[#d88926]"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

