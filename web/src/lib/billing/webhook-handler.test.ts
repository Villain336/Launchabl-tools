import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { createMemoryStore } from "@/lib/ai/store";
import { getUser, hasProAccess, setUserBilling, upsertUser } from "@/lib/auth/session";
import { getCreditBalance } from "@/lib/billing/credits";
import { readCreditStats } from "@/lib/ai/usage";
import { alreadyProcessed, applyStripeEvent, markProcessed } from "./webhook-handler";

function subscriptionEvent(
  type: "customer.subscription.created" | "customer.subscription.updated" | "customer.subscription.deleted",
  overrides: Partial<Stripe.Subscription> = {},
): Stripe.Event {
  const subscription: Partial<Stripe.Subscription> = {
    id: "sub_123",
    object: "subscription",
    customer: "cus_123",
    status: "active",
    metadata: { uid: "u1" },
    items: {
      object: "list",
      data: [
        {
          id: "si_1",
          object: "subscription_item",
          current_period_end: 1_800_000_000,
          current_period_start: 1_797_408_000,
          price: { recurring: { interval: "month" } },
        } as unknown as Stripe.SubscriptionItem,
      ],
      has_more: false,
      url: "",
    } as Stripe.ApiList<Stripe.SubscriptionItem>,
    ...overrides,
  };
  return {
    id: `evt_${Math.random().toString(36).slice(2)}`,
    object: "event",
    type,
    data: { object: subscription as Stripe.Subscription },
  } as unknown as Stripe.Event;
}

function checkoutCompletedEvent(overrides: Partial<Stripe.Checkout.Session> = {}): Stripe.Event {
  const session: Partial<Stripe.Checkout.Session> = {
    id: "cs_123",
    object: "checkout.session",
    mode: "subscription",
    customer: "cus_123",
    subscription: "sub_123",
    metadata: { uid: "u1" },
    client_reference_id: "u1",
    ...overrides,
  };
  return {
    id: `evt_${Math.random().toString(36).slice(2)}`,
    object: "event",
    type: "checkout.session.completed",
    data: { object: session as Stripe.Checkout.Session },
  } as unknown as Stripe.Event;
}

describe("applyStripeEvent", () => {
  it("links the customer id to the account on checkout.session.completed", async () => {
    const store = createMemoryStore();
    const { user } = await upsertUser("a@example.com", null, store);
    await applyStripeEvent(checkoutCompletedEvent({ metadata: { uid: user.uid }, client_reference_id: user.uid }), store);
    const updated = await getUser(user.uid, store);
    expect(updated?.stripeCustomerId).toBe("cus_123");
  });

  it("grants pro access on customer.subscription.created and revokes it on deletion", async () => {
    const store = createMemoryStore();
    const { user } = await upsertUser("b@example.com", null, store);
    await setUserBilling(user.uid, { stripeCustomerId: "cus_123" }, store);

    await applyStripeEvent(subscriptionEvent("customer.subscription.created", { metadata: { uid: user.uid } }), store);
    let updated = await getUser(user.uid, store);
    expect(hasProAccess(updated)).toBe(true);
    expect(updated?.subscriptionStatus).toBe("active");
    expect(updated?.planInterval).toBe("month");
    expect(updated?.proCurrentPeriodEnd).toBe(new Date(1_800_000_000 * 1000).toISOString());
    expect(await store.smembers("billing:pro:active")).toContain(user.uid);

    await applyStripeEvent(subscriptionEvent("customer.subscription.deleted", { status: "canceled", metadata: { uid: user.uid } }), store);
    updated = await getUser(user.uid, store);
    expect(hasProAccess(updated)).toBe(false);
    expect(await store.smembers("billing:pro:active")).not.toContain(user.uid);
  });

  it("resolves the account via the stripeCustomer index when the subscription has no metadata uid", async () => {
    const store = createMemoryStore();
    const { user } = await upsertUser("c@example.com", null, store);
    await setUserBilling(user.uid, { stripeCustomerId: "cus_999" }, store);

    await applyStripeEvent(subscriptionEvent("customer.subscription.updated", { customer: "cus_999", metadata: {} }), store);
    const updated = await getUser(user.uid, store);
    expect(hasProAccess(updated)).toBe(true);
  });

  it("does nothing (and doesn't throw) for an unmatched customer", async () => {
    const store = createMemoryStore();
    await expect(applyStripeEvent(subscriptionEvent("customer.subscription.created", { customer: "cus_unknown", metadata: {} }), store)).resolves.toBeUndefined();
  });

  it("ignores payment-mode checkout sessions that aren't a credit-pack purchase", async () => {
    const store = createMemoryStore();
    const { user } = await upsertUser("d@example.com", null, store);
    await applyStripeEvent(checkoutCompletedEvent({ mode: "payment", metadata: { uid: user.uid } }), store);
    const updated = await getUser(user.uid, store);
    expect(updated?.stripeCustomerId).toBeUndefined();
  });
});

describe("applyStripeEvent — credit pack purchases", () => {
  it("grants the pack's credits and links the customer id on a credit-pack checkout", async () => {
    const store = createMemoryStore();
    const { user } = await upsertUser("credits-buyer@example.com", null, store);
    await applyStripeEvent(
      checkoutCompletedEvent({ id: "cs_credits_1", mode: "payment", subscription: null, metadata: { uid: user.uid, pack: "starter" } }),
      store,
    );

    const updated = await getUser(user.uid, store);
    expect(updated?.stripeCustomerId).toBe("cus_123");
    expect(await getCreditBalance(user.uid, store)).toBe(20);

    const stats = await readCreditStats(1, store);
    expect(stats.packsSold).toBe(1);
    expect(stats.creditsPurchased).toBe(20);
  });

  it("ignores an unknown pack id", async () => {
    const store = createMemoryStore();
    const { user } = await upsertUser("credits-unknown@example.com", null, store);
    await applyStripeEvent(
      checkoutCompletedEvent({ id: "cs_credits_2", mode: "payment", subscription: null, metadata: { uid: user.uid, pack: "not-a-real-pack" } }),
      store,
    );
    expect(await getCreditBalance(user.uid, store)).toBe(0);
  });

  it("does nothing (and doesn't throw) for an unmatched customer", async () => {
    const store = createMemoryStore();
    await expect(
      applyStripeEvent(checkoutCompletedEvent({ id: "cs_credits_3", mode: "payment", subscription: null, customer: "cus_unknown", metadata: { pack: "starter" } }), store),
    ).resolves.toBeUndefined();
  });

  it("only grants once even if the same checkout session's event is delivered twice", async () => {
    const store = createMemoryStore();
    const { user } = await upsertUser("credits-dupe@example.com", null, store);
    const session = { id: "cs_credits_4", mode: "payment" as const, subscription: null, metadata: { uid: user.uid, pack: "starter" } };

    // Two separate events (distinct event ids) for the same checkout session id — the
    // event-id idempotency check in the route wouldn't catch this, so applyStripeEvent's
    // own setNx guard (keyed by session id) has to.
    await applyStripeEvent(checkoutCompletedEvent(session), store);
    await applyStripeEvent(checkoutCompletedEvent(session), store);

    expect(await getCreditBalance(user.uid, store)).toBe(20);
    const stats = await readCreditStats(1, store);
    expect(stats.packsSold).toBe(1);
  });
});

describe("webhook idempotency", () => {
  it("tracks processed event ids", async () => {
    const store = createMemoryStore();
    expect(await alreadyProcessed("evt_1", store)).toBe(false);
    await markProcessed("evt_1", store);
    expect(await alreadyProcessed("evt_1", store)).toBe(true);
    expect(await alreadyProcessed("evt_2", store)).toBe(false);
  });
});
