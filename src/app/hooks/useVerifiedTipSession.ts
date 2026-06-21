import { useEffect, useState } from "react";
import { getTipSessionContext, type TipSessionReadyContext } from "../lib/api";
import { logClientError } from "../lib/clientLog";
import { DEV_BYPASS_ENABLED, DEV_MOCK } from "../lib/devCustomerBypass";
import { markCustomerFlowEntered } from "../lib/customerFlowGuard";
import { onVerifiedTipPaymentSession } from "../lib/postPaymentSuccess";

export type VerifiedTipSessionPhase =
  | "loading"
  | "pending"
  | "ready"
  | "expired"
  | "unpaid"
  | "error";

export type VerifiedTipSessionState =
  | { phase: "loading" }
  | { phase: "pending"; sessionId: string }
  | { phase: "ready"; sessionId: string; context: TipSessionReadyContext }
  | { phase: "expired"; sessionId: string }
  | { phase: "unpaid"; sessionId: string }
  | { phase: "error"; sessionId: string; message: string };

type UseVerifiedTipSessionOptions = {
  enabled?: boolean;
  maxPollAttempts?: number;
  pollIntervalMs?: number;
  /** When true and sessionId matches dev mock, skip server verification. */
  allowDevMock?: boolean;
};

const DEFAULT_MAX_POLLS = 24;
const DEFAULT_POLL_MS = 650;

export function useVerifiedTipSession(
  sessionId: string,
  options?: UseVerifiedTipSessionOptions,
): VerifiedTipSessionState {
  const enabled = options?.enabled !== false;
  const maxPollAttempts = options?.maxPollAttempts ?? DEFAULT_MAX_POLLS;
  const pollIntervalMs = options?.pollIntervalMs ?? DEFAULT_POLL_MS;
  const allowDevMock = options?.allowDevMock !== false;
  const isDevMockSession =
    allowDevMock && DEV_BYPASS_ENABLED && sessionId === DEV_MOCK.sessionId;

  const [state, setState] = useState<VerifiedTipSessionState>(() =>
    !sessionId.trim() ? { phase: "error", sessionId: "", message: "missing_session" } : { phase: "loading" },
  );

  useEffect(() => {
    if (!enabled) return;

    const trimmed = sessionId.trim();
    if (!trimmed) {
      setState({ phase: "error", sessionId: "", message: "missing_session" });
      return;
    }

    if (isDevMockSession) {
      const mockContext: TipSessionReadyContext = {
        status: "ready",
        sessionId: DEV_MOCK.sessionId,
        paymentIntentId: null,
        transactionId: "dev_tx_001",
        employee: { id: DEV_MOCK.employeeId, name: DEV_MOCK.employeeName, avatar: null },
        businessId: DEV_MOCK.businessId,
        locationId: DEV_MOCK.venue.locationId,
        tableId: DEV_MOCK.venue.tableId,
        customerName: "Dev Customer",
      };
      markCustomerFlowEntered();
      onVerifiedTipPaymentSession(DEV_MOCK.sessionId, mockContext);
      setState({ phase: "ready", sessionId: trimmed, context: mockContext });
      return;
    }

    let cancelled = false;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const finishReady = (ctx: TipSessionReadyContext) => {
      markCustomerFlowEntered();
      onVerifiedTipPaymentSession(trimmed, ctx);
      setState({ phase: "ready", sessionId: trimmed, context: ctx });
    };

    const poll = async () => {
      tries += 1;
      try {
        const ctx = await getTipSessionContext(trimmed);
        if (cancelled) return;

        if (ctx.status === "ready") {
          finishReady(ctx);
          return;
        }
        if (ctx.status === "expired") {
          setState({ phase: "expired", sessionId: trimmed });
          return;
        }
        if (ctx.status === "unpaid") {
          setState({ phase: "unpaid", sessionId: trimmed });
          return;
        }

        setState({ phase: "pending", sessionId: trimmed });
        if (tries < maxPollAttempts) {
          timer = window.setTimeout(poll, pollIntervalMs);
          return;
        }
        setState({ phase: "unpaid", sessionId: trimmed });
      } catch (err) {
        if (cancelled) return;
        logClientError("useVerifiedTipSession.poll", err, { sessionId: trimmed, try: tries });
        setState({
          phase: "error",
          sessionId: trimmed,
          message: err instanceof Error ? err.message : "verification_failed",
        });
      }
    };

    setState({ phase: "loading" });
    void poll();

    return () => {
      cancelled = true;
      if (timer != null) window.clearTimeout(timer);
    };
  }, [
    enabled,
    isDevMockSession,
    maxPollAttempts,
    pollIntervalMs,
    sessionId,
  ]);

  return state;
}

export function isVerifiedTipSessionReady(
  state: VerifiedTipSessionState,
): state is { phase: "ready"; sessionId: string; context: TipSessionReadyContext } {
  return state.phase === "ready";
}
