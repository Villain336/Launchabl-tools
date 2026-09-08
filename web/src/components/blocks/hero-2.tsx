"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { ArrowRight, Check } from "lucide-react";
import { siteConfig, tools } from "@/lib/site-config";

const TRUST_ITEMS = [
  "No account required to use the tools",
  `${siteConfig.price} once for unlimited agency work`,
  "One request in the queue at a time — quality never drops",
];

const LOGO = "/brand/logo.jpg";

const marqueeCards = (() => {
  const live = tools.filter((t) => t.status === "live" || t.status === "beta");
  const source = live.length >= 8 ? live : tools;
  const cards = source.map((tool) => ({ src: LOGO, title: tool.name }));
  while (cards.length < 16) {
    cards.push(...cards.slice(0, 16 - cards.length));
  }
  return cards.slice(0, 16);
})();

export default function HeroBlock() {
  return (
    <section className="relative isolate flex w-full items-center justify-center overflow-hidden bg-background px-6 py-16 text-foreground sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_80%_10%,var(--color-primary)/0.18,transparent)]"
      />
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center lg:gap-10">
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

        <div className="relative min-w-0">
          <ThreeDMarquee
            cards={marqueeCards}
            className="h-[28rem] bg-neutral-950 ring-1 ring-[#FF6600]/20 sm:h-[32rem] lg:h-[36rem]"
          />
        </div>
      </div>
    </section>
  );
}
