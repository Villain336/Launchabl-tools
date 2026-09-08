import Link from "next/link";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <BackgroundBeamsWithCollision className="min-h-[70vh] h-auto from-background to-muted">
      <div className="relative z-20 mx-auto max-w-xl px-6 text-center">
        <p className="text-sm font-semibold tracking-[0.2em] text-primary uppercase">404</p>
        <h1 className="mt-4 font-heading text-4xl font-bold tracking-tight text-foreground md:text-6xl">
          This page{" "}
          <span className="relative inline-block">
            <span className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 bg-clip-text text-transparent blur-sm">
              launched
            </span>
            <span className="relative bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 bg-clip-text text-transparent">
              launched
            </span>
          </span>{" "}
          without us.
        </h1>
        <p className="mt-4 text-muted-foreground">
          The URL doesn&apos;t match a tool, case study, or page. Head back to the toolbox or the homepage.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button render={<Link href="/" />} nativeButton={false}>
            Go home
          </Button>
          <Button variant="outline" render={<Link href="/tools" />} nativeButton={false}>
            Open the toolbox
          </Button>
        </div>
      </div>
    </BackgroundBeamsWithCollision>
  );
}
