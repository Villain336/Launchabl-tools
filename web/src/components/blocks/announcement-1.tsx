"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Megaphone, X } from "lucide-react";

export default function AnnouncementBlock() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex w-full items-center justify-between gap-3 bg-primary px-4 py-2.5 text-primary-foreground">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Megaphone className="size-4 shrink-0" aria-hidden="true" />
          <span>
            Free tools are live — the unlimited plan is a one-time price, no retainer.{" "}
            <Button
              variant="link"
              size="sm"
              render={<Link href="/pricing" />}
              nativeButton={false}
              className="h-auto p-0 text-primary-foreground underline underline-offset-2 hover:text-primary-foreground/80"
            >
              See pricing
            </Button>
          </span>
        </p>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Dismiss announcement"
          onClick={() => setDismissed(true)}
          className="shrink-0 hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          <X aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
