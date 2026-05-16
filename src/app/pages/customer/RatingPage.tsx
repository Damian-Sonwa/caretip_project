import { motion } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HeartHandshake, MessageSquare, Send, LogOut, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";
import { useTipFlow } from "../../context/TipFlowContext";
import { ProfileAvatar } from "../../components/ui/profile-avatar";
import { getTipSessionContext, submitTipFeedback, type TipSessionContextResponse } from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { DEV_BYPASS_ENABLED, DEV_MOCK } from "../../lib/devCustomerBypass";
import { clearCustomerFlowEntry, markCustomerFlowEntered } from "../../lib/customerFlowGuard";
import { customerFlowUi as cf } from "./customerFlowUi";

/** Canonical English values sent to the API; labels are translated in the UI. */
const FEEDBACK_TAGS = [
  { key: "excellentService", api: "Excellent service" },
  { key: "veryFriendly", api: "Very friendly" },
  { key: "fastProfessional", api: "Fast and professional" },
  { key: "attentive", api: "Attentive" },
  { key: "greatVibe", api: "Great vibe" },
  { key: "aboveBeyond", api: "Above and beyond" },
] as const;

export function RatingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { businessId, employeeName, employeeAvatar, staffProfileSlug, reset } = useTipFlow();

  const sessionId = searchParams.get("session_id")?.trim() ?? "";
  const isDevMockSession = DEV_BYPASS_ENABLED && (!sessionId || sessionId === DEV_MOCK.sessionId);

  // Guard: don't block valid QR/email deep links just because flow storage isn't present yet.
  useEffect(() => {
    if (import.meta.env.DEV) return;
    if (isDevMockSession) return;
    if (!sessionId) {
      navigate("/", { replace: true });
    }
  }, [isDevMockSession, navigate, sessionId]);

  const [tipContext, setTipContext] = useState<TipSessionContextResponse | null>(null);
  const sessionReady = tipContext?.status === "ready";

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  useEffect(() => {
    if (isDevMockSession) {
      setTipContext({
        status: "ready",
        sessionId: DEV_MOCK.sessionId,
        paymentIntentId: null,
        transactionId: "dev_tx_001",
        employee: { id: DEV_MOCK.employeeId, name: DEV_MOCK.employeeName, avatar: null },
        businessId: DEV_MOCK.businessId,
        locationId: DEV_MOCK.venue.locationId,
        tableId: DEV_MOCK.venue.tableId,
        customerName: "Dev Customer",
      });
      setCustomerName("Dev Customer");
      return;
    }
    if (!sessionId) return;
    let cancelled = false;
    let tries = 0;

    const poll = async () => {
      tries += 1;
      try {
        const ctx = await getTipSessionContext(sessionId);
        if (cancelled) return;
        setTipContext(ctx);
        if (ctx.status === "ready") {
          markCustomerFlowEntered();
          setCustomerName(ctx.customerName ?? "");
          return;
        }
        if (tries < 10) {
          window.setTimeout(poll, 650);
        }
      } catch (err) {
        if (cancelled) return;
        logClientError("RatingPage.getTipSessionContext", err);
        toast.error(toUserFriendlyMessage(err));
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [isDevMockSession, sessionId]);

  const leaveFlow = () => {
    const biz = tipContext?.status === "ready" ? tipContext.businessId : tipContext?.businessId ?? businessId;
    const target = biz && !staffProfileSlug ? `/qr-landing/${biz}` : "/";
    clearCustomerFlowEntry();
    reset();
    navigate(target, { replace: true });
  };

  const handleSubmit = async () => {
    if (isDevMockSession) {
      toast.success(t("tipFlow.rating.devCaptured"));
      leaveFlow();
      return;
    }
    if (!sessionId) {
      toast.error(t("tipFlow.rating.missingSession"));
      leaveFlow();
      return;
    }
    if (rating <= 0 && comment.trim().length === 0 && selectedTags.length === 0) {
      toast.message(t("tipFlow.rating.optionalTitle"), {
        description: t("tipFlow.rating.optionalDesc"),
      });
      return;
    }

    setSubmitting(true);
    try {
      await submitTipFeedback({
        sessionId,
        rating: rating > 0 ? rating : null,
        comment: comment.trim() ? comment.trim() : null,
        tags: selectedTags,
        customerName: customerName.trim() ? customerName.trim() : null,
      });
      toast.success(t("tipFlow.rating.thanksFeedback"));
      leaveFlow();
    } catch (err) {
      logClientError("RatingPage.submitTipFeedback", err);
      toast.error(toUserFriendlyMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className={cf.pageWithBottomCta}>
      <div className={cf.stickyHeader}>
        <div className={`${cf.headerInner} relative`}>
          <button
            type="button"
            onClick={leaveFlow}
            className="absolute right-0 top-1/2 flex min-h-[2.5rem] min-w-[2.5rem] -translate-y-1/2 items-center justify-end gap-1.5 pr-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground sm:right-3"
            aria-label={t("tipFlow.rating.leavePageAria")}
          >
            <LogOut className="size-3.5 shrink-0" aria-hidden />
            <span className="hidden min-[380px]:inline">{t("tipFlow.rating.leavePage")}</span>
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-3 pr-20 sm:pr-28">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/18">
              <HeartHandshake className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className={cf.headline}>{t("tipFlow.rating.thankYouTip")}</h1>
              <p className={cf.subline}>{t("tipFlow.rating.experienceToday")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={cf.main}>
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className={`${cf.card} px-5 py-5 sm:px-6 sm:py-6`}
        >
          <div className="flex items-center gap-3">
            <ProfileAvatar
              src={tipContext?.employee?.avatar ?? employeeAvatar}
              displayName={tipContext?.employee?.name ?? employeeName ?? t("tipFlow.common.teamMember")}
              className="h-12 w-12"
            />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t("tipFlow.rating.youTipped")}</p>
              <p className="truncate text-sm font-semibold text-foreground">
                {tipContext?.employee?.name ?? employeeName ?? t("tipFlow.common.aTeamMember")}
              </p>
            </div>
            {!sessionReady && sessionId ? (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                {t("tipFlow.rating.verifying")}
              </span>
            ) : null}
          </div>
        </motion.div>

        {!sessionId ? (
          <div className={`${cf.cardMuted} px-5 py-5 text-sm leading-relaxed text-muted-foreground sm:px-6`}>
            {t("tipFlow.rating.needsSession")}
          </div>
        ) : null}

        <motion.div
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={`${cf.card} px-5 py-6 sm:px-7 sm:py-7`}
        >
          <div>
            <h2 className={`${cf.cardTitle} text-[0.9375rem]`}>{t("tipFlow.rating.tapToRate")}</h2>
            <p className={`${cf.cardDesc} mt-1 text-xs`}>{t("tipFlow.rating.optionalForStaff")}</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-1 sm:gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={cf.starButton}
                type="button"
                aria-label={t("tipFlow.rating.starAria", { n: star })}
              >
                <Star
                  className={[
                    "size-10 transition-colors sm:size-11",
                    star <= rating
                      ? "fill-primary text-primary"
                      : "text-muted-foreground/65",
                  ].join(" ")}
                />
              </button>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {rating === 0
              ? t("tipFlow.rating.hint0")
              : rating === 5
                ? t("tipFlow.rating.hint5")
                : rating === 4
                  ? t("tipFlow.rating.hint4")
                  : rating === 3
                    ? t("tipFlow.rating.hint3")
                    : rating === 2
                      ? t("tipFlow.rating.hint2")
                      : t("tipFlow.rating.hint1")}
          </p>
        </motion.div>

        {/* Quick compliments */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={`${cf.card} px-5 py-6 sm:px-7 sm:py-7`}
        >
          <h2 className={`${cf.cardTitle} mb-4 text-[0.9375rem]`}>{t("tipFlow.rating.quickCompliments")}</h2>
          <div className="flex flex-wrap gap-2">
            {FEEDBACK_TAGS.map(({ key, api }) => (
              <button
                key={api}
                onClick={() => handleTagToggle(api)}
                className={[
                  "rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ring-1 ring-inset sm:min-h-[2.75rem]",
                  selectedTags.includes(api)
                    ? "bg-primary text-primary-foreground ring-primary/25 shadow-sm"
                    : "bg-background text-foreground ring-border/70 hover:bg-muted/50",
                ].join(" ")}
                type="button"
              >
                {t(`tipFlow.rating.tags.${key}`)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Optional note */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={`${cf.card} px-5 py-6 sm:px-7 sm:py-7`}
        >
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="size-5 shrink-0 text-primary" aria-hidden />
            <h2 className={`${cf.cardTitle} text-[0.9375rem]`}>{t("tipFlow.rating.optionalNote")}</h2>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("tipFlow.rating.notePlaceholder")}
            rows={3}
            className={`${cf.inputField} resize-none leading-relaxed`}
          />
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              {t("tipFlow.rating.yourName")}
            </label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t("tipFlow.rating.namePlaceholder")}
              className={`${cf.inputField} py-2.5 text-sm`}
            />
          </div>
        </motion.div>

        <div className={`${cf.cardMuted} px-5 py-4 sm:px-6`}>
          <p className="text-xs leading-relaxed text-muted-foreground">{t("tipFlow.rating.footerHint")}</p>
        </div>
      </div>

      <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cf.fixedBottomBar}>
        <div className={`${cf.fixedBottomInner} space-y-2`}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={`${cf.btnPrimaryLg} disabled:pointer-events-none disabled:opacity-50`}
          >
            <Send className="size-5 shrink-0" aria-hidden />
            {t("tipFlow.rating.submit")}
          </button>
          <button
            type="button"
            onClick={leaveFlow}
            className="flex min-h-[2.75rem] w-full items-center justify-center rounded-xl text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("tipFlow.rating.leavePage")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
