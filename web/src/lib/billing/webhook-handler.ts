import type Stripe from "stripe";
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { getUser, getUserByStripeCustomerId, setUserBilling, type SubscriptionStatus } from "@/lib/auth/session";
import { grantCreditPack } from "@/lib/billing/credits";
import { recordLedgerEntry } from "@/lib/billing/ledger";
import { isCreditPackId } from "@/lib/billing/plan-display";

/**
 * Pure event → store-update mapping, separated from the route so it's
 * testable without constructing signed webhook payloads.
 *
 * Idempotency at the event level (below) is a plain KV existence check, not
 * a Redis SET NX, so it's not airtight under a race between two
 * near-simultaneous retries of the same event — acceptable for subscription
 * fields, since every handled event there is an upsert, not a one-shot side
 * effect. Granting credit packs is a one-shot side effect (double-delivery
 * would double-credit an account), so that path additionally guards on an
 * atomic `store.setNx` keyed by the checkout session id — see the
 * `checkout.session.completed` / `mode === "payment"` branch below.
 *
 * Every branch also dual-writes a row to the Postgres billing ledger
 * (`lib/billing/ledger.ts`, §19.4/§20) alongside its KV write — additive,
 * best-effort, and never able to fail this handler (the ledger module
 * swallows its own errors). KV remains the only thing entitlement checks
 * read; the ledger exists purely for financial reconciliation/audit.
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

async function applySubscription(subscription: Stripe.Subscription, eventId: string, kind: "subscription_created" | "subscription_updated" | "subscription_deleted", store: KeyValueStore): Promise<void> {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const uid = await resolveUid(customerId, subscription.metadata?.uid, store);
  if (!uid) {
    console.warn(`[billing/webhook] subscription ${subscription.id} has no matching account (customer ${customerId})`);
    return;
  }
  const fields = subscriptionFields(subscription);
  await setUserBilling(uid, { stripeCustomerId: customerId, ...fields }, store);
  const item = subscription.items.data[0];
  await recordLedgerEntry({
    stripeEventId: eventId,
    uid,
    kind,
    amountCents: item?.price.unit_amount ?? null,
    currency: item?.price.currency ?? null,
    status: fields.subscriptionStatus,
    raw: { subscriptionId: subscription.id, customerId, priceId: item?.price.id, interval: fields.planInterval },
  });
}

export async function applyStripeEvent(event: Stripe.Event, store: KeyValueStore = getStore()): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!session.customer) return;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer.id;

      if (session.mode === "payment") {
        // Credit pack: the price/quantity live in Stripe, but the pack id is
        // ours (set at checkout creation) — that's what maps back to a
        // credits amount without another Stripe round trip.
        const pack = session.metadata?.pack;
        if (!isCreditPackId(pack)) return;
        const uid = await resolveUid(customerId, session.metadata?.uid ?? session.client_reference_id, store);
        if (!uid) {
          console.warn(`[billing/webhook] credit pack checkout ${session.id} has no matching account (customer ${customerId})`);
          return;
        }
        // Granting credits is a one-shot debit-the-purse action, not an
        // idempotent upsert like the subscription fields below — the
        // event-id check above closes most of the double-delivery window
        // but isn't atomic (see the module docstring), so a real-money path
        // like this one gets its own atomic guard, keyed by checkout
        // session rather than event id in case Stripe ever emits more than
        // one event for the same session.
        const granted = await store.setNx(`stripe:creditgrant:${session.id}`, uid, PROCESSED_TTL_SECONDS);
        if (!granted) return;
        await setUserBilling(uid, { stripeCustomerId: customerId }, store);
        await grantCreditPack(uid, pack, store);
        await recordLedgerEntry({
          stripeEventId: event.id,
          uid,
          kind: "credit_pack_granted",
          amountCents: session.amount_total ?? null,
          currency: session.currency ?? null,
          status: "completed",
          raw: { sessionId: session.id, pack, customerId },
        });
        return;
      }

      if (session.mode !== "subscription" || !session.subscription) return;
      const uid = await resolveUid(customerId, session.metadata?.uid ?? session.client_reference_id, store);
      if (uid) {
        await setUserBilling(uid, { stripeCustomerId: customerId }, store);
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        await recordLedgerEntry({
          stripeEventId: event.id,
          uid,
          kind: "checkout_completed",
          amountCents: session.amount_total ?? null,
          currency: session.currency ?? null,
          status: session.status ?? null,
          raw: { sessionId: session.id, subscriptionId, customerId },
        });
      }
      // The subscription's own created/updated event carries status and period end; nothing else to do here.
      return;
    }
    case "customer.subscription.created":
      await applySubscription(event.data.object as Stripe.Subscription, event.id, "subscription_created", store);
      return;
    case "customer.subscription.updated":
      await applySubscription(event.data.object as Stripe.Subscription, event.id, "subscription_updated", store);
      return;
    case "customer.subscription.deleted": {
      await applySubscription(event.data.object as Stripe.Subscription, event.id, "subscription_deleted", store);
      return;
    }
    default:
      return;
  }
}
