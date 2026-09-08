import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sparkles, ArrowRight, ArrowUpRight } from "lucide-react";
import { toolClusters } from "@/lib/site-config";

export default function HeroBlock() {
  return (
    <section className="flex w-full items-center justify-center bg-background px-6 py-16 text-foreground sm:py-24">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <Badge variant="secondary">
          <Sparkles data-icon="inline-start" aria-hidden="true" />
          Free tools. Unlimited agency. One price.
        </Badge>

        <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          The marketing platform with a free toolbox and an unlimited agency behind it
        </h1>

        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Dozens of real marketing and dev tools, free to use right now — plus an unlimited
          design, web, and marketing agency behind them for a single flat price. No retainers,
          no surprise invoices.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Button render={<Link href="/tools" />} nativeButton={false}>
            Try a free tool
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            render={<Link href="/pricing" />}
            nativeButton={false}
          >
            See the unlimited plan
            <ArrowUpRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          No account required to use the tools. No credit card to look around.
        </p>

        <Separator className="mt-12 w-full max-w-xl" />

        <p className="mt-6 text-sm text-muted-foreground">
          Every tool lives inside one clear outcome cluster.
        </p>

        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {toolClusters.map((cluster) => (
            <li
              key={cluster.slug}
              className="text-base font-bold tracking-tight text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              {cluster.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
