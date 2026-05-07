import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, CreditCard, Download, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CareTipPageLoader } from "@/app/components/CareTipPageLoader";
import { useRequireAuth } from "@/app/hooks/useRequireAuth";
import { logClientError } from "@/app/lib/clientLog";
import { formatEur } from "@/app/lib/formatEur";
import { listBusinessTips, listEmployeeTips, type TipActivityRow, type TipStatus } from "@/app/lib/api";

function formatDateTime(iso: string, timezone?: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...(timezone ? { timeZone: timezone } : {}),
    });
  } catch {
    return iso;
  }
}

function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function TipsActivityPage() {
  const { user } = useRequireAuth();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | TipStatus>("all");
  const [range, setRange] = useState<"today" | "week" | "month" | "custom">("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<TipActivityRow[]>([]);
  const [total, setTotal] = useState(0);
  const [dataTimezone, setDataTimezone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const take = 50;
  const skip = (page - 1) * take;
  const totalPages = Math.max(1, Math.ceil(total / take));

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const common = {
        take,
        skip,
        status: status === "all" ? undefined : status,
        range,
        ...(range === "custom" ? { fromDate: customFrom || undefined, toDate: customTo || undefined } : {}),
      };
      const res =
        user.role === "business" ? await listBusinessTips(common) : await listEmployeeTips(common);
      setItems(res.items ?? []);
      setTotal(res.total ?? 0);
      setDataTimezone((res as any).timezone ?? null);
    } catch (e) {
      logClientError("TipsActivityPage.load", e);
      setItems([]);
      setTotal(0);
      setDataTimezone(null);
      setError(e instanceof Error ? e.message : "Failed to load tips.");
    } finally {
      setLoading(false);
    }
  }, [customFrom, customTo, range, skip, status, user?.id, user?.role]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((t) => {
      return (
        t.id.toLowerCase().includes(s) ||
        (t.staffName ?? "").toLowerCase().includes(s) ||
        (t.locationName ?? "").toLowerCase().includes(s) ||
        (t.tableName ?? "").toLowerCase().includes(s)
      );
    });
  }, [items, q]);

  const exportDisabled = exporting || loading || filtered.length === 0;

  return (
    <main className="bg-background px-4 py-8 pb-20 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Tips &amp; Activity</h1>
        <p className="mt-2 text-muted-foreground">Real tip activity for your account.</p>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-6 mb-6"
      >
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search staff, location/table, or tip ID…"
                className="w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value as "all" | TipStatus);
                }}
                className="appearance-none pl-4 pr-10 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all cursor-pointer text-sm"
              >
                <option value="all">All status</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={range}
                onChange={(e) => {
                  setPage(1);
                  setRange(e.target.value as typeof range);
                }}
                className="appearance-none pl-4 pr-10 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all cursor-pointer text-sm"
              >
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
                <option value="month">This month</option>
                <option value="custom">Custom</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {range === "custom" ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="appearance-none px-3 py-3 bg-input-background border border-border rounded-lg text-sm"
                />
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="appearance-none px-3 py-3 bg-input-background border border-border rounded-lg text-sm"
                />
              </div>
            ) : null}

            <Button
              type="button"
              disabled={exportDisabled}
              onClick={() => {
                if (filtered.length === 0) return;
                setExporting(true);
                try {
                  const header = ["Date", "Amount", "Staff", "Location/Table", "Status"];
                  const rows = filtered.map((t) => [
                    formatDateTime(t.createdAt, dataTimezone ?? undefined),
                    formatEur(t.amount),
                    t.staffName ?? "",
                    t.tableName ? `Table: ${t.tableName}` : t.locationName ? `Location: ${t.locationName}` : "",
                    String(t.status),
                  ]);
                  const tzRow = dataTimezone ? [`Timezone: ${dataTimezone}`] : [];
                  const csv = [tzRow, header, ...rows]
                    .filter((r) => r.length > 0)
                    .map((r) => r.map((c) => csvEscape(String(c))).join(","))
                    .join("\n");
                  const dateStr = new Date().toISOString().slice(0, 10);
                  const tzSlug = (dataTimezone ?? "local").replace(/\//g, "_");
                  downloadCsv(`tips_activity_${dateStr}_${tzSlug}.csv`, csv);
                  toast.success("Export downloaded");
                } finally {
                  setExporting(false);
                }
              }}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{exporting ? "Exporting…" : "Export"}</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {error ? (
        <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">{error}</div>
      ) : null}

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Staff</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Location/Table</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Date &amp; Time</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10">
                    <CareTipPageLoader variant="compact" message="Loading…" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <CreditCard className="mx-auto mb-4 h-10 w-10 opacity-50" />
                    No tips found.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="px-4 py-3 tabular-nums">{formatEur(t.amount)}</td>
                    <td className="px-4 py-3">{t.staffName ?? (user?.role === "employee" ? "You" : "—")}</td>
                    <td className="px-4 py-3">
                      {t.tableName ? `Table: ${t.tableName}` : t.locationName ? `Location: ${t.locationName}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(t.createdAt, dataTimezone ?? undefined)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold">
                        {String(t.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {skip + 1} to {Math.min(skip + take, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Prev
            </Button>
            <span className="px-2 text-sm text-foreground">
              Page {page} of {totalPages}
            </span>
            <Button type="button" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

