import { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import {
  verifyWebhookSignature,
  handleSuccessfulTipPayment,
  handlePaymentSuccess,
  handlePaymentFailed,
} from "../services/stripe.service.js";
import {
  isStripeWebhookEventProcessed,
  markStripeWebhookEventProcessed,
} from "../services/stripeWebhookIdempotency.service.js";
import { logServerError } from "../utils/httpErrors.js";

/**
 * POST /api/webhooks/stripe (mounted at /api/webhooks + /stripe)
 * Raw body required — registered in index.ts with express.raw({ type: "application/json" }).
 */
const router = Router();

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
    if (await isStripeWebhookEventProcessed(event.id)) {
      console.info("[stripe.webhook] duplicate event skipped", { eventId: event.id, type: event.type });
      return res.json({ received: true, duplicate: true });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("stripe.webhook: checkout.session.completed → handleSuccessfulTipPayment", {
        eventId: event.id,
        sessionId: session.id,
      });
      await handleSuccessfulTipPayment(session);
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
  } catch (err) {
    logServerError("stripe.webhook.handler", err, {
      phase: "event_handler",
      eventType: event.type,
      eventId: event.id,
    });
    return res.status(500).json({ received: false });
  }

  await markStripeWebhookEventProcessed(event.id, event.type);
  res.json({ received: true });
});

export default router;
