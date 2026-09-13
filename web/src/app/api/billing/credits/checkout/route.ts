import { NextResponse, type NextRequest } from "next/server";
import { getUser, readSession, setUserBilling } from "@/lib/auth/session";
import { BILLING_UNCONFIGURED, getStripe, priceIdForCreditPack, stripeConfigured } from "@/lib/billing/stripe";
import { CREDIT_PACKS, isCreditPackId } from "@/lib/billing/plan-display";

/**
 * Start a one-time Stripe Checkout for a credit pack. Signed-in only, same
 * as the subscription checkout route — a credit pack is meaningless
 * without an account to attach the balance to.
 */
export async function POST(request: NextRequest) {
  if (!stripeConfigured()) return NextResponse.json({ error: BILLING_UNCONFIGURED }, { status: 503 });

  const session = await readSession(request.cookies);
  if (!session) return NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { pack?: unknown } | null;
  if (!isCreditPackId(body?.pack)) return NextResponse.json({ error: "Unknown credit pack." }, { status: 400 });
  const pack = body.pack;
  const priceId = priceIdForCreditPack(pack);
  if (!priceId) return NextResponse.json({ error: "Credit packs aren't configured on this deployment." }, { status: 503 });

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
      mode: "payment",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/tools?credits=1`,
      cancel_url: `${origin}/pricing`,
      client_reference_id: user.uid,
      metadata: { uid: user.uid, pack, credits: String(CREDIT_PACKS[pack].credits) },
    });

    if (!checkoutSession.url) return NextResponse.json({ error: "Stripe didn't return a checkout URL." }, { status: 502 });
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[billing/credits/checkout]", error);
    return NextResponse.json({ error: "Couldn't start checkout. Try again in a moment." }, { status: 502 });
  }
}
