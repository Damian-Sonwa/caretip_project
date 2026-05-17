import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { CreditCard } from "lucide-react";
import { fetchPlatformTransactions, type GlobalTransactionRow } from "../../lib/api";
import { logClientError } from "../../lib/clientLog";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { formatEur } from "../../lib/formatEur";
import {
  PlatformPage,
  PlatformPageHeader,
  PlatformResponsiveData,
  PlatformSearchField,
} from "../../components/platform/PlatformPageChrome";
import { PlatformTransactionMobileCard } from "../../components/platform/platformAdminMobileCards";
import { platformUi } from "../../components/platform/platformDashboardUi";

function payoutStatusLabel(status: string, t: TFunction) {
  const key = `admin.globalTransactionsPage.payoutStatus.${status}`;
  const label = t(key);
  return label === key ? status.replace(/_/g, " ") : label;
}

function payoutBadgeClass(status: string): string {
  if (status === "paid") {
    return "bg-success text-success-foreground dark:bg-success/80 dark:text-success-foreground";
  }
  if (status === "failed") {
    return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
  }
  if (status === "not_applicable") {
    return "bg-muted text-muted-foreground";
  }
  return "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100";
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

  const emptyMessage = t("admin.globalTransactionsPage.empty");
  const footer =
    !loading && items.length > 0
      ? t("admin.globalTransactionsPage.footerShowing", { shown: items.length, total })
      : undefined;

  return (
    <PlatformPage>
      <PlatformPageHeader
        icon={CreditCard}
        title={t("admin.globalTransactionsPage.title")}
        subtitle={t("admin.globalTransactionsPage.subtitle", {
          feePercent: items[0]?.caretipFeePercent ?? 5,
        })}
      />

      <PlatformSearchField
        value={q}
        onChange={setQ}
        placeholder={t("admin.globalTransactionsPage.searchPlaceholder")}
        ariaLabel={t("admin.globalTransactionsPage.searchAria")}
        hint={t("admin.globalTransactionsPage.hintLiveSearch")}
      />

      <PlatformResponsiveData
        footer={footer}
        mobile={
          loading ? (
            <CareTipPageLoader variant="compact" message={t("admin.globalTransactionsPage.loading")} />
          ) : items.length === 0 ? (
            <p className={platformUi.emptyState}>{emptyMessage}</p>
          ) : (
            items.map((row) => <PlatformTransactionMobileCard key={row.id} row={row} />)
          )
        }
        desktop={
          <table className={platformUi.table}>
            <thead>
              <tr className={platformUi.tableHeadRow}>
                <th className={platformUi.tableTh}>{t("admin.globalTransactionsPage.colTransaction")}</th>
                <th className={platformUi.tableTh}>{t("admin.globalTransactionsPage.colBusiness")}</th>
                <th className={`${platformUi.tableTh} text-right`}>{t("admin.globalTransactionsPage.colAmountEur")}</th>
                <th className={`${platformUi.tableTh} text-right`}>{t("admin.globalTransactionsPage.colCaretipFee")}</th>
                <th className={`${platformUi.tableTh} text-right`}>{t("admin.globalTransactionsPage.colNetToStaff")}</th>
                <th className={platformUi.tableTh}>{t("admin.globalTransactionsPage.colPayout")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={platformUi.tableTd}>
                    <CareTipPageLoader variant="compact" message={t("admin.globalTransactionsPage.loading")} />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className={platformUi.emptyState}>
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className={platformUi.tableRow}>
                    <td className={`${platformUi.tableTd} max-w-[200px] font-mono text-xs`} title={row.id}>
                      {row.id}
                      {row.stripePaymentIntentId ? (
                        <span className="block truncate text-[10px] text-muted-foreground">
                          {row.stripePaymentIntentId}
                        </span>
                      ) : null}
                    </td>
                    <td className={platformUi.tableTd}>{row.businessName}</td>
                    <td className={`${platformUi.tableTd} text-right tabular-nums`}>{formatEur(row.amountEur)}</td>
                    <td className={`${platformUi.tableTd} text-right tabular-nums text-muted-foreground`}>
                      {row.caretipFeePercent}% ({formatEur(row.caretipFeeEur)})
                    </td>
                    <td className={`${platformUi.tableTd} text-right font-medium tabular-nums`}>
                      {formatEur(row.netToStaffEur)}
                    </td>
                    <td className={platformUi.tableTd}>
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${payoutBadgeClass(row.payoutStatus)}`}
                      >
                        {payoutStatusLabel(row.payoutStatus, t)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        }
      />
    </PlatformPage>
  );
}
