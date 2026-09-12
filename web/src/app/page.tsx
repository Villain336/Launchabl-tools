import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/agency-button";
import { siteConfig } from "@/lib/site-config";
import HeroBlock from "@/components/blocks/hero-2";
import WorldMapVisibility from "@/components/blocks/world-map-visibility";

export default function Home() {
  return (
    <>
      <HeroBlock />

      <WorldMapVisibility />

      <section className="border-t border-border bg-background py-16">
        <Container className="flex flex-col items-center text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Free tools now. A free audit next. Unlimited agency when you&apos;re ready.
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            The toolbox is free forever. Every plan starts with a free website audit, no account required.
            The unlimited plan is {siteConfig.price} once — no retainer. Everything else lives on the pages built for it.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/tools" size="lg">
              Browse tools <ArrowRight className="h-4 w-4" />
            </LinkButton>
            <LinkButton href={siteConfig.freeAudit.href} variant="secondary" size="lg">
              Get a free audit
            </LinkButton>
            <LinkButton href="/pricing" variant="secondary" size="lg">
              See pricing
            </LinkButton>
          </div>
        </Container>
      </section>
    </>
  );
}
