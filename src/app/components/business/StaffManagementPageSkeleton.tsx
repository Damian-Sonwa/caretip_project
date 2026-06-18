import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StaffRosterTableSkeleton } from "@/app/components/dashboard/DashboardContentSkeletons";
import { businessUi } from "@/app/components/business/businessDashboardUi";
import { cn } from "@/lib/utils";

function ShimmerBar({ className }: { className?: string }) {
  return (
    <span className={cn("dashboard-hero-metric-skeleton__bar block rounded-md", className)} aria-hidden />
  );
}

/** Staff management page shell — breadcrumb + hero + stats + table skeletons. */
export function StaffManagementPageSkeleton() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen overflow-x-hidden bg-background pb-20">
      <div className={businessUi.subPageTop}>
        <div className={businessUi.subPageBreadcrumb}>
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard">{t("business.staffPage.backAria")}</Link>
          </Button>
        </div>

        <div className={cn(businessUi.subPageHero, "space-y-4")}>
          <ShimmerBar className="h-6 w-40 rounded-full" />
          <ShimmerBar className="h-9 w-[min(100%,20rem)]" />
          <ShimmerBar className="h-4 w-[min(100%,28rem)]" />
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-none">
            <ShimmerBar className="h-4 w-28" />
            <ShimmerBar className="mt-3 h-10 w-48" />
            <ShimmerBar className="mt-4 h-11 w-full rounded-lg" />
          </div>
        </div>

        <Card className={businessUi.atAGlanceCard}>
          <CardContent className={businessUi.atAGlanceContent}>
            <ShimmerBar className="h-3 w-24" />
            <div className="mt-3 grid grid-cols-3 gap-4 text-center">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <ShimmerBar className="mx-auto h-3 w-16" />
                  <ShimmerBar className="mx-auto h-7 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={cn(businessUi.subPageMain, "min-w-0 space-y-6 pb-4")}>
        <Card className={cn(businessUi.cardStatic, "w-full")}>
          <CardHeader className="pb-3">
            <ShimmerBar className="h-4 w-16" />
            <ShimmerBar className="mt-2 h-3 w-48" />
          </CardHeader>
          <CardContent>
            <ShimmerBar className="h-12 w-full rounded-lg" />
          </CardContent>
        </Card>

        <StaffRosterTableSkeleton rows={6} />
      </div>
    </div>
  );
}
