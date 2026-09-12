import { Badge } from "@/components/ui/badge";
import { Wrench, Send, Repeat, Sparkles, Flag } from "lucide-react";
import type * as React from "react";

type IconProps = { className?: string; size?: number | string };
type IconRenderer = (props: IconProps) => React.ReactNode;
type Status = "Shipped" | "In Progress" | "Planned";

const milestones: {
  date: string;
  title: string;
  copy: string;
  icon: IconRenderer;
  status: Status;
}[] = [
  {
    date: "Start here",
    title: "Use a free tool",
    copy: "First run without an account. No credit card. See the quality before you ever pay.",
    icon: (p: IconProps) => <Wrench {...p} />,
    status: "Shipped",
  },
  {
    date: "When you're ready",
    title: "Buy once. Queue forever",
    copy: "One flat price unlocks unlimited design and marketing requests for life.",
    icon: (p: IconProps) => <Flag {...p} />,
    status: "Shipped",
  },
  {
    date: "The model",
    title: "One request at a time",
    copy: "We work the active request to done — unlimited revisions — then take the next one.",
    icon: (p: IconProps) => <Repeat {...p} />,
    status: "Shipped",
  },
  {
    date: "Submit",
    title: "Send the next brief",
    copy: "A page, a campaign, a technical SEO pass, a brand refresh. There's always a next one.",
    icon: (p: IconProps) => <Send {...p} />,
    status: "In Progress",
  },
  {
    date: "Coming",
    title: "Accounts, vault, and voting",
    copy: "Save outputs, vote on the public roadmap, and keep a history of every request.",
    icon: (p: IconProps) => <Sparkles {...p} />,
    status: "Planned",
  },
];

const statusVariant: Record<Status, "default" | "secondary" | "outline"> = {
  Shipped: "default",
  "In Progress": "secondary",
  Planned: "outline",
};

export default function TimelineBlock() {
  return (
    <section className="flex w-full items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-12">
          <Badge variant="outline" className="mb-4">
            How it works
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight">From free tool to unlimited queue</h2>
          <p className="mt-3 text-muted-foreground">
            The entire business model is one request in the queue at a time — it&apos;s what keeps quality high.
          </p>
        </div>

        <ol className="flex flex-col">
          {milestones.map((item, i) => {
            const last = i === milestones.length - 1;
            return (
              <li key={item.title} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-foreground">
                    <item.icon className="size-5" aria-hidden="true" />
                  </span>
                  {!last && <span className="w-px flex-1 bg-border" aria-hidden="true" />}
                </div>
                <div className={last ? "pb-0" : "pb-10"}>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">{item.date}</span>
                    <Badge variant={statusVariant[item.status]}>{item.status}</Badge>
                  </div>
                  <h3 className="mt-2 font-heading text-base font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm/relaxed text-muted-foreground">{item.copy}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
