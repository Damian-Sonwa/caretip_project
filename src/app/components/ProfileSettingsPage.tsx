import { useState } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Mail,
  Phone,
  Lock,
  Shield,
  Camera,
  Edit2,
  Save,
  X,
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  LogOut,
  Check,
  Heart,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { Link } from 'react-router';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardMobileSidebar } from './DashboardMobileSidebar';
import { DashboardHeader } from './DashboardHeader';
import { Footer } from './Footer';
import AnimatedShaderBackground from './ui/animated-shader-background';
import { LetterAvatar } from './ui/letter-avatar';

// Mock data for active sessions
const activeSessions = [
  {
    id: 1,
    device: 'MacBook Pro',
    location: 'San Francisco, CA',
    lastActive: '2 minutes ago',
    current: true,
    icon: Monitor,
  },
  {
    id: 2,
    device: 'iPhone 14 Pro',
    location: 'San Francisco, CA',
    lastActive: '1 hour ago',
    current: false,
    icon: Smartphone,
  },
  {
    id: 3,
    device: 'Chrome on Windows',
    location: 'New York, NY',
    lastActive: '2 days ago',
    current: false,
    icon: Monitor,
  },
];

export function ProfileSettingsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Profile info state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Password state
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Security settings state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [sessionAlerts, setSessionAlerts] = useState(true);

  const handleSaveProfile = () => {
    // In a real app, save to backend
    setIsEditingProfile(false);
  };

  const handleCancelProfile = () => {
    // Reset to original values
    setName('');
    setEmail('');
    setPhone('');
    setIsEditingProfile(false);
  };

  const handleSavePassword = () => {
    // In a real app, validate and save password
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsEditingPassword(false);
  };

  const handleCancelPassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsEditingPassword(false);
  };

  const handleRevokeSession = (sessionId: number) => {
    void sessionId;
    // In a real app, revoke the session
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedShaderBackground />
      
      <div className="relative z-10">
        {/* Sidebar - Desktop */}
        <DashboardSidebar />

        {/* Sidebar - Mobile */}
        <DashboardMobileSidebar 
          isOpen={mobileMenuOpen} 
          onClose={() => setMobileMenuOpen(false)} 
        />

        {/* Main Content */}
        <div className="lg:pl-64">
          {/* Header */}
          <DashboardHeader onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

          {/* Page Content */}
          <main className="px-4 lg:px-8 py-8 pb-20">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                Profile & Settings
              </h1>
              <p className="text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>

            {/* Content Grid */}
            <div className="max-w-5xl space-y-6">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-accent to-primary rounded-xl p-6 sm:p-8 text-white shadow-xl"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                        <Check className="w-3 h-3" />
                        Tipping enabled
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Your CareTip account</h2>
                    <p className="text-white/80 mb-4 max-w-xl">
                      Accept one-time tips via QR codes and staff links. Payments use Stripe Payment
                      Intents — there is no recurring subscription to CareTip on Starter.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <Heart className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-white/70">Model</p>
                          <p className="font-semibold">Per-tip only</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-white/70">Fees</p>
                          <p className="font-semibold">See pricing</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-white/70">Member since</p>
                          <p className="font-semibold">Dec 2025</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 lg:items-end">
                    <Link
                      to="/dashboard/transactions"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-white/90 text-primary rounded-lg font-semibold transition-all shadow-lg"
                    >
                      View tips & activity
                    </Link>
                    <Link
                      to="/pricing"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-white/30 hover:bg-white/10 backdrop-blur-sm text-white rounded-lg font-medium transition-all"
                    >
                      Fee details
                    </Link>
                  </div>
                </div>
              </motion.div>

              {/* Profile Section */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-card border border-border rounded-xl p-6 sm:p-8"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-1">
                      Profile Information
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Update your personal details
                    </p>
                  </div>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                </div>

                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 pb-8 border-b border-border">
                  <div className="relative group">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full">
                      <LetterAvatar name={name} size="full" className="h-full w-full rounded-full text-3xl" />
                    </div>
                    {isEditingProfile && (
                      <button className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">{email}</p>
                    {isEditingProfile && (
                      <p className="text-xs text-muted-foreground">
                        Click on avatar to change profile picture
                      </p>
                    )}
                  </div>
                </div>

                {/* Profile Fields */}
                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={name}
                        placeholder="Schmidt Paul"
                        onChange={(e) => setName(e.target.value)}
                        disabled={!isEditingProfile}
                        className={`w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-lg transition-all ${
                          isEditingProfile
                            ? 'text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent'
                            : 'cursor-not-allowed opacity-60'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        placeholder="you@example.com"
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={!isEditingProfile}
                        className={`w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-lg transition-all ${
                          isEditingProfile
                            ? 'text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent'
                            : 'cursor-not-allowed opacity-60'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="tel"
                        value={phone}
                        placeholder="+1 (555) 123-4567"
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={!isEditingProfile}
                        className={`w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-lg transition-all ${
                          isEditingProfile
                            ? 'text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent'
                            : 'cursor-not-allowed opacity-60'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditingProfile && (
                  <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-border">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveProfile}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium shadow-lg shadow-accent/20 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </motion.button>
                    <button
                      onClick={handleCancelProfile}
                      className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Password Section */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-card border border-border rounded-xl p-6 sm:p-8"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-1">
                      Password
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Change your account password
                    </p>
                  </div>
                  {!isEditingPassword && (
                    <button
                      onClick={() => setIsEditingPassword(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Change
                    </button>
                  )}
                </div>

                {isEditingPassword ? (
                  <div className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full pl-11 pr-12 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-11 pr-12 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-11 pr-12 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-muted/50 border border-border rounded-lg p-4">
                      <p className="text-sm font-medium text-foreground mb-2">
                        Password Requirements:
                      </p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <Check className="w-3 h-3" />
                          At least 8 characters long
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3 h-3" />
                          Contains uppercase and lowercase letters
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3 h-3" />
                          Contains at least one number
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3 h-3" />
                          Contains at least one special character
                        </li>
                      </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSavePassword}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium shadow-lg shadow-accent/20 transition-all"
                      >
                        <Save className="w-4 h-4" />
                        Update Password
                      </motion.button>
                      <button
                        onClick={handleCancelPassword}
                        className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                      •••••••••••• (Last changed 3 months ago)
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Security Settings Section */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-card border border-border rounded-xl p-6 sm:p-8"
              >
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-foreground mb-1">
                    Security Settings
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your account security preferences
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Two-Factor Authentication */}
                  <div className="flex items-start justify-between gap-4 pb-6 border-b border-border">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Shield className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-foreground mb-1">
                          Two-Factor Authentication
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        twoFactorEnabled ? 'bg-accent' : 'bg-border'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Email Notifications */}
                  <div className="flex items-start justify-between gap-4 pb-6 border-b border-border">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Mail className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-foreground mb-1">
                          Email Notifications
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Receive security alerts via email
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationsEnabled ? 'bg-accent' : 'bg-border'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Session Alerts */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Monitor className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-foreground mb-1">
                          Session Alerts
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Get notified of new login sessions
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSessionAlerts(!sessionAlerts)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        sessionAlerts ? 'bg-accent' : 'bg-border'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          sessionAlerts ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Active Sessions Section */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-card border border-border rounded-xl p-6 sm:p-8"
              >
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-foreground mb-1">
                    Active Sessions
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your active login sessions across devices
                  </p>
                </div>

                <div className="space-y-4">
                  {activeSessions.map((session) => {
                    const Icon = session.icon;
                    return (
                      <div
                        key={session.id}
                        className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-muted rounded-lg">
                            <Icon className="w-5 h-5 text-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-foreground">
                                {session.device}
                              </h3>
                              {session.current && (
                                <span className="rounded-full bg-success px-2 py-0.5 text-xs text-success-foreground">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {session.location}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Last active: {session.lastActive}
                            </p>
                          </div>
                        </div>
                        {!session.current && (
                          <button
                            onClick={() => handleRevokeSession(session.id)}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                          >
                            <LogOut className="w-3 h-3" />
                            Revoke
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <button className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors">
                    Sign out of all other sessions
                  </button>
                </div>
              </motion.div>
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
}