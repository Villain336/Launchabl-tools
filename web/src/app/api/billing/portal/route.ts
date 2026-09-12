import { NextResponse, type NextRequest } from "next/server";
import { BILLING_UNCONFIGURED, getStripe, stripeConfigured } from "@/lib/billing/stripe";
import { getUser, readSession } from "@/lib/auth/session";

/** Hand a subscriber to Stripe's hosted portal to change plan, update payment, or cancel. */
export async function POST(request: NextRequest) {
  if (!stripeConfigured()) return NextResponse.json({ error: BILLING_UNCONFIGURED }, { status: 503 });

  const session = await readSession(request.cookies);
  if (!session) return NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

  const user = await getUser(session.uid);
  if (!user?.stripeCustomerId) return NextResponse.json({ error: "No billing account yet — subscribe to Tools Pro first." }, { status: 400 });

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: BILLING_UNCONFIGURED }, { status: 503 });

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${request.nextUrl.origin}/tools`,
    });
    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("[billing/portal]", error);
    return NextResponse.json({ error: "Couldn't open the billing portal. Try again in a moment." }, { status: 502 });
  }
}
