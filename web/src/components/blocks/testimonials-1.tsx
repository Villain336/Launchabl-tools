import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Quote } from "lucide-react";
import { caseStudies } from "@/lib/case-studies";

function getInitials(name: string) {
  return name
    .split(",")[0]
    .trim()
    .split(" ")
    .map((part) => part[0])
    .join("");
}

export default function TestimonialsBlock() {
  return (
    <section className="flex w-full items-center justify-center bg-background px-6 py-20 text-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-block rounded-md border border-border px-3 py-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Case studies
          </span>
          <h2 className="mt-4 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            Proof, not just promises
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Illustrative examples of how the free tools and the unlimited plan work together.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {caseStudies.map((study) => (
            <Link key={study.slug} href={`/case-studies/${study.slug}`}>
              <Card className="flex h-full flex-col gap-0 border-0 bg-card p-8 transition-colors duration-200 hover:bg-muted">
                <CardContent className="flex flex-1 flex-col gap-5 p-0">
                  <Quote className="size-8 text-foreground opacity-20" aria-hidden="true" />
                  <blockquote className="flex-1 text-base leading-relaxed text-foreground">
                    &ldquo;{study.quote.text}&rdquo;
                  </blockquote>
                </CardContent>

                <CardFooter className="mt-8 gap-4 border-t border-border px-0 pt-6 pb-8">
                  <Avatar className="size-10 border border-border">
                    <AvatarFallback className="text-xs font-semibold">
                      {getInitials(study.quote.author)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">{study.quote.author}</span>
                    <span className="text-xs text-muted-foreground">
                      {study.industry}, <span className="font-medium text-foreground">{study.client}</span>
                    </span>
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
