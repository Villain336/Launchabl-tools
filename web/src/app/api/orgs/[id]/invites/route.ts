import { NextResponse, type NextRequest } from "next/server";
import { emailCodesEnabled, readSession } from "@/lib/auth/session";
import { inviteMember } from "@/lib/orgs/org";
import { siteConfig } from "@/lib/site-config";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

const unauthorised = () => NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

/** Invite a teammate by email. Emails the invite link when Resend is configured, otherwise returns the link to share manually. */
export async function POST(request: NextRequest, context: Context) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { email?: unknown; role?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email : "";
  const role = body?.role === "admin" ? "admin" : "member";
  const result = await inviteMember(id, session.uid, email, role);
  if ("error" in result) return NextResponse.json(result, { status: 400 });

  const inviteUrl = `${siteConfig.url}/team/join?token=${result.invite.token}`;
  let emailed = false;
  if (emailCodesEnabled()) {
    try {
      await sendInviteEmail(result.invite.email, inviteUrl);
      emailed = true;
    } catch (error) {
      console.warn(`[orgs/invite] failed to email invite for org ${id}:`, error instanceof Error ? error.message : error);
    }
  }
  return NextResponse.json({ invite: result.invite, inviteUrl, emailed });
}

async function sendInviteEmail(email: string, inviteUrl: string): Promise<void> {
  const from = process.env.AUTH_EMAIL_FROM ?? "Launchabl <hello@launchabl.io>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "You've been invited to a Launchabl team",
      text: `You've been invited to join a team on Launchabl. Accept it here: ${inviteUrl}\n\nThe invite expires in 7 days.`,
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}`);
}
