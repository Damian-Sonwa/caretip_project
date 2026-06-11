import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  Shield,
  Bell,
  Globe,
  Lock,
  Mail,
  Palette,
  Zap,
  Save,
} from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AdminMobileSidebar } from './AdminMobileSidebar';
import { DashboardHeader } from './DashboardHeader';
import { Footer } from './Footer';
import AnimatedShaderBackground from './ui/animated-shader-background';
import { useMobileMenuState } from '../hooks/useMobileMenuState';

interface FeatureToggle {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export function AdminSettingsPage() {
  const { mobileMenuOpen, openMobileMenu, closeMobileMenu } = useMobileMenuState();
  const [features, setFeatures] = useState<FeatureToggle[]>([
    {
      id: '1',
      name: 'User Registration',
      description: 'Allow new users to create accounts',
      enabled: true,
    },
    {
      id: '2',
      name: 'Business fee tiers',
      description: 'Allow upgrades to higher per-tip fee tiers (Pro, Enterprise)',
      enabled: true,
    },
    {
      id: '3',
      name: 'Social Sharing',
      description: 'Allow users to share content on social media',
      enabled: true,
    },
    {
      id: '4',
      name: 'Email Notifications',
      description: 'Send automated emails to users',
      enabled: true,
    },
    {
      id: '5',
      name: 'Dark Mode',
      description: 'Enable dark theme for all users',
      enabled: false,
    },
    {
      id: '6',
      name: 'Advanced Analytics',
      description: 'Track detailed user behavior and metrics',
      enabled: false,
    },
  ]);

  const toggleFeature = (id: string) => {
    setFeatures(features.map(f => 
      f.id === id ? { ...f, enabled: !f.enabled } : f
    ));
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
                Platform Settings
              </h1>
              <p className="text-muted-foreground">
                Configure platform features and preferences
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Settings Navigation */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-1"
              >
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-medium text-foreground mb-4">Settings Categories</h3>
                  <nav className="space-y-1">
                    {[
                      { name: 'General', icon: Settings, active: true },
                      { name: 'Security', icon: Shield, active: false },
                      { name: 'Notifications', icon: Bell, active: false },
                      { name: 'Integrations', icon: Globe, active: false },
                      { name: 'Email', icon: Mail, active: false },
                      { name: 'Appearance', icon: Palette, active: false },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.name}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                            item.active
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{item.name}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </motion.div>

              {/* Settings Content */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="lg:col-span-2 space-y-6"
              >
                {/* Feature Control */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Zap className="w-5 h-5 text-accent" />
                    <h3 className="text-lg font-semibold text-foreground">Feature Control</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Enable or disable platform features available to users
                  </p>
                  <div className="space-y-4">
                    {features.map((feature) => (
                      <div
                        key={feature.id}
                        className="flex items-start justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-foreground mb-1">
                            {feature.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleFeature(feature.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            feature.enabled ? 'bg-accent' : 'bg-muted'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              feature.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Platform Settings */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Settings className="w-5 h-5 text-accent" />
                    <h3 className="text-lg font-semibold text-foreground">Platform Settings</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Platform Name
                      </label>
                      <input
                        type="text"
                        placeholder="CareTip"
                        className="w-full px-4 py-2 bg-input-background text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Support Email
                      </label>
                      <input
                        type="email"
                        placeholder="support@example.com"
                        className="w-full px-4 py-2 bg-input-background text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Maximum businesses (platform cap)
                      </label>
                      <input
                        type="number"
                        placeholder="10000"
                        className="w-full px-4 py-2 bg-input-background text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Default User Role
                      </label>
                      <select className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent">
                        <option>Free User</option>
                        <option>Basic User</option>
                        <option>Premium User</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Lock className="w-5 h-5 text-accent" />
                    <h3 className="text-lg font-semibold text-foreground">Security</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-1">
                          Two-Factor Authentication
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Require 2FA for admin accounts
                        </p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-accent">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-1">
                          Password Expiry
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Require password reset every 90 days
                        </p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button className="w-full sm:w-auto px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" />
                  Save All Changes
                </button>
              </motion.div>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
