"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Check } from "lucide-react";
import { siteConfig, toolClusters, tools } from "@/lib/site-config";

const TRUST_ITEMS = [
  "No account required to use the tools",
  `${siteConfig.price} once for unlimited agency work`,
  "One request in the queue at a time — quality never drops",
];

const liveCount = tools.filter((t) => t.status === "live").length;

export default function HeroBlock() {
  return (
    <section className="relative isolate flex w-full items-center justify-center overflow-hidden bg-background px-6 py-16 text-foreground sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_80%_10%,var(--color-primary)/0.18,transparent)]"
      />
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 md:grid-cols-2 md:items-center md:gap-16">
        <div className="flex flex-col">
          <Badge variant="outline" className="w-fit">
            Free toolbox. Unlimited agency. One price.
          </Badge>

          <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Marketing tools that actually ship — with an agency behind them
          </h1>

          <p className="mt-5 text-lg text-muted-foreground">
            {siteConfig.description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button render={<Link href="/tools" />} nativeButton={false} size="lg" className="w-full sm:w-auto">
              Open the toolbox
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              render={<Link href="/pricing" />}
              nativeButton={false}
              className="w-full sm:w-auto"
            >
              See the unlimited plan
            </Button>
          </div>

          <Separator className="my-8" />

          <ul className="flex flex-col gap-2.5">
            {TRUST_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="rounded-xl border border-border bg-card p-1 shadow-sm">
            <div className="flex items-center gap-1.5 rounded-t-lg border-b border-border bg-muted px-3 py-2">
              <span className="size-2.5 rounded-full bg-[#FF5F57]" />
              <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="size-2.5 rounded-full bg-[#28C840]" />
              <span className="ml-3 h-4 flex-1 rounded-md border border-border bg-background text-[10px] leading-4 text-muted-foreground">
                launchabl.app/tools
              </span>
            </div>

            <div className="flex flex-col gap-3 rounded-b-lg bg-background p-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Live tools", value: String(liveCount), change: "Free to use now" },
                  { label: "Clusters", value: String(toolClusters.length), change: "By real outcome" },
                  { label: "Unlimited plan", value: siteConfig.price, change: "One-time, lifetime" },
                  { label: "Queue", value: "1", change: "Request at a time" },
                ].map((row) => (
                  <div key={row.label} className="flex flex-col rounded-lg border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                    <p className="mt-1 text-lg font-bold tabular-nums">{row.value}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{row.change}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold">What the toolbox is for</p>
                  <Badge variant="secondary" className="text-xs">
                    Outcome clusters
                  </Badge>
                </div>
                <div className="flex h-28 items-end gap-1">
                  {toolClusters.map((cluster, i) => {
                    const heights = [62, 78, 55, 88, 96, 70];
                    return (
                      <div
                        key={cluster.slug}
                        className="flex-1 rounded-t-sm bg-primary/70"
                        style={{ height: `${heights[i] ?? 60}%` }}
                        title={cluster.name}
                        aria-hidden="true"
                      />
                    );
                  })}
                </div>
                <div className="mt-2 flex justify-between gap-1">
                  {toolClusters.map((cluster) => (
                    <span key={cluster.slug} className="flex-1 truncate text-center text-[10px] text-muted-foreground">
                      {cluster.name.split(" ")[0]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            className="absolute -right-3 -bottom-3 -z-10 size-full rounded-xl border border-border bg-muted"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}
