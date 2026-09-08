import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export default function CtaBlock() {
  return (
    <section className="flex w-full items-center justify-center bg-background px-6 py-12 text-foreground">
      <div className="w-full rounded-xl bg-primary px-8 py-16 sm:px-16 sm:py-20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to stop paying by the project?
            </h2>
            <p className="max-w-xl text-base text-primary-foreground/80">
              {siteConfig.price} once — {siteConfig.priceNote}. Submit as many marketing and
              design requests as you want, and we work through them one at a time.
            </p>
          </div>
          <div className="shrink-0">
            <Button
              variant="secondary"
              render={<Link href="/pricing" />}
              nativeButton={false}
              className="w-full sm:w-auto"
            >
              See what&apos;s included
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
