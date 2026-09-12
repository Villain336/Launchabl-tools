import { NextResponse, type NextRequest } from "next/server";
import { BILLING_UNCONFIGURED, getStripe, priceIdFor, stripeConfigured, type BillingInterval } from "@/lib/billing/stripe";
import { getUser, readSession, setUserBilling } from "@/lib/auth/session";

/**
 * Start a Tools Pro subscription. Signed-in only — the free-run gate on
 * every tool already gets someone an account before they'd ever see this.
 */
export async function POST(request: NextRequest) {
  if (!stripeConfigured()) return NextResponse.json({ error: BILLING_UNCONFIGURED }, { status: 503 });

  const session = await readSession(request.cookies);
  if (!session) return NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { interval?: unknown } | null;
  const interval: BillingInterval = body?.interval === "year" ? "year" : "month";
  const priceId = priceIdFor(interval);
  if (!priceId) return NextResponse.json({ error: "Tools Pro pricing isn't configured on this deployment." }, { status: 503 });

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: BILLING_UNCONFIGURED }, { status: 503 });

  const user = await getUser(session.uid);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  try {
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name ?? undefined, metadata: { uid: user.uid } });
      customerId = customer.id;
      await setUserBilling(user.uid, { stripeCustomerId: customerId });
    }

    const origin = request.nextUrl.origin;
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/tools?upgraded=1`,
      cancel_url: `${origin}/pricing`,
      client_reference_id: user.uid,
      subscription_data: { metadata: { uid: user.uid } },
      metadata: { uid: user.uid },
    });

    if (!checkoutSession.url) return NextResponse.json({ error: "Stripe didn't return a checkout URL." }, { status: 502 });
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[billing/checkout]", error);
    return NextResponse.json({ error: "Couldn't start checkout. Try again in a moment." }, { status: 502 });
  }
}
