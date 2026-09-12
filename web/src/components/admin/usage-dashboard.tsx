"use client";

import { useEffect, useState } from "react";
import { KeyRound, RefreshCw } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { GatewayCredits, UpsellBucket, UsageBucket, UsageDay } from "@/lib/ai/usage";
import type { RateLimitTier } from "@/lib/ai/rate-limit";
import { getToolBySlug } from "@/lib/site-config";
import { modelLabel } from "@/lib/ai/models";
import { AGENT_TEMPLATES } from "@/lib/agent/templates";

type UsagePayload = {
  generatedAt: string;
  store: { kind: "memory" | "redis"; shared: boolean };
  limits: RateLimitTier[];
  dailyCapUsd: number;
  chains: { writer: string[]; fast: string[]; image?: string[] };
  credits: GatewayCredits;
  summary: { today: UsageBucket; last7: UsageBucket; last30: UsageBucket; range: UsageBucket };
  byTool: Record<string, UsageBucket>;
  byModel: Record<string, UsageBucket>;
  byTemplate?: Record<string, UsageBucket>;
  upsell: { today: UpsellBucket; last7: UpsellBucket; range: UpsellBucket; byTool: Record<string, UpsellBucket> };
  accounts?: { users: number; byDay: { date: string; signUps: number; signIns: number }[]; signUpsBySource?: Record<string, number> };
  reports?: { created: number; views: number; byTool: Record<string, number> };
  days: UsageDay[];
};

const templateTitle = (id: string) => AGENT_TEMPLATES.find((t) => t.id === id)?.title ?? id;

/** Human label for a sign-up source token (`template:launch-page`, `tool:seo-audit`, `report:agent`, `page:sign-in`). */
function sourceLabel(source: string, toolLabel: (slug: string) => string): string {
  const [kind, id] = source.split(":", 2);
  if (kind === "template") return `Template · ${templateTitle(id)}`;
  if (kind === "tool") return `Free-run gate · ${id === "agent" ? "Agent" : toolLabel(id)}`;
  if (kind === "report") return `Share report · ${id === "agent" ? "Agent" : toolLabel(id)}`;
  if (kind === "page") return `Page · /${id}`;
  return source;
}

/**
 * Which agent templates get run, what they cost and how many accounts they
 * create. A template's sign-ups come from the free-run gate shown inside a
 * conversation that started from it.
 */
function TemplatesPanel({ byTemplate, signUpsBySource, days }: { byTemplate: Record<string, UsageBucket>; signUpsBySource: Record<string, number>; days: number }) {
  const rows = Object.entries(byTemplate);
  const signUpsFor = (id: string) => signUpsBySource[`template:${id}`] ?? 0;
  const totalRuns = rows.reduce((acc, [, b]) => acc + b.requests, 0);
  const totalSignUps = rows.reduce((acc, [id]) => acc + signUpsFor(id), 0);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Agent templates</h2>
          <p className="text-xs text-muted-foreground">Runs started from a &ldquo;Start from a job&rdquo; card, and the accounts those conversations created.</p>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>
            {days} days <span className="font-medium text-foreground">{int(totalRuns)}</span> template runs
          </span>
          <span>
            <span className="font-medium text-foreground">{int(totalSignUps)}</span> sign-ups
          </span>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No template runs recorded yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Template</th>
              <th className="px-4 py-2 text-right font-medium">Runs</th>
              <th className="px-4 py-2 text-right font-medium">Errors</th>
              <th className="px-4 py-2 text-right font-medium">Avg time</th>
              <th className="px-4 py-2 text-right font-medium">Cost</th>
              <th className="px-4 py-2 text-right font-medium">Sign-ups</th>
              <th className="px-4 py-2 text-right font-medium">Per sign-up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(([id, b]) => {
              const signUps = signUpsFor(id);
              return (
                <tr key={id}>
                  <td className="px-4 py-2 text-foreground">
                    {templateTitle(id)} <span className="font-mono text-[11px] text-muted-foreground">{id}</span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{int(b.requests)}</td>
                  <td className={`px-4 py-2 text-right tabular-nums ${b.errors ? "text-red-600" : ""}`}>{int(b.errors)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{b.avgDurationMs !== null ? `${(b.avgDurationMs / 1000).toFixed(1)}s` : "—"}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium">{usd(b.costUsd)}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium">{int(signUps)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{signUps ? usd(b.costUsd / signUps) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SourcesTable({ sources, labelFor }: { sources: Record<string, number>; labelFor: (slug: string) => string }) {
  const rows = Object.entries(sources);
  if (rows.length === 0) return null;
  const total = rows.reduce((acc, [, n]) => acc + n, 0);
  return (
    <table className="w-full text-sm">
      <thead className="bg-muted/50 text-xs text-muted-foreground">
        <tr>
          <th className="px-4 py-2 text-left font-medium">Sign-up source</th>
          <th className="px-4 py-2 text-right font-medium">Sign-ups</th>
          <th className="px-4 py-2 text-right font-medium">Share</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map(([source, n]) => (
          <tr key={source}>
            <td className="px-4 py-2 text-foreground">{sourceLabel(source, labelFor)}</td>
            <td className="px-4 py-2 text-right tabular-nums font-medium">{int(n)}</td>
            <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{total ? `${((n / total) * 100).toFixed(0)}%` : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ReportsPanel({ reports, labelFor, days }: { reports: NonNullable<UsagePayload["reports"]>; labelFor: (slug: string) => string; days: number }) {
  const rows = Object.entries(reports.byTool).sort((a, b) => b[1] - a[1]);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Shared reports</h2>
          <p className="text-xs text-muted-foreground">Conversations frozen into public /r/… pages, and how often those pages were opened.</p>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>
            {days} days <span className="font-medium text-foreground">{int(reports.created)}</span> created
          </span>
          <span>
            <span className="font-medium text-foreground">{int(reports.views)}</span> views
          </span>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No reports shared yet.</p>
      ) : (
        <ul className="flex flex-wrap gap-2 px-4 py-3 text-xs">
          {rows.map(([slug, n]) => (
            <li key={slug} className="rounded-md border border-border px-2 py-1 text-foreground">
              {slug === "agent" ? "Agent" : labelFor(slug)} <span className="font-medium">{int(n)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AccountsPanel({ accounts, days, labelFor }: { accounts: NonNullable<UsagePayload["accounts"]>; days: number; labelFor: (slug: string) => string }) {
  const sum = (n: number, key: "signUps" | "signIns") => accounts.byDay.slice(0, n).reduce((acc, d) => acc + d[key], 0);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Accounts</h2>
          <p className="text-xs text-muted-foreground">Anonymous visitors get one free run, then sign in with an email.</p>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>
            Total users <span className="font-medium text-foreground">{int(accounts.users)}</span>
          </span>
          <span>
            Sign-ups today <span className="font-medium text-foreground">{int(sum(1, "signUps"))}</span>
          </span>
          <span>
            7 days <span className="font-medium text-foreground">{int(sum(7, "signUps"))}</span>
          </span>
          <span>
            {days} days <span className="font-medium text-foreground">{int(sum(days, "signUps"))}</span> sign-ups · {int(sum(days, "signIns"))} sign-ins
          </span>
        </div>
      </div>
      <SourcesTable sources={accounts.signUpsBySource ?? {}} labelFor={labelFor} />
    </div>
  );
}

const ctr = (b: UpsellBucket) => (b.views ? `${((b.clicks / b.views) * 100).toFixed(1)}%` : "—");

function UpsellPanel({ upsell, labelFor, days }: { upsell: UsagePayload["upsell"]; labelFor: (slug: string) => string; days: number }) {
  const rows = Object.entries(upsell.byTool);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Agency upsell</h2>
          <p className="text-xs text-muted-foreground">&ldquo;Want this done for you?&rdquo; cards shown under reports that found problems.</p>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>
            Today <span className="font-medium text-foreground">{int(upsell.today.clicks)}</span> / {int(upsell.today.views)}
          </span>
          <span>
            7 days <span className="font-medium text-foreground">{int(upsell.last7.clicks)}</span> / {int(upsell.last7.views)}
          </span>
          <span>
            {days} days <span className="font-medium text-foreground">{int(upsell.range.clicks)}</span> / {int(upsell.range.views)} · CTR {ctr(upsell.range)}
          </span>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No impressions recorded yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Tool</th>
              <th className="px-4 py-2 text-right font-medium">Views</th>
              <th className="px-4 py-2 text-right font-medium">Clicks</th>
              <th className="px-4 py-2 text-right font-medium">CTR</th>
              <th className="px-4 py-2 text-right font-medium">Dismissed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(([slug, b]) => (
              <tr key={slug}>
                <td className="px-4 py-2 text-foreground">{labelFor(slug)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{int(b.views)}</td>
                <td className="px-4 py-2 text-right tabular-nums font-medium">{int(b.clicks)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{ctr(b)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{int(b.dismissals)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const TOKEN_KEY = "launchabl.admin.token";

type FetchResult = { data: UsagePayload } | { error: string; status: number };

async function fetchUsage(token: string, days: number): Promise<FetchResult> {
  try {
    const response = await fetch(`/api/admin/usage?days=${days}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const body = (await response.json()) as UsagePayload & { error?: string };
    if (!response.ok) return { error: body.error ?? `HTTP ${response.status}`, status: response.status };
    return { data: body };
  } catch {
    return { error: "Couldn't reach the usage API.", status: 0 };
  }
}

const usd = (n: number) => (n < 0.01 && n > 0 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`);
const int = (n: number) => n.toLocaleString();
const tokens = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : String(n));

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

function BucketTable({ title, rows, labelFor }: { title: string; rows: [string, UsageBucket][]; labelFor: (key: string) => string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No usage recorded yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Name</th>
              <th className="px-4 py-2 text-right font-medium">Requests</th>
              <th className="px-4 py-2 text-right font-medium">Errors</th>
              <th className="px-4 py-2 text-right font-medium">In</th>
              <th className="px-4 py-2 text-right font-medium">Out</th>
              <th className="px-4 py-2 text-right font-medium">Avg time</th>
              <th className="px-4 py-2 text-right font-medium">Cost</th>
              <th className="px-4 py-2 text-right font-medium">Per request</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(([key, b]) => (
              <tr key={key}>
                <td className="px-4 py-2 text-foreground">{labelFor(key)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{int(b.requests)}</td>
                <td className={`px-4 py-2 text-right tabular-nums ${b.errors ? "text-red-600" : ""}`}>{int(b.errors)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{tokens(b.inputTokens)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{tokens(b.outputTokens)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{b.avgDurationMs !== null ? `${(b.avgDurationMs / 1000).toFixed(1)}s` : "—"}</td>
                <td className="px-4 py-2 text-right tabular-nums font-medium">{usd(b.costUsd)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{b.requests ? usd(b.costUsd / b.requests) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function UsageDashboard() {
  const [token, setToken] = useState("");
  const [days, setDays] = useState(30);
  const [data, setData] = useState<UsagePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const apply = (presented: string, result: FetchResult) => {
    if ("error" in result) {
      setError(result.error);
      setData(null);
      if (result.status === 401) window.sessionStorage.removeItem(TOKEN_KEY);
    } else {
      window.sessionStorage.setItem(TOKEN_KEY, presented);
      setError(null);
      setData(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const saved = window.sessionStorage.getItem(TOKEN_KEY);
    if (!saved) return;
    let cancelled = false;
    fetchUsage(saved, 30).then((result) => {
      if (cancelled) return;
      setToken(saved);
      apply(saved, result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const load = (presented: string, range: number) => {
    setLoading(true);
    fetchUsage(presented, range).then((result) => apply(presented, result));
  };

  const toolLabel = (slug: string) => getToolBySlug(slug)?.name ?? slug;

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">AI usage &amp; cost</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every chat turn across the free tools, with gateway-reported cost where available.</p>
        </div>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void load(token, days);
          }}
        >
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Admin token" className="w-56 pl-9" autoComplete="off" />
          </div>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-9 rounded-md border border-border bg-white px-2 text-sm">
            {[7, 14, 30, 60, 90].map((d) => (
              <option key={d} value={d}>
                Last {d} days
              </option>
            ))}
          </select>
          <Button type="submit" disabled={!token || loading}>
            <RefreshCw data-icon="inline-start" className={loading ? "animate-spin" : ""} aria-hidden="true" />
            {data ? "Refresh" : "Load"}
          </Button>
        </form>
      </div>

      {error && <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {data && (
        <div className="mt-8 space-y-8">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Tile label="Today" value={usd(data.summary.today.costUsd)} note={`${int(data.summary.today.requests)} requests`} />
            <Tile label="Last 7 days" value={usd(data.summary.last7.costUsd)} note={`${int(data.summary.last7.requests)} requests`} />
            <Tile label="Last 30 days" value={usd(data.summary.last30.costUsd)} note={`${int(data.summary.last30.requests)} requests · ${int(data.summary.last30.errors)} errors`} />
            <Tile
              label="Gateway balance"
              value={data.credits ? usd(data.credits.balance) : "—"}
              note={data.credits ? `${usd(data.credits.totalUsed)} used all-time` : "Credits endpoint unavailable"}
            />
            <Tile
              label="Store"
              value={data.store.kind === "redis" ? "Redis" : "Memory"}
              note={data.store.shared ? "Shared across instances" : "Per instance — attach Upstash/Vercel KV for production"}
            />
          </div>

          <BucketTable title="By tool" rows={Object.entries(data.byTool)} labelFor={toolLabel} />
          {data.byTemplate && <TemplatesPanel byTemplate={data.byTemplate} signUpsBySource={data.accounts?.signUpsBySource ?? {}} days={days} />}
          {data.accounts && <AccountsPanel accounts={data.accounts} days={days} labelFor={toolLabel} />}
          {data.reports && <ReportsPanel reports={data.reports} labelFor={toolLabel} days={days} />}
          {data.upsell && <UpsellPanel upsell={data.upsell} labelFor={toolLabel} days={days} />}
          <BucketTable title="By model" rows={Object.entries(data.byModel)} labelFor={(m) => `${modelLabel(m)} · ${m}`} />

          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">By day</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Day (UTC)</th>
                  <th className="px-4 py-2 text-right font-medium">Requests</th>
                  <th className="px-4 py-2 text-right font-medium">Errors</th>
                  <th className="px-4 py-2 text-right font-medium">Tokens</th>
                  <th className="px-4 py-2 text-right font-medium">Cost</th>
                  <th className="px-4 py-2 text-right font-medium">Estimated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.days
                  .filter((d) => d.total.requests > 0)
                  .map((d) => (
                    <tr key={d.day}>
                      <td className="px-4 py-2 font-mono text-xs text-foreground">{d.day}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{int(d.total.requests)}</td>
                      <td className={`px-4 py-2 text-right tabular-nums ${d.total.errors ? "text-red-600" : ""}`}>{int(d.total.errors)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{tokens(d.total.inputTokens + d.total.outputTokens)}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium">{usd(d.total.costUsd)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{d.estimatedRequests ? `${int(d.estimatedRequests)} req` : "—"}</td>
                    </tr>
                  ))}
                {data.days.every((d) => d.total.requests === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-sm text-muted-foreground">
                      No usage in this range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="font-medium text-foreground">Rate limits per client</p>
              <ul className="mt-1 space-y-0.5">
                {data.limits.map((l) => (
                  <li key={l.name}>
                    {l.limit} requests / {l.windowSeconds >= 86_400 ? `${l.windowSeconds / 86_400} day` : `${l.windowSeconds / 60} min`} ({l.name})
                  </li>
                ))}
              </ul>
              <p className="mt-2">
                Daily spend cap: <span className="font-medium text-foreground">{usd(data.dailyCapUsd)}</span> — today {usd(data.summary.today.costUsd)} ({Math.round((data.summary.today.costUsd / data.dailyCapUsd) * 100)}%). Set DAILY_SPEND_CAP_USD to change.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="font-medium text-foreground">Model chains</p>
              <p className="mt-1">Writer: {data.chains.writer.join(" → ")}</p>
              <p>Fast: {data.chains.fast.join(" → ")}</p>
              <p className="mt-2">&ldquo;Estimated&rdquo; counts requests priced from the list-price table because the gateway didn&apos;t report cost.</p>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
