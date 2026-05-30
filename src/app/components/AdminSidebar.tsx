import { motion } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router';
import { CareIcon } from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { cn } from '@/lib/utils';
import { CareTipLogo, CARE_TIP_LOGO_SURFACE_CLASS } from './CareTipLogo';
import { adminDashboardNavItems, isAdminDashboardNavActive } from './adminDashboardNav';

export function AdminSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const displayName = user?.name || t("admin.fallbackAdminName");

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-neutral-200/80 lg:bg-gradient-to-b lg:from-white lg:to-stone-50/95 lg:text-sidebar-foreground"
    >
      <div
        className={cn(
          'flex flex-col gap-2 px-6 py-4',
          CARE_TIP_LOGO_SURFACE_CLASS
        )}
      >
        <div className="min-w-0">
          <CareTipLogo size="sm" />
        </div>
        <div>
          <span className="text-sm font-semibold text-sidebar-foreground">{t('admin.sidebar.productLabel')}</span>
          <p className="text-xs text-muted-foreground">{t('admin.sidebar.roleBadge')}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <ul className="space-y-0.5">
          {adminDashboardNavItems.map((item) => {
            const isActive = isAdminDashboardNavActive(item.href, location.pathname);
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "admin-dash-nav-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "admin-dash-nav-link--active bg-primary font-semibold text-primary-foreground"
                      : "text-sidebar-foreground/85 hover:bg-stone-100/90 hover:text-sidebar-foreground",
                  )}
                >
                  <CareIcon name={item.icon} size="nav" />
                  <span className="truncate tracking-tight">{t(item.labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/platform-admin/login');
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <CareIcon name="signOut" size="md" />
          <span className="text-sm font-medium">{t('admin.sidebar.signOut')}</span>
        </button>
      </div>

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
  );
}
