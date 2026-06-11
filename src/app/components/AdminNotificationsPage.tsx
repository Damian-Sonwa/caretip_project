import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Send,
  Users,
  MessageSquare,
  Bell,
  Target,
  X,
} from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AdminMobileSidebar } from './AdminMobileSidebar';
import { DashboardHeader } from './DashboardHeader';
import { Footer } from './Footer';
import AnimatedShaderBackground from './ui/animated-shader-background';
import { useMobileMenuState } from '../hooks/useMobileMenuState';

interface Notification {
  id: string;
  title: string;
  message: string;
  recipients: string;
  sentDate: string;
  status: 'sent' | 'scheduled' | 'draft';
}

export function AdminNotificationsPage() {
  const [notifications] = useState<Notification[]>([]);
  const { mobileMenuOpen, openMobileMenu, closeMobileMenu } = useMobileMenuState();
  const [showComposer, setShowComposer] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipients: 'all',
    channel: 'email',
  });

  const handleSend = () => {
    void formData;
    setShowComposer(false);
    setFormData({
      title: '',
      message: '',
      recipients: 'all',
      channel: 'email',
    });
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
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                  Notifications & Broadcasts
                </h1>
                <p className="text-muted-foreground">
                  Send announcements and updates to your users
                </p>
              </div>
              <button
                onClick={() => setShowComposer(true)}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                New Broadcast
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Send className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-sm text-muted-foreground">Sent This Month</h3>
                </div>
                <p className="text-2xl font-semibold text-foreground">127</p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-sm text-muted-foreground">Total Recipients</h3>
                </div>
                <p className="text-2xl font-semibold text-foreground">2,847</p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Bell className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="text-sm text-muted-foreground">Scheduled</h3>
                </div>
                <p className="text-2xl font-semibold text-foreground">3</p>
              </motion.div>
            </div>

            {/* Notifications List */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Recent Broadcasts</h3>
              </div>
              <div className="divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No notifications yet</p>
                    <p className="text-sm mt-1">Create a broadcast to send notifications to your users.</p>
                  </div>
                ) : (
                notifications.map((notification) => (
                  <div key={notification.id} className="p-6 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-sm font-semibold text-foreground">
                            {notification.title}
                          </h4>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            notification.status === 'sent' ? 'bg-green-100 text-green-700' :
                            notification.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5" />
                            {notification.recipients}
                          </div>
                          {notification.sentDate !== '-' && (
                            <div className="flex items-center gap-1.5">
                              <Send className="w-3.5 h-3.5" />
                              {notification.sentDate}
                            </div>
                          )}
                        </div>
                      </div>
                      <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))
                )}
              </div>
            </motion.div>
          </main>

          <Footer />
        </div>
      </div>

      {/* Notification Composer Modal */}
      {showComposer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Create New Broadcast</h2>
              <button
                onClick={() => setShowComposer(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter notification title"
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Enter your message"
                  rows={6}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Recipients
                  </label>
                  <select
                    value={formData.recipients}
                    onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="all">All Users</option>
                    <option value="premium">Premium Users</option>
                    <option value="pro">Pro Users</option>
                    <option value="basic">Basic Users</option>
                    <option value="free">Free Users</option>
                    <option value="new">New Users (Last 30 days)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Channel
                  </label>
                  <select
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="email">Email</option>
                    <option value="in-app">In-App Notification</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowComposer(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Broadcast
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}