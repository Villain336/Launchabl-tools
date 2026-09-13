import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getOrgForUser } from "@/lib/orgs/org";
import { createCustomer, listCustomers, type CustomerInput } from "@/lib/service-business/customer";

/** The CRM: customers scoped to the signed-in user's org. */

export const runtime = "nodejs";

const unauthorised = () => NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ org: null, customers: [] }, { headers: { "cache-control": "private, no-store" } });
  const customers = await listCustomers(org.id);
  return NextResponse.json({ org, customers }, { headers: { "cache-control": "private, no-store" } });
}

function readInput(body: unknown): CustomerInput {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    name: typeof b.name === "string" ? b.name : undefined,
    phone: typeof b.phone === "string" ? b.phone : undefined,
    email: typeof b.email === "string" ? b.email : undefined,
    addresses: Array.isArray(b.addresses) ? (b.addresses as string[]) : undefined,
    notes: typeof b.notes === "string" ? b.notes : undefined,
    tags: Array.isArray(b.tags) ? (b.tags as string[]) : undefined,
    source: typeof b.source === "string" ? (b.source as CustomerInput["source"]) : undefined,
  };
}

export async function POST(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first — see /team." }, { status: 409 });
  const result = await createCustomer(org.id, session.uid, readInput(await request.json().catch(() => null)));
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ customer: result });
}
