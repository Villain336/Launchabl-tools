import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/ai/store";
import { clientKey, createRateLimiter } from "@/lib/ai/rate-limit";
import { emailCodesEnabled, isValidEmail, issueCode, normalizeEmail, normalizeSignUpSource, sendCodeEmail, sessionCookie, upsertUser, verifyCode } from "@/lib/auth/session";

declare global {
  var __launchablAuthLimiter: ReturnType<typeof createRateLimiter> | undefined;
}

const limiter = () => (globalThis.__launchablAuthLimiter ??= createRateLimiter([{ name: "auth", limit: 12, windowSeconds: 10 * 60 }], getStore()));

/**
 * POST { email, name?, code?, source? }
 * - Without an email sender configured: opens the account immediately.
 * - With RESEND_API_KEY: first call emails a code ({ step: "code" }); the
 *   second call with `code` opens the account.
 * - If sending the code fails (e.g. the Resend sending domain isn't verified
 *   yet, so Resend only allows delivery to the account owner's own address),
 *   don't hard-block sign-in on a deliverability problem — fall back to the
 *   same soft-gate used when no email sender is configured at all. This
 *   trades a little verification rigor for keeping the sign-up funnel (and
 *   everything gated behind it, including Tools Pro checkout) working while
 *   the sending domain gets verified at resend.com/domains.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: unknown; name?: unknown; code?: unknown; source?: unknown } | null;
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim().slice(0, 80) : null;
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const source = normalizeSignUpSource(body?.source);
  if (!isValidEmail(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const limit = await limiter().check(clientKey(request.headers));
  if (!limit.ok) return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });

  if (emailCodesEnabled()) {
    if (code) {
      if (!(await verifyCode(email, code))) return NextResponse.json({ error: "That code isn't right or has expired." }, { status: 400 });
    } else {
      try {
        await sendCodeEmail(email, await issueCode(email));
        return NextResponse.json({ step: "code" });
      } catch (error) {
        console.error("[auth] code email failed; falling back to unverified sign-in", error);
      }
    }
  }

  const { user, created } = await upsertUser(email, name, undefined, source);
  const response = NextResponse.json({ user: { email: user.email, name: user.name }, created });
  response.headers.append("Set-Cookie", await sessionCookie({ uid: user.uid, email: user.email, name: user.name, iat: Date.now() }));
  return response;
}
