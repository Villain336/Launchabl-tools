import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "About",
  description: "Why Launchable exists, and how the unlimited model actually works.",
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

export default function AboutPage() {
  return (
    <Container className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="About Launchable"
        title="One price. No retainers. No games."
        description="We built Launchable because most marketing agencies are either too expensive to try or too generic to trust. We wanted something a solo founder and a growing team could both rely on."
      />

      <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2">
        {principles.map((p) => (
          <div key={p.title} className="rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900">{p.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-3xl bg-slate-50 p-10">
        <h3 className="text-2xl font-bold text-slate-900">How the queue works</h3>
        <ol className="mt-6 space-y-4 text-sm text-slate-700">
          <li><strong>1. Submit a request.</strong> Describe what you need — a page, a campaign, a fix — in plain language.</li>
          <li><strong>2. It joins the queue.</strong> You can see exactly where your request sits and what&apos;s ahead of it.</li>
          <li><strong>3. We deliver, you review.</strong> Revisions are unlimited on any active request until you&apos;re happy.</li>
          <li><strong>4. Submit the next one.</strong> There&apos;s always a next one — that&apos;s what &ldquo;unlimited&rdquo; means here.</li>
        </ol>
      </div>
    </Container>
  );
}
