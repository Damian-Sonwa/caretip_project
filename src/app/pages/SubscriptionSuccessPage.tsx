import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2 } from "lucide-react";
import { clearBusinessProfileClientCache, fetchBillingSyncStatus } from "../lib/api";
import {
  clearCheckoutSyncExpectation,
  getCheckoutSyncExpectation,
} from "../lib/checkoutIntent";
import { clearSubscriptionTierSession } from "../lib/subscriptionSessionCache";

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 45;

type SyncPhase = "polling" | "ready" | "timeout";

export function SubscriptionSuccessPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<SyncPhase>("polling");

  useEffect(() => {
    clearBusinessProfileClientCache();
    clearSubscriptionTierSession();

    const expectedPlan = getCheckoutSyncExpectation();
    let cancelled = false;
    let attempts = 0;

    async function poll(): Promise<void> {
      while (!cancelled && attempts < MAX_ATTEMPTS) {
        attempts += 1;
        try {
          const result = await fetchBillingSyncStatus(expectedPlan ?? undefined);
          if (result.synced) {
            clearCheckoutSyncExpectation();
            clearBusinessProfileClientCache();
            clearSubscriptionTierSession();
            setPhase("ready");
            window.setTimeout(() => {
              if (!cancelled) navigate("/dashboard", { replace: true });
            }, 1200);
            return;
          }
        } catch {
          // keep polling — webhook may still be in flight
        }
        await new Promise((resolve) => window.setTimeout(resolve, POLL_INTERVAL_MS));
      }
      if (!cancelled) setPhase("timeout");
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 text-center shadow-sm">
        {phase === "polling" ? (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" aria-hidden />
            <h1 className="mt-6 text-xl font-semibold text-foreground">
              {t("business.billing.subscriptionSuccess.pollingTitle")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("business.billing.subscriptionSuccess.pollingBody")}
            </p>
          </>
        ) : null}

        {phase === "ready" ? (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden />
            <h1 className="mt-6 text-xl font-semibold text-foreground">
              {t("business.billing.subscriptionSuccess.readyTitle")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("business.billing.subscriptionSuccess.readyBody")}
            </p>
          </>
        ) : null}

        {phase === "timeout" ? (
          <>
            <h1 className="text-xl font-semibold text-foreground">
              {t("business.billing.subscriptionSuccess.timeoutTitle")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("business.billing.subscriptionSuccess.timeoutBody")}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                to="/dashboard"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {t("business.billing.subscriptionSuccess.goToDashboard")}
              </Link>
              <Link
                to="/dashboard/billing/subscription"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted/50"
              >
                {t("business.billing.subscriptionSuccess.viewBilling")}
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
