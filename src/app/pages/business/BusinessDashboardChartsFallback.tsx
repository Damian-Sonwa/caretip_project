import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { DashboardChartSkeleton } from "../../components/dashboard/DashboardAnalyticsLoader";
import { businessUi } from "../../components/business/businessDashboardUi";
import { cn } from "@/lib/utils";

export function BusinessDashboardChartsFallback() {
  return (
    <div className={businessUi.analyticsChartsGrid} aria-hidden>
      {[0, 1].map((key) => (
        <div key={key} className="flex h-full min-h-0 w-full">
          <Card className={cn(businessUi.cardStatic, "business-dashboard-chart-card business-dashboard-panel-card w-full")}>
            <CardHeader className="business-dashboard-panel-card__header">
              <div className="h-6 w-40 rounded-md bg-muted/60" />
            </CardHeader>
            <CardContent className="business-dashboard-panel-card__content min-h-[260px] sm:min-h-[290px]">
              <DashboardChartSkeleton minHeightClass="h-full min-h-0" className="h-full" />
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
