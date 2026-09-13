/**
 * Org-scoped OS alerts. Telegram is a real Bot API. Email uses Resend,
 * same as sign-in codes and scheduled reports. iMessage has no public API
 * we can call — the honest path is Telegram or email from the truck until
 * a Messages provider exists.
 */
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { getUser } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/log";
import { getOrg } from "@/lib/orgs/org";
import { siteConfig } from "@/lib/site-config";
import { cleanText, RECORD_TTL, requireOrgRole, type DomainError } from "./shared";

export type AlertSettings = {
  orgId: string;
  email: string;
  telegramChatId: string;
  emailEnabled: boolean;
  telegramEnabled: boolean;
  updatedAt: string;
};

export type AlertChannelResult = "sent" | "skipped" | "failed";
export type AlertSendResult = { email: AlertChannelResult; telegram: AlertChannelResult };

export type AlertPayload = { title: string; body: string };

export type AlertDeps = {
  email?: (to: string, title: string, body: string) => Promise<boolean>;
  telegram?: (chatId: string, text: string) => Promise<boolean>;
};

const settingsKey = (orgId: string) => `osalert:${orgId}`;

export function telegramConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.TELEGRAM_BOT_TOKEN);
}

export async function getAlertSettings(orgId: string, store: KeyValueStore = getStore()): Promise<AlertSettings | null> {
  const raw = await store.get(settingsKey(orgId));
  return raw ? (JSON.parse(raw) as AlertSettings) : null;
}

export async function resolveAlertSettings(orgId: string, store: KeyValueStore = getStore()): Promise<AlertSettings> {
  const existing = await getAlertSettings(orgId, store);
  if (existing) return existing;
  const org = await getOrg(orgId, store);
  const owner = org ? await getUser(org.ownerUid, store) : null;
  return {
    orgId,
    email: owner?.email ?? "",
    telegramChatId: "",
    emailEnabled: Boolean(owner?.email),
    telegramEnabled: false,
    updatedAt: new Date(0).toISOString(),
  };
}

export async function saveAlertSettings(
  orgId: string,
  actingUid: string,
  input: Partial<Pick<AlertSettings, "email" | "telegramChatId" | "emailEnabled" | "telegramEnabled">>,
  store: KeyValueStore = getStore(),
): Promise<AlertSettings | DomainError> {
  const permissionError = await requireOrgRole(orgId, actingUid, ["owner", "admin"], store);
  if (permissionError) return permissionError;
  const current = await resolveAlertSettings(orgId, store);
  const updated: AlertSettings = {
    orgId,
    email: input.email !== undefined ? cleanText(input.email, 200) : current.email,
    telegramChatId: input.telegramChatId !== undefined ? cleanText(input.telegramChatId, 40) : current.telegramChatId,
    emailEnabled: input.emailEnabled !== undefined ? Boolean(input.emailEnabled) : current.emailEnabled,
    telegramEnabled: input.telegramEnabled !== undefined ? Boolean(input.telegramEnabled) : current.telegramEnabled,
    updatedAt: new Date().toISOString(),
  };
  await store.set(settingsKey(orgId), JSON.stringify(updated), RECORD_TTL);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "alerts.updated", target: orgId, detail: { emailEnabled: updated.emailEnabled, telegramEnabled: updated.telegramEnabled } }, store);
  return updated;
}

async function sendResendEmail(to: string, title: string, body: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  const from = process.env.AUTH_EMAIL_FROM ?? "Launchabl <hello@launchabl.io>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: title,
      text: `${body}\n\n— ${siteConfig.name} OS`,
    }),
    signal: AbortSignal.timeout(8_000),
  });
  return res.ok;
}

async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 3900) }),
    signal: AbortSignal.timeout(8_000),
  });
  return res.ok;
}

export function canDeliver(settings: AlertSettings): boolean {
  return (settings.emailEnabled && Boolean(settings.email)) || (settings.telegramEnabled && Boolean(settings.telegramChatId));
}

export async function sendOrgAlert(
  orgId: string,
  payload: AlertPayload,
  store: KeyValueStore = getStore(),
  deps: AlertDeps = {},
): Promise<AlertSendResult> {
  const settings = await resolveAlertSettings(orgId, store);
  const title = cleanText(payload.title, 160) || "Launchabl OS";
  const body = cleanText(payload.body, 2000);
  const result: AlertSendResult = { email: "skipped", telegram: "skipped" };

  if (settings.emailEnabled && settings.email) {
    const send = deps.email ?? sendResendEmail;
    try {
      result.email = (await send(settings.email, title, body)) ? "sent" : "failed";
    } catch {
      result.email = "failed";
    }
  }

  if (settings.telegramEnabled && settings.telegramChatId) {
    const send = deps.telegram ?? sendTelegramMessage;
    try {
      result.telegram = (await send(settings.telegramChatId, `${title}\n\n${body}`)) ? "sent" : "failed";
    } catch {
      result.telegram = "failed";
    }
  }

  return result;
}
