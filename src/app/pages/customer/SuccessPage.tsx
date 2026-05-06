import { motion } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { Check, Star, Home, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useTipFlow } from "../../context/TipFlowContext";
import { getTipSessionContext } from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { promotePendingTipToRepeatTip } from "../../lib/repeatTip";
import { clearCustomerFlowEntry, markCustomerFlowEntered } from "../../lib/customerFlowGuard";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { formatEur } from "../../lib/formatEur";

export function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { amount, employeeName, reset } = useTipFlow();
  const [verified, setVerified] = useState(false);

  const sessionId = searchParams.get("session_id")?.trim() ?? "";

  const tipAmount = amount ?? 15.3;

  const goToRating = () => {
    if (!sessionId) {
      navigate("/", { replace: true });
      return;
    }
    navigate(`/rating?session_id=${encodeURIComponent(sessionId)}`);
  };

  const leavePage = () => {
    clearCustomerFlowEntry();
    reset();
    navigate("/", { replace: true });
  };

  // Production guard: /success should only render after verified successful payment.
  useEffect(() => {
    if (import.meta.env.DEV) {
      setVerified(true);
      return;
    }
    if (!sessionId) {
      navigate("/", { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const ctx = await getTipSessionContext(sessionId);
        if (cancelled) return;
        if (ctx.status === "ready") {
          markCustomerFlowEntered();
          // Promote the last checkout into repeat-tip storage (client-side only).
          promotePendingTipToRepeatTip({
            sessionId,
            verifiedBusinessId: ctx.businessId,
            verifiedEmployee: ctx.employee ? { id: ctx.employee.id, name: ctx.employee.name } : null,
          });
          setVerified(true);
          return;
        }
        navigate("/", { replace: true });
      } catch (err) {
        if (cancelled) return;
        logClientError("SuccessPage.verify", err);
        toast.error(toUserFriendlyMessage(err));
        navigate("/", { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, sessionId]);

  if (!verified) {
    return <CareTipPageLoader variant="wait" message="Validating payment…" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-12">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 20,
            delay: 0.2 
          }}
          className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center shadow-xl"
        >
          <Check className="w-12 h-12 text-white" strokeWidth={3} />
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Tip Sent Successfully!
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            Thank you for your generosity
          </p>
          <p className="text-4xl font-bold text-accent">
            €{tipAmount.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Your tip has been sent to {employeeName ?? "the team member"}
          </p>
        </motion.div>

        {/* Receipt Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-xl border border-border p-6 mb-6"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Receipt</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Transaction ID</span>
              <span className="text-sm font-mono text-foreground">#TIP-2024-1247</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Date & Time</span>
              <span className="text-sm text-foreground">Mar 23, 2026 • 7:45 PM</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment Method</span>
              <span className="text-sm text-foreground">Apple Pay •••• 4242</span>
            </div>
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="font-semibold text-foreground">Tip Amount</span>
              <span className="text-lg font-bold text-foreground">{formatEur(tipAmount)}</span>
            </div>
          </div>
        </motion.div>

        {/* Rating Section - button links to full rating page */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={goToRating}
          className="w-full bg-accent/10 border-2 border-accent/30 text-accent rounded-xl p-4 font-semibold hover:bg-accent/20 transition-all flex items-center justify-center gap-2 mb-4"
        >
          <Star className="w-5 h-5" />
          Leave optional feedback
        </motion.button>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="space-y-3"
        >
          <button
            type="button"
            onClick={leavePage}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary-hover"
          >
            <LogOut className="w-5 h-5" />
            Leave page
          </button>
          <p className="text-center">
            <button
              type="button"
              onClick={leavePage}
              className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline inline-flex items-center gap-1"
            >
              <Home className="w-4 h-4" />
              Back to home
            </button>
          </p>
        </motion.div>

        {/* Footer Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center text-xs text-muted-foreground mt-8"
        >
          A receipt has been sent to your email
        </motion.p>
      </div>
    </div>
  );
}
