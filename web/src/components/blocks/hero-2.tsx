"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { ArrowRight } from "lucide-react";
import { siteConfig, tools } from "@/lib/site-config";

const LOGO = "/brand/logo.jpg";

const marqueeCards = (() => {
  const source = tools.length ? tools : [{ name: siteConfig.name, slug: "home" }];
  const cards = source.map((tool) => ({ src: LOGO, title: tool.name }));
  while (cards.length < 32) {
    cards.push(...cards.slice(0, 32 - cards.length));
  }
  return cards.slice(0, 32);
})();

export default function HeroBlock() {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-7rem)] w-full flex-col items-center justify-center overflow-hidden bg-background text-foreground">
      <ThreeDMarquee
        cards={marqueeCards}
        className="pointer-events-none absolute inset-0 h-full w-full rounded-none"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-background/30"
      />

      <div className="relative z-20 mx-auto w-full max-w-3xl px-6 py-20">
        <div className="flex flex-col items-center rounded-3xl border border-border/70 bg-background/80 px-6 py-10 text-center shadow-sm backdrop-blur-md sm:px-10">
        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
          Free toolbox. Unlimited agency. One price.
        </Badge>

        <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Marketing tools that actually ship — with an agency behind them
        </h1>

        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          {siteConfig.description}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Button render={<Link href="/tools" />} nativeButton={false} size="lg">
            Open the toolbox
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            render={<Link href="/pricing" />}
            nativeButton={false}
            className="bg-background/80 backdrop-blur-sm"
          >
            See the unlimited plan
          </Button>
        </div>
        </div>
      </div>
    </section>
  );
}
