"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Customer } from "@/lib/service-business/customer";
import type { Job } from "@/lib/service-business/job";
import type { WarrantyRecord } from "@/lib/service-business/warranty";

function dueSoon(record: WarrantyRecord): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (record.endOn < today) return false;
  const remindFrom = new Date(`${record.endOn}T00:00:00.000Z`);
  remindFrom.setUTCDate(remindFrom.getUTCDate() - Math.max(0, record.reminderDaysBefore));
  return remindFrom.toISOString().slice(0, 10) <= today;
}

export function WarrantyWorkspace() {
  const session = useSession();
  const [records, setRecords] = useState<WarrantyRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [jobId, setJobId] = useState("");
  const [coverage, setCoverage] = useState("");
  const [endOn, setEndOn] = useState("");
  const [reminderDays, setReminderDays] = useState("14");

  type Snapshot = { records: WarrantyRecord[]; customers: Customer[]; jobs: Job[] };

  function applySnapshot(next: Snapshot) {
    setRecords(next.records);
    setCustomers(next.customers);
    setJobs(next.jobs);
  }

  async function loadAll(): Promise<Snapshot> {
    const [warr, cust, jobRes] = await Promise.all([
      fetch("/api/service-business/warranty", { credentials: "same-origin", cache: "no-store" }).then((r) => r.json()),
      fetch("/api/service-business/customers", { credentials: "same-origin", cache: "no-store" }).then((r) => r.json()),
      fetch("/api/service-business/jobs", { credentials: "same-origin", cache: "no-store" }).then((r) => r.json()),
    ]);
    return { records: warr.warranties ?? [], customers: cust.customers ?? [], jobs: jobRes.jobs ?? [] };
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
        to track warranties.
      </p>
    );
  }

  async function addRecord() {
    const res = await fetch("/api/service-business/warranty", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customerId: customerId || customers[0]?.id,
        jobId: jobId || null,
        coverage: coverage || "Workmanship",
        endOn,
        reminderDaysBefore: Number(reminderDays),
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) setError(data.error ?? "Could not save the warranty.");
    else {
      setCoverage("");
      setEndOn("");
      setError(null);
      await loadAll().then(applySnapshot);
    }
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Card>
        <CardHeader>
          <CardTitle>New coverage</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Customer…</option>
            {customers.filter((c) => !c.archived).map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
          <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Linked job (optional)</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
          <Input value={coverage} onChange={(e) => setCoverage(e.target.value)} placeholder="Coverage (parts, labor, seasonal visit)" />
          <Input type="date" value={endOn} onChange={(e) => setEndOn(e.target.value)} />
          <Input value={reminderDays} onChange={(e) => setReminderDays(e.target.value)} placeholder="Remind this many days before" />
          <Button type="button" onClick={() => void addRecord()}>Save warranty</Button>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {records.length === 0 && <p className="text-sm text-muted-foreground">No warranties on file yet.</p>}
        {records.map((record) => (
          <Card key={record.id}>
            <CardContent className="pt-6">
              <p className="font-medium">{record.coverage}</p>
              <p className="text-xs text-muted-foreground">
                {record.startOn} → {record.endOn}
                {dueSoon(record) ? " · due soon" : ""}
                {record.lastRemindedAt ? " · reminder sent" : ""}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
