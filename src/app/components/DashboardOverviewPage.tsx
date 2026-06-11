import { useMemo } from "react";
import { useMobileMenuState } from "../hooks/useMobileMenuState";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Link } from "react-router";
import {
  TrendingUp,
  Users,
  Euro,
  Activity,
  ArrowUpRight,
  Heart,
  QrCode,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardMobileSidebar } from "./DashboardMobileSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { Footer } from "./Footer";
import AnimatedShaderBackground from "./ui/animated-shader-background";
import { formatEur } from "../lib/formatEur";
import { useAuth } from "../hooks/useAuth";
import { SidebarSkeleton } from "./ui/sidebar-skeleton";

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul"] as const;
const TIPS_OVERVIEW_SERIES = [12400, 15200, 14100, 18900, 20100, 22400, 24800];

export function DashboardOverviewPage() {
  const { t, i18n } = useTranslation();
  const { mobileMenuOpen, openMobileMenu, closeMobileMenu } = useMobileMenuState();
  const { user, authHydrated, sessionValidated } = useAuth();
  const isAppReady = authHydrated && sessionValidated && Boolean(user);

  const tipsData = useMemo(
    () =>
      MONTH_KEYS.map((k, i) => ({
        month: t(`charts.monthShort.${k}`),
        tips: TIPS_OVERVIEW_SERIES[i],
      })),
    [t, i18n.resolvedLanguage],
  );

  return (
    <div className="min-h-screen relative">
      <AnimatedShaderBackground />

      <div className="relative z-10">
        {isAppReady ? <DashboardSidebar /> : <SidebarSkeleton />}
        <DashboardMobileSidebar isOpen={mobileMenuOpen} onClose={closeMobileMenu} />

        <div className="lg:pl-64">
          <DashboardHeader onMenuClick={openMobileMenu} />

          <main className="px-4 lg:px-8 py-8 pb-20">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-accent to-primary rounded-2xl p-8 mb-8 text-white shadow-2xl"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{t("sampleDashboard.overviewHeroTitle")}</h1>
                  <p className="text-white/80 mb-4 max-w-xl">{t("sampleDashboard.overviewHeroBody")}</p>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                    <Heart className="w-3 h-3" />
                    {t("sampleDashboard.overviewHeroPill")}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/dashboard/transactions"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-white/90 text-primary rounded-lg font-semibold transition-all shadow-lg"
                  >
                    <Euro className="w-4 h-4" />
                    {t("sampleDashboard.overviewCtaTips")}
                  </Link>
                  <Link
                    to="/business/qr-management"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-white/40 hover:bg-white/10 text-white rounded-lg font-semibold transition-all"
                  >
                    <QrCode className="w-4 h-4" />
                    {t("sampleDashboard.overviewCtaQr")}
                  </Link>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-accent/10 rounded-xl">
                    <Euro className="w-6 h-6 text-accent" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">
                  {formatEur(24800, { minFrac: 0, maxFrac: 0 })}
                </p>
                <p className="text-sm text-muted-foreground">{t("sampleDashboard.statTipsMonth")}</p>
                <p className="text-xs text-neutral-600 mt-2 font-medium dark:text-neutral-400">
                  {t("sampleDashboard.statSampleNote")}
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">18</p>
                <p className="text-sm text-muted-foreground">{t("sampleDashboard.statTeamMembers")}</p>
                <p className="text-xs text-muted-foreground mt-2">{t("sampleDashboard.statTeamHint")}</p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">412</p>
                <p className="text-sm text-muted-foreground">{t("sampleDashboard.statSuccessfulTips")}</p>
                <p className="text-xs text-neutral-600 mt-2 font-medium dark:text-neutral-400">
                  {t("sampleDashboard.statOneTime")}
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">{formatEur(18.4)}</p>
                <p className="text-sm text-muted-foreground">{t("sampleDashboard.statAvgTip")}</p>
                <p className="text-xs text-muted-foreground mt-2">{t("sampleDashboard.statRolling")}</p>
              </motion.div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-card border border-border rounded-xl p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">{t("sampleDashboard.tipVolumeTitle")}</h3>
                  <p className="text-sm text-muted-foreground">{t("sampleDashboard.tipVolumeSubtitle")}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={tipsData}>
                  <defs>
                    <linearGradient id="tipsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e9781c" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#e9781c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tips"
                    stroke="#e9781c"
                    strokeWidth={3}
                    fill="url(#tipsGradient)"
                    name={t("sampleDashboard.legendTips")}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20 rounded-2xl p-8 text-center"
            >
              <Heart className="w-10 h-10 text-accent mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-foreground mb-3">{t("sampleDashboard.ctaTitle")}</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">{t("sampleDashboard.ctaBody")}</p>
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent/90 text-white rounded-lg font-semibold shadow-lg shadow-accent/20 transition-all"
              >
                {t("sampleDashboard.ctaHowItWorks")}
              </Link>
            </motion.div>
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
