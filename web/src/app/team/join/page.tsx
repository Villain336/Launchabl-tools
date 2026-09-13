import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { AcceptInvite } from "@/components/team/accept-invite";

export const metadata: Metadata = { title: "Join a team", robots: { index: false, follow: true } };

export default async function TeamJoinPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto w-full max-w-sm rounded-card bg-surface p-6 shadow-card sm:p-8">
        <h1 className="mb-4 text-xl font-bold text-foreground">Join a team</h1>
        <AcceptInvite token={token} />
      </div>
    </Container>
  );
}
