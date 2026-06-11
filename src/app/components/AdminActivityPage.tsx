import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  Download,
  UserPlus,
  ArrowUpCircle,
  CreditCard,
  Settings,
} from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AdminMobileSidebar } from './AdminMobileSidebar';
import { DashboardHeader } from './DashboardHeader';
import { Footer } from './Footer';
import AnimatedShaderBackground from './ui/animated-shader-background';
import { useMobileMenuState } from '../hooks/useMobileMenuState';

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  type: 'user' | 'tip' | 'payment' | 'system';
  timestamp: string;
  details?: string;
}

export function AdminActivityPage() {
  const { mobileMenuOpen, openMobileMenu, closeMobileMenu } = useMobileMenuState();
  const [filterType, setFilterType] = useState<string>('all');
  const [activities] = useState<ActivityLog[]>([]);

  const filteredActivities = activities.filter(
    (activity) => filterType === 'all' || activity.type === filterType
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return UserPlus;
      case 'tip':
        return ArrowUpCircle;
      case 'payment':
        return CreditCard;
      case 'system':
        return Settings;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-gray-50 text-neutral-600 border border-gray-200';
      case 'tip':
        return 'bg-gray-50 text-neutral-600 border border-gray-200';
      case 'payment':
        return 'bg-gray-50 text-neutral-600 border border-gray-200';
      case 'system':
        return 'bg-gray-50 text-neutral-600 border border-gray-200';
      default:
        return 'bg-gray-50 text-neutral-600 border border-gray-200';
    }
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedShaderBackground />
      
      <div className="relative z-10">
        <AdminSidebar />
        <AdminMobileSidebar 
          isOpen={mobileMenuOpen} 
          onClose={closeMobileMenu} 
        />

        <div className="lg:pl-64">
          <DashboardHeader onMenuClick={openMobileMenu} />

          <main className="px-4 lg:px-8 py-8 pb-20">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                Activity Log
              </h1>
              <p className="text-muted-foreground">
                Monitor platform activity and user actions
              </p>
            </div>

            {/* Filters */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-card border border-border rounded-xl p-4 mb-6"
            >
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterType === 'all'
                        ? 'bg-accent text-accent-foreground'
                        : 'border border-border hover:bg-muted'
                    }`}
                  >
                    All Activity
                  </button>
                  <button
                    onClick={() => setFilterType('user')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterType === 'user'
                        ? 'bg-accent text-accent-foreground'
                        : 'border border-border hover:bg-muted'
                    }`}
                  >
                    Users
                  </button>
                  <button
                    onClick={() => setFilterType('tip')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterType === 'tip'
                        ? 'bg-accent text-accent-foreground'
                        : 'border border-border hover:bg-muted'
                    }`}
                  >
                    Tips
                  </button>
                  <button
                    onClick={() => setFilterType('payment')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterType === 'payment'
                        ? 'bg-accent text-accent-foreground'
                        : 'border border-border hover:bg-muted'
                    }`}
                  >
                    Payments
                  </button>
                  <button
                    onClick={() => setFilterType('system')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterType === 'system'
                        ? 'bg-accent text-accent-foreground'
                        : 'border border-border hover:bg-muted'
                    }`}
                  >
                    System
                  </button>
                </div>

                <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Log
                </button>
              </div>
            </motion.div>

            {/* Activity Feed */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                </div>
              </div>

              <div className="divide-y divide-border">
                {filteredActivities.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No activity yet</p>
                    <p className="text-sm mt-1">Activity will appear here when users interact with the platform.</p>
                  </div>
                ) : (
                filteredActivities.map((activity, index) => {
                  const Icon = getActivityIcon(activity.type);
                  const colorClass = getActivityColor(activity.type);

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="p-6 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2.5 rounded-lg ${colorClass} flex-shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-1">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {activity.action}
                              </p>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {activity.user}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {activity.timestamp}
                            </span>
                          </div>
                          {activity.details && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {activity.details}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
                )}
              </div>

              {/* Load More */}
              <div className="p-6 border-t border-border text-center">
                <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                  Load More Activity
                </button>
              </div>
            </motion.div>
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
