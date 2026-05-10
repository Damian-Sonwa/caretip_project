import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Search, CreditCard } from "lucide-react";
import { fetchPlatformTransactions, type GlobalTransactionRow } from "../../lib/api";
import { logClientError } from "../../lib/clientLog";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { formatEur } from "../../lib/formatEur";

function payoutStatusLabel(status: string, t: TFunction) {
  const key = `admin.globalTransactionsPage.payoutStatus.${status}`;
  const label = t(key);
  return label === key ? status.replace(/_/g, " ") : label;
}

export function GlobalTransactionsPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [items, setItems] = useState<GlobalTransactionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQ(q.trim()), 400);
    return () => window.clearTimeout(id);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPlatformTransactions({
        q: debouncedQ || undefined,
        take: 100,
        skip: 0,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      logClientError("GlobalTransactionsPage", e);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="px-4 lg:px-8 py-8 pb-20">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2 flex items-center gap-2">
                <CreditCard className="w-7 h-7 text-accent" />
                {t("admin.globalTransactionsPage.title")}
              </h1>
              <p className="text-muted-foreground">
                {t("admin.globalTransactionsPage.subtitle", {
                  feePercent: items[0]?.caretipFeePercent ?? 5,
                })}
              </p>
            </div>

            <div className="relative mb-6 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                placeholder={t("admin.globalTransactionsPage.searchPlaceholder")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoComplete="off"
                aria-label={t("admin.globalTransactionsPage.searchAria")}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-sm"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">{t("admin.globalTransactionsPage.hintLiveSearch")}</p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left">
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t("admin.globalTransactionsPage.colTransaction")}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t("admin.globalTransactionsPage.colBusiness")}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground text-right">{t("admin.globalTransactionsPage.colAmountEur")}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground text-right">{t("admin.globalTransactionsPage.colCaretipFee")}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground text-right">{t("admin.globalTransactionsPage.colNetToStaff")}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t("admin.globalTransactionsPage.colPayout")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10">
                          <CareTipPageLoader variant="compact" message={t("admin.globalTransactionsPage.loading")} />
                        </td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                          {t("admin.globalTransactionsPage.empty")}
                        </td>
                      </tr>
                    ) : (
                      items.map((row) => (
                        <tr key={row.id} className="border-b border-border/60 hover:bg-muted/30">
                          <td className="px-4 py-3 font-mono text-xs max-w-[200px] truncate" title={row.id}>
                            {row.id}
                            {row.stripePaymentIntentId && (
                              <span className="block text-[10px] text-muted-foreground truncate">
                                {row.stripePaymentIntentId}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">{row.businessName}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{formatEur(row.amountEur)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                            {row.caretipFeePercent}% ({formatEur(row.caretipFeeEur)})
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium">{formatEur(row.netToStaffEur)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                row.payoutStatus === "paid"
                                  ? "bg-success text-success-foreground dark:bg-success/80 dark:text-success-foreground"
                                  : row.payoutStatus === "failed"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
                                    : row.payoutStatus === "not_applicable"
                                      ? "bg-muted text-muted-foreground"
                                      : "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
                              }`}
                            >
                              {payoutStatusLabel(row.payoutStatus, t)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {!loading && (
                <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
                  {t("admin.globalTransactionsPage.footerShowing", { shown: items.length, total })}
                </div>
              )}
            </motion.div>
    </main>
  );
}
