/**
 * Fire-and-forget JSON POST for counters (upsell impressions, template
 * picks). `sendBeacon` survives navigation; `fetch` with `keepalive` is the
 * fallback. Failures are swallowed — a lost beacon must never break the UI.
 */
export function sendBeaconJson(path: string, payload: unknown): void {
  const body = JSON.stringify(payload);
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon?.(path, new Blob([body], { type: "application/json" }))) return;
  } catch {
    // fall through to fetch
  }
  void fetch(path, { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => undefined);
}
