import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import {
  TrendingDown,
  Euro,
  CreditCard,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Heart,
  QrCode,
  Users,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardMobileSidebar } from './DashboardMobileSidebar';
import { DashboardHeader } from './DashboardHeader';
import { Footer } from './Footer';
import AnimatedShaderBackground from './ui/animated-shader-background';
import { formatEur } from '../lib/formatEur';
import { useAuth } from '../hooks/useAuth';
import { SidebarSkeleton } from './ui/sidebar-skeleton';

function eurInt(n: number): string {
  return formatEur(n, { minFrac: 0, maxFrac: 0 });
}

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ElementType;
  delay: number;
  subtitle?: string;
}

function MetricCard({ title, value, change, isPositive, icon: Icon, delay, subtitle }: MetricCardProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-accent/10 rounded-lg">
          <Icon className="w-5 h-5 text-accent" />
        </div>
        <button className="p-1 hover:bg-muted rounded transition-colors">
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <h3 className="text-sm text-muted-foreground mb-1">{title}</h3>
      <p className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">{value}</p>
      <div className="flex items-center gap-1">
        {isPositive ? (
          <ArrowUpRight className="w-4 h-4 text-primary" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        )}
        <span className={`text-sm font-medium ${isPositive ? 'text-primary' : 'text-neutral-600 dark:text-neutral-400'}`}>
          {change}
        </span>
        {subtitle ? <span className="text-sm text-muted-foreground">{subtitle}</span> : null}
      </div>
    </motion.div>
  );
}

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul"] as const;
const TIPS_SERIES = [118, 132, 126, 141, 156, 168, 174];
const AVG_SERIES = [14, 15, 16, 15, 17, 18, 17];
const SCAN_SERIES = [142, 156, 138, 167, 178, 185, 192];

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, authHydrated, sessionValidated } = useAuth();
  const isAppReady = authHydrated && sessionValidated && Boolean(user);

  const tipVolumeData = useMemo(
    () =>
      MONTH_KEYS.map((k, i) => ({
        month: t(`charts.monthShort.${k}`),
        tips: TIPS_SERIES[i],
        avgTip: AVG_SERIES[i],
      })),
    [t, i18n.resolvedLanguage],
  );

  const guestScanData = useMemo(
    () =>
      MONTH_KEYS.map((k, i) => ({
        month: t(`charts.monthShort.${k}`),
        scans: SCAN_SERIES[i],
      })),
    [t, i18n.resolvedLanguage],
  );

  const teamTipLeaders = useMemo(() => {
    const ids = [1, 2, 3, 4, 5] as const;
    const icons = [Heart, Heart, Users, Heart, QrCode] as const;
    const totals = [1240, 980, 2410, 865, 540];
    return ids.map((id, i) => ({
      id,
      name: t(`sampleDashboard.leaders.${id}.name`),
      role: t(`sampleDashboard.leaders.${id}.role`),
      icon: icons[i],
      iconWrap: "bg-primary/10",
      iconColor: "text-primary",
      periodTotal: eurInt(totals[i]),
      lastTip: t(`sampleDashboard.leaders.${id}.lastTip`),
      shiftNote: t(`sampleDashboard.leaders.${id}.shift`),
    }));
  }, [t, i18n.resolvedLanguage]);

  const recentTipActivity = useMemo(() => {
    const rows = [1, 2, 3, 4, 5] as const;
    return rows.map((id) => {
      const amounts = { 1: 18, 2: 25, 3: 12, 4: 8, 5: 15 } as const;
      const amt = amounts[id];
      const amount =
        id === 4 ? `−${formatEur(amt)}` : id === 3 ? formatEur(amt) : `+${formatEur(amt)}`;
      return {
        id,
        label: t(`sampleDashboard.activity.${id}.label`),
        action: t(`sampleDashboard.activity.${id}.action`),
        amount,
        status: id === 3 ? ("warning" as const) : ("success" as const),
        time: t(`sampleDashboard.activity.${id}.time`),
      };
    });
  }, [t, i18n.resolvedLanguage]);

  return (
    <div className="min-h-screen relative">
      <AnimatedShaderBackground />
      
      <div className="relative z-10">
        {/* Sidebar - Desktop */}
        {isAppReady ? <DashboardSidebar /> : <SidebarSkeleton />}

        {/* Sidebar - Mobile */}
        <DashboardMobileSidebar 
          isOpen={mobileMenuOpen && isAppReady} 
          onClose={() => setMobileMenuOpen(false)} 
        />

        {/* Main Content */}
        <div className="lg:pl-64">
          {/* Header */}
          <DashboardHeader onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

          {/* Page Content */}
          <main className="px-4 lg:px-8 py-8 pb-20">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                {t("sampleDashboard.welcomeTitle")}
              </h1>
              <p className="text-muted-foreground">{t("sampleDashboard.welcomeSubtitle")}</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title={t("sampleDashboard.metrics.tipsReceived30d")}
                value={eurInt(18420)}
                change="+12.4%"
                isPositive={true}
                icon={Euro}
                delay={0.1}
                subtitle={t("sampleDashboard.metrics.vsPriorMonth")}
              />
              <MetricCard
                title={t("sampleDashboard.metrics.successfulTips")}
                value="612"
                change="+8.1%"
                isPositive={true}
                icon={CreditCard}
                delay={0.2}
                subtitle={t("sampleDashboard.metrics.completedIntents")}
              />
              <MetricCard
                title={t("sampleDashboard.metrics.avgTipSize")}
                value={formatEur(30.1)}
                change={`+${formatEur(1.2)}`}
                isPositive={true}
                icon={TrendingDown}
                delay={0.3}
                subtitle={t("sampleDashboard.metrics.afterFees")}
              />
              <MetricCard
                title={t("sampleDashboard.metrics.pendingSettlement")}
                value="14"
                change={t("sampleDashboard.metrics.stripe")}
                isPositive={false}
                icon={Calendar}
                delay={0.4}
                subtitle={t("sampleDashboard.metrics.inFlight")}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Spending Chart */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {t("sampleDashboard.chartMonthlyTitle")}
                    </h3>
                    <p className="text-sm text-muted-foreground">{t("sampleDashboard.chartMonthlySubtitle")}</p>
                  </div>
                  <button className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors">
                    {t("sampleDashboard.viewDetails")}
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={tipVolumeData}>
                    <defs>
                      <linearGradient id="colorTips" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EB992C" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#EB992C" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorAvgTip" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6B7280" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6B7280" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,24,39,0.10)" />
                    <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="tips"
                      stroke="#EB992C"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorTips)"
                      name={t("sampleDashboard.legendTips")}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgTip"
                      stroke="#6B7280"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAvgTip)"
                      name={t("sampleDashboard.legendAvgTip")}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Usage Chart */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {t("sampleDashboard.chartGuestScansTitle")}
                    </h3>
                    <p className="text-sm text-muted-foreground">{t("sampleDashboard.chartGuestScansSubtitle")}</p>
                  </div>
                  <button className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors">
                    {t("sampleDashboard.export")}
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={guestScanData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,24,39,0.10)" />
                    <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="scans" fill="#EB992C" radius={[8, 8, 0, 0]} name={t("sampleDashboard.legendScans")} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team tipping snapshot */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-foreground">{t("sampleDashboard.teamTitle")}</h3>
                  <Link
                    to="/dashboard/transactions"
                    className="text-sm text-accent hover:text-accent/80 transition-colors"
                  >
                    {t("sampleDashboard.tipsActivityLink")}
                  </Link>
                </div>
                <div className="space-y-3">
                  {teamTipLeaders.map((row) => {
                    const Icon = row.icon;
                    return (
                      <div
                        key={row.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-full ${row.iconWrap} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-5 h-5 ${row.iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {row.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {row.role} · {t("sampleDashboard.lastTipPrefix")} {row.lastTip}
                            </p>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-semibold text-foreground">
                            {row.periodTotal}
                          </p>
                          <span className="inline-block text-xs text-muted-foreground">
                            {row.shiftNote}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-foreground">{t("sampleDashboard.recentActivity")}</h3>
                  <Link
                    to="/dashboard/transactions"
                    className="text-sm text-accent hover:text-accent/80 transition-colors"
                  >
                    {t("sampleDashboard.viewAll")}
                  </Link>
                </div>
                <div className="space-y-4">
                  {recentTipActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 ${
                            activity.status === 'success'
                              ? 'bg-primary'
                              : activity.status === 'warning'
                              ? 'bg-neutral-400 dark:bg-neutral-600'
                              : 'bg-neutral-300 dark:bg-neutral-700'
                          }`}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {activity.label}
                          </p>
                          <p className="text-xs text-muted-foreground">{activity.action}</p>
                          <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          activity.status === 'success'
                            ? 'text-primary'
                            : activity.status === 'warning'
                            ? 'text-neutral-600 dark:text-neutral-400'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {activity.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
}