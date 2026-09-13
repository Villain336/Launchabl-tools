import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getOrgForUser } from "@/lib/orgs/org";
import { archiveCustomer, updateCustomer, type CustomerInput } from "@/lib/service-business/customer";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

const unauthorised = () => NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

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

export async function PATCH(request: NextRequest, context: Context) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Org not found." }, { status: 404 });
  const { id } = await context.params;
  const result = await updateCustomer(org.id, session.uid, id, readInput(await request.json().catch(() => null)));
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ customer: result });
}

/** Archives (soft-deletes) a customer rather than removing their job/estimate history. */
export async function DELETE(request: NextRequest, context: Context) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Org not found." }, { status: 404 });
  const { id } = await context.params;
  const result = await archiveCustomer(org.id, session.uid, id);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ customer: result });
}
