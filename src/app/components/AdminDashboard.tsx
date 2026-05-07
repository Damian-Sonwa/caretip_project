import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, Navigate } from "react-router";
import { motion } from "motion/react";
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
}

function StatCard({ title, value, change, icon: Icon, delay, trend, beam }: StatCardProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      className="h-full"
    >
      <Card className="relative h-full overflow-visible border-2 border-border bg-card shadow-sm transition-shadow hover:shadow-md">
        {beam && <BorderBeam size={220} duration={18} colorFrom="#e9932f" colorTo="#000000" />}
        <CardHeader className="pb-2">
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
          <CardDescription className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </CardDescription>
          <CardTitle className="break-words text-balance text-2xl font-bold tabular-nums text-foreground sm:text-3xl leading-snug">
            {value}
          </CardTitle>
          {change && <p className="text-sm leading-snug text-muted-foreground">{change}</p>}
        </CardHeader>
      </Card>
    </motion.div>
  );
}

function AnalyticsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-xl border-2 border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border bg-muted/40 pb-3">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        <div className="h-[260px] w-full">{children}</div>
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
  const config: ChartConfig = {
    business: { label: "Businesses", color: ADMIN_CHART_COLORS.primary },
    employee: { label: "Employees", color: ADMIN_CHART_COLORS.cyan },
    platform_admin: { label: "Platform admins", color: ADMIN_CHART_COLORS.purple },
  };

  const rows = data.map((d) => ({
    name: config[d.role]?.label ?? d.role,
    role: d.role,
    value: d.count,
    fill: `var(--color-${d.role})`,
  }));

  return (
    <ChartContainer config={config} className="aspect-auto h-[260px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <Pie
          data={rows}
          dataKey="value"
          nameKey="name"
          innerRadius={62}
          outerRadius={92}
          paddingAngle={3}
        >
          {rows.map((r) => (
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
  const config: ChartConfig = {
    success: { label: "Success", color: ADMIN_CHART_COLORS.emerald },
    pending: { label: "Pending", color: ADMIN_CHART_COLORS.amber },
    failed: { label: "Failed", color: ADMIN_CHART_COLORS.red },
  };

  const rows = data.map((d) => ({
    name: config[d.status]?.label ?? d.status,
    status: d.status,
    value: d.count,
    fill: `var(--color-${d.status})`,
  }));

  return (
    <ChartContainer config={config} className="aspect-auto h-[260px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <Pie
          data={rows}
          dataKey="value"
          nameKey="name"
          innerRadius={62}
          outerRadius={92}
          paddingAngle={3}
        >
          {rows.map((r) => (
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
  const config: ChartConfig = {
    newUsers: { label: "New users", color: ADMIN_CHART_COLORS.primary },
    newBusinesses: { label: "New venues", color: ADMIN_CHART_COLORS.purple },
    newTips: { label: "New tips", color: ADMIN_CHART_COLORS.cyan },
  };

  return (
    <ChartContainer config={config} className="aspect-auto h-[260px]">
      <LineChart data={data} margin={{ left: 6, right: 6, top: 12, bottom: 6 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tickMargin={8} minTickGap={18} />
        <YAxis tickFormatter={formatCompact} width={34} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(v) => `Date: ${String(v ?? "")}`}
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
  const config: ChartConfig = {
    tipsEur: { label: "Tips (EUR)", color: ADMIN_CHART_COLORS.emerald },
    top: { label: "Top venues", color: ADMIN_CHART_COLORS.slate },
  };

  const topBars = (top ?? []).map((b) => ({
    name: b.businessName,
    tipsEur: b.tipsEur,
  }));

  // If there are no tips yet, still render a stable chart container.
  const showTop = topBars.length > 0;

  return (
    <ChartContainer config={config} className="aspect-auto h-[260px]">
      {showTop ? (
        <BarChart data={topBars} margin={{ left: 6, right: 6, top: 12, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tickMargin={8} interval={0} tickFormatter={(v) => String(v).slice(0, 10)} />
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
  const { user, authHydrated, sessionValidated } = useAuth();
  const { socket, connected, connectionStatus } = useSocket(
    Boolean(user?.role === "platform_admin" && authHydrated && sessionValidated),
  );

  const [health, setHealth] = useState<PlatformHealthResponse | null>(null);
  const [stats, setStats] = useState<PlatformGlobalStats | null>(null);
  const [businesses, setBusinesses] = useState<PlatformBusinessRow[]>([]);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [serviceIssue, setServiceIssue] = useState<string | null>(null);
  const [businessSearchQuery, setBusinessSearchQuery] = useState("");
  /** First full platform stats + businesses fetch only (background refreshes do not flash loaders). */
  const [initialDashLoading, setInitialDashLoading] = useState(true);

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
      const [s, b, a] = await Promise.all([
        fetchPlatformStats(),
        fetchPlatformBusinesses(),
        fetchPlatformAnalytics(30),
      ]);
      setStats(s);
      setAnalytics(a);
      setBusinesses(
        [...b.businesses].sort((a, b) => (b.totalTipsEur ?? 0) - (a.totalTipsEur ?? 0)),
      );
    } catch (err) {
      logClientError("AdminDashboard", err);
      const msg = err instanceof Error ? err.message : "";
      // Do not wipe the UI on transient outages; keep the last known values.
      // Surface a clear message instead. Invalid sessions are cleared by the shared API client.
      if (
        msg.toLowerCase().includes("service temporarily unavailable") ||
        msg.toLowerCase().includes("http 503")
      ) {
        setServiceIssue("Service temporarily unavailable. Please try again in a moment.");
        // Best-effort: reflect degraded health badge.
        setHealth((h) => h ?? { database: "offline", stripe: "offline" });
      } else {
        setServiceIssue(msg || "We couldn't load platform data right now.");
      }
    } finally {
      setInitialDashLoading(false);
    }
  }, [user, authHydrated, sessionValidated]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

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
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background px-4 pb-20 pt-8 lg:px-8">
        <PageLoader message="Loading platform dashboard…" />
      </main>
    );
  }

  return (
    <main className="bg-background px-4 pb-20 pt-8 lg:px-8">
      <div className="mb-4 flex justify-end">
        <LiveConnectionBadge status={connectionStatus} />
      </div>
      <NetworkOverviewHero health={health} />

      <TracingBeam>
        <FixPrompt
          id="platformDataLoad"
          issueActive={Boolean(serviceIssue)}
          dismissPersistence="session"
          title="We’re having trouble loading platform data."
          description={serviceIssue ?? undefined}
          actionLabel="Retry"
          onAction={() => void loadDashboardData()}
          className="mb-6"
        />
        <div className="relative mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            title="Successful tips (EUR)"
            value={stats ? `€${stats.totalVolumeEurFormatted}` : "N/A"}
            change={
              stats
                ? `Sum of all successful tips · ${stats.successTransactionCount} successful of ${stats.transactionCount} total${typeof stats.businessesWithSuccessfulTips === "number" ? ` · ${stats.businessesWithSuccessfulTips} businesses with tips` : ""}`
                : undefined
            }
            icon={Heart}
            delay={0.1}
            beam
          />
          <StatCard
            title="Venues"
            value={stats ? String(stats.businessesCount) : "N/A"}
            change="Registered businesses on the platform"
            icon={Building2}
            delay={0.15}
          />
          <StatCard
            title="Locations"
            value={stats ? String(stats.locationsCount) : "N/A"}
            change="Venue sites and rooms across all businesses"
            icon={MapPin}
            delay={0.18}
          />
          <StatCard
            title="Staff"
            value={stats ? String(stats.employeesCount) : "N/A"}
            change="Employees with CareTip accounts"
            icon={Users}
            delay={0.2}
          />
          <StatCard
            title="Active users"
            value={stats ? String(stats.activeUsersCount) : "N/A"}
            change="Accounts with sign-in enabled"
            icon={UserCheck}
            delay={0.25}
          />
        </div>

        {/* Analytics charts */}
        {analytics ? (
          <motion.section
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mb-10"
          >
            <div className="mb-4 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-foreground">Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Last {analytics.rangeDays} days · live aggregates
                </p>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Tip status uses all-time totals
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <AnalyticsCard title="User distribution" description="Accounts by role">
                <UserDistributionChart data={analytics.userDistribution} />
              </AnalyticsCard>

              <AnalyticsCard title="Tip status distribution" description="Success vs pending vs failed">
                <TipStatusChart data={analytics.tipStatus} />
              </AnalyticsCard>

              <AnalyticsCard title="Platform growth" description="New users, venues, and tips per day">
                <GrowthChart data={analytics.growth} />
              </AnalyticsCard>

              <AnalyticsCard title="Tip volume (EUR)" description="Successful tips per day">
                <TipVolumeChart data={analytics.tipVolume} top={analytics.topBusinessesByTips} />
              </AnalyticsCard>
            </div>
          </motion.section>
        ) : null}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="overflow-hidden rounded-xl border-2 border-border bg-card shadow-sm"
        >
          <div className="flex flex-col gap-3 border-b border-border bg-muted px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-foreground" />
              <h3 className="text-lg font-semibold text-foreground">All businesses</h3>
            </div>
            <Link
              to="/platform-admin/businesses"
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              Open KYC &amp; verification
            </Link>
          </div>
          {businesses.length > 0 && (
            <div className="border-b border-border px-4 py-3">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={businessSearchQuery}
                  onChange={(e) => setBusinessSearchQuery(e.target.value)}
                  placeholder="Search by business name, slug, or owner email…"
                  autoComplete="off"
                  aria-label="Filter businesses"
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            {businesses.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No businesses yet.</p>
            ) : filteredBusinesses.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No businesses match your search.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Business</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Owner</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Tips (EUR)
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Staff / Loc.
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBusinesses.map((b) => (
                    <tr key={b.id} className="border-b border-border hover:bg-muted/50">
                      <td className="px-2 py-3 align-middle">
                        <BusinessLogoMark logoPathOrUrl={b.logoPath ?? null} businessName={b.name} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{b.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{b.slug}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">{b.ownerEmail}</td>
                      <td className="px-4 py-3">
                        {b.verificationStatus === "verified" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-xs font-medium text-success-foreground">
                            <CheckCircle className="h-3.5 w-3.5" /> Verified
                          </span>
                        ) : b.verificationStatus === "rejected" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
                            <XCircle className="h-3.5 w-3.5" /> Rejected
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-amber-700">Pending</span>
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
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </TracingBeam>
    </main>
  );
}
