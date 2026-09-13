import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { OsSubnav } from "@/components/service-business/os-subnav";
import { CrmManager } from "@/components/service-business/crm-manager";

export const metadata: Metadata = { title: "CRM" };

export default function CrmPage() {
  return (
    <Container className="py-16 sm:py-24">
      <OsSubnav current="/crm" />
      <h1 className="text-3xl font-bold text-foreground">CRM</h1>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">
        Your unified customer profiles, business trades, and the knowledge notes your AI agent is
        building up from every job — all scoped to your team account. See the{" "}
        <a href="/security" className="underline">
          audit log
        </a>{" "}
        for a record of every change.
      </p>
      <div className="mt-8 max-w-2xl">
        <CrmManager />
      </div>
    </Container>
  );
}
