import "../src/loadEnv.js";
import { getStripeClient } from "../src/services/stripe.service.js";

const sessionIds = [
  "cs_test_a1wMLSl2Yv9iaaQgrO9V6OWQMlrUhXoE4SRNkcD09QWFwcQPY4Fez08qUs",
  "cs_test_a19tOHv0FoMr3q5U5KOIl1fnRppUiJnueKPKrILarzSw4UPxlD01IXZtN0",
];

async function main() {
  const stripe = getStripeClient();
  for (const id of sessionIds) {
    const session = await stripe.checkout.sessions.retrieve(id, {
      expand: ["subscription", "customer"],
    });
    console.log("=== session", id, "===");
    console.log("mode:", session.mode);
    console.log("status:", session.status);
    console.log("payment_status:", session.payment_status);
    console.log("customer:", typeof session.customer === "string" ? session.customer : session.customer?.id);
    console.log(
      "subscription:",
      session.subscription == null
        ? null
        : typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription as { id: string; status: string }).id,
    );
    console.log("session.metadata:", JSON.stringify(session.metadata));
    if (session.subscription && typeof session.subscription !== "string") {
      const sub = session.subscription;
      console.log("subscription.status:", sub.status);
      console.log("subscription.metadata:", JSON.stringify(sub.metadata));
    }
    console.log("");
  }
}

main().catch(console.error);
