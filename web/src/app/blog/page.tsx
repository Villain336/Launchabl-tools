import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "Blog",
  description: "SEO and marketing guides, written alongside the tools they support.",
};

const posts = [
  {
    title: "Why every JPEG you post online is leaking your location",
    excerpt: "A plain-language walkthrough of EXIF metadata, what it exposes, and how to strip it before you hit publish.",
  },
  {
    title: "Schema markup for local businesses: the 6 types that matter",
    excerpt: "Most local sites are missing LocalBusiness and FAQ schema. Here's what to add first, and how to check what you're missing.",
  },
  {
    title: "Static vs. dynamic QR codes: when a printed code needs to change",
    excerpt: "If you'll ever need to update where a QR code points after printing, you need a dynamic code. Here's how to tell which you need.",
  },
];

export default function BlogPage() {
  return (
    <Container className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="Blog"
        title="Guides that pair with the tools"
        description="Every flagship tool has a companion guide explaining the 'why,' not just the 'how.' This keeps the tools useful and the site indexable."
      />
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article key={post.title} className="rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900">{post.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-indigo-600">Coming soon</p>
          </article>
        ))}
      </div>
    </Container>
  );
}
