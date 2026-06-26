import { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import {
  verifyWebhookSignature,
  handleSuccessfulTipPayment,
  handlePaymentSuccess,
  handlePaymentFailed,
} from "../services/stripe.service.js";
import {
  handleStripeBillingWebhookEvent,
  isStripeBillingEventType,
  isSubscriptionCheckoutSession,
} from "../services/stripeBillingWebhook.service.js";
import {
  isStripeWebhookEventProcessed,
  markStripeWebhookEventProcessed,
} from "../services/stripeWebhookIdempotency.service.js";
import { recordCheckoutSessionExpired } from "../services/checkoutFunnelMetrics.service.js";
import { logTrialSync } from "../lib/subscription/trialSyncDebugLog.js";
import { logServerError } from "../utils/httpErrors.js";

/**
 * POST /api/webhooks/stripe (mounted at /api/webhooks + /stripe)
 * Raw body required — registered in index.ts with express.raw({ type: "application/json" }).
 */
const router = Router();

const TIP_EVENT_TYPES = new Set([
  "checkout.session.expired",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
]);

router.post("/stripe", async (req: Request, res: Response) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers["stripe-signature"];

  if (!sig || !webhookSecret) {
    return res.status(400).send("Webhook secret or signature missing");
  }

  let event: Stripe.Event;
  try {
    event = verifyWebhookSignature(req.body as Buffer, sig);
  } catch (err) {
    logServerError("stripe.webhook.verify", err, { phase: "signature_verify" });
    return res.status(400).send("Webhook signature verification failed");
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (isSubscriptionCheckoutSession(session)) {
        logTrialSync("webhook.stripe_router.billing_checkout", {
          stripeEventId: event.id,
          sessionId: session.id,
          mode: session.mode,
        });
        const billingResult = await handleStripeBillingWebhookEvent(event);
        return res.json(billingResult);
      }
    }

    if (isStripeBillingEventType(event.type)) {
      const billingResult = await handleStripeBillingWebhookEvent(event);
      return res.json(billingResult);
    }

    if (await isStripeWebhookEventProcessed(event.id)) {
      console.info("[stripe.webhook] duplicate event skipped", { eventId: event.id, type: event.type });
      return res.json({ received: true, duplicate: true });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("stripe.webhook: checkout.session.completed → handleSuccessfulTipPayment", {
        eventId: event.id,
        sessionId: session.id,
        mode: session.mode,
      });
      await handleSuccessfulTipPayment(session);
    }
    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.info("[stripe.webhook] checkout.session.expired", {
        eventId: event.id,
        sessionId: session.id,
        paymentStatus: session.payment_status ?? null,
      });
      recordCheckoutSessionExpired(session);
    }
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSuccess(paymentIntent.id);
    }
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailed(paymentIntent.id);
    }
    if (event.type === "payment_intent.canceled") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailed(paymentIntent.id);
    }

    if (TIP_EVENT_TYPES.has(event.type) || event.type === "checkout.session.completed") {
      await markStripeWebhookEventProcessed(event.id, event.type);
    }
  } catch (err) {
    logServerError("stripe.webhook.handler", err, {
      phase: "event_handler",
      eventType: event.type,
      eventId: event.id,
    });
    return res.status(500).json({ received: false });
  }

  res.json({ received: true });
});

export default router;
