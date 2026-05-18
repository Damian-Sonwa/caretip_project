import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { dashboardBlockMotion } from "@/lib/motionPerf";
import {
  Users,
  TrendingUp,
  Heart,
  Building2,
  Search,
  MapPin,
  UserCheck,
  CheckCircle,
  XCircle,
  ChevronDown,
} from "lucide-react";
import {
  fetchPlatformHealth,
  fetchPlatformStats,
  fetchPlatformBusinesses,
  fetchPlatformAnalytics,
  type PlatformHealthResponse,
  type PlatformGlobalStats,
  type PlatformBusinessRow,
  type PlatformAnalytics,
} from "../lib/api";
import { logClientError } from "../lib/clientLog";
import { formatEur } from "../lib/formatEur";
import { toUserFriendlyMessage } from "../lib/errorMessages";
import { BusinessLogoMark } from "./business/BusinessLogoMark";
import { FixPrompt } from "./FixPrompt";
import { PageLoader } from "./PageLoader";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import { useRealtimeFallback } from "../hooks/useRealtimeFallback";
import { LiveConnectionBadge } from "./LiveConnectionBadge";
import { NetworkOverviewHero } from "./NetworkOverviewHero";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { BorderBeam } from "@/components/ui/border-beam";
import { cn } from "@/lib/utils";
import { platformUi } from "./platform/platformDashboardUi";
import { PlatformBusinessMobileCard } from "./platform/PlatformBusinessMobileCard";
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
} from "@/components/ui/card";
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

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  icon: React.ElementType;
  delay: number;
  trend?: "up" | "down";
  beam?: boolean;
  wideOnTablet?: boolean;
}

function StatCard({ title, value, change, icon: Icon, delay, trend, beam, wideOnTablet }: StatCardProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      {...dashboardBlockMotion}
      transition={{ ...dashboardBlockMotion.transition, delay: reduceMotion ? 0 : delay * 0.5 }}
      className={cn("h-full", wideOnTablet && "sm:col-span-2 lg:col-span-1")}
    >
      <Card className={platformUi.statCard}>
        {beam && !reduceMotion ? (
          <BorderBeam size={220} duration={20} colorFrom="#e9932f" colorTo="#000000" />
        ) : null}
        <CardHeader className={platformUi.statCardHeader}>
          <div className="flex items-start justify-between gap-3">
            <div className="rounded-lg border border-border bg-muted p-2">
              <Icon className="h-5 w-5 text-foreground" />
            </div>
            {trend && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  trend === "up" ? "text-primary" : "text-red-600"
                }`}
              >
                <TrendingUp className={`h-4 w-4 ${trend === "down" ? "rotate-180" : ""}`} />
              </div>
            )}
          </div>
          <CardDescription className={platformUi.statCardLabel}>{title}</CardDescription>
          <CardTitle className={platformUi.statCardValue}>{value}</CardTitle>
          {change ? <p className={platformUi.statCardChange}>{change}</p> : null}
        </CardHeader>
      </Card>
    </motion.div>
  );
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

const ADMIN_CHART_COLORS = {
  primary: "#197278", // brand teal
  cyan: "#22d3ee",
  purple: "#a78bfa",
  emerald: "#34d399",
  amber: "#f59e0b",
  red: "#fb7185",
  slate: "#94a3b8",
} as const;

const ADMIN_ANALYTICS_TZ_KEY = "caretip_platform_admin_timezone";
const ADMIN_ANALYTICS_TZ_DEFAULT = "Europe/Berlin";
const ADMIN_ANALYTICS_TZ_OPTIONS = [
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

  const rows: Array<{ name: string; role: string; value: number; fill: string }> = data.map((d) => ({
    name: String(config[d.role]?.label ?? d.role),
    role: d.role,
    value: Number.isFinite(d.count) ? d.count : 0,
    fill: `var(--color-${d.role})`,
  }));
  const total = rows.reduce((s, r) => s + (Number.isFinite(r.value) ? r.value : 0), 0);
  const chartRows =
    total > 0
      ? rows
      : [
          {
            name: t("admin.legendNoData"),
            role: "empty",
            value: 1,
            fill: "var(--color-empty)",
          },
        ];

  return (
    <ChartContainer config={config} className="aspect-auto h-full w-full min-h-0">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <Pie
          data={chartRows}
          dataKey="value"
          nameKey="name"
          innerRadius={62}
          outerRadius={92}
          paddingAngle={3}
        >
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

  const rows: Array<{ name: string; status: string; value: number; fill: string }> = data.map((d) => ({
    name: String(config[d.status]?.label ?? d.status),
    status: d.status,
    value: Number.isFinite(d.count) ? d.count : 0,
    fill: `var(--color-${d.status})`,
  }));
  const total = rows.reduce((s, r) => s + (Number.isFinite(r.value) ? r.value : 0), 0);
  const chartRows =
    total > 0
      ? rows
      : [
          {
            name: t("admin.legendNoData"),
            status: "empty",
            value: 1,
            fill: "var(--color-empty)",
          },
        ];

  return (
    <ChartContainer config={config} className="aspect-auto h-full w-full min-h-0">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <Pie
          data={chartRows}
          dataKey="value"
          nameKey="name"
          innerRadius={62}
          outerRadius={92}
          paddingAngle={3}
        >
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

  const topBars = (top ?? []).map((b) => ({
    name: b.businessName,
    tipsEur: b.tipsEur,
  }));

  // If there are no tips yet, still render a stable chart container.
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

/**
 * Super Admin home: global platform stats + all businesses (live aggregates).
 * Renders inside SuperAdminLayout only (no business dashboard UI).
 */
export function AdminDashboard() {
  const { t } = useTranslation();
  const { user, authHydrated, sessionValidated } = useAuth();
  const { socket, connected, connectionStatus } = useSocket(
    Boolean(user?.role === "platform_admin" && authHydrated && sessionValidated),
  );

  const [health, setHealth] = useState<PlatformHealthResponse | null>(null);
  const [stats, setStats] = useState<PlatformGlobalStats | null>(null);
  const [businesses, setBusinesses] = useState<PlatformBusinessRow[]>([]);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [analyticsTimezone, setAnalyticsTimezone] = useState<string>(ADMIN_ANALYTICS_TZ_DEFAULT);
  const [serviceIssue, setServiceIssue] = useState<string | null>(null);
  const [businessSearchQuery, setBusinessSearchQuery] = useState("");
  const [businessesExpanded, setBusinessesExpanded] = useState(true);
  /** First full platform stats + businesses fetch only (background refreshes do not flash loaders). */
  const [initialDashLoading, setInitialDashLoading] = useState(true);

  const emptyAnalytics = useMemo<PlatformAnalytics>(() => {
    const rangeDays = 30;
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - (rangeDays - 1));
    const growth: PlatformAnalytics["growth"] = [];
    const tipVolume: PlatformAnalytics["tipVolume"] = [];
    for (let i = 0; i < rangeDays; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      growth.push({ date: iso, newUsers: 0, newBusinesses: 0, newTips: 0 });
      tipVolume.push({ date: iso, tipsEur: 0, tipCount: 0 });
    }
    return {
      rangeDays,
      userDistribution: [
        { role: "business", count: 0 },
        { role: "employee", count: 0 },
        { role: "platform_admin", count: 0 },
      ],
      tipStatus: [
        { status: "success", count: 0 },
        { status: "pending", count: 0 },
        { status: "failed", count: 0 },
      ],
      growth,
      tipVolume,
      topBusinessesByTips: [],
    };
  }, []);

  const filteredBusinesses = useMemo(() => {
    const q = businessSearchQuery.trim().toLowerCase();
    if (!q) return businesses;
    return businesses.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        b.ownerEmail.toLowerCase().includes(q)
    );
  }, [businesses, businessSearchQuery]);

  useEffect(() => {
    if (!authHydrated || !sessionValidated || !user || user.role !== "platform_admin") return;
    let cancelled = false;
    void fetchPlatformHealth()
      .then((h) => {
        if (!cancelled) setHealth(h);
      })
      .catch((err: unknown) => {
        logClientError("AdminDashboard.fetchPlatformHealth", err);
        if (!cancelled) setHealth({ database: "offline", stripe: "offline" });
      });
    return () => {
      cancelled = true;
    };
  }, [user, authHydrated, sessionValidated]);

  const loadDashboardData = useCallback(async () => {
    if (!authHydrated || !sessionValidated || !user || user.role !== "platform_admin") return;
    try {
      setServiceIssue(null);
      // Keep core dashboard (stats + KYC table) resilient even if analytics fails.
      const [s, b] = await Promise.all([fetchPlatformStats(), fetchPlatformBusinesses()]);
      setStats(s);
      setBusinesses(
        [...b.businesses].sort((a, b) => (b.totalTipsEur ?? 0) - (a.totalTipsEur ?? 0)),
      );

      try {
        const a = await fetchPlatformAnalytics(30, analyticsTimezone);
        setAnalytics(a ?? emptyAnalytics);
      } catch (e) {
        logClientError("AdminDashboard.analytics", e);
        setAnalytics(emptyAnalytics);
      }
    } catch (err) {
      logClientError("AdminDashboard", err);
      const msg = toUserFriendlyMessage(err);
      setStats((prev) => prev ?? ({} as PlatformGlobalStats));
      setBusinesses((prev) => prev ?? []);
      setAnalytics((prev) => prev ?? emptyAnalytics);
      // Do not wipe the UI on transient outages; keep the last known values.
      // Surface a clear message instead. Invalid sessions are cleared by the shared API client.
      if (
        msg.toLowerCase().includes("service temporarily unavailable") ||
        msg.toLowerCase().includes("http 503")
      ) {
        setServiceIssue(t("admin.serviceUnavailable"));
        // Best-effort: reflect degraded health badge.
        setHealth((h) => h ?? { database: "offline", stripe: "offline" });
      } else {
        setServiceIssue(msg || t("admin.serviceGenericError"));
      }
    } finally {
      setInitialDashLoading(false);
    }
  }, [user, authHydrated, sessionValidated, analyticsTimezone, emptyAnalytics, t]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (!authHydrated) return;
    try {
      const raw = localStorage.getItem(ADMIN_ANALYTICS_TZ_KEY);
      const tz = raw?.trim();
      if (tz) setAnalyticsTimezone(tz);
    } catch {
      // ignore
    }
  }, [authHydrated]);

  // If the API is down (503), don't keep hammering it on a timer.
  useRealtimeFallback(connected || Boolean(serviceIssue), loadDashboardData);

  useEffect(() => {
    if (!socket || user?.role !== "platform_admin") return;
    const sync = () => void loadDashboardData();
    socket.on("platform_data_updated", sync);
    socket.on("platform_verification_updated", sync);
    return () => {
      socket.off("platform_data_updated", sync);
      socket.off("platform_verification_updated", sync);
    };
  }, [socket, user?.role, loadDashboardData]);

  if (!user) {
    return null;
  }
  if (user.role !== "platform_admin") {
    return <Navigate to="/unauthorized" replace />;
  }

  if (initialDashLoading) {
    return (
      <main className={platformUi.pageMain}>
        <div className={cn(platformUi.page, "flex min-h-[min(70vh,calc(100vh-5rem))] flex-col items-center justify-center py-16")}>
          <PageLoader message={t("admin.loadingDashboard")} />
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background">
      <div className={platformUi.page}>
        <div className="mb-4 flex justify-end">
          <LiveConnectionBadge status={connectionStatus} />
        </div>
        <NetworkOverviewHero health={health} />

        <TracingBeam>
          <FixPrompt
            id="platformDataLoad"
            issueActive={Boolean(serviceIssue)}
            dismissPersistence="session"
            title={t("admin.loadErrorTitle")}
            description={serviceIssue ?? undefined}
            actionLabel={t("admin.retry")}
            onAction={() => void loadDashboardData()}
            className="mb-6"
          />
          <div className={cn(platformUi.statGrid)}>
          <StatCard
            title={t("admin.statTips")}
            value={stats ? `€${stats.totalVolumeEurFormatted}` : t("format.notAvailable")}
            change={
              stats
                ? t("admin.statTipsChange", {
                    success: stats.successTransactionCount,
                    total: stats.transactionCount,
                    biz:
                      typeof stats.businessesWithSuccessfulTips === "number"
                        ? t("admin.statTipsBizPart", { count: stats.businessesWithSuccessfulTips })
                        : "",
                  })
                : undefined
            }
            icon={Heart}
            delay={0.1}
            beam
            wideOnTablet
          />
          <StatCard
            title={t("admin.statVenues")}
            value={stats ? String(stats.businessesCount) : t("format.notAvailable")}
            change={t("admin.statVenuesChange")}
            icon={Building2}
            delay={0.15}
          />
          <StatCard
            title={t("admin.statLocations")}
            value={stats ? String(stats.locationsCount) : t("format.notAvailable")}
            change={t("admin.statLocationsChange")}
            icon={MapPin}
            delay={0.18}
          />
          <StatCard
            title={t("admin.statStaff")}
            value={stats ? String(stats.employeesCount) : t("format.notAvailable")}
            change={t("admin.statStaffChange")}
            icon={Users}
            delay={0.2}
          />
          <StatCard
            title={t("admin.statActiveUsers")}
            value={stats ? String(stats.activeUsersCount) : t("format.notAvailable")}
            change={t("admin.statActiveUsersChange")}
            icon={UserCheck}
            delay={0.25}
          />
        </div>

        {/* Analytics charts */}
        {(analytics ?? emptyAnalytics) ? (
          <motion.section
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className={platformUi.analyticsSection}
          >
            <div className={platformUi.analyticsHeader}>
              <div className={platformUi.analyticsHeaderCopy}>
                <h3 className="text-lg font-semibold text-foreground sm:text-xl">{t("admin.analyticsTitle")}</h3>
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground max-lg:line-clamp-3 lg:line-clamp-none">
                  {t("admin.analyticsSubtitle", {
                    days: (analytics ?? emptyAnalytics).rangeDays,
                    tz: (analytics ?? emptyAnalytics).timezone ?? analyticsTimezone,
                  })}
                </p>
              </div>
              <div className={platformUi.analyticsControls}>
                <Select
                  value={analyticsTimezone}
                  onValueChange={(v) => {
                    setAnalyticsTimezone(v);
                    try {
                      localStorage.setItem(ADMIN_ANALYTICS_TZ_KEY, v);
                    } catch {
                      // ignore
                    }
                  }}
                >
                  <SelectTrigger size="sm" className="w-full" aria-label={t("admin.timezoneAria")}>
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
                <span className="text-xs font-medium leading-snug text-muted-foreground max-lg:line-clamp-2">
                  {t("admin.tipStatusNote")}
                </span>
              </div>
            </div>

            <div className={cn(platformUi.analyticsChartsGrid)}>
              <AnalyticsCard title={t("admin.chartUserDist")} description={t("admin.chartUserDistDesc")}>
                <UserDistributionChart data={(analytics ?? emptyAnalytics).userDistribution} />
              </AnalyticsCard>

              <AnalyticsCard title={t("admin.chartTipStatus")} description={t("admin.chartTipStatusDesc")}>
                <TipStatusChart data={(analytics ?? emptyAnalytics).tipStatus} />
              </AnalyticsCard>

              <AnalyticsCard title={t("admin.chartGrowth")} description={t("admin.chartGrowthDesc")}>
                <GrowthChart data={(analytics ?? emptyAnalytics).growth} />
              </AnalyticsCard>

              <AnalyticsCard title={t("admin.chartTipVol")} description={t("admin.chartTipVolDesc")}>
                <TipVolumeChart
                  data={(analytics ?? emptyAnalytics).tipVolume}
                  top={(analytics ?? emptyAnalytics).topBusinessesByTips}
                />
              </AnalyticsCard>
            </div>
          </motion.section>
        ) : null}

        <motion.div
          {...dashboardBlockMotion}
          transition={{ ...dashboardBlockMotion.transition, delay: 0.12 }}
          className={platformUi.businessesPanel}
        >
          <div className={platformUi.businessesPanelHeader}>
            <button
              type="button"
              onClick={() => setBusinessesExpanded((v) => !v)}
              className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
              aria-expanded={businessesExpanded}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Building2 className="h-5 w-5 text-foreground" />
                <h3 className="min-w-0 text-base font-semibold leading-snug text-foreground sm:text-lg">
                  <span className="block sm:inline">{t("admin.businessesTitle")}</span>
                  <span className="mt-0.5 block text-xs font-medium text-muted-foreground sm:ml-2 sm:mt-0 sm:inline">
                    {t("admin.businessesSubtitle")}
                  </span>
                </h3>
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                  businessesExpanded && "rotate-180",
                )}
              />
            </button>

            <Link
              to="/platform-admin/businesses"
              className="shrink-0 text-xs font-medium text-foreground underline-offset-4 hover:underline sm:text-sm"
            >
              {t("admin.businessesOpen")}
            </Link>
          </div>

          {businessesExpanded ? (
            <>
              {businesses.length > 0 && (
                <div className={platformUi.businessesSearchWrap}>
                  <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="search"
                      value={businessSearchQuery}
                      onChange={(e) => setBusinessSearchQuery(e.target.value)}
                      placeholder={t("admin.searchBusinessesPlaceholder")}
                      autoComplete="off"
                      aria-label={t("admin.searchBusinessesAria")}
                      className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                  </div>
                </div>
              )}
              {businesses.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">{t("admin.noBusinesses")}</p>
              ) : filteredBusinesses.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">{t("admin.noSearchMatches")}</p>
              ) : (
                <>
                  <div className={platformUi.businessesMobileList}>
                    {filteredBusinesses.map((b) => (
                      <PlatformBusinessMobileCard key={b.id} business={b} />
                    ))}
                  </div>
                  <div className={platformUi.businessesTableWrap}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted text-left">
                        <th className="px-4 py-3 font-medium text-muted-foreground">{t("admin.colBusiness")}</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">{t("admin.colOwner")}</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">{t("admin.colStatus")}</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                          {t("admin.colTipsEur")}
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                          {t("admin.colStaffLoc")}
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                          {t("admin.colActions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBusinesses.map((b) => (
                        <tr key={b.id} className="border-b border-border hover:bg-muted/50">
                          <td className="px-2 py-3 align-middle">
                            <BusinessLogoMark
                              logoPathOrUrl={b.logoPath ?? null}
                              businessName={b.name}
                              size="sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{b.name}</div>
                            <div className="font-mono text-xs text-muted-foreground">{b.slug}</div>
                          </td>
                          <td className="px-4 py-3 text-xs">{b.ownerEmail}</td>
                          <td className="px-4 py-3">
                            {b.verificationStatus === "verified" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-xs font-medium text-success-foreground">
                                <CheckCircle className="h-3.5 w-3.5" /> {t("admin.verification.verified")}
                              </span>
                            ) : b.verificationStatus === "rejected" ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
                                <XCircle className="h-3.5 w-3.5" /> {t("admin.verification.rejected")}
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-amber-700">
                                {t("admin.verification.pending")}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {formatEur(b.totalTipsEur ?? 0)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                            {b.staffCount ?? 0} / {b.locationCount ?? 0}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to={`/platform-admin/businesses/${b.id}`}
                              className="text-xs font-medium text-foreground underline-offset-2 hover:underline"
                            >
                              {t("admin.view")}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </>
              )}
            </>
          ) : null}
        </motion.div>
        </TracingBeam>
      </div>
    </main>
  );
}
