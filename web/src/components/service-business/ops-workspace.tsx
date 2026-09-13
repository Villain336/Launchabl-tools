"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth/use-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { OsDashboard } from "@/lib/service-business/dashboard";
import type { Lead } from "@/lib/service-business/lead";
import type { Job } from "@/lib/service-business/job";
import type { Estimate } from "@/lib/service-business/estimate";
import type { Customer } from "@/lib/service-business/customer";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

type Snapshot = { dashboard: OsDashboard | null; leads: Lead[]; jobs: Job[]; estimates: Estimate[]; customers: Customer[] };

async function loadAll(): Promise<Snapshot> {
  const [dash, leadRes, jobRes, estRes, custRes] = await Promise.all([
    fetch("/api/service-business/dashboard", { credentials: "same-origin", cache: "no-store" }).then((r) => r.json()),
    fetch("/api/service-business/leads", { credentials: "same-origin", cache: "no-store" }).then((r) => r.json()),
    fetch("/api/service-business/jobs", { credentials: "same-origin", cache: "no-store" }).then((r) => r.json()),
    fetch("/api/service-business/estimates", { credentials: "same-origin", cache: "no-store" }).then((r) => r.json()),
    fetch("/api/service-business/customers", { credentials: "same-origin", cache: "no-store" }).then((r) => r.json()),
  ]);
  return {
    dashboard: dash.dashboard ?? null,
    leads: leadRes.leads ?? [],
    jobs: jobRes.jobs ?? [],
    estimates: estRes.estimates ?? [],
    customers: custRes.customers ?? [],
  };
}

export function OpsWorkspace() {
  const session = useSession();
  const [dashboard, setDashboard] = useState<OsDashboard | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [estCustomer, setEstCustomer] = useState("");
  const [estDesc, setEstDesc] = useState("");
  const [estAmount, setEstAmount] = useState("");
  const [payJob, setPayJob] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [invoiceBusy, setInvoiceBusy] = useState(false);

  function applySnapshot(snapshot: Snapshot) {
    setDashboard(snapshot.dashboard);
    setLeads(snapshot.leads);
    setJobs(snapshot.jobs);
    setEstimates(snapshot.estimates);
    setCustomers(snapshot.customers);
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
        to open the dashboard.
      </p>
    );
  }

  async function convertLead(id: string) {
    const res = await fetch("/api/service-business/jobs", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ fromLead: id }) });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) setError(data.error ?? "Could not create the job.");
    else await loadAll().then(applySnapshot);
  }

  async function addEstimate() {
    const customerId = estCustomer || customers[0]?.id;
    const amount = Math.round(Number(estAmount) * 100);
    const res = await fetch("/api/service-business/estimates", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ customerId, lineItems: [{ description: estDesc || "Service", quantity: 1, unitCents: amount }] }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) setError(data.error ?? "Could not create the estimate.");
    else {
      setEstDesc("");
      setEstAmount("");
      await loadAll().then(applySnapshot);
    }
  }

  async function sendInvoice() {
    const jobId = payJob || jobs[0]?.id;
    const amountCents = Math.round(Number(payAmount) * 100);
    setInvoiceBusy(true);
    const res = await fetch("/api/service-business/payments/checkout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId, amountCents }),
    });
    const data = (await res.json()) as { error?: string; url?: string };
    setInvoiceBusy(false);
    if (!res.ok || !data.url) setError(data.error ?? "Could not start Stripe Checkout.");
    else window.location.href = data.url;
  }

  async function addPayment() {
    const jobId = payJob || jobs[0]?.id;
    const amountCents = Math.round(Number(payAmount) * 100);
    const res = await fetch("/api/service-business/payments", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId, amountCents, method: "card" }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) setError(data.error ?? "Could not record payment.");
    else {
      setPayAmount("");
      await loadAll().then(applySnapshot);
    }
  }

  return (
    <div className="space-y-8">
      {dashboard && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{money(dashboard.revenueCents)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Leads this book</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{dashboard.leads.total}</p>
              <p className="text-xs text-muted-foreground">{dashboard.leads.new} new · {dashboard.leads.held} held</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Open jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{dashboard.jobs.open}</p>
              <p className="text-xs text-muted-foreground">{dashboard.jobs.upcoming} on the book this week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Lead allotment</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard.allotment ? (
                <>
                  <p className="text-2xl font-bold">{dashboard.allotment.remaining}</p>
                  <p className="text-xs text-muted-foreground">
                    {dashboard.allotment.used} of {dashboard.allotment.limit} used · {dashboard.allotment.period}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Create a business profile first.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {dashboard && (dashboard.warrantiesDue > 0 || dashboard.lowStock > 0) && (
        <p className="text-sm text-muted-foreground">
          {dashboard.warrantiesDue > 0 && (
            <Link href="/os/warranty" className="underline">
              {dashboard.warrantiesDue} warranty {dashboard.warrantiesDue === 1 ? "is" : "are"} due soon
            </Link>
          )}
          {dashboard.warrantiesDue > 0 && dashboard.lowStock > 0 && " · "}
          {dashboard.lowStock > 0 && (
            <Link href="/os/inventory" className="underline">
              {dashboard.lowStock} inventory {dashboard.lowStock === 1 ? "item is" : "items are"} low
            </Link>
          )}
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leads.length === 0 && <p className="text-sm text-muted-foreground">No marketplace leads yet.</p>}
            {leads.slice(0, 8).map((lead) => (
              <div key={lead.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">{lead.city} · {lead.trade} · {lead.status}{lead.held ? " (held)" : ""}</p>
                  {lead.description && <p className="mt-1 text-sm text-muted-foreground">{lead.description}</p>}
                </div>
                {lead.status !== "won" && (
                  <Button type="button" size="sm" variant="outline" onClick={() => void convertLead(lead.id)}>
                    Make job
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {jobs.length === 0 && <p className="text-sm text-muted-foreground">No jobs yet — convert a lead or add a customer in the CRM.</p>}
            {jobs.slice(0, 8).map((job) => (
              <div key={job.id} className="rounded-lg border border-border p-3">
                <p className="font-medium">{job.title}</p>
                <p className="text-xs text-muted-foreground">{job.status} · {job.id}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New estimate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <select value={estCustomer} onChange={(e) => setEstCustomer(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Customer…</option>
              {customers.filter((c) => !c.archived).map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
            <Input value={estDesc} onChange={(e) => setEstDesc(e.target.value)} placeholder="Line item" />
            <Input value={estAmount} onChange={(e) => setEstAmount(e.target.value)} placeholder="Amount (USD)" />
            <Button type="button" onClick={() => void addEstimate()}>Save estimate</Button>
            <ul className="space-y-2 text-sm">
              {estimates.slice(0, 5).map((estimate) => (
                <li key={estimate.id}>{money(estimate.totalCents)} · {estimate.status}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Record a payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <select value={payJob} onChange={(e) => setPayJob(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Job…</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
            <Input value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Amount (USD)" />
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void addPayment()}>Record paid</Button>
              <Button type="button" variant="outline" disabled={invoiceBusy} onClick={() => void sendInvoice()}>
                {invoiceBusy ? "Opening Stripe…" : "Send Stripe invoice"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Record cash/check/card collected on site, or send a Stripe Checkout link. Both land on the same ledger.
            </p>
            <Link href="/crm" className="block text-sm underline">Open CRM</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
