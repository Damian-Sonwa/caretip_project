import { useState, useEffect, useCallback } from "react";
import { Loader2, Megaphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  fetchPlatformAnnouncements,
  sendPlatformAnnouncementApi,
  type PlatformAnnouncementRow,
} from "@/app/lib/api";
import { logClientError } from "@/app/lib/clientLog";
import { toUserFriendlyMessage } from "@/app/lib/errorMessages";
import { caretipBtnPrimary } from "@/lib/caretipButtonSystem";
import { cn } from "@/lib/utils";
import { CareTipPageLoader } from "@/app/components/CareTipPageLoader";
import { PlatformPage, PlatformPageHeader } from "@/app/components/platform/PlatformPageChrome";
import { platformUi } from "@/app/components/platform/platformDashboardUi";
import {
  getPageSessionCache,
  setPageSessionCache,
  PAGE_CACHE_TTL_MEDIUM_MS,
} from "@/app/lib/pageSessionCache";

type Audience = "all" | "managers" | "employees" | "admins";

function formatSentAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function channelLabel(ch: string, t: (key: string) => string): string {
  if (ch === "in_app") return t("admin.announcements.channelInApp");
  if (ch === "push") return t("admin.announcements.channelPush");
  if (ch === "email") return t("admin.announcements.channelEmail");
  return ch;
}

function audienceLabel(audience: string, t: (key: string) => string): string {
  if (audience === "managers") return t("admin.announcements.audienceManagers");
  if (audience === "employees") return t("admin.announcements.audienceEmployees");
  if (audience === "admins") return t("admin.announcements.audienceAdmins");
  return t("admin.announcements.audienceAll");
}

export function PlatformAnnouncementsPage() {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [priority, setPriority] = useState<"normal" | "high">("normal");
  const [inApp, setInApp] = useState(true);
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [history, setHistory] = useState<PlatformAnnouncementRow[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = useCallback(async (opts?: { quiet?: boolean }) => {
    const quiet = opts?.quiet === true;
    const cacheKey = "platform:announcements-history";
    const cached = getPageSessionCache<{ items: PlatformAnnouncementRow[]; total: number }>(
      cacheKey,
      PAGE_CACHE_TTL_MEDIUM_MS,
    );
    const useCachedFirst = !quiet && cached !== null;
    if (useCachedFirst) {
      setHistory(cached.items);
      setHistoryTotal(cached.total);
      setHistoryLoading(false);
    } else if (!quiet) {
      setHistoryLoading(true);
    }
    try {
      const res = await fetchPlatformAnnouncements({ take: 100, skip: 0 });
      setHistory(res.items);
      setHistoryTotal(res.total);
      setPageSessionCache(cacheKey, { items: res.items, total: res.total });
    } catch (err) {
      logClientError("PlatformAnnouncementsPage.loadHistory", err);
      if (!useCachedFirst) {
        toast.error(toUserFriendlyMessage(err));
        setHistory([]);
        setHistoryTotal(0);
      }
    } finally {
      if (!quiet && !useCachedFirst) setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

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
      void loadHistory();
    } catch (err) {
      logClientError("PlatformAnnouncementsPage", err);
      toast.error(toUserFriendlyMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PlatformPage>
      <PlatformPageHeader
        icon={Megaphone}
        title={t("admin.announcements.centerTitle")}
        subtitle={t("admin.announcements.centerSubtitle")}
      />

      <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
        <section className="lg:col-span-2" aria-labelledby="announce-compose-heading">
          <h2 id="announce-compose-heading" className="mb-3 text-sm font-semibold text-foreground">
            {t("admin.announcements.composeSection")}
          </h2>
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className={cn(platformUi.contentCard, "space-y-4")}
          >
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground" htmlFor="ann-title">
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
              <label className="mb-1.5 block text-xs font-medium text-foreground" htmlFor="ann-message">
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
              <label className="mb-1.5 block text-xs font-medium text-foreground" htmlFor="ann-url">
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
                <label className="mb-1.5 block text-xs font-medium text-foreground" htmlFor="ann-audience">
                  {t("admin.announcements.fieldAudience")}
                </label>
                <select
                  id="ann-audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as Audience)}
                  className="caretip-auth-field"
                >
                  <option value="all">{t("admin.announcements.audienceAll")}</option>
                  <option value="managers">{t("admin.announcements.audienceManagers")}</option>
                  <option value="employees">{t("admin.announcements.audienceEmployees")}</option>
                  <option value="admins">{t("admin.announcements.audienceAdmins")}</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground" htmlFor="ann-priority">
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
              <legend className="text-xs font-medium text-foreground">
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
        </section>

        <section className="lg:col-span-3" aria-labelledby="announce-history-heading">
          <h2 id="announce-history-heading" className="mb-3 text-sm font-semibold text-foreground">
            {t("admin.announcements.historySection")}
          </h2>
          <div className={platformUi.dataPanel}>
            {historyLoading && history.length === 0 ? (
              <div className="px-4 py-12">
                <CareTipPageLoader variant="section" message={t("admin.announcements.historyLoading")} />
              </div>
            ) : history.length === 0 ? (
              <p className={platformUi.emptyState}>{t("admin.announcements.historyEmpty")}</p>
            ) : (
              <>
                <div className={platformUi.tableWrap}>
                  <table className={platformUi.table}>
                    <thead>
                      <tr className={platformUi.tableHeadRow}>
                        <th className={platformUi.tableTh}>{t("admin.announcements.colSent")}</th>
                        <th className={platformUi.tableTh}>{t("admin.announcements.colTitle")}</th>
                        <th className={platformUi.tableTh}>{t("admin.announcements.colAudience")}</th>
                        <th className={platformUi.tableTh}>{t("admin.announcements.colDelivery")}</th>
                        <th className={platformUi.tableTh}>{t("admin.announcements.colStatus")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((row) => (
                        <tr key={row.id} className={platformUi.tableRow}>
                          <td className={cn(platformUi.tableTd, "whitespace-nowrap text-muted-foreground")}>
                            {formatSentAt(row.createdAt)}
                          </td>
                          <td className={platformUi.tableTd}>
                            <p className="font-medium text-foreground">{row.title}</p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{row.message}</p>
                          </td>
                          <td className={platformUi.tableTd}>
                            <span className="text-sm text-foreground">{audienceLabel(row.audience, t)}</span>
                            {row.priority === "high" ? (
                              <span className="ml-1.5 text-xs font-medium text-accent">
                                · {t("admin.announcements.priorityHigh")}
                              </span>
                            ) : null}
                          </td>
                          <td className={platformUi.tableTd}>
                            <div className="flex flex-wrap gap-1">
                              {row.channels.map((ch) => (
                                <span
                                  key={ch}
                                  className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] text-muted-foreground"
                                >
                                  {channelLabel(ch, t)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className={platformUi.tableTd}>
                            <span className="text-sm tabular-nums text-foreground">
                              {row.recipientCount > 0
                                ? t("admin.announcements.statusDelivered", { count: row.recipientCount })
                                : t("admin.announcements.statusNoRecipients")}
                            </span>
                            <p className="mt-0.5 text-xs text-muted-foreground">{row.createdByEmail}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-3 p-4 lg:hidden">
                  {history.map((row) => (
                    <article
                      key={row.id}
                      className="rounded-xl border border-border bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-foreground">{row.title}</p>
                        <time className="shrink-0 text-xs text-muted-foreground">
                          {formatSentAt(row.createdAt)}
                        </time>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{row.message}</p>
                      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <dt className="text-muted-foreground">{t("admin.announcements.colAudience")}</dt>
                          <dd className="font-medium text-foreground">{audienceLabel(row.audience, t)}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">{t("admin.announcements.colStatus")}</dt>
                          <dd className="font-medium text-foreground">
                            {row.recipientCount > 0
                              ? t("admin.announcements.statusDelivered", { count: row.recipientCount })
                              : t("admin.announcements.statusNoRecipients")}
                          </dd>
                        </div>
                      </dl>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {row.channels.map((ch) => (
                          <span
                            key={ch}
                            className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] text-muted-foreground"
                          >
                            {channelLabel(ch, t)}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
                <p className={platformUi.panelFooter}>
                  {t("admin.announcements.historyFooter", { shown: history.length, total: historyTotal })}
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </PlatformPage>
  );
}
