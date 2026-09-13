import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getOrgForUser } from "@/lib/orgs/org";
import { resolveAlertSettings, saveAlertSettings, sendOrgAlert, telegramConfigured } from "@/lib/service-business/alerts";

export const runtime = "nodejs";

const unauthorised = () => NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ org: null, settings: null, telegramConfigured: telegramConfigured() }, { headers: { "cache-control": "private, no-store" } });
  const settings = await resolveAlertSettings(org.id);
  return NextResponse.json(
    { org, settings, telegramConfigured: telegramConfigured(), emailConfigured: Boolean(process.env.RESEND_API_KEY) },
    { headers: { "cache-control": "private, no-store" } },
  );
}

export async function POST(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first — see /team." }, { status: 409 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (body?.test) {
    const result = await sendOrgAlert(org.id, {
      title: "Launchabl OS test alert",
      body: "If you got this, Telegram and/or email are wired. iMessage is not a public API — use these from the truck.",
    });
    return NextResponse.json({ result });
  }
  const result = await saveAlertSettings(org.id, session.uid, {
    email: typeof body?.email === "string" ? body.email : undefined,
    telegramChatId: typeof body?.telegramChatId === "string" ? body.telegramChatId : undefined,
    emailEnabled: typeof body?.emailEnabled === "boolean" ? body.emailEnabled : undefined,
    telegramEnabled: typeof body?.telegramEnabled === "boolean" ? body.telegramEnabled : undefined,
  });
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ settings: result });
}
