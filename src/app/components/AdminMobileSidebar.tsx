import { useNavigate } from 'react-router';
import { X } from 'lucide-react';
import { CareIcon } from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  CareTipLogo,
  DASHBOARD_SIDEBAR_MOBILE_BRAND_CLASS,
  DASHBOARD_SIDEBAR_NAV_CLASS,
} from './CareTipLogo';
import {
  dashboardSidebarIconButtonIdle,
  dashboardSidebarSignOutButton,
} from "@/lib/theme/dashboardSidebarUi";
import { PlatformSidebarNavShell } from './platform/PlatformSidebarNavShell';
import { MobileDrawer } from './ui/MobileDrawer';

interface AdminMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminMobileSidebar({ isOpen, onClose }: AdminMobileSidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const displayName = user?.name || t('admin.fallbackAdminName');

  return (
    <MobileDrawer isOpen={isOpen} onClose={onClose} ariaLabel={t("admin.sidebar.closeMenuAria")}>
      <div className={DASHBOARD_SIDEBAR_MOBILE_BRAND_CLASS}>
        <div className="min-w-0 flex-1">
          <CareTipLogo size="drawer" />
        </div>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "touch-manipulation flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-2.5",
            dashboardSidebarIconButtonIdle,
          )}
          aria-label={t("admin.sidebar.closeMenuAria")}
        >
          <X className="h-5 w-5 text-sidebar-foreground" />
        </button>
      </div>

      <nav className={cn(DASHBOARD_SIDEBAR_NAV_CLASS, "min-h-0 flex-1 overflow-y-auto overscroll-contain px-0")}>
        <PlatformSidebarNavShell onNavigate={onClose} />
      </nav>

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => {
            logout();
            onClose();
            navigate('/platform-admin/login');
          }}
          className={dashboardSidebarSignOutButton}
        >
          <CareIcon name="signOut" size="md" />
          <span className="text-sm font-medium">{t("admin.sidebar.signOut")}</span>
        </button>
      </div>

      <div className="border-t border-sidebar-border p-3 sm:p-4">
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
    </MobileDrawer>
  );
}
