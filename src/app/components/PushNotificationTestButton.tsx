import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { sendTestPushNotificationApi } from "../lib/api";
import { logClientError } from "../lib/clientLog";
import { toUserFriendlyMessage } from "../lib/errorMessages";
import {
  getFcmDiagnostics,
  registerFcmDeviceToken,
  type FcmDiagnostics,
} from "../lib/fcmPush";

export function PushNotificationTestButton() {
  const { t } = useTranslation();
  const [diagnostics, setDiagnostics] = useState<FcmDiagnostics | null>(null);
  const [sending, setSending] = useState(false);

  const refreshDiagnostics = useCallback(async () => {
    try {
      setDiagnostics(await getFcmDiagnostics());
    } catch (err) {
      logClientError("PushNotificationTestButton.diagnostics", err);
    }
  }, []);

  useEffect(() => {
    void refreshDiagnostics();
  }, [refreshDiagnostics]);

  const statusLabel = (() => {
    if (!diagnostics) return t("push.test.statusChecking");
    if (!diagnostics.supported) return t("push.test.statusUnsupported");
    if (!diagnostics.configAvailable) return t("push.test.statusNoConfig");
    if (diagnostics.permission === "denied") return t("push.test.statusDenied");
    if (diagnostics.permission === "default") return t("push.test.statusPrompt");
    if (!diagnostics.hasToken) return t("push.test.statusNoToken");
    return t("push.test.statusReady");
  })();

  const handleTest = async () => {
    setSending(true);
    try {
      const registered = await registerFcmDeviceToken();
      if (!registered) {
        toast.error(t("push.test.toastRegisterFailed"));
        await refreshDiagnostics();
        return;
      }
      const result = await sendTestPushNotificationApi();
      if (result.sent) {
        toast.success(result.message || t("push.test.toastSuccess"));
      } else {
        toast.error(result.message || t("push.test.toastFailed"));
      }
      await refreshDiagnostics();
    } catch (err) {
      logClientError("PushNotificationTestButton.send", err);
      toast.error(toUserFriendlyMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-border/60 bg-muted/30 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="rounded-lg bg-accent/10 p-2">
            <BellRing className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t("push.test.title")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{statusLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("push.test.hint")}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={sending}
          onClick={() => void handleTest()}
        >
          {sending ? t("push.test.sending") : t("push.test.button")}
        </Button>
      </div>
    </div>
  );
}
