"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth/use-session";
import { Button } from "@/components/ui/button";

export function AcceptInvite({ token }: { token: string }) {
  const session = useSession();
  const [status, setStatus] = useState<"idle" | "accepting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!token) return <p className="text-sm text-muted-foreground">This invite link is missing a token.</p>;
  if (session.status !== "ready") return null;
  if (!session.user) {
    return (
      <p className="text-sm text-muted-foreground">
        <Link href={`/sign-in?next=${encodeURIComponent(`/team/join?token=${token}`)}`} className="text-primary underline">
          Sign in
        </Link>{" "}
        with the email address this invite was sent to, then come back to this link.
      </p>
    );
  }
  if (status === "done") return <p className="text-sm text-emerald-600">You&apos;re in. <Link href="/team" className="underline">Go to your team</Link>.</p>;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Accept this invite as {session.user.email}?</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        disabled={status === "accepting"}
        onClick={async () => {
          setStatus("accepting");
          setError(null);
          const res = await fetch("/api/orgs/invites/accept", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          if (!res.ok) {
            setError(body.error ?? "Couldn't accept that invite.");
            setStatus("error");
            return;
          }
          setStatus("done");
        }}
      >
        Accept invite
      </Button>
    </div>
  );
}
