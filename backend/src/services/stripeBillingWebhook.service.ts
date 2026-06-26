import {
  SubscriptionEventProcessingResult,
  SubscriptionStatus,
} from "@prisma/client";
import type Stripe from "stripe";
import { isSubscriptionBillingEnabled } from "../config/featureFlags.js";
import { BILLING_CHECKOUT_METADATA_KEYS, STRIPE_BILLING_AUDIT_TYPES } from "../lib/subscription/subscriptionAuditTypes.js";
import { mapStripeSubscriptionStatus } from "../lib/subscription/mapStripeSubscriptionStatus.js";
import { getStripeClient } from "./stripe.service.js";
import { prisma } from "../prisma.js";
import {
  applyStripeMirrorTransactional,
  buildMirrorSnapshotFromStripeSubscription,
  createSubscriptionAuditEventData,
  findSubscriptionForStripeBilling,
} from "./subscription.service.js";
import {
  activateSubscriptionMirrorFromStripeSubscription,
  clearRetryableIgnoredBillingWebhook,
} from "./subscriptionActivation.service.js";
import { logTrialSync } from "../lib/subscription/trialSyncDebugLog.js";

const BILLING_EVENT_TYPES = new Set<string>([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
]);

export function isStripeBillingEventType(eventType: string): boolean {
  return BILLING_EVENT_TYPES.has(eventType);
}

export function isSubscriptionCheckoutSession(session: Stripe.Checkout.Session): boolean {
  return session.mode === "subscription";
}

async function isBillingWebhookDuplicate(stripeEventId: string): Promise<boolean> {
  const row = await prisma.subscriptionEvent.findUnique({
    where: { stripeEventId },
    select: { id: true, processingResult: true, payload: true },
  });
  if (!row) return false;

  const payload = row.payload as { reason?: string } | null;
  if (
    row.processingResult === SubscriptionEventProcessingResult.ignored &&
    payload?.reason === "subscription_row_not_found"
  ) {
    await clearRetryableIgnoredBillingWebhook(stripeEventId);
    return false;
  }

  return true;
}

async function recordIgnoredBillingEvent(params: {
  stripeEventId: string;
  auditType: string;
  payload: Record<string, unknown>;
  subscriptionId?: string | null;
}): Promise<void> {
  try {
    await prisma.subscriptionEvent.create({
      data: {
        subscriptionId: params.subscriptionId ?? null,
        ...createSubscriptionAuditEventData({
          auditType: params.auditType as (typeof STRIPE_BILLING_AUDIT_TYPES)[keyof typeof STRIPE_BILLING_AUDIT_TYPES],
          payload: params.payload,
          stripeEventId: params.stripeEventId,
          processingResult: SubscriptionEventProcessingResult.ignored,
        }),
      },
    });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "P2002") return;
    throw err;
  }
}

async function recordFailedBillingEvent(params: {
  stripeEventId: string;
  auditType: string;
  payload: Record<string, unknown>;
  error: unknown;
  subscriptionId?: string | null;
}): Promise<void> {
  const message = params.error instanceof Error ? params.error.message : String(params.error);
  try {
    await prisma.subscriptionEvent.create({
      data: {
        subscriptionId: params.subscriptionId ?? null,
        ...createSubscriptionAuditEventData({
          auditType: params.auditType as (typeof STRIPE_BILLING_AUDIT_TYPES)[keyof typeof STRIPE_BILLING_AUDIT_TYPES],
          payload: { ...params.payload, error: message },
          stripeEventId: params.stripeEventId,
          processingResult: SubscriptionEventProcessingResult.failed,
          processingError: message,
        }),
      },
    });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "P2002") return;
  }
}

function subscriptionIdFromStripeObject(
  sub: string | Stripe.Subscription | null | undefined,
): string | null {
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

function customerIdFromStripeObject(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined,
): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id ?? null;
}

function metadataLookup(md: Stripe.Metadata | null | undefined) {
  return {
    caretipBusinessId: md?.[BILLING_CHECKOUT_METADATA_KEYS.businessId] ?? null,
    caretipSubscriptionId: md?.[BILLING_CHECKOUT_METADATA_KEYS.subscriptionId] ?? null,
    caretipPlanKey: md?.[BILLING_CHECKOUT_METADATA_KEYS.planKey] ?? null,
  };
}

async function resolveSubscriptionRow(sub: Stripe.Subscription) {
  const md = sub.metadata ?? {};
  const meta = metadataLookup(md);
  return findSubscriptionForStripeBilling({
    stripeSubscriptionId: sub.id,
    stripeCustomerId: customerIdFromStripeObject(sub.customer),
    caretipBusinessId: meta.caretipBusinessId,
    caretipSubscriptionId: meta.caretipSubscriptionId,
  });
}

async function handleSubscriptionLifecycleEvent(
  event: Stripe.Event,
  sub: Stripe.Subscription,
  auditType: (typeof STRIPE_BILLING_AUDIT_TYPES)[keyof typeof STRIPE_BILLING_AUDIT_TYPES],
  source:
    | "webhook_subscription_created"
    | "webhook_subscription_updated"
    | "webhook_subscription_deleted",
): Promise<void> {
  const meta = metadataLookup(sub.metadata);
  const businessId = meta.caretipBusinessId;
  if (!businessId) {
    logTrialSync("webhook.subscription_lifecycle.stop", {
      source,
      outcome: "ignored",
      reason: "missing_caretipBusinessId_on_subscription",
      stripeSubscriptionId: sub.id,
      stripeEventId: event.id,
    });
    await recordIgnoredBillingEvent({
      stripeEventId: event.id,
      auditType,
      payload: { reason: "subscription_row_not_found", stripeSubscriptionId: sub.id },
    });
    return;
  }

  const outcome = await activateSubscriptionMirrorFromStripeSubscription({
    businessId,
    sub,
    auditType,
    stripeEventId: event.id,
    source,
  });

  if (outcome === "ignored") {
    await recordIgnoredBillingEvent({
      stripeEventId: event.id,
      auditType,
      payload: { reason: "activation_ignored", stripeSubscriptionId: sub.id, source },
    });
  }
}

async function handleInvoicePaymentSucceeded(event: Stripe.Event, invoice: Stripe.Invoice): Promise<void> {
  const subId = subscriptionIdFromStripeObject(invoice.subscription);
  if (!subId) {
    await recordIgnoredBillingEvent({
      stripeEventId: event.id,
      auditType: STRIPE_BILLING_AUDIT_TYPES.invoicePaymentSucceeded,
      payload: { reason: "no_subscription_on_invoice", invoiceId: invoice.id },
    });
    return;
  }

  const stripe = getStripeClient();
  const sub = await stripe.subscriptions.retrieve(subId);
  const row = await resolveSubscriptionRow(sub);
  if (!row) {
    await recordIgnoredBillingEvent({
      stripeEventId: event.id,
      auditType: STRIPE_BILLING_AUDIT_TYPES.invoicePaymentSucceeded,
      payload: { reason: "subscription_row_not_found", stripeSubscriptionId: subId },
    });
    return;
  }

  const snapshot = buildMirrorSnapshotFromStripeSubscription(sub);
  if (snapshot.status !== SubscriptionStatus.active && snapshot.status !== SubscriptionStatus.trialing) {
    snapshot.status = SubscriptionStatus.active;
  }

  await applyStripeMirrorTransactional({
    subscriptionRowId: row.id,
    businessId: row.businessId,
    snapshot,
    auditType: STRIPE_BILLING_AUDIT_TYPES.invoicePaymentSucceeded,
    stripeEventId: event.id,
    auditPayload: {
      invoiceId: invoice.id,
      amountPaid: invoice.amount_paid,
      stripeSubscriptionId: subId,
    },
  });
}

async function handleInvoicePaymentFailed(event: Stripe.Event, invoice: Stripe.Invoice): Promise<void> {
  const subId = subscriptionIdFromStripeObject(invoice.subscription);
  if (!subId) {
    await recordIgnoredBillingEvent({
      stripeEventId: event.id,
      auditType: STRIPE_BILLING_AUDIT_TYPES.invoicePaymentFailed,
      payload: { reason: "no_subscription_on_invoice", invoiceId: invoice.id },
    });
    return;
  }

  const stripe = getStripeClient();
  const sub = await stripe.subscriptions.retrieve(subId);
  const row = await resolveSubscriptionRow(sub);
  if (!row) {
    await recordIgnoredBillingEvent({
      stripeEventId: event.id,
      auditType: STRIPE_BILLING_AUDIT_TYPES.invoicePaymentFailed,
      payload: { reason: "subscription_row_not_found", stripeSubscriptionId: subId },
    });
    return;
  }

  const snapshot = buildMirrorSnapshotFromStripeSubscription(sub);
  const mapped = mapStripeSubscriptionStatus(sub.status);
  snapshot.status = mapped.status;

  await applyStripeMirrorTransactional({
    subscriptionRowId: row.id,
    businessId: row.businessId,
    snapshot,
    auditType: STRIPE_BILLING_AUDIT_TYPES.invoicePaymentFailed,
    stripeEventId: event.id,
    auditPayload: {
      invoiceId: invoice.id,
      attemptCount: invoice.attempt_count,
      stripeSubscriptionId: subId,
      status: snapshot.status,
    },
  });
}

async function handleSubscriptionCheckoutCompleted(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const md = session.metadata ?? {};
  const meta = metadataLookup(md);
  const stripeSubId = subscriptionIdFromStripeObject(session.subscription);

  logTrialSync("webhook.checkout_completed.start", {
    stripeEventId: event.id,
    sessionId: session.id,
    stripeSubscriptionId: stripeSubId,
    caretipBusinessId: meta.caretipBusinessId,
    caretipSubscriptionId: meta.caretipSubscriptionId,
    caretipPlanKey: meta.caretipPlanKey,
    mirrorExisted: Boolean(
      await findSubscriptionForStripeBilling({
        stripeSubscriptionId: stripeSubId,
        stripeCustomerId: customerIdFromStripeObject(session.customer),
        caretipBusinessId: meta.caretipBusinessId,
        caretipSubscriptionId: meta.caretipSubscriptionId,
      }),
    ),
  });

  if (!meta.caretipBusinessId) {
    logTrialSync("webhook.checkout_completed.stop", {
      outcome: "ignored",
      reason: "missing_caretipBusinessId_on_session",
      sessionId: session.id,
    });
    await recordIgnoredBillingEvent({
      stripeEventId: event.id,
      auditType: STRIPE_BILLING_AUDIT_TYPES.checkoutSessionCompleted,
      payload: { reason: "missing_caretipBusinessId", sessionId: session.id },
    });
    return;
  }

  if (!stripeSubId) {
    logTrialSync("webhook.checkout_completed.stop", {
      outcome: "ignored",
      reason: "missing_stripe_subscription_on_session",
      sessionId: session.id,
    });
    await recordIgnoredBillingEvent({
      stripeEventId: event.id,
      auditType: STRIPE_BILLING_AUDIT_TYPES.checkoutSessionCompleted,
      payload: { reason: "missing_stripe_subscription", sessionId: session.id },
    });
    return;
  }

  const stripe = getStripeClient();
  const sub = await stripe.subscriptions.retrieve(stripeSubId);
  const outcome = await activateSubscriptionMirrorFromStripeSubscription({
    businessId: meta.caretipBusinessId,
    sub,
    auditType: STRIPE_BILLING_AUDIT_TYPES.checkoutSessionCompleted,
    stripeEventId: event.id,
    source: "webhook_checkout_completed",
  });

  if (outcome === "ignored") {
    await recordIgnoredBillingEvent({
      stripeEventId: event.id,
      auditType: STRIPE_BILLING_AUDIT_TYPES.checkoutSessionCompleted,
      payload: { reason: "activation_ignored", sessionId: session.id, outcome },
    });
  }
}

async function dispatchBillingEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      await handleSubscriptionLifecycleEvent(
        event,
        sub,
        STRIPE_BILLING_AUDIT_TYPES.subscriptionCreated,
        "webhook_subscription_created",
      );
      return;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      await handleSubscriptionLifecycleEvent(
        event,
        sub,
        STRIPE_BILLING_AUDIT_TYPES.subscriptionUpdated,
        "webhook_subscription_updated",
      );
      return;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await handleSubscriptionLifecycleEvent(
        event,
        sub,
        STRIPE_BILLING_AUDIT_TYPES.subscriptionDeleted,
        "webhook_subscription_deleted",
      );
      return;
    }
    case "invoice.payment_succeeded": {
      await handleInvoicePaymentSucceeded(event, event.data.object as Stripe.Invoice);
      return;
    }
    case "invoice.payment_failed": {
      await handleInvoicePaymentFailed(event, event.data.object as Stripe.Invoice);
      return;
    }
    default:
      return;
  }
}

/**
 * Process a Stripe billing webhook event with subscription_events idempotency.
 * Uses processingResult: processed | ignored | failed (no pending enum value).
 */
export async function handleStripeBillingWebhookEvent(
  event: Stripe.Event,
): Promise<{ received: true; duplicate?: boolean; billingDisabled?: boolean }> {
  logTrialSync("webhook.dispatch", { stripeEventId: event.id, type: event.type });

  if (!isSubscriptionBillingEnabled()) {
    logTrialSync("webhook.dispatch.stop", { reason: "billing_disabled" });
    return { received: true, billingDisabled: true };
  }

  if (await isBillingWebhookDuplicate(event.id)) {
    logTrialSync("webhook.dispatch.stop", { reason: "duplicate", stripeEventId: event.id });
    return { received: true, duplicate: true };
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (isSubscriptionCheckoutSession(session)) {
      try {
        await handleSubscriptionCheckoutCompleted(event, session);
      } catch (err) {
        logTrialSync("webhook.checkout_completed.error", {
          stripeEventId: event.id,
          error: err instanceof Error ? err.message : String(err),
        });
        await recordFailedBillingEvent({
          stripeEventId: event.id,
          auditType: STRIPE_BILLING_AUDIT_TYPES.checkoutSessionCompleted,
          payload: { eventType: event.type },
          error: err,
        });
        throw err;
      }
      return { received: true };
    }
  }

  if (!isStripeBillingEventType(event.type)) {
    return { received: true };
  }

  try {
    await dispatchBillingEvent(event);
  } catch (err) {
    await recordFailedBillingEvent({
      stripeEventId: event.id,
      auditType: event.type,
      payload: { eventType: event.type },
      error: err,
    });
    throw err;
  }

  return { received: true };
}
