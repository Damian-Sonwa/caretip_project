import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import type { PlatformAnalytics } from "../lib/api";
import { cn } from "@/lib/utils";
import { platformUi } from "./platform/platformDashboardUi";
import {
  DashboardChartSkeleton,
  DashboardRefreshIndicator,
} from "./dashboard/DashboardAnalyticsLoader";
import { DashboardStableChartSlot } from "./dashboard/DashboardSectionLoading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/app/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

const ADMIN_CHART_COLORS = {
  primary: "#197278",
  cyan: "#22d3ee",
  purple: "#a78bfa",
  emerald: "#34d399",
  amber: "#f59e0b",
  red: "#fb7185",
  slate: "#94a3b8",
} as const;

export const ADMIN_ANALYTICS_TZ_OPTIONS = [
  "Europe/Berlin",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Africa/Lagos",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
] as const;

function formatCompact(n: number): string {
  try {
    return new Intl.NumberFormat(undefined, { notation: "compact" }).format(n);
  } catch {
    return String(n);
  }
}

function AnalyticsCard({
  title,
  description,
  children,
  descriptionClassName,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  descriptionClassName?: string;
}) {
  return (
    <Card className={platformUi.analyticsCard}>
      <CardHeader className={platformUi.analyticsCardHeader}>
        <CardTitle className={platformUi.analyticsCardTitle}>{title}</CardTitle>
        <CardDescription className={cn(platformUi.analyticsCardDesc, descriptionClassName)}>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className={platformUi.analyticsCardBody}>
        <div className={platformUi.analyticsChartWrap}>{children}</div>
      </CardContent>
    </Card>
  );
}

function UserDistributionChart({
  data,
}: {
  data: Array<{ role: "business" | "employee" | "platform_admin"; count: number }>;
}) {
  const { t } = useTranslation();
  const config: ChartConfig = {
    business: { label: t("admin.legendBusinesses"), color: ADMIN_CHART_COLORS.primary },
    employee: { label: t("admin.legendEmployees"), color: ADMIN_CHART_COLORS.cyan },
    platform_admin: { label: t("admin.legendPlatformAdmins"), color: ADMIN_CHART_COLORS.purple },
    empty: { label: t("admin.legendNoData"), color: ADMIN_CHART_COLORS.slate },
  };

  const rows = data.map((d) => ({
    name: String(config[d.role]?.label ?? d.role),
    role: d.role,
    value: Number.isFinite(d.count) ? d.count : 0,
    fill: `var(--color-${d.role})`,
  }));
  const total = rows.reduce((s, r) => s + (Number.isFinite(r.value) ? r.value : 0), 0);
  const chartRows =
    total > 0
      ? rows
      : [{ name: t("admin.legendNoData"), role: "empty", value: 1, fill: "var(--color-empty)" }];

  return (
    <ChartContainer config={config} className="aspect-auto h-full w-full min-h-0">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <Pie data={chartRows} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={3}>
          {chartRows.map((r) => (
            <Cell key={r.role} fill={r.fill} />
          ))}
        </Pie>
        <Legend verticalAlign="bottom" height={24} />
      </PieChart>
    </ChartContainer>
  );
}

function TipStatusChart({
  data,
}: {
  data: Array<{ status: "success" | "pending" | "failed"; count: number }>;
}) {
  const { t } = useTranslation();
  const config: ChartConfig = {
    success: { label: t("admin.tipStatusSuccess"), color: ADMIN_CHART_COLORS.emerald },
    pending: { label: t("admin.tipStatusPending"), color: ADMIN_CHART_COLORS.amber },
    failed: { label: t("admin.tipStatusFailed"), color: ADMIN_CHART_COLORS.red },
    empty: { label: t("admin.legendNoData"), color: ADMIN_CHART_COLORS.slate },
  };

  const rows = data.map((d) => ({
    name: String(config[d.status]?.label ?? d.status),
    status: d.status,
    value: Number.isFinite(d.count) ? d.count : 0,
    fill: `var(--color-${d.status})`,
  }));
  const total = rows.reduce((s, r) => s + (Number.isFinite(r.value) ? r.value : 0), 0);
  const chartRows =
    total > 0
      ? rows
      : [{ name: t("admin.legendNoData"), status: "empty", value: 1, fill: "var(--color-empty)" }];

  return (
    <ChartContainer config={config} className="aspect-auto h-full w-full min-h-0">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <Pie data={chartRows} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={3}>
          {chartRows.map((r) => (
            <Cell key={r.status} fill={r.fill} />
          ))}
        </Pie>
        <Legend verticalAlign="bottom" height={24} />
      </PieChart>
    </ChartContainer>
  );
}

function GrowthChart({
  data,
}: {
  data: Array<{ date: string; newUsers: number; newBusinesses: number; newTips: number }>;
}) {
  const { t } = useTranslation();
  const config: ChartConfig = {
    newUsers: { label: t("admin.legendNewUsers"), color: ADMIN_CHART_COLORS.primary },
    newBusinesses: { label: t("admin.legendNewVenues"), color: ADMIN_CHART_COLORS.purple },
    newTips: { label: t("admin.legendNewTips"), color: ADMIN_CHART_COLORS.cyan },
  };

  return (
    <ChartContainer config={config} className="aspect-auto h-full w-full min-h-0">
      <LineChart data={data} margin={{ left: 6, right: 6, top: 12, bottom: 6 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tickMargin={8} minTickGap={18} />
        <YAxis tickFormatter={formatCompact} width={34} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(v) => t("admin.growthDateLabel", { date: String(v ?? "") })}
            />
          }
        />
        <Legend verticalAlign="bottom" height={24} />
        <Line type="monotone" dataKey="newUsers" stroke="var(--color-newUsers)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="newBusinesses" stroke="var(--color-newBusinesses)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="newTips" stroke="var(--color-newTips)" strokeWidth={2} dot={false} />
      </LineChart>
    </ChartContainer>
  );
}

function TipVolumeChart({
  data,
  top,
}: {
  data: Array<{ date: string; tipsEur: number; tipCount: number }>;
  top: Array<{ businessId: string; businessName: string; tipsEur: number }>;
}) {
  const { t } = useTranslation();
  const config: ChartConfig = {
    tipsEur: { label: t("admin.legendTipsEur"), color: ADMIN_CHART_COLORS.emerald },
    top: { label: t("admin.legendTopVenues"), color: ADMIN_CHART_COLORS.slate },
  };

  const topBars = (top ?? []).map((b) => ({ name: b.businessName, tipsEur: b.tipsEur }));
  const showTop = topBars.length > 0;

  return (
    <ChartContainer config={config} className="aspect-auto h-full w-full min-h-0">
      {showTop ? (
        <BarChart data={topBars} margin={{ left: 6, right: 6, top: 12, bottom: 26 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tickMargin={10}
            interval="preserveStartEnd"
            tick={{ fontSize: 11 }}
            angle={-35}
            height={58}
            textAnchor="end"
            tickFormatter={(v) => String(v).slice(0, 12)}
          />
          <YAxis tickFormatter={formatCompact} width={40} />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
          <Bar dataKey="tipsEur" fill="var(--color-tipsEur)" radius={[10, 10, 0, 0]} />
        </BarChart>
      ) : (
        <AreaChart data={data} margin={{ left: 6, right: 6, top: 12, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickMargin={8} minTickGap={18} />
          <YAxis tickFormatter={formatCompact} width={40} />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
          <Area
            type="monotone"
            dataKey="tipsEur"
            stroke="var(--color-tipsEur)"
            fill="var(--color-tipsEur)"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </AreaChart>
      )}
    </ChartContainer>
  );
}

export type AdminDashboardAnalyticsChartsProps = {
  showChartSkeletons: boolean;
  chartAnalytics: PlatformAnalytics | null;
  chartTipStatus: PlatformAnalytics["tipStatus"];
  chartsLookEmpty: boolean;
  analyticsError: string | null;
  analyticsMeta: { rangeDays: number; timezone?: string | null };
  analyticsTimezone: string;
  analyticsSyncing: boolean;
  analyticsUpdatedAt: number | null;
  onTimezoneChange: (tz: string) => void;
  onRetryAnalytics: () => void;
};

export function AdminDashboardAnalyticsCharts({
  showChartSkeletons,
  chartAnalytics,
  chartTipStatus,
  chartsLookEmpty,
  analyticsError,
  analyticsMeta,
  analyticsTimezone,
  analyticsSyncing,
  analyticsUpdatedAt,
  onTimezoneChange,
  onRetryAnalytics,
}: AdminDashboardAnalyticsChartsProps) {
  const { t } = useTranslation();

  return (
    <motion.section
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={platformUi.analyticsSection}
      aria-busy={showChartSkeletons || undefined}
    >
      <div className={platformUi.analyticsHeader}>
        <div className={platformUi.analyticsHeaderCopy}>
          <h3 className="text-lg font-semibold text-foreground sm:text-xl">{t("admin.analyticsTitle")}</h3>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground max-lg:line-clamp-3 lg:line-clamp-none">
            {t("admin.analyticsSubtitle", {
              days: analyticsMeta.rangeDays,
              tz: analyticsMeta.timezone ?? analyticsTimezone,
            })}
          </p>
        </div>
        <div className={platformUi.analyticsControls}>
          <div className="flex w-full min-w-0 flex-col gap-1.5 sm:items-end">
            <Select value={analyticsTimezone} onValueChange={onTimezoneChange} disabled={analyticsSyncing}>
              <SelectTrigger size="sm" className="w-full sm:min-w-[14rem]" aria-label={t("admin.timezoneAria")}>
                <SelectValue placeholder={t("admin.timezonePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_ANALYTICS_TZ_OPTIONS.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DashboardRefreshIndicator
              isRefreshing={analyticsSyncing}
              lastUpdatedAt={analyticsUpdatedAt}
              className="shrink-0 text-right"
            />
          </div>
          <span className="text-xs font-medium leading-snug text-muted-foreground max-lg:line-clamp-2">
            {t("admin.tipStatusNote")}
          </span>
        </div>
      </div>

      {analyticsError && !chartAnalytics ? (
        <p className="mb-3 text-sm text-destructive" role="alert">
          {analyticsError}{" "}
          <button type="button" className="font-semibold underline underline-offset-2" onClick={onRetryAnalytics}>
            {t("admin.retry")}
          </button>
        </p>
      ) : null}
      {chartsLookEmpty ? (
        <p className="mb-3 text-sm text-muted-foreground">
          {t("admin.analyticsPeriodEmpty", {
            defaultValue: "No tips in this chart period yet. Stat cards show all-time platform totals.",
          })}
        </p>
      ) : null}
      <div className={platformUi.analyticsChartsGrid}>
        <AnalyticsCard title={t("admin.chartUserDist")} description={t("admin.chartUserDistDesc")}>
          <DashboardStableChartSlot loading={showChartSkeletons} skeleton={<DashboardChartSkeleton />}>
            {chartAnalytics ? (
              <UserDistributionChart data={chartAnalytics.userDistribution} />
            ) : (
              <span className="block min-h-[220px] sm:min-h-[260px]" aria-hidden />
            )}
          </DashboardStableChartSlot>
        </AnalyticsCard>

        <AnalyticsCard title={t("admin.chartTipStatus")} description={t("admin.chartTipStatusDesc")}>
          <DashboardStableChartSlot loading={showChartSkeletons} skeleton={<DashboardChartSkeleton />}>
            {chartAnalytics ? (
              <TipStatusChart data={chartTipStatus} />
            ) : (
              <span className="block min-h-[220px] sm:min-h-[260px]" aria-hidden />
            )}
          </DashboardStableChartSlot>
        </AnalyticsCard>

        <AnalyticsCard title={t("admin.chartGrowth")} description={t("admin.chartGrowthDesc")}>
          <DashboardStableChartSlot
            loading={showChartSkeletons}
            skeleton={<DashboardChartSkeleton barHeights={[38, 62, 44, 78, 52, 66, 40, 84, 58, 46]} />}
          >
            {chartAnalytics ? (
              <GrowthChart data={chartAnalytics.growth} />
            ) : (
              <span className="block min-h-[220px] sm:min-h-[260px]" aria-hidden />
            )}
          </DashboardStableChartSlot>
        </AnalyticsCard>

        <AnalyticsCard title={t("admin.chartTipVol")} description={t("admin.chartTipVolDesc")}>
          <DashboardStableChartSlot
            loading={showChartSkeletons}
            skeleton={<DashboardChartSkeleton barHeights={[55, 72, 48, 88, 60, 76, 42, 80, 64, 50]} />}
          >
            {chartAnalytics ? (
              <TipVolumeChart data={chartAnalytics.tipVolume} top={chartAnalytics.topBusinessesByTips} />
            ) : (
              <span className="block min-h-[220px] sm:min-h-[260px]" aria-hidden />
            )}
          </DashboardStableChartSlot>
        </AnalyticsCard>
      </div>
    </motion.section>
  );
}
