import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/agency-badge";
import { tools } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "What we're building next, in public.",
};

const columns: { title: string; statuses: ("live" | "beta" | "coming-soon")[] }[] = [
  { title: "Shipped", statuses: ["live"] },
  { title: "In beta", statuses: ["beta"] },
  { title: "Building next", statuses: ["coming-soon"] },
];

export default function RoadmapPage() {
  return (
    <Container className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="Public roadmap"
        title="Built in the open"
        description="Every tool on this platform started here. This page is the same trust mechanic our unlimited request queue runs on — nothing happens in a black box."
      />

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {columns.map((col) => (
          <div key={col.title} className="rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900">{col.title}</h3>
            <ul className="mt-4 space-y-3">
              {tools
                .filter((t) => col.statuses.includes(t.status))
                .map((t) => (
                  <li key={t.slug} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    {t.name}
                    <Badge tone={t.status === "live" ? "success" : t.status === "beta" ? "info" : "warning"}>
                      {t.status}
                    </Badge>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm text-slate-500">
        Want to vote on what ships next? Voting + suggestions are on the roadmap for this
        roadmap page itself — a good example of eating our own dog food.
      </p>
    </Container>
  );
}
