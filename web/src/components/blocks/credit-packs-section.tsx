"use client";

import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreditPacksCard } from "@/components/billing/credit-packs-card";

/**
 * Sits between the Tools Pro subscription card and the rest of /pricing —
 * the credit-pack alternative for accounts that hit the pro-tool trial
 * wall but don't run those tools often enough to justify a subscription.
 */
export function CreditPacksSection() {
  const router = useRouter();

  return (
    <section className="flex w-full items-center justify-center bg-background px-6 py-4">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <Badge variant="outline" className="gap-1">
            <Zap className="size-3" aria-hidden="true" />
            For occasional use
          </Badge>
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Or buy credits instead</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Only reach for the image generator, transcriber or clip finder every once in a while? Buy a batch of
            credits instead of subscribing — they never expire and cover exactly the tools Tools Pro does.
          </p>
        </div>

        <CreditPacksCard onSignInRequired={() => router.push(`/sign-in?next=${encodeURIComponent("/pricing")}`)} />
      </div>
    </section>
  );
}
