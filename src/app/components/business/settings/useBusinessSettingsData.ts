import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import {
  fetchBusinessProfile,
  getMyAccountSettings,
  getTwoFactorStatus,
} from "../../../lib/api";
import { logClientError } from "../../../lib/clientLog";
import { toUserFriendlyMessage } from "../../../lib/errorMessages";

export function useBusinessSettingsData() {
  const { t } = useTranslation();
  const { user, updateUser } = useRequireAuth();
  const [loading, setLoading] = useState(true);
  const [contactPhone, setContactPhone] = useState("");
  const [initialPhone, setInitialPhone] = useState("");
  const [tipReceivedNotifications, setTipReceivedNotifications] = useState(true);
  const [summaryEmails, setSummaryEmails] = useState(false);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [notifyNewLogin, setNotifyNewLogin] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user || user.role !== "business") return;
    setLoading(true);
    void (async () => {
      try {
        const [biz, prefs, two] = await Promise.all([
          fetchBusinessProfile(),
          getMyAccountSettings(),
          getTwoFactorStatus(),
        ]);
        if (cancelled) return;
        const phone = biz.contactPhone ?? "";
        setContactPhone(phone);
        setInitialPhone(phone);
        if (biz.logo) {
          updateUser({ avatar: biz.logo ?? undefined });
        }
        setTipReceivedNotifications(prefs.tipReceivedNotifications);
        setSummaryEmails(prefs.summaryEmails);
        setSystemAlerts(prefs.systemAlerts);
        setNotifyNewLogin(prefs.notifyNewLogin);
        setTwoFactorEnabled(two.enabled);
      } catch (e) {
        logClientError("useBusinessSettingsData.load", e);
        toast.error(toUserFriendlyMessage(e) || t("business.accountSettings.toastLoadFail"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  return {
    user,
    updateUser,
    loading,
    contactPhone,
    setContactPhone,
    initialPhone,
    setInitialPhone,
    tipReceivedNotifications,
    setTipReceivedNotifications,
    summaryEmails,
    setSummaryEmails,
    systemAlerts,
    setSystemAlerts,
    notifyNewLogin,
    setNotifyNewLogin,
    twoFactorEnabled,
    setTwoFactorEnabled,
  };
}
