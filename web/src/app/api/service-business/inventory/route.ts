import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getOrgForUser } from "@/lib/orgs/org";
import { adjustInventory, createInventoryItem, listInventory, updateInventoryItem, type InventoryInput } from "@/lib/service-business/inventory";

export const runtime = "nodejs";

const unauthorised = () => NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

function readInput(body: unknown): InventoryInput {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    name: typeof b.name === "string" ? b.name : undefined,
    sku: typeof b.sku === "string" ? b.sku : undefined,
    quantityOnHand: typeof b.quantityOnHand === "number" ? b.quantityOnHand : b.quantityOnHand !== undefined ? Number(b.quantityOnHand) : undefined,
    reorderThreshold: typeof b.reorderThreshold === "number" ? b.reorderThreshold : b.reorderThreshold !== undefined ? Number(b.reorderThreshold) : undefined,
    costCents: typeof b.costCents === "number" ? b.costCents : b.costCents !== undefined ? Number(b.costCents) : undefined,
    notes: typeof b.notes === "string" ? b.notes : undefined,
  };
}

export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ org: null, items: [] }, { headers: { "cache-control": "private, no-store" } });
  const items = await listInventory(org.id);
  return NextResponse.json({ org, items }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first — see /team." }, { status: 409 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (body?.adjust) {
    const result = await adjustInventory(org.id, session.uid, {
      itemId: typeof body.itemId === "string" ? body.itemId : undefined,
      delta: typeof body.delta === "number" ? body.delta : Number(body.delta),
      jobId: typeof body.jobId === "string" ? body.jobId : null,
    });
    if ("error" in result) return NextResponse.json(result, { status: 400 });
    return NextResponse.json({ item: result });
  }
  const result = await createInventoryItem(org.id, session.uid, readInput(body));
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ item: result });
}

export async function PATCH(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first — see /team." }, { status: 409 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Missing item id." }, { status: 400 });
  const result = await updateInventoryItem(org.id, session.uid, id, readInput(body));
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ item: result });
}
