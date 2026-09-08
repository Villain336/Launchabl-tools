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
import { Check, X, ShieldCheck, ArrowRight } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

const ours = [
  "Real audits, kits, and reports — not another QR clone",
  "Tools that run in the browser when they can, so files stay yours",
  "Every tool ends in a next step, not a dead end",
  "Unlimited design & marketing requests, queued one at a time",
  "One flat price. No retainer. Nothing to cancel",
  "Domain + hosting included for your primary site",
];

const others = [
  "A wall of converters with ads and no point of view",
  "Upload your files to a random server and hope",
  "Finish a tool and get dumped on a signup wall",
  "Hourly retainers that punish you for asking for more",
  "Scope negotiations every time you need a new page",
  "You buy the domain. You figure out hosting. They disappear",
];

function CheckRow({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-md bg-primary">
        <Check className="size-3 text-primary-foreground" aria-hidden />
      </span>
      <span className="text-sm text-foreground">{text}</span>
    </li>
  );
}

function CrossRow({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-md bg-muted">
        <X className="size-3 text-muted-foreground" aria-hidden />
      </span>
      <span className="text-sm text-muted-foreground">{text}</span>
    </li>
  );
}

export default function ComparisonBlock() {
  return (
    <section className="flex w-full items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-10 text-center">
          <Badge variant="outline" className="mb-4">
            <ShieldCheck data-icon="inline-start" />
            Why {siteConfig.name}
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Built differently, on purpose
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Most &ldquo;marketing tool&rdquo; sites are a pile of converters. We built a toolbox that
            proves the work — then an unlimited agency behind it.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-primary/30 ring-1 ring-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">{siteConfig.name}</CardTitle>
                <Badge variant="default">Recommended</Badge>
              </div>
              <CardDescription>Free tools plus a one-time unlimited plan.</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <ul className="flex flex-col gap-3">
                {ours.map((point) => (
                  <CheckRow key={point} text={point} />
                ))}
              </ul>
            </CardContent>
            <CardFooter className="border-t">
              <Button nativeButton={false} className="w-full" render={<Link href="/pricing" />}>
                Get the unlimited plan
                <ArrowRight data-icon="inline-end" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-muted-foreground">
                Typical tool sites
              </CardTitle>
              <CardDescription>The pattern you already know, and already bounce from.</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <ul className="flex flex-col gap-3">
                {others.map((point) => (
                  <CrossRow key={point} text={point} />
                ))}
              </ul>
            </CardContent>
            <CardFooter className="border-t">
              <Button variant="secondary" nativeButton={false} className="w-full" render={<Link href="/tools" />}>
                Try a free tool first
                <ArrowRight data-icon="inline-end" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
