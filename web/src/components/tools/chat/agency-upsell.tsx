"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { track } from "@/components/analytics";
import { useArtifactSession } from "@/components/tools/chat/artifact-session";
import { siteConfig } from "@/lib/site-config";
import { sendBeaconJson } from "@/lib/chat/beacon";
import type { UpsellKind } from "@/lib/ai/usage";

/**
 * "Want this done for you?" — shown under reports that found real problems.
 * The free tools are the top of the funnel; this is the one place they
 * point at the agency, and only when there's something concrete to fix.
 */

const DISMISS_KEY = "launchabl.upsell.dismissedAt";
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

let dismissedThisPage = false;

function dismissed(): boolean {
  if (dismissedThisPage) return true;
  try {
    const at = Number(window.localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < DISMISS_FOR_MS;
  } catch {
    return false;
  }
}

// Dismissal is shared by every card on the page (and across tabs), so it's an
// external store rather than per-card state.
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
const hiddenOnServer = () => true;

function dismiss() {
  dismissedThisPage = true;
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // storage unavailable; the in-memory flag still hides the cards for this page view
  }
  for (const listener of listeners) listener();
}

export function sendUpsellEvent(slug: string, kind: UpsellKind) {
  track(`upsell_${kind}`, { tool: slug });
  sendBeaconJson("/api/upsell", { slug, kind });
}

export function AgencyUpsell({ issues, noun = "issue" }: { issues: number; noun?: string }) {
  const { slug } = useArtifactSession();
  const hidden = useSyncExternalStore(subscribe, dismissed, hiddenOnServer);
  const visible = !hidden && issues > 0;
  const ref = useRef<HTMLDivElement>(null);
  const viewed = useRef(false);

  // Count an impression only when the card is actually scrolled into view.
  useEffect(() => {
    const node = ref.current;
    if (!visible || !node || viewed.current) return;
    if (typeof IntersectionObserver === "undefined") {
      viewed.current = true;
      sendUpsellEvent(slug, "view");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || viewed.current) return;
        viewed.current = true;
        sendUpsellEvent(slug, "view");
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible, slug]);

  if (!visible) return null;

  const plural = issues === 1 ? noun : `${noun}s`;

  return (
    <div
      ref={ref}
      data-upsell
      className="not-prose relative mt-2 flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-primary/25 bg-accent-tint px-4 py-3 pr-9"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Sparkles className="h-4 w-4" />
      </span>
      <div className="min-w-[200px] flex-1">
        <p className="text-[13.5px] font-semibold text-ink">Want this done for you?</p>
        <p className="mt-0.5 text-[12.5px] leading-snug text-ink-2">
          Launchabl&apos;s agency fixes the {issues} {plural} in this report — and handles your brand, site, content and SEO for life — for a one-time{" "}
          <span className="font-semibold text-ink">{siteConfig.price}</span>. No retainers.
        </p>
      </div>
      <Link
        href={`/pricing?from=${encodeURIComponent(slug)}`}
        onClick={() => sendUpsellEvent(slug, "click")}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[8px] bg-primary px-3 text-[12.5px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-[transform,filter] duration-150 hover:brightness-95 active:scale-[0.98]"
      >
        See how it works <ArrowRight className="h-3.5 w-3.5" />
      </Link>
      <button
        type="button"
        aria-label="Hide this for a week"
        title="Hide this for a week"
        onClick={() => {
          sendUpsellEvent(slug, "dismiss");
          dismiss();
        }}
        className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full text-ink-3 transition-colors duration-100 hover:bg-surface hover:text-ink"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
