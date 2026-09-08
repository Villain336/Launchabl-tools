import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wrench, Send, Repeat } from "lucide-react";

type IconProps = { className?: string; size?: number | string };

const steps = [
  {
    number: "01",
    icon: (p: IconProps) => <Wrench {...p} />,
    title: "Start free with the tools",
    copy: "Use any tool in the toolbox right now — no account, no credit card. See the quality before you ever pay.",
  },
  {
    number: "02",
    icon: (p: IconProps) => <Send {...p} />,
    title: "Submit unlimited requests",
    copy: "One flat price unlocks the request queue. Submit as many design and marketing requests as you want.",
  },
  {
    number: "03",
    icon: (p: IconProps) => <Repeat {...p} />,
    title: "We work through them, one at a time",
    copy: "Every request gets full attention and unlimited revisions before we move to the next — no rushed work.",
  },
];

export default function HowItWorksBlock() {
  return (
    <section className="flex w-full items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
            How it works
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            One flat price. A visible queue. No retainer.
          </h2>
          <p className="mt-3 text-muted-foreground">
            The entire business model is one request in the queue at a time — it&apos;s what keeps quality high.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {steps.map(({ number, icon: Icon, title, copy }) => (
            <Card key={number} className="relative p-6">
              <Badge variant="secondary" className="absolute top-6 right-6 font-mono text-xs tabular-nums">
                {number}
              </Badge>

              <CardHeader className="p-0">
                <span className="flex size-12 items-center justify-center rounded-lg border border-border bg-muted">
                  <Icon className="size-5 text-foreground" aria-hidden="true" />
                </span>

                <CardTitle className="mt-5 text-base font-semibold">{title}</CardTitle>
                <CardDescription className="mt-2 text-sm">{copy}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
