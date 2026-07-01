import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Building2 } from "lucide-react";
import { Link } from "react-router";
import { fetchPlatformBusinesses, type PlatformBusinessRow } from "../../lib/api";
import { PlatformPage, PlatformPageHeader, PlatformResponsiveData } from "../../components/platform/PlatformPageChrome";
import { platformUi } from "../../components/platform/platformDashboardUi";
import { formatEur } from "../../lib/formatEur";
import { PlatformAdminTableSkeleton } from "../../components/dashboard/DashboardSectionLoading";
import { OnboardingVerificationStatusChip } from "../../components/verification/VerificationWorkflowStatusChip";
import { PlatformBusinessMobileCard } from "../../components/platform/PlatformBusinessMobileCard";

export function PlatformAllBusinessesPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<PlatformBusinessRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchPlatformBusinesses()
      .then((res) => setRows(res.businesses))
      .finally(() => setLoading(false));
  }, []);

  const colCount = 5;

  return (
    <PlatformPage>
      <PlatformPageHeader
        icon={Building2}
        title={t("admin.allBusinessesPage.title")}
        subtitle={t("admin.allBusinessesPage.subtitle")}
      />
      <PlatformResponsiveData
        desktop={
          <table className={platformUi.table}>
            <thead>
              <tr className={platformUi.tableHeadRow}>
                <th className={platformUi.tableTh}>{t("admin.colBusiness")}</th>
                <th className={platformUi.tableTh}>{t("admin.colOwner")}</th>
                <th className={platformUi.tableTh}>{t("admin.allBusinessesPage.colOnboardingVerification")}</th>
                <th className={platformUi.tableTh}>{t("admin.colTipsEur")}</th>
                <th className={platformUi.tableTh}>{t("admin.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <PlatformAdminTableSkeleton rows={10} cols={colCount} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className={platformUi.emptyState}>
                    {t("admin.noBusinesses")}
                  </td>
                </tr>
              ) : (
                rows.map((b) => (
                  <tr key={b.id} className={platformUi.tableRow}>
                    <td className={platformUi.tableTd}>
                      <div className="font-medium">{b.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{b.slug}</div>
                    </td>
                    <td className={platformUi.tableTd}>{b.ownerEmail}</td>
                    <td className={platformUi.tableTd}>
                      <OnboardingVerificationStatusChip status={b.onboardingVerificationStatus} />
                    </td>
                    <td className={platformUi.tableTd}>{formatEur(b.totalTipsEur ?? 0)}</td>
                    <td className={platformUi.tableTd}>
                      <Link to={`/platform-admin/businesses/${b.id}`} className="text-sm text-accent hover:underline">
                        {t("admin.view")}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        }
        mobile={
          loading ? (
            <p className={platformUi.emptyState}>{t("admin.loading")}</p>
          ) : (
            rows.map((b) => <PlatformBusinessMobileCard key={b.id} business={b} />)
          )
        }
      />
    </PlatformPage>
  );
}
