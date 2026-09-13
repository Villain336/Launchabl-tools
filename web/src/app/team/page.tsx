import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { TeamManager } from "@/components/team/team-manager";

export const metadata: Metadata = { title: "Team" };

export default function TeamPage() {
  return (
    <Container className="py-16 sm:py-24">
      <h1 className="text-3xl font-bold text-foreground">Team</h1>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">
        Give your agency or company a shared account — everyone keeps their own sign-in, an
        admin manages seats, and every membership and billing change is recorded in the{" "}
        <a href="/security" className="underline">
          audit log
        </a>
        .
      </p>
      <div className="mt-8 max-w-lg">
        <TeamManager />
      </div>
    </Container>
  );
}
