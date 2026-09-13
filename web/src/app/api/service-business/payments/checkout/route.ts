import { NextResponse, type NextRequest } from "next/server";
import { getUser, readSession } from "@/lib/auth/session";
import { BILLING_UNCONFIGURED, getStripe, stripeConfigured } from "@/lib/billing/stripe";
import { getOrgForUser } from "@/lib/orgs/org";
import { getCustomer } from "@/lib/service-business/customer";
import { getEstimate } from "@/lib/service-business/estimate";
import { getJob } from "@/lib/service-business/job";

export const runtime = "nodejs";

/**
 * One-time Stripe Checkout for a job invoice. The homeowner pays; the
 * webhook records the same JobPayment row as a card collected on site.
 * At-most-once: the webhook guards on `stripe:jobpay:{sessionId}`.
 */
export async function POST(request: NextRequest) {
  if (!stripeConfigured()) return NextResponse.json({ error: BILLING_UNCONFIGURED }, { status: 503 });
  const session = await readSession(request.cookies);
  if (!session) return NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first — see /team." }, { status: 409 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const jobId = typeof body?.jobId === "string" ? body.jobId : "";
  if (!jobId) return NextResponse.json({ error: "Pick a job to invoice." }, { status: 400 });
  const job = await getJob(org.id, jobId);
  if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });

  let amountCents = typeof body?.amountCents === "number" ? Math.round(body.amountCents) : Number(body?.amountCents);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    if (job.estimateId) {
      const estimate = await getEstimate(org.id, job.estimateId);
      amountCents = estimate?.totalCents ?? 0;
    }
  }
  if (!Number.isFinite(amountCents) || amountCents < 50) {
    return NextResponse.json({ error: "Enter an invoice amount of at least $0.50." }, { status: 400 });
  }

  const customer = await getCustomer(org.id, job.customerId);
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: BILLING_UNCONFIGURED }, { status: 503 });
  const user = await getUser(session.uid);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  try {
    const origin = request.nextUrl.origin;
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customer?.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `${job.title} — ${org.name}` },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/os/dashboard?paid=1`,
      cancel_url: `${origin}/os/dashboard`,
      client_reference_id: user.uid,
      metadata: {
        kind: "job_invoice",
        orgId: org.id,
        jobId: job.id,
        uid: user.uid,
        amountCents: String(amountCents),
      },
    });
    if (!checkoutSession.url) return NextResponse.json({ error: "Stripe didn't return a checkout URL." }, { status: 502 });
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[service-business/payments/checkout]", error);
    return NextResponse.json({ error: "Couldn't start checkout. Try again in a moment." }, { status: 502 });
  }
}
