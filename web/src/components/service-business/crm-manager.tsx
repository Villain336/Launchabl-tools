"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TRADE_LABELS, TRADES, type Trade } from "@/lib/service-business/profile";

type OrgRecord = { id: string; name: string };
type EngagementType = "self-serve" | "managed";
type ServiceBusinessProfile = {
  orgId: string;
  slug: string;
  trades: Trade[];
  serviceArea: string[];
  address: string;
  phone: string;
  licensed: boolean;
  insured: boolean;
  bonded: boolean;
  allowKnowledgeSharing: boolean;
  engagementType: EngagementType;
};
type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  tags: string[];
  source: string;
  archived: boolean;
};
type KnowledgeNote = { id: string; title: string; markdown: string; source: string; sharedToPool: boolean; createdAt: string };

async function loadJson<T>(url: string, fallback: T): Promise<T> {
  const res = await fetch(url, { credentials: "same-origin", cache: "no-store" });
  if (!res.ok) return fallback;
  return (await res.json()) as T;
}

type CrmSnapshot = { org: OrgRecord | null; profile: ServiceBusinessProfile | null; customers: Customer[]; notes: KnowledgeNote[] };

async function loadAll(): Promise<CrmSnapshot> {
  const [profileRes, customersRes, notesRes] = await Promise.all([
    loadJson<{ org: OrgRecord | null; profile: ServiceBusinessProfile | null }>("/api/service-business/profile", { org: null, profile: null }),
    loadJson<{ customers: Customer[] }>("/api/service-business/customers", { customers: [] }),
    loadJson<{ notes: KnowledgeNote[] }>("/api/service-business/knowledge", { notes: [] }),
  ]);
  return { org: profileRes.org, profile: profileRes.profile, customers: customersRes.customers, notes: notesRes.notes };
}

export function CrmManager() {
  const session = useSession();
  const [org, setOrg] = useState<OrgRecord | null>(null);
  const [profile, setProfile] = useState<ServiceBusinessProfile | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [notes, setNotes] = useState<KnowledgeNote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [noteTitle, setNoteTitle] = useState("");
  const [noteMarkdown, setNoteMarkdown] = useState("");

  function applySnapshot(snapshot: CrmSnapshot) {
    setOrg(snapshot.org);
    setProfile(snapshot.profile);
    setCustomers(snapshot.customers);
    setNotes(snapshot.notes);
    setLoaded(true);
  }

  useEffect(() => {
    if (session.status === "ready" && session.user) void loadAll().then(applySnapshot);
  }, [session.status, session.user]);

  if (session.status !== "ready") return null;
  if (!session.user) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          <Link href="/sign-in?next=/crm" className="text-primary underline">
            Sign in
          </Link>{" "}
          to manage your customers.
        </CardContent>
      </Card>
    );
  }
  if (!loaded) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!org) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Set up your team account first —{" "}
          <Link href="/team" className="text-primary underline">
            create a team
          </Link>
          , then come back here.
        </CardContent>
      </Card>
    );
  }

  async function run(action: () => Promise<Response>, onOk?: () => void): Promise<void> {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await action();
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Something went wrong.");
        return;
      }
      onOk?.();
      applySnapshot(await loadAll());
    } finally {
      setBusy(false);
    }
  }

  const activeCustomers = customers.filter((c) => !c.archived);
  const archivedCustomers = customers.filter((c) => c.archived);

  function toggleTrade(trade: Trade) {
    const current = profile?.trades ?? [];
    const trades = current.includes(trade) ? current.filter((t) => t !== trade) : [...current, trade];
    void run(() => fetch("/api/service-business/profile", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ trades }) }));
  }

  function toggleKnowledgeSharing() {
    void run(
      () =>
        fetch("/api/service-business/profile", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ allowKnowledgeSharing: !(profile?.allowKnowledgeSharing ?? false) }),
        }),
      () => setNotice(profile?.allowKnowledgeSharing ? "Knowledge sharing turned off." : "Thanks — your notes will help improve the AI agents across the platform."),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Business profile</CardTitle>
          {profile?.engagementType === "managed" && (
            <span className="rounded-[4px] bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">Managed by Launchabl</span>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {notice && <p className="text-sm text-emerald-600">{notice}</p>}
          {profile?.engagementType === "managed" && (
            <p className="text-sm text-muted-foreground">
              Your Launchabl team is running this account&rsquo;s marketing and setup for you. Everything below still reflects what&rsquo;s happening on your account — you don&rsquo;t need to do
              anything here unless you want to.
            </p>
          )}
          <div>
            <h3 className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Trades served</h3>
            <div className="flex flex-wrap gap-2">
              {TRADES.map((trade) => {
                const active = profile?.trades.includes(trade) ?? false;
                return (
                  <button
                    key={trade}
                    type="button"
                    disabled={busy}
                    onClick={() => toggleTrade(trade)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                  >
                    {TRADE_LABELS[trade]}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={profile?.allowKnowledgeSharing ?? false} disabled={busy} onChange={toggleKnowledgeSharing} className="mt-0.5" />
            <span>
              Let knowledge notes from my account help improve the AI agents for every business on the platform.
              <span className="mt-1 block text-xs text-muted-foreground">
                Your notes always stay saved to your account either way. Turning this on also shares them into a pool used to make the AI agents smarter across accounts. Off by default — turn it
                off any time and only new notes stop being shared.
              </span>
            </span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customers ({activeCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" disabled={busy} className="max-w-xs" />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" disabled={busy} className="max-w-[160px]" />
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" disabled={busy} className="max-w-xs" />
            <Button
              disabled={busy || !name.trim()}
              onClick={() =>
                void run(
                  () => fetch("/api/service-business/customers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, phone, email }) }),
                  () => {
                    setName("");
                    setPhone("");
                    setEmail("");
                  },
                )
              }
            >
              Add customer
            </Button>
          </div>

          {activeCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No customers yet — add your first one above.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {activeCustomers.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="truncate">
                    {c.name}
                    {(c.phone || c.email) && <span className="ml-1 text-muted-foreground">({[c.phone, c.email].filter(Boolean).join(" · ")})</span>}
                    <span className="ml-2 text-xs text-muted-foreground uppercase">{c.source}</span>
                  </span>
                  <Button variant="outline" size="xs" disabled={busy} onClick={() => void run(() => fetch(`/api/service-business/customers/${c.id}`, { method: "DELETE" }))}>
                    Archive
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {archivedCustomers.length > 0 && (
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer">Archived ({archivedCustomers.length})</summary>
              <ul className="mt-2 flex flex-col gap-1">
                {archivedCustomers.map((c) => (
                  <li key={c.id} className="truncate">
                    {c.name}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Knowledge notes ({notes.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            What the AI agent has learned from jobs, customers, and quotes in this account — repurposed from the Markdown file generator tool. Saved privately here always;{" "}
            {profile?.allowKnowledgeSharing ? "and, since you've opted in above, shared into the cross-account learning pool." : "opt in above to also share these into the cross-account learning pool."}
          </p>
          <div className="flex flex-col gap-2">
            <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Note title" disabled={busy} />
            <Textarea value={noteMarkdown} onChange={(e) => setNoteMarkdown(e.target.value)} placeholder="What happened, in Markdown…" disabled={busy} rows={3} />
            <Button
              className="self-start"
              disabled={busy || !noteTitle.trim() || !noteMarkdown.trim()}
              onClick={() =>
                void run(
                  () =>
                    fetch("/api/service-business/knowledge", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ title: noteTitle, markdown: noteMarkdown, source: "manual" }),
                    }),
                  () => {
                    setNoteTitle("");
                    setNoteMarkdown("");
                  },
                )
              }
            >
              Save note
            </Button>
          </div>

          {notes.length > 0 && (
            <ul className="flex flex-col gap-2">
              {notes.map((n) => (
                <li key={n.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{n.title}</span>
                    <span className="text-xs text-muted-foreground uppercase">{n.sharedToPool ? "shared" : "private"}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">{n.markdown}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
