"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AutomationKind, AutomationRule, AutomationRun } from "@/lib/service-business/automation";

const AUTOMATION_KINDS = ["lead_followup", "review_request", "job_reminder", "warranty_reminder"] as const;
const AUTOMATION_KIND_LABELS: Record<AutomationKind, string> = {
  lead_followup: "Lead follow-up",
  review_request: "Review request after a completed job",
  job_reminder: "Upcoming job reminder",
  warranty_reminder: "Warranty / maintenance due",
};

export function AutomationWorkspace() {
  const session = useSession();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [telegramConfigured, setTelegramConfigured] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [kind, setKind] = useState<AutomationKind>("lead_followup");
  const [delayHours, setDelayHours] = useState("24");
  const [email, setEmail] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  type Snapshot = {
    rules: AutomationRule[];
    runs: AutomationRun[];
    telegramConfigured: boolean;
    emailConfigured: boolean;
    email: string;
    telegramChatId: string;
  };

  function applySnapshot(next: Snapshot) {
    setRules(next.rules);
    setRuns(next.runs);
    setTelegramConfigured(next.telegramConfigured);
    setEmailConfigured(next.emailConfigured);
    setEmail(next.email);
    setTelegramChatId(next.telegramChatId);
  }

  async function loadAll(): Promise<Snapshot> {
    const [auto, alerts] = await Promise.all([
      fetch("/api/service-business/automations", { credentials: "same-origin", cache: "no-store" }).then((r) => r.json()),
      fetch("/api/service-business/alerts", { credentials: "same-origin", cache: "no-store" }).then((r) => r.json()),
    ]);
    return {
      rules: auto.rules ?? [],
      runs: auto.runs ?? [],
      telegramConfigured: Boolean(alerts.telegramConfigured),
      emailConfigured: Boolean(alerts.emailConfigured),
      email: alerts.settings?.email ?? "",
      telegramChatId: alerts.settings?.telegramChatId ?? "",
    };
  }

  useEffect(() => {
    if (session.status === "ready" && session.user) void loadAll().then(applySnapshot);
  }, [session.status, session.user]);

  if (session.status !== "ready") return null;
  if (!session.user) {
    return (
      <p className="text-sm text-muted-foreground">
        <a href="/sign-in" className="underline">
          Sign in
        </a>{" "}
        to manage OS automations.
      </p>
    );
  }

  async function saveRule() {
    const res = await fetch("/api/service-business/automations", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, delayHours: Number(delayHours), enabled: true }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) setError(data.error ?? "Could not save the automation.");
    else {
      setError(null);
      await loadAll().then(applySnapshot);
    }
  }

  async function toggle(rule: AutomationRule) {
    await fetch("/api/service-business/automations", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: rule.id, enabled: !rule.enabled }),
    });
    await loadAll().then(applySnapshot);
  }

  async function runNow() {
    const res = await fetch("/api/service-business/automations", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runNow: true }),
    });
    const data = (await res.json()) as { runs?: AutomationRun[] };
    setNotice(`${data.runs?.length ?? 0} reminder(s) fired.`);
    await loadAll().then(applySnapshot);
  }

  async function saveAlerts() {
    const res = await fetch("/api/service-business/alerts", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        telegramChatId,
        emailEnabled: true,
        telegramEnabled: Boolean(telegramChatId),
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) setError(data.error ?? "Could not save alerts.");
    else {
      setNotice("Alert settings saved.");
      await loadAll().then(applySnapshot);
    }
  }

  async function testAlert() {
    const res = await fetch("/api/service-business/alerts", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ test: true }),
    });
    const data = (await res.json()) as { result?: { email: string; telegram: string } };
    setNotice(`Test: email ${data.result?.email ?? "skipped"}, Telegram ${data.result?.telegram ?? "skipped"}.`);
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
      <Card>
        <CardHeader>
          <CardTitle>Where alerts go</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Telegram and email are live. iMessage is not a public API — use Telegram or email from the truck until a Messages provider is connected.
          </p>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Alert email" />
          <Input value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} placeholder="Telegram chat id" />
          <p className="text-xs text-muted-foreground">
            Email {emailConfigured ? "is configured on this deployment" : "needs RESEND_API_KEY"}.
            Telegram {telegramConfigured ? "bot is configured" : "needs TELEGRAM_BOT_TOKEN"}.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void saveAlerts()}>Save alert settings</Button>
            <Button type="button" variant="outline" onClick={() => void testAlert()}>Send a test</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>New automation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <select value={kind} onChange={(e) => setKind(e.target.value as AutomationKind)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {AUTOMATION_KINDS.map((value) => (
              <option key={value} value={value}>{AUTOMATION_KIND_LABELS[value]}</option>
            ))}
          </select>
          <Input value={delayHours} onChange={(e) => setDelayHours(e.target.value)} placeholder="Hours to wait (job reminder: hours before start)" />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void saveRule()}>Enable</Button>
            <Button type="button" variant="outline" onClick={() => void runNow()}>Run due now</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This is the OS rule book — not the SEO report schedules at /automations.
          </p>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="flex items-center justify-between gap-3 pt-6">
              <div>
                <p className="font-medium">{AUTOMATION_KIND_LABELS[rule.kind]}</p>
                <p className="text-xs text-muted-foreground">{rule.delayHours} hours · {rule.enabled ? "on" : "paused"}</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => void toggle(rule)}>
                {rule.enabled ? "Pause" : "Resume"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {runs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent runs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {runs.slice(0, 8).map((run) => (
              <p key={run.id} className="text-muted-foreground">
                {run.title} · email {run.result.email} · Telegram {run.result.telegram}
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
