import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { ChevronDown, CreditCard, Download, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { businessUi } from "@/app/components/business/businessDashboardUi";
import { employeeUi } from "@/app/components/employee/employeeDashboardUi";
import { CareTipPageLoader } from "@/app/components/CareTipPageLoader";
import { useRequireAuth } from "@/app/hooks/useRequireAuth";
import { logClientError } from "@/app/lib/clientLog";
import { formatEur } from "@/app/lib/formatEur";
import { listBusinessTips, listEmployeeTips, type TipActivityRow, type TipStatus } from "@/app/lib/api";
import { useSubscriptionEntitlements } from "@/app/hooks/useSubscriptionEntitlements";

function formatDateTime(iso: string, locale: typeof de, timezone?: string): string {
  try {
    const d = new Date(iso);
    return format(d, "PPp", {
      locale,
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
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.toLowerCase().startsWith("de") ? de : enUS;
  const { user } = useRequireAuth();
  const { hasCapability } = useSubscriptionEntitlements({
    enabled: user?.role === "business",
    role: user?.role === "business" ? "business" : null,
  });
  const canExportCsv = user?.role === "business" && hasCapability("csvExport");
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

  const statusLabel = useCallback(
    (s: TipStatus | string) => {
      if (s === "success") return t("business.tipsActivity.statusSuccess");
      if (s === "pending") return t("business.tipsActivity.statusPending");
      if (s === "failed") return t("business.tipsActivity.statusFailed");
      return String(s);
    },
    [t],
  );

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
      setDataTimezone((res as { timezone?: string }).timezone ?? null);
    } catch (e) {
      logClientError("TipsActivityPage.load", e);
      setItems([]);
      setTotal(0);
      setDataTimezone(null);
      setError(e instanceof Error ? e.message : t("business.tipsActivity.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [customFrom, customTo, range, skip, status, t, user?.id, user?.role]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((tip) => {
      return (
        tip.id.toLowerCase().includes(s) ||
        (tip.staffName ?? "").toLowerCase().includes(s) ||
        (tip.locationName ?? "").toLowerCase().includes(s) ||
        (tip.tableName ?? "").toLowerCase().includes(s)
      );
    });
  }, [items, q]);

  const exportDisabled = !canExportCsv || exporting || loading || filtered.length === 0;
  const ui = user?.role === "employee" ? employeeUi : businessUi;

  return (
    <main className={cn(ui.page, ui.pageShell, "overflow-x-hidden")}>
      <div className={ui.pageInner}>
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{t("business.tipsActivity.title")}</h1>
        <p className={cn("mt-2", ui.cardDesc)}>{t("business.tipsActivity.subtitle")}</p>
      </header>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={cn(ui.filterPanel, "mb-6 p-6")}
      >
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("business.tipsActivity.searchPlaceholder")}
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
                <option value="all">{t("business.tipsActivity.statusAll")}</option>
                <option value="success">{t("business.tipsActivity.statusSuccess")}</option>
                <option value="pending">{t("business.tipsActivity.statusPending")}</option>
                <option value="failed">{t("business.tipsActivity.statusFailed")}</option>
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
                <option value="today">{t("business.tipsActivity.rangeToday")}</option>
                <option value="week">{t("business.tipsActivity.rangeWeek")}</option>
                <option value="month">{t("business.tipsActivity.rangeMonth")}</option>
                <option value="custom">{t("business.tipsActivity.rangeCustom")}</option>
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

            {canExportCsv ? (
            <Button
              type="button"
              disabled={exportDisabled}
              onClick={() => {
                if (filtered.length === 0) return;
                setExporting(true);
                try {
                  const header = [
                    t("business.tipsActivity.csvDate"),
                    t("business.tipsActivity.csvAmount"),
                    t("business.tipsActivity.csvStaff"),
                    t("business.tipsActivity.csvLocationTable"),
                    t("business.tipsActivity.csvStatus"),
                  ];
                  const rows = filtered.map((tip) => [
                    formatDateTime(tip.createdAt, dateLocale, dataTimezone ?? undefined),
                    formatEur(tip.amount),
                    tip.staffName ?? "",
                    tip.tableName
                      ? `${t("business.tipsActivity.csvTablePrefix")} ${tip.tableName}`
                      : tip.locationName
                        ? `${t("business.tipsActivity.csvLocationPrefix")} ${tip.locationName}`
                        : "",
                    statusLabel(tip.status),
                  ]);
                  const tzRow = dataTimezone ? [`${t("business.tipsActivity.csvTimezone")} ${dataTimezone}`] : [];
                  const csv = [tzRow, header, ...rows]
                    .filter((r) => r.length > 0)
                    .map((r) => r.map((c) => csvEscape(String(c))).join(","))
                    .join("\n");
                  const dateStr = new Date().toISOString().slice(0, 10);
                  const tzSlug = (dataTimezone ?? "local").replace(/\//g, "_");
                  downloadCsv(`tips_activity_${dateStr}_${tzSlug}.csv`, csv);
                  toast.success(t("business.tipsActivity.toastExportDone"));
                } finally {
                  setExporting(false);
                }
              }}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">
                {exporting ? t("business.tipsActivity.exporting") : t("business.tipsActivity.export")}
              </span>
            </Button>
            ) : null}
          </div>
        </div>
      </motion.div>

      {error ? (
        <div className={cn(ui.filterPanel, "mb-6 p-4 text-sm text-muted-foreground")}>{error}</div>
      ) : null}

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={cn(ui.tablePanel, "overflow-hidden")}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">{t("business.tipsActivity.thAmount")}</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t("business.tipsActivity.thStaff")}</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t("business.tipsActivity.thLocationTable")}</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t("business.tipsActivity.thDateTime")}</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t("business.tipsActivity.thStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10">
                    <CareTipPageLoader variant="compact" message={t("business.tipsActivity.loading")} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <CreditCard className="mx-auto mb-4 h-10 w-10 opacity-50" />
                    {t("business.tipsActivity.empty")}
                  </td>
                </tr>
              ) : (
                filtered.map((tip) => (
                  <tr key={tip.id} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="px-4 py-3 tabular-nums">{formatEur(tip.amount)}</td>
                    <td className="px-4 py-3">
                      {tip.staffName ?? (user?.role === "employee" ? t("business.tipsActivity.you") : t("business.tipsActivity.unknownStaff"))}
                    </td>
                    <td className="px-4 py-3">
                      {tip.tableName
                        ? `${t("business.tipsActivity.csvTablePrefix")} ${tip.tableName}`
                        : tip.locationName
                          ? `${t("business.tipsActivity.csvLocationPrefix")} ${tip.locationName}`
                          : t("business.tipsActivity.noLocationDetail")}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(tip.createdAt, dateLocale, dataTimezone ?? undefined)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold">
                        {statusLabel(tip.status)}
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
            {t("business.tipsActivity.pagination", {
              from: skip + 1,
              to: Math.min(skip + take, total),
              total,
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              {t("business.tipsActivity.prev")}
            </Button>
            <span className="px-2 text-sm text-foreground">
              {t("business.tipsActivity.pageOf", { page, pages: totalPages })}
            </span>
            <Button type="button" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              {t("business.tipsActivity.next")}
            </Button>
          </div>
        </div>
      ) : null}
      </div>
    </main>
  );
}
