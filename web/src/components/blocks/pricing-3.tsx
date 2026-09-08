import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Check, ArrowRight } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

const included = [
  "Unlimited design & marketing requests, queued one at a time",
  "Brand identity, website design, and ongoing site edits",
  "Copywriting for ads, email, and landing pages",
  "Technical SEO and structured data across your whole site",
  "Domain registration and managed hosting for your primary site",
  "Unlimited revisions on any request until you're happy",
];

export default function PricingBlock() {
  return (
    <section className="flex w-full items-center justify-center bg-background px-6 py-12 text-foreground">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="size-3" aria-hidden="true" />
            One plan. Full access.
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight">
            One price. No retainer. No surprises.
          </h2>
          <p className="text-sm text-muted-foreground">
            Everything you need to launch and grow, for a single flat fee.
          </p>
        </div>

        <Card className="w-full ring-1 ring-primary/30">
          <CardHeader className="gap-4 pb-0">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base font-semibold">Unlimited plan</CardTitle>
              <CardDescription>Design, web, content, and technical SEO — unlimited.</CardDescription>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-bold tracking-tight text-foreground">
                {siteConfig.price}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{siteConfig.priceNote}</p>
          </CardHeader>

          <CardContent className="flex flex-col gap-5 pt-4">
            <Separator />

            <ul className="flex flex-col gap-3">
              {included.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter className="flex-col gap-3 border-t bg-muted/30">
            <Button nativeButton={false} size="lg" className="w-full" render={<Link href="/solutions" />}>
              Get started
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              30-day results guarantee. Cancel anytime — there&apos;s nothing to cancel.
            </p>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
