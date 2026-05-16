import { Link } from "react-router";
import { CheckCircle, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PlatformBusinessRow } from "../../lib/api";
import { formatEur } from "../../lib/formatEur";
import { BusinessLogoMark } from "../business/BusinessLogoMark";
import { cn } from "@/lib/utils";

type PlatformBusinessMobileCardProps = {
  business: PlatformBusinessRow;
  className?: string;
};

export function PlatformBusinessMobileCard({ business: b, className }: PlatformBusinessMobileCardProps) {
  const { t } = useTranslation();

  const status =
    b.verificationStatus === "verified" ? (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success px-2 py-0.5 text-[11px] font-medium text-success-foreground">
        <CheckCircle className="h-3.5 w-3.5" aria-hidden />
        {t("admin.verification.verified")}
      </span>
    ) : b.verificationStatus === "rejected" ? (
      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-red-700">
        <XCircle className="h-3.5 w-3.5" aria-hidden />
        {t("admin.verification.rejected")}
      </span>
    ) : (
      <span className="shrink-0 text-[11px] font-medium text-amber-700">{t("admin.verification.pending")}</span>
    );

  return (
    <Link
      to={`/platform-admin/businesses/${b.id}`}
      className={cn(
        "block rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors",
        "hover:bg-muted/30 active:bg-muted/50",
        className,
      )}
    >
      <div className="flex gap-3">
        <BusinessLogoMark logoPathOrUrl={b.logoPath ?? null} businessName={b.name} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="min-w-0 truncate text-base font-semibold text-foreground">{b.name}</h4>
            {status}
          </div>
          <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{b.slug}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{b.ownerEmail}</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <div>
              <dt className="font-medium uppercase tracking-wide text-muted-foreground">{t("admin.colTipsEur")}</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                {formatEur(b.totalTipsEur ?? 0)}
              </dd>
            </div>
            <div>
              <dt className="font-medium uppercase tracking-wide text-muted-foreground">{t("admin.colStaffLoc")}</dt>
              <dd className="mt-0.5 text-sm font-medium tabular-nums text-foreground">
                {b.staffCount ?? 0} / {b.locationCount ?? 0}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs font-medium text-primary">{t("admin.view")} →</p>
        </div>
      </div>
    </Link>
  );
}
