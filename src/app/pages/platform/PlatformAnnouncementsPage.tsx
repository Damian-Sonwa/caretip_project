import { useState } from "react";
import { Loader2, Megaphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { sendPlatformAnnouncementApi } from "@/app/lib/api";
import { logClientError } from "@/app/lib/clientLog";
import { toUserFriendlyMessage } from "@/app/lib/errorMessages";
import { caretipBtnPrimary } from "@/lib/caretipButtonSystem";
import { cn } from "@/lib/utils";

export function PlatformAnnouncementsPage() {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [audience, setAudience] = useState<"all" | "managers" | "employees">("all");
  const [priority, setPriority] = useState<"normal" | "high">("normal");
  const [inApp, setInApp] = useState(true);
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error(t("admin.announcements.validationRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await sendPlatformAnnouncementApi({
        title: title.trim(),
        message: message.trim(),
        audience,
        url: url.trim() || undefined,
        priority,
        channels: { inApp, push, email },
      });
      toast.success(res.message);
      setTitle("");
      setMessage("");
      setUrl("");
    } catch (err) {
      logClientError("PlatformAnnouncementsPage", err);
      toast.error(toUserFriendlyMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Megaphone className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {t("admin.announcements.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.announcements.subtitle")}</p>
        </div>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm"
      >
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground" htmlFor="ann-title">
            {t("admin.announcements.fieldTitle")}
          </label>
          <input
            id="ann-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="caretip-auth-field"
            maxLength={256}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground" htmlFor="ann-message">
            {t("admin.announcements.fieldMessage")}
          </label>
          <textarea
            id="ann-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="caretip-auth-field min-h-[6rem] resize-y"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground" htmlFor="ann-url">
            {t("admin.announcements.fieldUrl")}
          </label>
          <input
            id="ann-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/dashboard"
            className="caretip-auth-field"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground" htmlFor="ann-audience">
              {t("admin.announcements.fieldAudience")}
            </label>
            <select
              id="ann-audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value as typeof audience)}
              className="caretip-auth-field"
            >
              <option value="all">{t("admin.announcements.audienceAll")}</option>
              <option value="managers">{t("admin.announcements.audienceManagers")}</option>
              <option value="employees">{t("admin.announcements.audienceEmployees")}</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground" htmlFor="ann-priority">
              {t("admin.announcements.fieldPriority")}
            </label>
            <select
              id="ann-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
              className="caretip-auth-field"
            >
              <option value="normal">{t("admin.announcements.priorityNormal")}</option>
              <option value="high">{t("admin.announcements.priorityHigh")}</option>
            </select>
          </div>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-foreground">
            {t("admin.announcements.fieldChannels")}
          </legend>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={inApp} onChange={(e) => setInApp(e.target.checked)} />
            {t("admin.announcements.channelInApp")}
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)} />
            {t("admin.announcements.channelPush")}
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} />
            {t("admin.announcements.channelEmail")}
          </label>
        </fieldset>
        <button
          type="submit"
          disabled={submitting}
          className={cn(caretipBtnPrimary, "w-full disabled:opacity-50")}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {t("admin.announcements.sending")}
            </>
          ) : (
            t("admin.announcements.send")
          )}
        </button>
      </form>
    </div>
  );
}
