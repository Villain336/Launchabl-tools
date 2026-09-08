import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClipboardCheck, Rocket, ShieldCheck, Search, RefreshCw, Clapperboard } from "lucide-react";
import Link from "next/link";
import { toolClusters } from "@/lib/site-config";

type IconProps = { className?: string; size?: number | string };

const clusterMeta: Record<
  string,
  { icon: (p: IconProps) => React.ReactNode; span: string; iconSize: string; titleSize: string; descSize: string }
> = {
  "audits-reports": {
    icon: (p) => <ClipboardCheck {...p} />,
    span: "md:col-span-2 md:row-span-2",
    iconSize: "size-10 md:size-14",
    titleSize: "text-base md:text-2xl",
    descSize: "text-sm md:text-base",
  },
  launch: { icon: (p) => <Rocket {...p} />, span: "", iconSize: "size-10", titleSize: "text-base", descSize: "text-sm" },
  protect: { icon: (p) => <ShieldCheck {...p} />, span: "", iconSize: "size-10", titleSize: "text-base", descSize: "text-sm" },
  "get-found": { icon: (p) => <Search {...p} />, span: "", iconSize: "size-10", titleSize: "text-base", descSize: "text-sm" },
  "convert-ship": { icon: (p) => <RefreshCw {...p} />, span: "", iconSize: "size-10", titleSize: "text-base", descSize: "text-sm" },
  "create-produce": {
    icon: (p) => <Clapperboard {...p} />,
    span: "",
    iconSize: "size-10",
    titleSize: "text-base",
    descSize: "text-sm",
  },
};

export default function BentoBlock() {
  const tiles = toolClusters
    .filter((c) => clusterMeta[c.slug])
    .sort((a, b) => (a.slug === "audits-reports" ? -1 : b.slug === "audits-reports" ? 1 : 0));

  return (
    <section className="flex w-full items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
            The toolbox
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Every tool lives inside one clear job
          </h2>
          <p className="mt-3 text-muted-foreground">
            Not a dumping ground of unrelated converters — pick the outcome you&apos;re after, and
            every tool in that cluster hands off to the next step.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:grid-rows-[auto_auto]">
          {tiles.map((cluster) => {
            const meta = clusterMeta[cluster.slug];
            const Icon = meta.icon;
            return (
              <Link key={cluster.slug} href={`/tools#${cluster.slug}`}>
                <Card
                  className={["flex h-full flex-col justify-between p-6 transition-colors hover:border-primary/40", meta.span]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <CardHeader className="p-0">
                    <span
                      className={[
                        "flex items-center justify-center rounded-lg border border-border bg-muted",
                        meta.iconSize,
                      ].join(" ")}
                    >
                      <Icon className="size-5" />
                    </span>
                    <CardTitle className={["mt-4 font-semibold", meta.titleSize].join(" ")}>
                      {cluster.name}
                    </CardTitle>
                    <CardDescription className={["mt-2", meta.descSize].join(" ")}>
                      {cluster.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
