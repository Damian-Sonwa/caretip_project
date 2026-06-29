/**
 * Simulate checkout.session.completed handler logic for a known session.
 */
import "../src/loadEnv.js";
import { getStripeClient } from "../src/services/stripe.service.js";
import {
  buildMirrorSnapshotFromStripeSubscription,
  createInitialSubscriptionMirrorFromStripe,
  findSubscriptionForStripeBilling,
} from "../src/services/subscription.service.js";
import { STRIPE_BILLING_AUDIT_TYPES } from "../src/lib/subscription/subscriptionAuditTypes.js";
import { isSubscriptionMirrorEntitled } from "../src/lib/subscription/subscriptionMirrorEntitlement.js";

const SESSION_ID = "cs_test_a1wMLSl2Yv9iaaQgrO9V6OWQMlrUhXoE4SRNkcD09QWFwcQPY4Fez08qUs";

function subscriptionIdFromStripeObject(
  sub: string | { id: string } | null | undefined,
): string | null {
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

async function main() {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(SESSION_ID);
  const md = session.metadata ?? {};
  const caretipBusinessId = md.caretipBusinessId ?? null;
  const stripeSubId = subscriptionIdFromStripeObject(session.subscription);

  console.log("Simulating webhook handler preconditions:");
  console.log("  caretipBusinessId:", caretipBusinessId);
  console.log("  stripeSubId:", stripeSubId);
  console.log("  session.subscription raw:", session.subscription);

  const row = await findSubscriptionForStripeBilling({
    stripeSubscriptionId: stripeSubId,
    stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
    caretipBusinessId,
    caretipSubscriptionId: md.caretipSubscriptionId ?? null,
  });
  console.log("  existing row:", row);

  const wouldCreate = !row && caretipBusinessId && stripeSubId;
  console.log("  would enter create path:", wouldCreate);

  if (!wouldCreate) {
    console.log("  => Would record IGNORED subscription_row_not_found");
    return;
  }

  const sub = await stripe.subscriptions.retrieve(stripeSubId!);
  console.log("  subscription.status:", sub.status);
  console.log("  subscription.metadata:", sub.metadata);

  const snapshot = buildMirrorSnapshotFromStripeSubscription(sub);
  console.log("  snapshot:", {
    planKey: snapshot.planKey,
    status: snapshot.status,
    isTrial: snapshot.isTrial,
  });
  console.log("  isSubscriptionMirrorEntitled:", isSubscriptionMirrorEntitled(snapshot));

  if (!sub.metadata?.caretipBusinessId) {
    console.log("  => lifecycle handler would IGNORE (no caretipBusinessId on subscription metadata)");
    return;
  }

  console.log("  => Would call createInitialSubscriptionMirrorFromStripe (dry-run — not executing)");
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
