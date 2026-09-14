"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth/use-session";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  REPLY_CHANNELS,
  REPLY_QUEUE_RULE,
  channelLabel,
  replyClipboardText,
  type ReplyChannelId,
  type ReplyDraft,
} from "@/lib/service-business/reply-queue-shared";

type Snapshot = {
  run: boolean;
  canDraft: boolean;
  bookingPath: string | null;
  drafts: ReplyDraft[];
};

async function loadQueue(): Promise<Snapshot> {
  const res = await fetch("/api/service-business/replies", { credentials: "same-origin", cache: "no-store" });
  const data = (await res.json()) as Partial<Snapshot>;
  return { run: Boolean(data.run), canDraft: Boolean(data.canDraft), bookingPath: data.bookingPath ?? null, drafts: data.drafts ?? [] };
}

async function copyToPhone(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "true");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(area);
  return ok;
}

export function RepliesWorkspace() {
  const session = useSession();
  const [queue, setQueue] = useState<Snapshot>({ run: false, canDraft: false, bookingPath: null, drafts: [] });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [channel, setChannel] = useState<ReplyChannelId>("nextdoor");
  const [neighborhoodAsk, setNeighborhoodAsk] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (session.status === "ready" && session.user) void loadQueue().then(setQueue);
  }, [session.status, session.user]);

  if (session.status !== "ready") return null;
  if (!session.user) {
    return (
      <p className="text-sm text-muted-foreground">
        <Link href="/sign-in?next=/os/replies" className="underline">
          Sign in
        </Link>{" "}
        to see replies waiting on your phone.
      </p>
    );
  }

  async function act(id: string, action: "copied" | "sent" | "skipped") {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/service-business/replies/${encodeURIComponent(id)}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = (await res.json()) as { error?: string };
    setBusyId(null);
    if (!res.ok) setError(data.error ?? "Could not update that reply.");
    else await loadQueue().then(setQueue);
  }

  async function copyAndMark(draft: ReplyDraft) {
    const text = replyClipboardText(draft, window.location.origin);
    const ok = await copyToPhone(text);
    if (!ok) {
      setError("Could not copy. Long-press the reply and copy it yourself.");
      return;
    }
    setNotice("Copied. Paste it in the app, then mark sent.");
    await act(draft.id, "copied");
  }

  async function createDraft(event: React.FormEvent) {
    event.preventDefault();
    setBusyId("create");
    setError(null);
    const res = await fetch("/api/service-business/replies", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ channel, neighborhoodAsk, body }),
    });
    const data = (await res.json()) as { error?: string };
    setBusyId(null);
    if (!res.ok) {
      setError(data.error ?? "Could not save that draft.");
      return;
    }
    setNeighborhoodAsk("");
    setBody("");
    setNotice("Draft is in the queue. They can copy it from their phone.");
    await loadQueue().then(setQueue);
  }

  const waiting = queue.drafts.filter((draft) => draft.status === "ready" || draft.status === "copied");
  const closed = queue.drafts.filter((draft) => draft.status === "sent" || draft.status === "skipped");

  if (!queue.run) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Run sits on the neighborhood asks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>{REPLY_QUEUE_RULE}</p>
          <p>
            This queue is part of Run — $497/month — not the $99 Network seat. We draft; you send.
          </p>
          <p>
            <Link href="/agency" className="underline">
              Talk to the agency
            </Link>
            {queue.bookingPath ? (
              <>
                {" "}
                · your booking link is already{" "}
                <Link href={queue.bookingPath} className="underline">
                  {queue.bookingPath}
                </Link>
              </>
            ) : null}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">{REPLY_QUEUE_RULE}</p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {notice ? <p className="text-sm text-foreground">{notice}</p> : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Waiting on your phone</h2>
        {waiting.length === 0 ? <p className="text-sm text-muted-foreground">Nothing to send right now.</p> : null}
        {waiting.map((draft) => (
          <article key={draft.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {channelLabel(draft.channel)} · {draft.status === "copied" ? "copied — send it" : "ready"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">They asked: {draft.neighborhoodAsk}</p>
            <p className="mt-3 whitespace-pre-wrap text-base leading-6 text-foreground">{draft.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">Ends on {draft.bookingPath}. We did not post this.</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button size="lg" className="w-full sm:w-auto" disabled={busyId === draft.id} onClick={() => void copyAndMark(draft)}>
                Copy reply
              </Button>
              <Button size="lg" variant="secondary" className="w-full sm:w-auto" disabled={busyId === draft.id} onClick={() => void act(draft.id, "sent")}>
                I sent it
              </Button>
              <Button size="lg" variant="ghost" className="w-full sm:w-auto" disabled={busyId === draft.id} onClick={() => void act(draft.id, "skipped")}>
                Skip
              </Button>
            </div>
          </article>
        ))}
      </section>

      {queue.canDraft ? (
        <Card>
          <CardHeader>
            <CardTitle>Draft the next reply</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(event) => void createDraft(event)} className="space-y-3">
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as ReplyChannelId)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {REPLY_CHANNELS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <Textarea
                value={neighborhoodAsk}
                onChange={(e) => setNeighborhoodAsk(e.target.value)}
                rows={3}
                placeholder="Paste the neighborhood ask. We do not scrape it."
                required
              />
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="The reply they will send. We add /b if you forget." required />
              <Button type="submit" disabled={busyId === "create"} className="w-full sm:w-auto">
                {busyId === "create" ? "Saving…" : "Put it in their queue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {closed.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Already handled</h2>
          {closed.map((draft) => (
            <p key={draft.id} className="text-sm text-muted-foreground">
              {channelLabel(draft.channel)} · {draft.status} · {draft.neighborhoodAsk.slice(0, 80)}
            </p>
          ))}
        </section>
      ) : null}
    </div>
  );
}
