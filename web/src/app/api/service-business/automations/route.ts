import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getOrgForUser } from "@/lib/orgs/org";
import { isAutomationKind, listAutomationRules, listAutomationRuns, runAutomationRules, upsertAutomationRule } from "@/lib/service-business/automation";

export const runtime = "nodejs";

const unauthorised = () => NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ org: null, rules: [], runs: [] }, { headers: { "cache-control": "private, no-store" } });
  const [rules, runs] = await Promise.all([listAutomationRules(org.id), listAutomationRuns(org.id)]);
  return NextResponse.json({ org, rules, runs }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first — see /team." }, { status: 409 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (body?.runNow) {
    const runs = await runAutomationRules(org.id);
    return NextResponse.json({ runs });
  }
  const result = await upsertAutomationRule(org.id, session.uid, {
    id: typeof body?.id === "string" ? body.id : undefined,
    kind: typeof body?.kind === "string" && isAutomationKind(body.kind) ? body.kind : undefined,
    enabled: typeof body?.enabled === "boolean" ? body.enabled : undefined,
    delayHours: typeof body?.delayHours === "number" ? body.delayHours : Number(body?.delayHours) || undefined,
  });
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ rule: result });
}

export async function PATCH(request: NextRequest) {
  return POST(request);
}
