import { Card, CardContent } from "@/app/components/ui/card";
import { DashboardChartSkeleton } from "@/app/components/dashboard/DashboardAnalyticsLoader";
import { platformUi } from "@/app/components/platform/platformDashboardUi";

type AdminDashboardAnalyticsChartsFallbackProps = {
  chartCount?: number;
};

export function AdminDashboardAnalyticsChartsFallback({
  chartCount = 3,
}: AdminDashboardAnalyticsChartsFallbackProps = {}) {
  return (
    <section className={platformUi.analyticsSection} aria-hidden>
      <div className="mb-4 h-8 w-48 rounded-md bg-muted/60" />
      <div className={platformUi.analyticsChartsGrid}>
        {Array.from({ length: chartCount }).map((_, key) => (
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
