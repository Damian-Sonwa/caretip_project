import { motion } from 'motion/react';
import { Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Bell,
  UserCircle,
  HelpCircle,
  Wallet,
  Building2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '@/lib/utils';
import { CareTipLogo, CARE_TIP_LOGO_SURFACE_CLASS } from './CareTipLogo';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Business profile', href: '/dashboard/profile', icon: Building2 },
  { name: 'Tips & activity', href: '/dashboard/transactions', icon: Wallet },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Support', href: '/dashboard/support', icon: HelpCircle },
  { name: 'Profile & Settings', href: '/dashboard/profile-settings', icon: UserCircle },
];

export function DashboardSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 lg:w-64 lg:border-r lg:border-border lg:bg-card/50 lg:backdrop-blur-xl"
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center gap-2 px-6 py-4',
          CARE_TIP_LOGO_SURFACE_CLASS
        )}
      >
        <CareTipLogo size="sm" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                    ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md font-semibold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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

      {/* User Profile */}
      <div className="border-t border-border p-4">
        <Link 
          to="/dashboard/profile-settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground">
            {user?.name.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || 'user@example.com'}</p>
          </div>
        </Link>
      </div>
    </motion.aside>
  );
}