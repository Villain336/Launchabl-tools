"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { REPLY_CHANNELS, channelLabel, type ReplyChannelId, type ReplyDraft } from "@/lib/service-business/reply-queue-shared";

const TOKEN_KEY = "launchabl.admin.token";

type ManagedOrg = { orgId: string; orgName: string; slug: string; trades: string[] };
type Snapshot = { orgs: ManagedOrg[]; ready: ReplyDraft[] };

export function AdminRepliesPanel() {
  const [token, setToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot>({ orgs: [], ready: [] });
  const [orgId, setOrgId] = useState("");
  const [channel, setChannel] = useState<ReplyChannelId>("nextdoor");
  const [neighborhoodAsk, setNeighborhoodAsk] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function load(presented: string) {
    const res = await fetch("/api/admin/service-business/replies", {
      headers: { Authorization: `Bearer ${presented}` },
      cache: "no-store",
    });
    if (res.status === 401) {
      window.sessionStorage.removeItem(TOKEN_KEY);
      setUnlocked(false);
      setError("Admin token was rejected.");
      return;
    }
    if (!res.ok) {
      setError("Could not load the Run reply queue.");
      return;
    }
    window.sessionStorage.setItem(TOKEN_KEY, presented);
    const data = (await res.json()) as Snapshot;
    setSnapshot({ orgs: data.orgs ?? [], ready: data.ready ?? [] });
    setUnlocked(true);
    setError(null);
    if (!orgId && data.orgs?.[0]) setOrgId(data.orgs[0].orgId);
  }

  useEffect(() => {
    const saved = window.sessionStorage.getItem(TOKEN_KEY);
    if (saved) {
      setToken(saved);
      void load(saved);
    }
  }, []);

  async function createDraft(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/service-business/replies", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ orgId, channel, neighborhoodAsk, body, actor: "admin" }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not draft that reply.");
      return;
    }
    setNeighborhoodAsk("");
    setBody("");
    await load(token);
  }

  if (!unlocked) {
    return (
      <form
        className="mx-auto max-w-md space-y-3 py-16"
        onSubmit={(event) => {
          event.preventDefault();
          void load(token);
        }}
      >
        <p className="text-sm text-muted-foreground">Platform token. Draft neighborhood replies for Run orgs we sit on.</p>
        <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="ADMIN_TOKEN" />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit">Open the queue</Button>
      </form>
    );
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <form onSubmit={(event) => void createDraft(event)} className="space-y-3 rounded-2xl border border-border p-5">
        <h2 className="text-lg font-semibold">Draft for a Run org</h2>
        <p className="text-sm text-muted-foreground">Paste the ask. We do not scrape. They copy and send from their phone.</p>
        <select value={orgId} onChange={(e) => setOrgId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          {snapshot.orgs.length === 0 ? <option value="">No Run orgs yet</option> : null}
          {snapshot.orgs.map((org) => (
            <option key={org.orgId} value={org.orgId}>
              {org.orgName} · /b/{org.slug}
            </option>
          ))}
        </select>
        <select value={channel} onChange={(e) => setChannel(e.target.value as ReplyChannelId)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          {REPLY_CHANNELS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <Textarea value={neighborhoodAsk} onChange={(e) => setNeighborhoodAsk(e.target.value)} rows={3} placeholder="Pasted neighborhood ask" required />
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Reply they will send" required />
        <Button type="submit" disabled={busy || !orgId}>
          {busy ? "Saving…" : "Put it in their queue"}
        </Button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Ready to send</h2>
        {snapshot.ready.length === 0 ? <p className="text-sm text-muted-foreground">No waiting drafts.</p> : null}
        {snapshot.ready.map((draft) => (
          <article key={draft.id} className="rounded-xl border border-border p-4 text-sm">
            <p className="font-medium">
              {draft.orgName} · {channelLabel(draft.channel)}
            </p>
            <p className="mt-1 text-muted-foreground">{draft.neighborhoodAsk}</p>
            <p className="mt-2 whitespace-pre-wrap">{draft.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
