import type { KeyValueStore } from "@/lib/ai/store";
import { getStore } from "@/lib/ai/store";
import { listCustomers } from "./customer";
import { listEstimates } from "./estimate";
import { listJobs } from "./job";
import { listLeadsForOrg, readAllotment } from "./lead";
import { listPayments } from "./payment";
import { getServiceBusinessProfile } from "./profile";

export type OsDashboard = {
  customers: number;
  leads: { total: number; new: number; held: number; won: number };
  jobs: { total: number; open: number; completed: number };
  estimates: { total: number; accepted: number; pipelineCents: number };
  revenueCents: number;
  allotment: { period: string; used: number; limit: number; remaining: number } | null;
};

export async function readOsDashboard(orgId: string, store: KeyValueStore = getStore()): Promise<OsDashboard> {
  const [customers, leads, jobs, estimates, payments, profile] = await Promise.all([
    listCustomers(orgId, store),
    listLeadsForOrg(orgId, store),
    listJobs(orgId, store),
    listEstimates(orgId, store),
    listPayments(orgId, store),
    getServiceBusinessProfile(orgId, store),
  ]);
  const activeCustomers = customers.filter((c) => !c.archived);
  const revenueCents = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amountCents, 0);
  const pipelineCents = estimates.filter((e) => e.status === "sent" || e.status === "draft").reduce((sum, e) => sum + e.totalCents, 0);
  const allotment = profile ? await readAllotment(orgId, profile.leadTier, store) : null;
  return {
    customers: activeCustomers.length,
    leads: {
      total: leads.length,
      new: leads.filter((l) => l.status === "new").length,
      held: leads.filter((l) => l.held).length,
      won: leads.filter((l) => l.status === "won").length,
    },
    jobs: {
      total: jobs.length,
      open: jobs.filter((j) => j.status === "scheduled" || j.status === "in_progress").length,
      completed: jobs.filter((j) => j.status === "completed").length,
    },
    estimates: {
      total: estimates.length,
      accepted: estimates.filter((e) => e.status === "accepted").length,
      pipelineCents,
    },
    revenueCents,
    allotment,
  };
}
