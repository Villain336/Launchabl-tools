import { Separator } from "@/components/ui/separator";
import { tools, toolClusters } from "@/lib/site-config";

export default function StatsBlock() {
  const liveCount = tools.filter((t) => t.status === "live").length;
  const stats = [
    { value: `${tools.length}+`, label: "tools in the toolbox" },
    { value: `${liveCount}`, label: "live and ready to use today" },
    { value: `${toolClusters.length}`, label: "outcome clusters, not a junk drawer" },
    { value: "1", label: "flat price for the unlimited agency" },
  ];

  return (
    <section className="flex w-full items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Built to be used, not browsed
          </h2>
          <p className="mt-3 text-muted-foreground">
            No account required for the tools, and no retainer once you&apos;re in.
          </p>
        </div>

        <Separator className="mt-12" />
        <dl className="grid grid-cols-2 md:grid-cols-4">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center border-border px-6 py-8 text-center md:[&:nth-child(2)]:border-r [&:nth-child(odd)]:border-r"
            >
              <dt className="text-4xl font-bold tracking-tight sm:text-5xl">{value}</dt>
              <dd className="mt-2 text-sm text-muted-foreground">{label}</dd>
            </div>
          ))}
        </dl>
        <Separator />
      </div>
    </section>
  );
}
