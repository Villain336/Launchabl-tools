"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <BackgroundBeamsWithCollision className="min-h-[70vh] h-auto from-background to-muted">
      <div className="relative z-20 mx-auto max-w-xl px-6 text-center">
        <p className="text-sm font-semibold tracking-[0.2em] text-primary uppercase">500 / 505</p>
        <h1 className="mt-4 font-heading text-4xl font-bold tracking-tight text-foreground md:text-6xl">
          Something{" "}
          <span className="relative inline-block">
            <span className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 bg-clip-text text-transparent blur-sm">
              exploded
            </span>
            <span className="relative bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 bg-clip-text text-transparent">
              exploded
            </span>
          </span>{" "}
          on our side.
        </h1>
        <p className="mt-4 text-muted-foreground">
          A server error interrupted this page. Try again, or go back to a page that still works.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="outline" render={<Link href="/" />} nativeButton={false}>
            Go home
          </Button>
        </div>
      </div>
    </BackgroundBeamsWithCollision>
  );
}
