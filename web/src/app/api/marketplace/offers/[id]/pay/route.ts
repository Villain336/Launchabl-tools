import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/ai/store";
import { BILLING_UNCONFIGURED, getStripe, stripeConfigured } from "@/lib/billing/stripe";
import { getOrg } from "@/lib/orgs/org";
import { getEstimate } from "@/lib/service-business/estimate";
import { getOfferByToken } from "@/lib/service-business/offer";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!stripeConfigured()) return NextResponse.json({ error: BILLING_UNCONFIGURED }, { status: 503 });
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const token = typeof body?.token === "string" ? body.token : "";
  const offer = await getOfferByToken(id, token);
  if (!offer || !offer.claimedOrgId || !offer.jobId || !offer.estimateId) {
    return NextResponse.json({ error: "There is no quote to pay yet." }, { status: 400 });
  }
  const estimate = await getEstimate(offer.claimedOrgId, offer.estimateId);
  if (!estimate || estimate.totalCents < 50) return NextResponse.json({ error: "That quote is not payable yet." }, { status: 400 });
  const org = await getOrg(offer.claimedOrgId, getStore());
  const stripe = getStripe();
  if (!stripe || !org) return NextResponse.json({ error: BILLING_UNCONFIGURED }, { status: 503 });

  try {
    const origin = request.nextUrl.origin;
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: offer.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `${estimate.lineItems[0]?.description || offer.trade} — ${org.name}` },
            unit_amount: estimate.totalCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/request/${offer.id}?token=${encodeURIComponent(token)}&paid=1`,
      cancel_url: `${origin}/request/${offer.id}?token=${encodeURIComponent(token)}`,
      client_reference_id: org.ownerUid,
      metadata: {
        kind: "job_invoice",
        orgId: org.id,
        jobId: offer.jobId,
        uid: org.ownerUid,
        amountCents: String(estimate.totalCents),
        offerId: offer.id,
      },
    });
    if (!checkoutSession.url) return NextResponse.json({ error: "Stripe didn't return a checkout URL." }, { status: 502 });
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[marketplace/offers/pay]", error);
    return NextResponse.json({ error: "Couldn't start checkout. Try again in a moment." }, { status: 502 });
  }
}
