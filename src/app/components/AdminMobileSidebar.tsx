import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  X,
  LogOut,
  Building2,
  FileText,
  Settings,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { cn } from '@/lib/utils';
import { CareTipLogo, CARE_TIP_LOGO_SURFACE_CLASS } from './CareTipLogo';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const DASHBOARD_HREF = '/platform-admin/dashboard';

function useAdminNavItems(t: (key: string) => string): NavItem[] {
  return useMemo(
    () => [
      { name: t('admin.sidebar.navOverview'), href: DASHBOARD_HREF, icon: LayoutDashboard },
      { name: t('admin.sidebar.navBusinesses'), href: '/platform-admin/businesses', icon: Building2 },
      { name: t('admin.sidebar.navTransactions'), href: '/platform-admin/transactions', icon: CreditCard },
      { name: t('admin.sidebar.navLogs'), href: '/platform-admin/logs', icon: FileText },
      { name: t('admin.sidebar.navSettings'), href: '/platform-admin/settings', icon: Settings },
      { name: t('admin.sidebar.navUsers'), href: '/platform-admin/users', icon: Users },
    ],
    [t],
  );
}

function isNavActive(href: string, pathname: string): boolean {
  if (href === DASHBOARD_HREF) {
    return pathname === DASHBOARD_HREF;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface AdminMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminMobileSidebar({ isOpen, onClose }: AdminMobileSidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const navItems = useAdminNavItems(t);
  const displayName = user?.name || t('admin.fallbackAdminName');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:hidden"
          >
            {/* Header */}
            <div
              className={cn(
                'flex items-center justify-between px-6 py-4',
                CARE_TIP_LOGO_SURFACE_CLASS
              )}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1 pr-2">
                <div className="min-w-0">
                  <CareTipLogo size="sm" />
                </div>
                <span className="text-xs font-semibold text-sidebar-foreground">{t("admin.sidebar.productLabel")}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 transition-colors hover:bg-sidebar-accent"
                aria-label={t("admin.sidebar.closeMenuAria")}
              >
                <X className="h-5 w-5 text-sidebar-foreground" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const isActive = isNavActive(item.href, location.pathname);
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all',
                          isActive
                            ? 'bg-primary font-semibold text-primary-foreground shadow-md'
                            : 'text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Quick Actions */}
            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                  navigate('/platform-admin/login');
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">{t("admin.sidebar.signOut")}</span>
              </button>
            </div>

            {/* Admin Profile */}
            <div className="border-t border-sidebar-border p-4">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted px-3 py-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground">
                  {displayName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email || 'admin@example.com'}</p>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
