import { Check, X } from "lucide-react";

const included = [
  {
    label: "Unlimited design & marketing requests",
    detail: "Queued one at a time, so quality never drops as volume goes up.",
  },
  {
    label: "Brand identity & website design",
    detail: "Full brand systems, landing pages, and ongoing site edits.",
  },
  {
    label: "Copywriting for ads, email, and landing pages",
    detail: "Original copy for every channel, written for your voice.",
  },
  {
    label: "Technical SEO & structured data",
    detail: "Schema markup and technical fixes across your whole site.",
  },
  {
    label: "Domain registration & managed hosting",
    detail: "Your primary site's domain and hosting, handled for you.",
  },
  {
    label: "Unlimited revisions",
    detail: "Every request gets revised until you're actually happy with it.",
  },
];

const notIncluded = [
  {
    label: "Custom software / app development",
    detail: "Marketing and design requests only — not application engineering.",
  },
  {
    label: "Paid ad spend",
    detail: "We design the ads; you fund the media budget with the platform.",
  },
  {
    label: "More than one active request at a time",
    detail: "One request in the queue keeps every deliverable getting full attention.",
  },
  {
    label: "Rush delivery outside the standard queue",
    detail: "Available as a paid add-on when you need something sooner.",
  },
];

export default function FeaturesBlock() {
  return (
    <section className="flex w-full items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-12 max-w-xl">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            What&apos;s in the plan
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            No hidden add-ons. No surprises.
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            One plan, one price. Here&apos;s exactly what&apos;s covered — and what isn&apos;t.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-12 gap-y-0 sm:grid-cols-2">
          {included.map(({ label, detail }) => (
            <div key={label} className="flex items-start gap-3 border-t border-border py-4">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Check className="size-3" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm leading-snug font-semibold">{label}</span>
                <span className="text-sm leading-snug text-muted-foreground">{detail}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 max-w-xl">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            What&apos;s not included
          </p>
        </div>
        <div className="grid grid-cols-1 gap-x-12 gap-y-0 sm:grid-cols-2">
          {notIncluded.map(({ label, detail }) => (
            <div key={label} className="flex items-start gap-3 border-t border-border py-4">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <X className="size-3" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm leading-snug font-semibold text-muted-foreground">{label}</span>
                <span className="text-sm leading-snug text-muted-foreground">{detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
