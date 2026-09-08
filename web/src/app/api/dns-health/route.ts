import { NextRequest, NextResponse } from "next/server";
import { promises as dns } from "dns";

// Production notes: this covers the most common, freely-checkable signals
// (SPF/DMARC via TXT, MX presence, a best-effort DKIM selector guess).
// A production version should let the user supply their actual DKIM
// selector (it isn't discoverable via DNS alone) and could add blacklist
// checks via a dedicated reputation API.

type CheckResult = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

const COMMON_DKIM_SELECTORS = ["default", "google", "selector1", "selector2", "k1", "mail", "dkim"];

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const domainRaw = typeof body?.domain === "string" ? body.domain.trim() : "";
  if (!domainRaw) {
    return NextResponse.json({ error: "Provide a domain to check." }, { status: 400 });
  }

  const domain = domainRaw
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();

  const checks: CheckResult[] = [];

  // MX records
  try {
    const mx = await dns.resolveMx(domain);
    checks.push({
      id: "mx",
      label: "MX records (mail routing)",
      status: mx.length > 0 ? "pass" : "fail",
      detail:
        mx.length > 0
          ? `Found ${mx.length} MX record(s): ${mx
              .sort((a, b) => a.priority - b.priority)
              .map((r) => r.exchange)
              .join(", ")}`
          : "No MX records found — this domain cannot receive email.",
    });
  } catch {
    checks.push({
      id: "mx",
      label: "MX records (mail routing)",
      status: "fail",
      detail: "No MX records found or domain does not resolve.",
    });
  }

  // SPF (TXT record starting with v=spf1)
  try {
    const txt = await dns.resolveTxt(domain);
    const flat = txt.map((parts) => parts.join(""));
    const spf = flat.find((t) => t.toLowerCase().startsWith("v=spf1"));
    checks.push({
      id: "spf",
      label: "SPF record",
      status: spf ? "pass" : "fail",
      detail: spf
        ? `Found: ${spf}`
        : "No SPF record found — receiving mail servers can't verify who's allowed to send email as this domain.",
    });
  } catch {
    checks.push({
      id: "spf",
      label: "SPF record",
      status: "fail",
      detail: "Could not read TXT records for this domain.",
    });
  }

  // DMARC (_dmarc.<domain> TXT record starting with v=DMARC1)
  try {
    const txt = await dns.resolveTxt(`_dmarc.${domain}`);
    const flat = txt.map((parts) => parts.join(""));
    const dmarc = flat.find((t) => t.toLowerCase().startsWith("v=dmarc1"));
    checks.push({
      id: "dmarc",
      label: "DMARC record",
      status: dmarc ? "pass" : "fail",
      detail: dmarc
        ? `Found: ${dmarc}`
        : "No DMARC record found — spoofed emails from this domain aren't policed.",
    });
  } catch {
    checks.push({
      id: "dmarc",
      label: "DMARC record",
      status: "fail",
      detail: "No _dmarc TXT record found for this domain.",
    });
  }

  // DKIM — best-effort guess across common selectors (real selector isn't discoverable via DNS alone)
  let dkimFound: string | null = null;
  for (const selector of COMMON_DKIM_SELECTORS) {
    try {
      const txt = await dns.resolveTxt(`${selector}._domainkey.${domain}`);
      if (txt.length > 0) {
        dkimFound = selector;
        break;
      }
    } catch {
      // try next selector
    }
  }
  checks.push({
    id: "dkim",
    label: "DKIM record (common selectors)",
    status: dkimFound ? "pass" : "warn",
    detail: dkimFound
      ? `Found a DKIM record under the "${dkimFound}" selector.`
      : `No DKIM record found under common selectors (${COMMON_DKIM_SELECTORS.join(", ")}). DKIM selectors are provider-specific — if you use a custom selector, this check can't see it from DNS alone.`,
  });

  const passCount = checks.filter((c) => c.status === "pass").length;
  const score = Math.round((passCount / checks.length) * 100);

  return NextResponse.json({ domain, checks, score });
}
