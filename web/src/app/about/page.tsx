import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TimelineBlock from "@/components/blocks/timeline-1";
import StatsBlock from "@/components/blocks/stats-1";

export const metadata: Metadata = {
  title: "About",
  description: "Why Launchabl exists, and how the unlimited model actually works.",
};

const principles = [
  {
    title: "Free tools aren't a lead magnet — they're a product",
    body: "Most agencies bolt a calculator onto their homepage and call it 'value.' Our tools are built to be genuinely useful on their own, with or without you ever buying anything.",
  },
  {
    title: "Unlimited means one request at a time, done well",
    body: "We don't take on unlimited work simultaneously — we take unlimited requests over time, worked through one at a time so quality never slips.",
  },
  {
    title: "Transparency is the trust mechanic",
    body: "A public roadmap, a visible request queue, and clear data-handling notes on every tool — the platform should never ask you to trust a black box.",
  },
  {
    title: "Your data stays yours",
    body: "Wherever a tool can run entirely in your browser, it does. We say so explicitly on every tool page, because 'trust us' isn't good enough.",
  },
];

const queueSteps = [
  { number: "01", title: "Submit a request", body: "Describe what you need — a page, a campaign, a fix — in plain language." },
  { number: "02", title: "It joins the queue", body: "You can see exactly where your request sits and what's ahead of it." },
  { number: "03", title: "We deliver, you review", body: "Revisions are unlimited on any active request until you're happy." },
  { number: "04", title: "Submit the next one", body: "There's always a next one — that's what \"unlimited\" means here." },
];

export default function AboutPage() {
  return (
    <>
    <Container className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="About Launchabl"
        title="One price. No retainers. No games."
        description="We built Launchabl because most marketing agencies are either too expensive to try or too generic to trust. We wanted something a solo founder and a growing team could both rely on."
      />

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {principles.map((p) => (
          <Card key={p.title} className="p-6">
            <CardHeader className="p-0">
              <CardTitle className="text-lg font-semibold">{p.title}</CardTitle>
              <CardDescription className="mt-1">{p.body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="mt-16">
        <h3 className="text-2xl font-bold text-foreground">How the queue works</h3>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {queueSteps.map((step) => (
            <Card key={step.number} className="relative p-6">
              <Badge variant="secondary" className="absolute top-6 right-6 font-mono text-xs tabular-nums">
                {step.number}
              </Badge>
              <CardHeader className="p-0">
                <CardTitle className="text-base font-semibold">{step.title}</CardTitle>
                <CardDescription className="mt-2">{step.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </Container>
      <TimelineBlock />
      <StatsBlock />
    </>
  );
}
