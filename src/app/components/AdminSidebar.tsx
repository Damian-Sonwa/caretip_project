import { motion } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  LogOut,
  Building2,
  FileText,
  Settings,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '@/lib/utils';
import { CareTipLogo, CARE_TIP_LOGO_SURFACE_CLASS } from './CareTipLogo';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const DASHBOARD_HREF = '/platform-admin/dashboard';

const navItems: NavItem[] = [
  { name: 'Overview', href: DASHBOARD_HREF, icon: LayoutDashboard },
  { name: 'Business Management', href: '/platform-admin/businesses', icon: Building2 },
  { name: 'Global Transactions', href: '/platform-admin/transactions', icon: CreditCard },
  { name: 'Audit Logs', href: '/platform-admin/logs', icon: FileText },
  { name: 'System Settings', href: '/platform-admin/settings', icon: Settings },
  { name: 'User Management', href: '/platform-admin/users', icon: Users },
];

function isNavActive(href: string, pathname: string): boolean {
  if (href === DASHBOARD_HREF) {
    return pathname === DASHBOARD_HREF;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-sidebar-border lg:bg-sidebar lg:text-sidebar-foreground"
    >
      {/* Logo */}
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
          <span className="text-sm font-semibold text-sidebar-foreground">Platform Admin</span>
          <p className="text-xs text-muted-foreground">SuperAdmin</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = isNavActive(item.href, location.pathname);
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                    ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                        : 'text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    }
                  `}
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
            navigate('/platform-admin/login');
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Sign out</span>
        </button>
      </div>

      {/* Admin Profile */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted px-3 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground">
            {user?.name.charAt(0) || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{user?.name || 'Admin'}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email || 'admin@example.com'}</p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
