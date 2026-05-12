import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  Check,
  Heart,
  TrendingUp,
  Euro,
} from 'lucide-react';
import { Link } from 'react-router';
import { LetterAvatar } from './ui/letter-avatar';
import { toast } from "sonner";
import { useRequireAuth } from "../hooks/useRequireAuth";
import {
  changePasswordAPI,
  fetchBusinessProfile,
  patchBusinessProfile,
  uploadMyBusinessLogo,
  getMyAccountSettings,
  patchMyAccountSettings,
  getTwoFactorStatus,
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
} from "../lib/api";
import { logClientError } from "../lib/clientLog";
import { toUserFriendlyMessage } from "../lib/errorMessages";

const TEAL = "#EB992C";

export function ProfileSettingsPage() {
  const { t } = useTranslation();
  const { user, updateUser } = useRequireAuth();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Profile info state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [initialProfile, setInitialProfile] = useState<{ name: string; email: string; phone: string } | null>(null);
  
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
  const [twoFactorQr, setTwoFactorQr] = useState<string>("");
  const [twoFactorCode, setTwoFactorCode] = useState<string>("");

  const [tipReceivedNotifications, setTipReceivedNotifications] = useState(true);
  const [summaryEmails, setSummaryEmails] = useState(false);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [notifyNewLogin, setNotifyNewLogin] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || user.role !== "business") return;
      setLoading(true);
      try {
        const [biz, prefs, two] = await Promise.all([
          fetchBusinessProfile(),
          getMyAccountSettings(),
          getTwoFactorStatus(),
        ]);
        if (cancelled) return;
        setName(biz.name ?? "");
        setEmail(user.email ?? "");
        setPhone(biz.contactPhone ?? "");
        if (biz.logo) {
          updateUser({ avatar: biz.logo ?? undefined });
        }
        setInitialProfile({
          name: biz.name ?? "",
          email: user.email ?? "",
          phone: biz.contactPhone ?? "",
        });
        setTipReceivedNotifications(prefs.tipReceivedNotifications);
        setSummaryEmails(prefs.summaryEmails);
        setSystemAlerts(prefs.systemAlerts);
        setNotifyNewLogin(prefs.notifyNewLogin);
        setTwoFactorEnabled(two.enabled);
      } catch (e) {
        logClientError("ProfileSettingsPage.load", e);
        toast.error(t("business.accountSettings.toastLoadFail"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid loops on updateUser patches
  }, [user?.id, user?.role]);

  const handleCancelProfile = () => {
    if (initialProfile) {
      setName(initialProfile.name);
      setEmail(initialProfile.email);
      setPhone(initialProfile.phone);
    }
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    if (!user || user.role !== "business") return;
    setSavingProfile(true);
    try {
      const updated = await patchBusinessProfile({
        name: name.trim(),
        contactPhone: phone.trim() || null,
      });
      updateUser({ name: updated.name });
      setIsEditingProfile(false);
      toast.success(t("business.accountSettings.toastProfileSaved"), { style: { background: TEAL, color: "#fff" } });
    } catch (e) {
      logClientError("ProfileSettingsPage.saveProfile", e);
      toast.error(toUserFriendlyMessage(e));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogo = async (file: File) => {
    if (!user || user.role !== "business") return;
    setUploadingLogo(true);
    try {
      const r = await uploadMyBusinessLogo(file);
      if (r?.path) {
        updateUser({ avatar: r.path });
      }
      toast.success(t("business.accountSettings.toastLogoUpdated"), { style: { background: TEAL, color: "#fff" } });
    } catch (e) {
      logClientError("ProfileSettingsPage.uploadLogo", e);
      toast.error(toUserFriendlyMessage(e));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSavePassword = async () => {
    setSavingPassword(true);
    try {
      if (newPassword !== confirmPassword) {
        toast.error(t("business.accountSettings.toastPasswordMismatch"));
        return;
      }
      await changePasswordAPI(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsEditingPassword(false);
      toast.success(t("business.accountSettings.toastPasswordUpdated"), { style: { background: TEAL, color: "#fff" } });
    } catch (e) {
      logClientError("ProfileSettingsPage.changePassword", e);
      toast.error(toUserFriendlyMessage(e));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCancelPassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsEditingPassword(false);
  };

  const savePrefs = async (patch: Partial<{
    tipReceivedNotifications: boolean;
    summaryEmails: boolean;
    systemAlerts: boolean;
    notifyNewLogin: boolean;
  }>) => {
    setSavingPrefs(true);
    try {
      const updated = await patchMyAccountSettings(patch);
      setTipReceivedNotifications(updated.tipReceivedNotifications);
      setSummaryEmails(updated.summaryEmails);
      setSystemAlerts(updated.systemAlerts);
      setNotifyNewLogin(updated.notifyNewLogin);
      toast.success(t("business.accountSettings.toastPrefsSaved"), { style: { background: TEAL, color: "#fff" } });
    } catch (e) {
      logClientError("ProfileSettingsPage.savePrefs", e);
      toast.error(toUserFriendlyMessage(e));
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <main className="bg-background px-4 py-8 pb-20 lg:px-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                {t("business.accountSettings.title")}
              </h1>
              <p className="text-muted-foreground">
                {t("business.accountSettings.subtitle")}
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
                        {t("business.accountSettings.heroPill")}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold mb-3">{t("business.accountSettings.heroTitle")}</h2>
                    <p className="text-white/80 mb-4 max-w-xl">
                      {t("business.accountSettings.heroBodyLong")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <Heart className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-white/70">{t("business.accountSettings.statModel")}</p>
                          <p className="font-semibold">{t("business.accountSettings.statModelValue")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <Euro className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-white/70">{t("business.accountSettings.statFees")}</p>
                          <p className="font-semibold">{t("business.accountSettings.statFeesValue")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-white/70">{t("business.accountSettings.statMember")}</p>
                          <p className="font-semibold">{t("business.accountSettings.statMemberValue")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 lg:items-end">
                    <Link
                      to="/dashboard/transactions"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-white/90 text-primary rounded-lg font-semibold transition-all shadow-lg"
                    >
                      {t("business.accountSettings.linkTipsActivity")}
                    </Link>
                    <Link
                      to="/pricing"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-white/30 hover:bg-white/10 backdrop-blur-sm text-white rounded-lg font-medium transition-all"
                    >
                      {t("business.accountSettings.linkFeeDetails")}
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
                      {t("business.accountSettings.profileTitle")}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t("business.accountSettings.profileDesc")}
                    </p>
                  </div>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      {t("business.accountSettings.editShort")}
                    </button>
                  )}
                </div>

                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 pb-8 border-b border-border">
                  <div className="relative group">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={t("business.accountSettings.altProfilePhoto")}
                          className="h-full w-full rounded-full object-cover"
                          draggable={false}
                        />
                      ) : (
                        <LetterAvatar name={name} size="full" className="h-full w-full rounded-full text-3xl" />
                      )}
                    </div>
                    {isEditingProfile && (
                      <label className="absolute inset-0 cursor-pointer rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingLogo}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (!file || !file.type.startsWith("image/")) {
                              toast.error(t("business.accountSettings.toastImageOnly"));
                              return;
                            }
                            void handleLogo(file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">{email}</p>
                    {isEditingProfile && (
                      <p className="text-xs text-muted-foreground">
                        {t("business.accountSettings.photoClickHint")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Profile Fields */}
                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t("business.accountSettings.labelFullName")}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={name}
                        placeholder={t("business.accountSettings.phName")}
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
                      Email Address (read-only)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        placeholder={t("business.accountSettings.phEmail")}
                        disabled
                        className="w-full cursor-not-allowed opacity-60 pl-11 pr-4 py-3 bg-input-background border border-border rounded-lg transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t("business.accountSettings.labelContactPhone")}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="tel"
                        value={phone}
                        placeholder={t("business.accountSettings.phPhone")}
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
                    <button
                      type="button"
                      disabled={savingProfile}
                      onClick={handleSaveProfile}
                      className="flex touch-manipulation items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-white shadow-lg shadow-accent/20 transition-[colors,opacity,box-shadow] hover:bg-accent/90 active:opacity-90 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {t("business.accountSettings.saveProfile")}
                    </button>
                    <button
                      disabled={savingProfile}
                      onClick={handleCancelProfile}
                      className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      <X className="w-4 h-4" />
                      {t("business.accountSettings.cancel")}
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
                      {t("business.accountSettings.passwordTitle")}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t("business.accountSettings.passwordDesc")}
                    </p>
                  </div>
                  {!isEditingPassword && (
                    <button
                      onClick={() => setIsEditingPassword(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      {t("business.accountSettings.changeShort")}
                    </button>
                  )}
                </div>

                {isEditingPassword ? (
                  <div className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t("business.accountSettings.labelCurrentPw")}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full pl-11 pr-12 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                          placeholder={t("business.accountSettings.phCurrentPw")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={t("business.accountSettings.togglePwVisibility")}
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
                        {t("business.accountSettings.labelNewPw")}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-11 pr-12 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                          placeholder={t("business.accountSettings.phNewPw")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={t("business.accountSettings.togglePwVisibility")}
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
                        {t("business.accountSettings.labelConfirmPw")}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-11 pr-12 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                          placeholder={t("business.accountSettings.phConfirmPw")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={t("business.accountSettings.togglePwVisibility")}
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
                        {t("business.accountSettings.pwReqTitle")}
                      </p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <Check className="w-3 h-3" />
                          {t("business.accountSettings.pwReqLen")}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3 h-3" />
                          {t("business.accountSettings.pwReqCase")}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3 h-3" />
                          {t("business.accountSettings.pwReqNum")}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3 h-3" />
                          {t("business.accountSettings.pwReqSpec")}
                        </li>
                      </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="button"
                        disabled={savingPassword}
                        onClick={handleSavePassword}
                        className="flex touch-manipulation items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-white shadow-lg shadow-accent/20 transition-[colors,opacity,box-shadow] hover:bg-accent/90 active:opacity-90 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {t("business.accountSettings.updatePassword")}
                      </button>
                      <button
                        disabled={savingPassword}
                        onClick={handleCancelPassword}
                        className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
                      >
                        <X className="w-4 h-4" />
                        {t("business.accountSettings.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                      {t("business.accountSettings.passwordHint")}
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
                    {t("business.accountSettings.securityTitle")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("business.accountSettings.securityDesc")}
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Two-Factor Authentication */}
                  <div className="pb-6 border-b border-border">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-accent/10 rounded-lg">
                          <Shield className="w-5 h-5 text-accent" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-foreground mb-1">
                            {t("business.accountSettings.twoFactorTitle")}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t("business.accountSettings.twoFactorDesc")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!twoFactorEnabled ? (
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => {
                              void (async () => {
                                try {
                                  const r = await setupTwoFactor();
                                  setTwoFactorQr(r.qrDataUrl || "");
                                  toast.success(t("business.accountSettings.toast2faScan"), {
                                    style: { background: TEAL, color: "#fff" },
                                  });
                                } catch (e) {
                                  logClientError("ProfileSettingsPage.2fa.setup", e);
                                  toast.error(toUserFriendlyMessage(e));
                                }
                              })();
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            {t("business.accountSettings.setup2fa")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setTwoFactorQr("disable")}
                            className="flex items-center justify-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                          >
                            {t("business.accountSettings.disable2fa")}
                          </button>
                        )}
                      </div>
                    </div>

                    {!twoFactorEnabled && twoFactorQr ? (
                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
                        <div className="rounded-lg border border-border bg-muted/20 p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-3">
                            {t("business.accountSettings.scanAppTitle")}
                          </p>
                          <img
                            src={twoFactorQr}
                            alt={t("business.accountSettings.twoFactorQrAlt")}
                            className="w-full max-w-[220px] rounded-md bg-white p-2"
                          />
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              {t("business.accountSettings.labelVerificationCode")}
                            </label>
                            <input
                              value={twoFactorCode}
                              onChange={(e) => setTwoFactorCode(e.target.value)}
                              placeholder={t("business.accountSettings.phCode")}
                              inputMode="numeric"
                              className="w-full px-4 py-3 bg-input-background border border-border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              void (async () => {
                                try {
                                  const r = await enableTwoFactor(twoFactorCode);
                                  setTwoFactorEnabled(r.enabled);
                                  setTwoFactorQr("");
                                  setTwoFactorCode("");
                                  toast.success(t("business.accountSettings.toast2faEnabled"), { style: { background: TEAL, color: "#fff" } });
                                } catch (e) {
                                  logClientError("ProfileSettingsPage.2fa.enable", e);
                                  toast.error(toUserFriendlyMessage(e));
                                }
                              })();
                            }}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium shadow-lg shadow-accent/20 transition-all"
                          >
                            {t("business.accountSettings.enable2fa")}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {twoFactorEnabled && twoFactorQr === "disable" ? (
                      <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
                        <p className="text-sm text-muted-foreground mb-3">
                          {t("business.accountSettings.disable2faPrompt")}
                        </p>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <input
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value)}
                            placeholder={t("business.accountSettings.phCode")}
                            inputMode="numeric"
                            className="w-full px-4 py-3 bg-input-background border border-border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              void (async () => {
                                try {
                                  const r = await disableTwoFactor(twoFactorCode);
                                  setTwoFactorEnabled(r.enabled);
                                  setTwoFactorQr("");
                                  setTwoFactorCode("");
                                  toast.success(t("business.accountSettings.toast2faDisabled"), { style: { background: TEAL, color: "#fff" } });
                                } catch (e) {
                                  logClientError("ProfileSettingsPage.2fa.disable", e);
                                  toast.error(toUserFriendlyMessage(e));
                                }
                              })();
                            }}
                            className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
                          >
                            {t("business.accountSettings.disable")}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTwoFactorQr("");
                              setTwoFactorCode("");
                            }}
                            className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
                          >
                            {t("business.accountSettings.cancel")}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Notifications & alerts */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-accent/10 rounded-lg">
                          <Mail className="w-5 h-5 text-accent" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-foreground mb-1">
                            {t("business.accountSettings.tipNotifTitle")}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t("business.accountSettings.tipNotifDesc")}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={savingPrefs}
                        onClick={() => {
                          const next = !tipReceivedNotifications;
                          setTipReceivedNotifications(next);
                          void savePrefs({ tipReceivedNotifications: next });
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          tipReceivedNotifications ? 'bg-accent' : 'bg-border'
                        } ${savingPrefs ? "opacity-60" : ""}`}
                        aria-label={t("business.accountSettings.ariaTipNotif")}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            tipReceivedNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-accent/10 rounded-lg">
                          <Mail className="w-5 h-5 text-accent" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-foreground mb-1">
                            {t("business.accountSettings.summaryTitle")}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t("business.accountSettings.summaryDesc")}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={savingPrefs}
                        onClick={() => {
                          const next = !summaryEmails;
                          setSummaryEmails(next);
                          void savePrefs({ summaryEmails: next });
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          summaryEmails ? 'bg-accent' : 'bg-border'
                        } ${savingPrefs ? "opacity-60" : ""}`}
                        aria-label={t("business.accountSettings.ariaSummary")}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            summaryEmails ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-accent/10 rounded-lg">
                          <Mail className="w-5 h-5 text-accent" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-foreground mb-1">
                            {t("business.accountSettings.systemTitle")}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t("business.accountSettings.systemDesc")}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={savingPrefs}
                        onClick={() => {
                          const next = !systemAlerts;
                          setSystemAlerts(next);
                          void savePrefs({ systemAlerts: next });
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          systemAlerts ? 'bg-accent' : 'bg-border'
                        } ${savingPrefs ? "opacity-60" : ""}`}
                        aria-label={t("business.accountSettings.ariaSystem")}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            systemAlerts ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-accent/10 rounded-lg">
                          <Mail className="w-5 h-5 text-accent" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-foreground mb-1">
                            {t("business.accountSettings.loginTitle")}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t("business.accountSettings.loginDesc")}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={savingPrefs}
                        onClick={() => {
                          const next = !notifyNewLogin;
                          setNotifyNewLogin(next);
                          void savePrefs({ notifyNewLogin: next });
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notifyNewLogin ? 'bg-accent' : 'bg-border'
                        } ${savingPrefs ? "opacity-60" : ""}`}
                        aria-label={t("business.accountSettings.ariaLogin")}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notifyNewLogin ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>
    </main>
  );
}