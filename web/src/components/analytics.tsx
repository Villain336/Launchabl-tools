"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Cookieless Vercel Web Analytics, wired the same way `@vercel/analytics/next`
 * does it (script with auto-track disabled, page views on route change),
 * without the package — its optional peers conflict with vitest's vite.
 *
 * Only active in production; the script 404s harmlessly elsewhere, so we
 * skip it entirely to keep dev consoles clean.
 */

type VaQueue = { (...args: unknown[]): void; q?: unknown[][] };

declare global {
  interface Window {
    va?: VaQueue;
    vaq?: unknown[][];
  }
}

const ENABLED = process.env.NODE_ENV === "production";
const SCRIPT_SRC = "/_vercel/insights/script.js";

function ensureQueue() {
  if (typeof window === "undefined") return;
  if (!window.va) {
    window.va = function va(...params: unknown[]) {
      (window.vaq = window.vaq || []).push(params);
    };
  }
}

function inject() {
  if (document.head.querySelector(`script[src*="${SCRIPT_SRC}"]`)) return;
  const script = document.createElement("script");
  script.src = SCRIPT_SRC;
  script.defer = true;
  script.dataset.sdkn = "launchabl/next";
  script.dataset.sdkv = "1.0.0";
  script.dataset.disableAutoTrack = "1";
  document.head.appendChild(script);
}

/** Custom event (e.g. "upsell_click"). Values must be strings/numbers/booleans/null. */
export function track(name: string, properties?: Record<string, string | number | boolean | null>) {
  if (!ENABLED || typeof window === "undefined") return;
  ensureQueue();
  window.va?.("event", { name, options: properties ?? {} });
}

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!ENABLED) return;
    ensureQueue();
    inject();
  }, []);

  useEffect(() => {
    if (!ENABLED || !pathname) return;
    const query = searchParams?.toString();
    window.va?.("pageview", { route: pathname, path: query ? `${pathname}?${query}` : pathname });
  }, [pathname, searchParams]);

  return null;
}
