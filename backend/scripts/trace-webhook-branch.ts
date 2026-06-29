import "../src/loadEnv.js";
import { getStripeClient } from "../src/services/stripe.service.js";
import { findSubscriptionForStripeBilling } from "../src/services/subscription.service.js";
import { BILLING_CHECKOUT_METADATA_KEYS } from "../src/lib/subscription/subscriptionAuditTypes.js";

const EVENT_ID = "evt_1Tmace66w930Tx0Amvoz9L96";

function metadataLookup(md: Record<string, string> | null | undefined) {
  return {
    caretipBusinessId: md?.[BILLING_CHECKOUT_METADATA_KEYS.businessId] ?? null,
    caretipSubscriptionId: md?.[BILLING_CHECKOUT_METADATA_KEYS.subscriptionId] ?? null,
    caretipPlanKey: md?.[BILLING_CHECKOUT_METADATA_KEYS.planKey] ?? null,
  };
}

function subscriptionIdFromStripeObject(
  sub: string | { id: string } | null | undefined,
): string | null {
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

function customerIdFromStripeObject(
  customer: string | { id: string } | null | undefined,
): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

async function main() {
  const stripe = getStripeClient();
  const event = await stripe.events.retrieve(EVENT_ID);
  const session = event.data.object as {
    subscription: string | null;
    customer: string | null;
    metadata: Record<string, string>;
    id: string;
  };

  const meta = metadataLookup(session.metadata);
  const stripeSubId = subscriptionIdFromStripeObject(session.subscription);
  const customerId = customerIdFromStripeObject(session.customer);

  console.log("Branch analysis for", EVENT_ID);
  console.log("meta:", meta);
  console.log("stripeSubId:", stripeSubId);
  console.log("customerId:", customerId);

  const row = await findSubscriptionForStripeBilling({
    stripeSubscriptionId: stripeSubId,
    stripeCustomerId: customerId,
    caretipBusinessId: meta.caretipBusinessId,
    caretipSubscriptionId: meta.caretipSubscriptionId,
  });
  console.log("findSubscriptionForStripeBilling row:", row);

  const createPath = !row && meta.caretipBusinessId && stripeSubId;
  console.log("createPath (!row && businessId && subId):", Boolean(createPath), createPath);

  if (!createPath) {
    console.log("=> Falls through to IGNORED checkout_session_completed");
    if (row) console.log("   reason: row already exists", row);
    if (!meta.caretipBusinessId) console.log("   reason: missing caretipBusinessId");
    if (!stripeSubId) console.log("   reason: missing stripeSubId");
  } else {
    console.log("=> Should enter create path");
  }
}

main().catch(console.error);
