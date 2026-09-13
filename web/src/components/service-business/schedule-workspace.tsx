"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Customer } from "@/lib/service-business/customer";
import type { Job } from "@/lib/service-business/job";

type Member = { uid: string; email: string; name: string | null };

function localInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function dayKey(iso: string | null): string {
  if (!iso) return "Unscheduled";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unscheduled";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function ScheduleWorkspace() {
  const session = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [title, setTitle] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [driveMinutes, setDriveMinutes] = useState("20");
  const [address, setAddress] = useState("");
  const [assignedUid, setAssignedUid] = useState("");

  function applySnapshot(next: { jobs: Job[]; customers: Customer[]; members: Member[] }) {
    setJobs(next.jobs);
    setCustomers(next.customers);
    setMembers(next.members);
  }

  async function loadAll(): Promise<{ jobs: Job[]; customers: Customer[]; members: Member[] }> {
    const [jobRes, custRes, orgRes] = await Promise.all([
      fetch("/api/service-business/jobs", { credentials: "same-origin", cache: "no-store" }).then((r) => r.json()),
      fetch("/api/service-business/customers", { credentials: "same-origin", cache: "no-store" }).then((r) => r.json()),
      fetch("/api/orgs", { credentials: "same-origin", cache: "no-store" }).then((r) => r.json()),
    ]);
    return { jobs: jobRes.jobs ?? [], customers: custRes.customers ?? [], members: orgRes.members ?? [] };
  }

  useEffect(() => {
    if (session.status === "ready" && session.user) void loadAll().then(applySnapshot);
  }, [session.status, session.user]);

  const grouped = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const job of [...jobs].sort((a, b) => (a.scheduledFor ?? "").localeCompare(b.scheduledFor ?? ""))) {
      const key = dayKey(job.scheduledFor);
      map.set(key, [...(map.get(key) ?? []), job]);
    }
    return Array.from(map.entries());
  }, [jobs]);

  if (session.status !== "ready") return null;
  if (!session.user) {
    return (
      <p className="text-sm text-muted-foreground">
        <a href="/sign-in" className="underline">
          Sign in
        </a>{" "}
        to open the schedule.
      </p>
    );
  }

  async function addJob() {
    const res = await fetch("/api/service-business/jobs", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customerId: customerId || customers[0]?.id,
        title: title || "Scheduled job",
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
        durationMinutes: Number(durationMinutes),
        driveMinutes: Number(driveMinutes),
        address,
        assignedUid: assignedUid || null,
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) setError(data.error ?? "Could not schedule the job.");
    else {
      setTitle("");
      setAddress("");
      setError(null);
      await loadAll().then(applySnapshot);
    }
  }

  async function reschedule(job: Job, next: string) {
    const res = await fetch("/api/service-business/jobs", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: job.id, scheduledFor: next ? new Date(next).toISOString() : null }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) setError(data.error ?? "Could not move that job.");
    else await loadAll().then(applySnapshot);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Book a job</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Customer…</option>
            {customers.filter((c) => !c.archived).map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job title" />
          <Input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
          <Input value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="Minutes on site" />
          <Input value={driveMinutes} onChange={(e) => setDriveMinutes(e.target.value)} placeholder="Drive time (minutes)" />
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Job address" />
          <select value={assignedUid} onChange={(e) => setAssignedUid(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.uid} value={member.uid}>{member.name || member.email}</option>
            ))}
          </select>
          <Button type="button" onClick={() => void addJob()}>Add to the book</Button>
          <p className="text-xs text-muted-foreground">
            Overlaps are blocked for the same crew member, including drive time before the start.
          </p>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {grouped.length === 0 && <p className="text-sm text-muted-foreground">No jobs on the book yet.</p>}
        {grouped.map(([day, dayJobs]) => (
          <Card key={day}>
            <CardHeader>
              <CardTitle>{day}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dayJobs.map((job) => (
                <div key={job.id} className="rounded-lg border border-border p-3">
                  <p className="font-medium">{job.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.durationMinutes} min on site · {job.driveMinutes} min drive
                    {job.address ? ` · ${job.address}` : ""} · {job.status}
                  </p>
                  <Input
                    className="mt-2"
                    type="datetime-local"
                    value={localInput(job.scheduledFor)}
                    onChange={(e) => void reschedule(job, e.target.value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
