import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  Gift,
  TrendingUp,
  Star,
  Sparkles,
  Check,
  ArrowRight,
  Heart,
} from 'lucide-react';
import { Link } from 'react-router';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardMobileSidebar } from './DashboardMobileSidebar';
import { DashboardHeader } from './DashboardHeader';
import { Footer } from './Footer';
import AnimatedShaderBackground from './ui/animated-shader-background';

interface Notification {
  id: string;
  type: 'renewal' | 'trial' | 'promo' | 'alert' | 'success';
  title: string;
  message: string;
  date: string;
  read: boolean;
  actionLabel?: string;
  actionUrl?: string;
  icon: typeof Bell;
  color: string;
  bgColor: string;
}

const notificationsData: Notification[] = [
  {
    id: '1',
    type: 'promo',
    title: 'Boost tips with branded QR cards',
    message:
      'Print-ready QR packs help guests tip in seconds. Order from your dashboard or export PDFs for each team member.',
    date: '2026-03-17',
    read: false,
    actionLabel: 'QR management',
    actionUrl: '/business/qr-management',
    icon: Gift,
    color: 'text-primary',
    bgColor: 'bg-gray-50',
  },
  {
    id: '2',
    type: 'success',
    title: 'Large tip received',
    message:
      'A guest sent 50 € to your front-of-house team. Funds are processing through Stripe as a one-time payment.',
    date: '2026-03-15',
    read: false,
    actionLabel: 'View activity',
    actionUrl: '/dashboard/transactions',
    icon: Heart,
    color: 'text-primary',
    bgColor: 'bg-gray-50',
  },
  {
    id: '3',
    type: 'success',
    title: 'Tip settled',
    message:
      'A 12 € tip completed successfully. There is no subscription or invoice, just a single PaymentIntent.',
    date: '2026-03-01',
    read: true,
    actionLabel: 'Tips & activity',
    actionUrl: '/dashboard/transactions',
    icon: Check,
    color: 'text-primary',
    bgColor: 'bg-gray-50',
  },
  {
    id: '4',
    type: 'promo',
    title: 'Share staff tipping links',
    message:
      'Each team member gets a personal link so regulars can tip them by name after great service.',
    date: '2026-02-28',
    read: true,
    actionLabel: 'Staff management',
    actionUrl: '/dashboard/staff-management',
    icon: Star,
    color: 'text-primary',
    bgColor: 'bg-gray-50',
  },
  {
    id: '5',
    type: 'alert',
    title: 'New: instant tip notifications',
    message:
      'Turn on push or email alerts when new tips land so your team can thank guests in the moment.',
    date: '2026-02-20',
    read: true,
    actionLabel: 'Notification settings',
    actionUrl: '/dashboard/profile-settings',
    icon: Sparkles,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    id: '6',
    type: 'success',
    title: 'Weekly tip summary',
    message:
      'You had 48 successful tips this week. Open Tips & activity for a full breakdown by employee.',
    date: '2025-12-15',
    read: true,
    icon: TrendingUp,
    color: 'text-primary',
    bgColor: 'bg-gray-50',
  },
];

export function NotificationsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(notificationsData);
  const [filter, setFilter] = useState<'all' | 'unread' | 'promo'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'promo') return n.type === 'promo';
    return true;
  });

  return (
    <div className="min-h-screen relative">
      <AnimatedShaderBackground />

      <div className="relative z-10">
        <DashboardSidebar />
        <DashboardMobileSidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        <div className="lg:pl-64">
          <DashboardHeader onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

          <main className="px-4 lg:px-8 py-8 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                  Notifications
                </h1>
                <p className="text-muted-foreground">
                  Updates about tips, QR tools, and your CareTip account
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-sm font-medium text-accent hover:text-accent/80"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
              {(['all', 'unread', 'promo'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                    filter === f
                      ? 'bg-accent text-accent-foreground'
                      : 'border border-border hover:bg-muted'
                  }`}
                >
                  {f}
                  {f === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
                </button>
              ))}
            </div>

            <div className="space-y-4 max-w-3xl">
              {filtered.map((n) => {
                const Icon = n.icon;
                return (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl border p-4 sm:p-5 flex gap-4 ${
                      n.read ? 'bg-card border-border' : 'bg-accent/5 border-accent/20'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${n.bgColor}`}
                    >
                      <Icon className={`w-5 h-5 ${n.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h2 className="font-semibold text-foreground">{n.title}</h2>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-2" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{n.message}</p>
                      <p className="text-xs text-muted-foreground mb-3">{n.date}</p>
                      <div className="flex flex-wrap gap-2">
                        {!n.read && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(n.id)}
                            className="text-xs font-medium text-accent"
                          >
                            Mark read
                          </button>
                        )}
                        {n.actionUrl && n.actionLabel && (
                          <Link
                            to={n.actionUrl}
                            className="inline-flex items-center gap-1 text-xs font-medium text-accent"
                          >
                            {n.actionLabel}
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
