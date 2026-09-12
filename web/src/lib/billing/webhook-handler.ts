import type Stripe from "stripe";
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { getUser, getUserByStripeCustomerId, setUserBilling, type SubscriptionStatus } from "@/lib/auth/session";

/**
 * Pure event → store-update mapping, separated from the route so it's
 * testable without constructing signed webhook payloads.
 *
 * Idempotency is a plain KV existence check (not a Redis SET NX), so it's
 * not airtight under a race between two near-simultaneous retries of the
 * same event — acceptable here because every handled event is an upsert of
 * the same subscription fields, not a one-shot side effect (no email sent,
 * nothing charged twice). A strict compare-and-set would need a store
 * primitive this KeyValueStore doesn't expose yet.
 */
const PROCESSED_TTL_SECONDS = 3 * 24 * 60 * 60;

export async function alreadyProcessed(eventId: string, store: KeyValueStore): Promise<boolean> {
  return Boolean(await store.get(`stripe:evt:${eventId}`));
}

export async function markProcessed(eventId: string, store: KeyValueStore): Promise<void> {
  await store.set(`stripe:evt:${eventId}`, "1", PROCESSED_TTL_SECONDS);
}

function subscriptionFields(subscription: Stripe.Subscription): {
  stripeSubscriptionId: string;
  subscriptionStatus: SubscriptionStatus;
  planInterval: "month" | "year";
  proCurrentPeriodEnd: string;
} {
  // `current_period_end` moved from the subscription root to each item in
  // recent Stripe API versions; a subscription has exactly one item here.
  const item = subscription.items.data[0];
  const interval = item?.price.recurring?.interval === "year" ? "year" : "month";
  const periodEndSec = item?.current_period_end ?? Math.floor(Date.now() / 1000);
  return {
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status as SubscriptionStatus,
    planInterval: interval,
    proCurrentPeriodEnd: new Date(periodEndSec * 1000).toISOString(),
  };
}

async function resolveUid(customerId: string, metadataUid: string | null | undefined, store: KeyValueStore): Promise<string | null> {
  if (metadataUid) {
    const byMetadata = await getUser(metadataUid, store);
    if (byMetadata) return byMetadata.uid;
  }
  const byCustomer = await getUserByStripeCustomerId(customerId, store);
  return byCustomer?.uid ?? null;
}

async function applySubscription(subscription: Stripe.Subscription, store: KeyValueStore): Promise<void> {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const uid = await resolveUid(customerId, subscription.metadata?.uid, store);
  if (!uid) {
    console.warn(`[billing/webhook] subscription ${subscription.id} has no matching account (customer ${customerId})`);
    return;
  }
  await setUserBilling(uid, { stripeCustomerId: customerId, ...subscriptionFields(subscription) }, store);
}

export async function applyStripeEvent(event: Stripe.Event, store: KeyValueStore = getStore()): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription" || !session.customer || !session.subscription) return;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer.id;
      const uid = await resolveUid(customerId, session.metadata?.uid ?? session.client_reference_id, store);
      if (uid) await setUserBilling(uid, { stripeCustomerId: customerId }, store);
      // The subscription's own created/updated event carries status and period end; nothing else to do here.
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await applySubscription(event.data.object as Stripe.Subscription, store);
      return;
    }
    default:
      return;
  }
}
