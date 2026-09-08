import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Rocket, Wrench, Search, ShieldCheck, Film, FileCheck } from "lucide-react";
import { toolClusters } from "@/lib/site-config";

const icons = [Rocket, Wrench, Search, ShieldCheck, FileCheck, Film];

export default function BentoBlock() {
  return (
    <section className="flex w-full items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Every tool lives in an outcome cluster
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Not a junk drawer of converters. Six jobs a marketer, founder, or developer actually has.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
          {toolClusters.map((cluster, i) => {
            const Icon = icons[i] ?? Rocket;
            return (
              <Link
                key={cluster.slug}
                href={`/tools#${cluster.slug}`}
                className="flex flex-col gap-5 bg-card p-8 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-12 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-6 text-foreground" aria-hidden="true" />
                  </span>
                  <Badge variant="secondary">{cluster.name}</Badge>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="font-heading text-lg leading-snug font-semibold">{cluster.name}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{cluster.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
