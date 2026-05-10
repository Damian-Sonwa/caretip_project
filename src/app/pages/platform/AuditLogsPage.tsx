import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { fetchPlatformAuditLogs, type PlatformAuditLogRow } from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "medium" });
  } catch (err) {
    logClientError("AuditLogsPage.formatTime", err);
    return iso;
  }
}

export function AuditLogsPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<PlatformAuditLogRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const meta = (r.metadata ?? "").toLowerCase();
      return (
        r.action.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        meta.includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });
  }, [rows, searchQuery]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPlatformAuditLogs({ take: 200, skip: 0 });
      setRows(res.items);
      setTotal(res.total);
    } catch (e) {
      logClientError("AuditLogsPage", e);
      toast.error(toUserFriendlyMessage(e));
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="px-4 lg:px-8 py-8 pb-20">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-7 h-7 text-accent" />
                {t("admin.auditLogsPage.title")}
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                {t("admin.auditLogsPage.subtitle", { count: total })}
              </p>
            </div>

            {!loading && rows.length > 0 && (
              <div className="relative mb-4 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("admin.auditLogsPage.filterPlaceholder")}
                  autoComplete="off"
                  aria-label={t("admin.auditLogsPage.filterAria")}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-sm"
                />
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left">
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t("admin.auditLogsPage.colTime")}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t("admin.auditLogsPage.colAction")}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t("admin.auditLogsPage.colUser")}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t("admin.auditLogsPage.colDetails")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10">
                          <CareTipPageLoader variant="compact" message={t("admin.auditLogsPage.loading")} />
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                          {t("admin.auditLogsPage.empty")}
                        </td>
                      </tr>
                    ) : filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                          {t("admin.auditLogsPage.noSearchMatches")}
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((r) => (
                        <tr key={r.id} className="border-b border-border/60 hover:bg-muted/30">
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                            {formatTime(r.createdAt)}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{r.action}</td>
                          <td className="px-4 py-3 text-xs break-all">{r.userEmail}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-md truncate" title={r.metadata ?? ""}>
                            {r.metadata ?? t("format.notAvailable")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
    </main>
  );
}

