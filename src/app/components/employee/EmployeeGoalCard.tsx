import { useState } from "react";
import { Pencil, Trash2, Target, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  upsertEmployeeGoal,
  deleteEmployeeGoal,
  type EmployeeGoalProgress,
  type GoalPeriod,
} from "../../lib/api";
import { formatEur } from "../../lib/formatEur";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

const PERIOD_LABEL: Record<GoalPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const STATUS_LABEL: Record<EmployeeGoalProgress["status"], string> = {
  achieved: "Achieved",
  on_track: "On track",
  below_target: "Below target",
};

function statusClass(s: EmployeeGoalProgress["status"]): string {
  if (s === "achieved") return "text-emerald-600";
  if (s === "on_track") return "text-primary";
  return "text-amber-700";
}

type Props = {
  goal: EmployeeGoalProgress | null;
  onUpdated: () => void;
};

export function EmployeeGoalCard({ goal, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<GoalPeriod>("monthly");
  const [startDate, setStartDate] = useState("");

  const openEdit = () => {
    if (goal) {
      setAmount(String(goal.goalAmount));
      setPeriod(goal.goalPeriod);
      setStartDate(goal.startDate);
    } else {
      setAmount("");
      setPeriod("monthly");
      setStartDate(new Date().toISOString().slice(0, 10));
    }
    setOpen(true);
  };

  const handleSave = async () => {
    const n = parseFloat(amount);
    if (Number.isNaN(n) || n < 0) {
      toast.error("Enter a valid goal amount.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) {
      toast.error("Please use a valid start date.");
      return;
    }
    setSaving(true);
    try {
      await upsertEmployeeGoal({
        goalAmount: n,
        goalPeriod: period,
        startDate: startDate.trim(),
      });
      toast.success("Goal saved");
      setOpen(false);
      onUpdated();
    } catch (e) {
      logClientError("EmployeeGoalCard.save", e);
      toast.error(toUserFriendlyMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!goal) return;
    const ok = window.confirm("Remove your tip goal?");
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteEmployeeGoal();
      toast.success("Goal removed");
      setOpen(false);
      onUpdated();
    } catch (e) {
      logClientError("EmployeeGoalCard.delete", e);
      toast.error(toUserFriendlyMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="border-2 border-primary/30 bg-muted/30 shadow-sm">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary p-2 text-primary-foreground">
              <Target className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base">Tip goal</CardTitle>
              {goal && goal.goalAmount > 0 ? (
                <>
                  <CardDescription className="mt-1 flex flex-wrap items-baseline gap-x-1.5 break-words text-foreground/90">
                    <span className="min-w-0 font-semibold tabular-nums">
                      {formatEur(goal.currentAmount)} / {formatEur(goal.goalAmount)}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      ({Math.round(Number(goal.percent))}%)
                    </span>
                  </CardDescription>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {PERIOD_LABEL[goal.goalPeriod]} · since {goal.startDate}
                  </p>
                  <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-background">
                    <div
                      className="h-3 rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, goal.percent)}%` }}
                    />
                  </div>
                  <p className={`mt-2 text-xs font-medium ${statusClass(goal.status)}`}>
                    {STATUS_LABEL[goal.status]}
                  </p>
                </>
              ) : (
                <CardDescription className="mt-1">
                  Set a target for your tips. You can pick daily, weekly, or monthly.
                </CardDescription>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="default" onClick={openEdit}>
                  {goal ? (
                    <>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit goal
                    </>
                  ) : (
                    "Create goal"
                  )}
                </Button>
                {goal ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                      </>
                    )}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{goal ? "Edit tip goal" : "Create tip goal"}</DialogTitle>
            <DialogDescription>
              Progress uses successful tips in the current {PERIOD_LABEL[period].toLowerCase()} period
              (from your start date).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="goal-amount">Target amount (€)</Label>
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
              <Input
                id="goal-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
