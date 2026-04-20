import { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import {
  TrendingDown,
  DollarSign,
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

// Mock data — tipping-focused business dashboard
const tipVolumeData = [
  { month: 'Jan', tips: 118, avgTip: 14 },
  { month: 'Feb', tips: 132, avgTip: 15 },
  { month: 'Mar', tips: 126, avgTip: 16 },
  { month: 'Apr', tips: 141, avgTip: 15 },
  { month: 'May', tips: 156, avgTip: 17 },
  { month: 'Jun', tips: 168, avgTip: 18 },
  { month: 'Jul', tips: 174, avgTip: 17 },
];

const guestScanData = [
  { month: 'Jan', scans: 142 },
  { month: 'Feb', scans: 156 },
  { month: 'Mar', scans: 138 },
  { month: 'Apr', scans: 167 },
  { month: 'May', scans: 178 },
  { month: 'Jun', scans: 185 },
  { month: 'Jul', scans: 192 },
];

const teamTipLeaders = [
  {
    id: 1,
    name: 'Maya Chen',
    role: 'Server',
    icon: Heart,
    iconWrap: 'bg-rose-100',
    iconColor: 'text-rose-600',
    periodTotal: '$1,240',
    lastTip: '2h ago',
    shiftNote: 'Top week',
  },
  {
    id: 2,
    name: 'James Okoro',
    role: 'Bartender',
    icon: Heart,
    iconWrap: 'bg-amber-100',
    iconColor: 'text-amber-700',
    periodTotal: '$980',
    lastTip: '5h ago',
    shiftNote: 'Strong bar',
  },
  {
    id: 3,
    name: 'Front desk pool',
    role: 'Shared QR',
    icon: Users,
    iconWrap: 'bg-blue-100',
    iconColor: 'text-blue-600',
    periodTotal: '$2,410',
    lastTip: '1h ago',
    shiftNote: 'Team pool',
  },
  {
    id: 4,
    name: 'Sofia Reyes',
    role: 'Server',
    icon: Heart,
    iconWrap: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
    periodTotal: '$865',
    lastTip: 'Yesterday',
    shiftNote: 'Steady',
  },
  {
    id: 5,
    name: 'Kitchen thank-you',
    role: 'Back-of-house',
    icon: QrCode,
    iconWrap: 'bg-violet-100',
    iconColor: 'text-violet-700',
    periodTotal: '$540',
    lastTip: '3d ago',
    shiftNote: 'QR on pass',
  },
];

const recentTipActivity = [
  {
    id: 1,
    label: 'Guest → Maya Chen',
    action: 'Tip completed',
    amount: '+$18.00',
    status: 'success',
    time: '2h ago',
  },
  {
    id: 2,
    label: 'Guest → bar pool',
    action: 'Tip completed',
    amount: '+$25.00',
    status: 'success',
    time: '5h ago',
  },
  {
    id: 3,
    label: 'Guest → James Okoro',
    action: 'Tip pending',
    amount: '$12.00',
    status: 'warning',
    time: '6h ago',
  },
  {
    id: 4,
    label: 'Adjustment',
    action: 'Refund issued',
    amount: '-$8.00',
    status: 'success',
    time: '1d ago',
  },
  {
    id: 5,
    label: 'Guest → Sofia Reyes',
    action: 'Tip completed',
    amount: '+$15.00',
    status: 'success',
    time: '2d ago',
  },
];

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
          <ArrowUpRight className="w-4 h-4 text-green-500" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-red-500" />
        )}
        <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {change}
        </span>
        <span className="text-sm text-muted-foreground">{subtitle || 'vs last month'}</span>
      </div>
    </motion.div>
  );
}

export function DashboardPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen relative">
      <AnimatedShaderBackground />
      
      <div className="relative z-10">
        {/* Sidebar - Desktop */}
        <DashboardSidebar />

        {/* Sidebar - Mobile */}
        <DashboardMobileSidebar 
          isOpen={mobileMenuOpen} 
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
                Welcome back! 👋
              </h1>
              <p className="text-muted-foreground">
                Tips, scans, and payouts for your team — one-time payments only
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Tips received (30d)"
                value="$18,420"
                change="+12.4%"
                isPositive={true}
                icon={DollarSign}
                delay={0.1}
                subtitle="vs prior month"
              />
              <MetricCard
                title="Successful tips"
                value="612"
                change="+8.1%"
                isPositive={true}
                icon={CreditCard}
                delay={0.2}
                subtitle="completed PaymentIntents"
              />
              <MetricCard
                title="Avg tip size"
                value="$30.10"
                change="+$1.20"
                isPositive={true}
                icon={TrendingDown}
                delay={0.3}
                subtitle="after fees"
              />
              <MetricCard
                title="Pending settlement"
                value="14"
                change="Stripe"
                isPositive={false}
                icon={Calendar}
                delay={0.4}
                subtitle="in flight"
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
                      Monthly Spending & Savings
                    </h3>
                    <p className="text-sm text-muted-foreground">Last 7 months</p>
                  </div>
                  <button className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors">
                    View Details
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={tipVolumeData}>
                    <defs>
                      <linearGradient id="colorTips" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14BDEB" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#14BDEB" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorAvgTip" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ACAD94" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ACAD94" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(56, 77, 72, 0.1)" />
                    <XAxis dataKey="month" stroke="#6E7271" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6E7271" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#D8D4D5',
                        border: '1px solid rgba(56, 77, 72, 0.1)',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="tips"
                      stroke="#14BDEB"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorTips)"
                      name="Tips"
                    />
                    <Area
                      type="monotone"
                      dataKey="avgTip"
                      stroke="#ACAD94"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAvgTip)"
                      name="Avg tip ($)"
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
                      Guest QR scans
                    </h3>
                    <p className="text-sm text-muted-foreground">Opens of your tipping flow</p>
                  </div>
                  <button className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors">
                    Export
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={guestScanData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(56, 77, 72, 0.1)" />
                    <XAxis dataKey="month" stroke="#6E7271" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6E7271" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#D8D4D5',
                        border: '1px solid rgba(56, 77, 72, 0.1)',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="scans" fill="#14BDEB" radius={[8, 8, 0, 0]} name="Scans" />
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
                  <h3 className="text-lg font-semibold text-foreground">Who guests tipped</h3>
                  <Link
                    to="/dashboard/transactions"
                    className="text-sm text-accent hover:text-accent/80 transition-colors"
                  >
                    Tips & activity
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
                            <p className="text-xs text-muted-foreground">{row.role} · Last tip {row.lastTip}</p>
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
                  <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                  <Link
                    to="/dashboard/transactions"
                    className="text-sm text-accent hover:text-accent/80 transition-colors"
                  >
                    View all
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
                              ? 'bg-green-500'
                              : activity.status === 'failed'
                              ? 'bg-red-500'
                              : 'bg-yellow-500'
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
                            ? 'text-green-600'
                            : activity.status === 'failed'
                            ? 'text-red-500'
                            : 'text-amber-600'
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