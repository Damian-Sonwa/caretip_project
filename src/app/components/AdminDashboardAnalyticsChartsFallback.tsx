import { Card, CardContent } from "@/app/components/ui/card";
import { DashboardChartSkeleton } from "@/app/components/dashboard/DashboardAnalyticsLoader";
import { platformUi } from "@/app/components/platform/platformDashboardUi";

export function AdminDashboardAnalyticsChartsFallback() {
  return (
    <section className={platformUi.analyticsSection} aria-hidden>
      <div className="mb-4 h-8 w-48 rounded-md bg-muted/60" />
      <div className={platformUi.analyticsChartsGrid}>
        {[0, 1, 2, 3].map((key) => (
          <Card key={key} className={platformUi.analyticsCard}>
            <CardContent className="min-h-[220px] p-4 sm:min-h-[260px]">
              <DashboardChartSkeleton />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
