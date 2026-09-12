import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/ai/store";
import { getStripe, stripeConfigured, webhookSecret } from "@/lib/billing/stripe";
import { alreadyProcessed, applyStripeEvent, markProcessed } from "@/lib/billing/webhook-handler";

// Stripe's SDK verifies signatures with Node's crypto module.
export const runtime = "nodejs";

/** Stripe subscription lifecycle events — checkout completion, renewals, cancellations. */
export async function POST(request: NextRequest) {
  if (!stripeConfigured()) return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  const secret = webhookSecret();
  const stripe = getStripe();
  if (!secret || !stripe) return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });

  const payload = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.warn("[billing/webhook] signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const store = getStore();
  if (await alreadyProcessed(event.id, store)) return NextResponse.json({ received: true, duplicate: true });

  try {
    await applyStripeEvent(event, store);
    await markProcessed(event.id, store);
  } catch (error) {
    console.error(`[billing/webhook] failed to apply ${event.type}`, error);
    return NextResponse.json({ error: "Failed to process event." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
