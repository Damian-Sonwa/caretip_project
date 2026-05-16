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
            className="fixed inset-y-0 left-0 z-50 flex w-[min(100%,18rem)] max-w-[85vw] flex-col border-r border-neutral-200/80 bg-gradient-to-b from-white to-stone-50/95 text-sidebar-foreground shadow-xl lg:hidden"
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
                className="touch-manipulation rounded-xl p-2.5 transition-colors hover:bg-stone-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={t("admin.sidebar.closeMenuAria")}
              >
                <X className="h-5 w-5 text-sidebar-foreground" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
              <ul className="space-y-0.5">
                {navItems.map((item) => {
                  const isActive = isNavActive(item.href, location.pathname);
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={onClose}
                        className={cn(
                          "admin-dash-nav-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all",
                          isActive
                            ? "admin-dash-nav-link--active bg-primary font-semibold text-primary-foreground"
                            : "text-sidebar-foreground/85 hover:bg-stone-100/90 hover:text-sidebar-foreground",
                        )}
                      >
                        <Icon className="h-[1.125rem] w-[1.125rem] shrink-0" />
                        <span className="truncate tracking-tight">{item.name}</span>
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
            <div className="border-t border-border/70 p-3 sm:p-4">
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
