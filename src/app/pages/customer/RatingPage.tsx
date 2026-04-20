import { motion } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { HeartHandshake, MessageSquare, Send, LogOut, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";
import { useTipFlow } from "../../context/TipFlowContext";
import { ProfileAvatar } from "../../components/ui/profile-avatar";
import { getTipSessionContext, submitTipFeedback, type TipSessionContextResponse } from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { DEV_BYPASS_ENABLED, DEV_MOCK } from "../../lib/devCustomerBypass";
import { clearCustomerFlowEntry, markCustomerFlowEntered } from "../../lib/customerFlowGuard";

export function RatingPage() {
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

  const tags = useMemo(
    () => ["Excellent service", "Very friendly", "Fast and professional", "Attentive", "Great vibe", "Above and beyond"],
    []
  );

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
      toast.success("DEV: feedback captured locally");
      leaveFlow();
      return;
    }
    if (!sessionId) {
      toast.error("Missing payment session. You can close this page safely.");
      leaveFlow();
      return;
    }
    if (rating <= 0 && comment.trim().length === 0 && selectedTags.length === 0) {
      toast.message("Feedback is optional", {
        description: "Tap a rating or add a quick note, or press Leave page.",
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
      toast.success("Thanks for the feedback!");
      leaveFlow();
    } catch (err) {
      logClientError("RatingPage.submitTipFeedback", err);
      toast.error(toUserFriendlyMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Dashboard-style top bar */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-md mx-auto px-4 py-4 relative lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl lg:px-8 xl:px-10 2xl:px-12">
          <button
            type="button"
            onClick={leaveFlow}
            className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            aria-label="Leave page"
          >
            <LogOut className="w-3.5 h-3.5" />
            Leave page
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/20">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-foreground">
                Thank you for your tip <span aria-hidden>💛</span>
              </h1>
              <p className="text-xs text-muted-foreground">How was your experience today?</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6 lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl lg:px-8 xl:px-10 2xl:px-12 lg:space-y-8">
        {/* Context card (dashboard style) */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="rounded-xl border border-border bg-card p-5 shadow-sm lg:p-6"
        >
          <div className="flex items-center gap-3">
            <ProfileAvatar
              src={tipContext?.employee?.avatar ?? employeeAvatar}
              displayName={tipContext?.employee?.name ?? employeeName ?? "Team Member"}
              className="h-12 w-12"
            />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">You tipped</p>
              <p className="truncate text-sm font-semibold text-foreground">
                {tipContext?.employee?.name ?? employeeName ?? "a team member"}
              </p>
            </div>
            {!sessionReady && sessionId ? (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Verifying…
              </span>
            ) : null}
          </div>
        </motion.div>

        {!sessionId ? (
          <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
            This feedback page needs a payment session id. You can close this page safely.
          </div>
        ) : null}

        {/* Rating */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-6 shadow-sm lg:p-7"
        >
          <div>
            <h2 className="text-sm font-semibold text-foreground">Tap to rate</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Optional feedback for the staff member.
            </p>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-110"
                type="button"
                aria-label={`Rate ${star} out of 5`}
              >
                <Star
                  className={[
                    "h-10 w-10 transition-colors",
                    star <= rating
                      ? "text-accent fill-accent"
                      : "text-muted-foreground",
                  ].join(" ")}
                />
              </button>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {rating === 0
              ? "Quick tap, takes 2 seconds."
              : rating === 5
                ? "Amazing — thank you!"
                : rating === 4
                  ? "Great — thanks!"
                  : rating === 3
                    ? "Thanks — appreciated."
                    : rating === 2
                      ? "Thanks — we’ll improve."
                      : "Thanks — we’ll do better."}
          </p>
        </motion.div>

        {/* Quick compliments */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-card rounded-xl border border-border p-6 shadow-sm lg:p-7"
        >
          <h2 className="text-sm font-semibold text-foreground mb-3">Quick compliments (optional)</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={[
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors ring-1",
                  selectedTags.includes(tag)
                    ? "bg-accent text-white ring-accent/30"
                    : "bg-background text-foreground ring-border hover:bg-muted/60",
                ].join(" ")}
                type="button"
              >
                {tag}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Optional note */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-card rounded-xl border border-border p-6 shadow-sm lg:p-7"
        >
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Optional note</h2>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Short note (optional)…"
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
          />
          <div className="mt-3">
            <label className="text-xs font-semibold text-muted-foreground">Your name (optional)</label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Alex"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
        </motion.div>

        <div className="bg-muted/40 rounded-lg p-4">
          <p className="text-xs text-muted-foreground">
            Your feedback is optional and helps the team improve.
          </p>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4"
      >
        <div className="max-w-md mx-auto space-y-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-accent text-white rounded-xl py-4 font-semibold text-lg hover:bg-accent/90 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            type="button"
          >
            <Send className="w-5 h-5" />
            Submit feedback
          </button>
          <button
            onClick={leaveFlow}
            className="w-full text-muted-foreground text-sm hover:text-foreground transition-colors"
            type="button"
          >
            Leave page
          </button>
        </div>
      </motion.div>
    </div>
  );
}
