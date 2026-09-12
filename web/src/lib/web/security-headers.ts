import { finalizeChecklist, type Check, type ChecklistReport } from "@/lib/web/checklist";
import { FETCH_HEADERS, FetchPageError, normalizeUrl } from "@/lib/web/fetch-page";

/**
 * HTTP security posture from one response: transport (HTTPS, HTTP→HTTPS
 * redirect, HSTS), content controls (CSP and its quality, framing, MIME
 * sniffing), privacy (Referrer-Policy, Permissions-Policy), isolation
 * (COOP/CORP), cookie flags and version leaks. Grades quality, not just
 * presence — a CSP with 'unsafe-inline' everywhere isn't a pass.
 */

export type SecurityHeadersReport = ChecklistReport & {
  kind: "security-headers";
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  headers: { name: string; value: string | null }[];
  cookies: { name: string; secure: boolean; httpOnly: boolean; sameSite: string | null }[];
};

export const WATCHED_HEADERS = [
  "strict-transport-security",
  "content-security-policy",
  "content-security-policy-report-only",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "cross-origin-opener-policy",
  "cross-origin-resource-policy",
  "cross-origin-embedder-policy",
  "x-xss-protection",
  "server",
  "x-powered-by",
  "x-aspnet-version",
  "cache-control",
];

export type CspAnalysis = {
  directives: Record<string, string[]>;
  unsafeInlineScript: boolean;
  unsafeEval: boolean;
  wildcardScript: boolean;
  hasFrameAncestors: boolean;
  hasObjectSrc: boolean;
  hasBaseUri: boolean;
  usesNonceOrHash: boolean;
  strictDynamic: boolean;
  upgradeInsecure: boolean;
  reportTo: boolean;
};

export function analyzeCsp(value: string): CspAnalysis {
  const directives: Record<string, string[]> = {};
  for (const part of value.split(";")) {
    const [name, ...sources] = part.trim().split(/\s+/);
    if (name) directives[name.toLowerCase()] = sources.map((s) => s.toLowerCase());
  }
  const script = directives["script-src"] ?? directives["default-src"] ?? [];
  const has = (d: string) => Object.prototype.hasOwnProperty.call(directives, d);
  return {
    directives,
    unsafeInlineScript: script.includes("'unsafe-inline'") && !script.some((s) => /^'(nonce-|sha(256|384|512)-)/.test(s)),
    unsafeEval: script.includes("'unsafe-eval'"),
    wildcardScript: script.some((s) => s === "*" || /^https?:$/.test(s)),
    hasFrameAncestors: has("frame-ancestors"),
    hasObjectSrc: has("object-src") || (directives["default-src"]?.includes("'none'") ?? false),
    hasBaseUri: has("base-uri"),
    usesNonceOrHash: script.some((s) => /^'(nonce-|sha(256|384|512)-)/.test(s)),
    strictDynamic: script.includes("'strict-dynamic'"),
    upgradeInsecure: has("upgrade-insecure-requests"),
    reportTo: has("report-to") || has("report-uri"),
  };
}

export type CookieFlags = { name: string; secure: boolean; httpOnly: boolean; sameSite: string | null };

export function parseSetCookie(values: string[]): CookieFlags[] {
  return values.map((raw) => {
    const [pair, ...attrs] = raw.split(";");
    const lower = attrs.map((a) => a.trim().toLowerCase());
    return {
      name: pair.split("=")[0].trim().slice(0, 60) || "(unnamed)",
      secure: lower.includes("secure"),
      httpOnly: lower.includes("httponly"),
      sameSite: lower.find((a) => a.startsWith("samesite="))?.slice(9) ?? null,
    };
  });
}

const SAFE_REFERRER = new Set(["no-referrer", "same-origin", "strict-origin", "strict-origin-when-cross-origin"]);

function gradeFor(score: number, hasCriticalFail: boolean): SecurityHeadersReport["grade"] {
  if (hasCriticalFail) return score >= 60 ? "C" : score >= 40 ? "D" : "F";
  if (score >= 95) return "A+";
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

async function probeHttpRedirect(url: URL): Promise<{ status: number; location: string | null } | null> {
  if (url.protocol !== "https:") return null;
  const http = new URL(url.toString());
  http.protocol = "http:";
  http.port = "";
  try {
    const res = await fetch(http, { method: "GET", redirect: "manual", headers: FETCH_HEADERS, signal: AbortSignal.timeout(6_000) });
    res.body?.cancel().catch(() => undefined);
    return { status: res.status, location: res.headers.get("location") };
  } catch {
    return null;
  }
}

export async function checkSecurityHeaders(rawUrl: string): Promise<SecurityHeadersReport> {
  const url = normalizeUrl(rawUrl);
  let res: Response;
  try {
    res = await fetch(url, { method: "GET", redirect: "follow", headers: FETCH_HEADERS, signal: AbortSignal.timeout(12_000) });
  } catch (error) {
    const name = (error as Error).name;
    throw new FetchPageError(name === "TimeoutError" || name === "AbortError" ? "The site took too long to respond." : "Couldn't reach that site.", name === "TimeoutError" ? "timeout" : "network");
  }
  res.body?.cancel().catch(() => undefined);
  const final = new URL(res.url || url.toString());
  const h = res.headers;
  const get = (name: string) => h.get(name);
  const httpProbe = await probeHttpRedirect(final);

  const checks: Check[] = [];
  const isHttps = final.protocol === "https:";

  /* Transport */
  checks.push(
    isHttps
      ? { id: "https", status: "pass", group: "Transport", title: "Served over HTTPS", detail: url.protocol === "http:" ? `http:// redirected to ${final.origin}.` : final.origin }
      : { id: "https", status: "fail", group: "Transport", title: "Served over plain HTTP", detail: "Everything on this page can be read and altered in transit; browsers mark it Not Secure.", fix: "Install a certificate (free via Let's Encrypt or your host) and redirect all HTTP traffic to HTTPS with a 301." },
  );
  if (httpProbe) {
    const redirectsToHttps = [301, 302, 307, 308].includes(httpProbe.status) && (httpProbe.location ?? "").startsWith("https://");
    if (redirectsToHttps) checks.push({ id: "http-redirect", status: httpProbe.status === 301 || httpProbe.status === 308 ? "pass" : "warn", group: "Transport", title: `HTTP redirects to HTTPS (${httpProbe.status})`, detail: httpProbe.location ?? "", fix: httpProbe.status === 301 || httpProbe.status === 308 ? undefined : "Use a permanent 301/308 so browsers and search engines cache the upgrade." });
    else if (httpProbe.status >= 200 && httpProbe.status < 400) checks.push({ id: "http-redirect", status: "fail", group: "Transport", title: "The site also answers over plain HTTP", detail: `http:// returned ${httpProbe.status} without redirecting to HTTPS, so anyone typing the address without https:// gets an unprotected page.`, fix: "Redirect every http:// request to the https:// equivalent with a 301." });
  }
  const hsts = get("strict-transport-security");
  if (!isHttps) {
    // HSTS is meaningless over HTTP; skip.
  } else if (!hsts) {
    checks.push({ id: "hsts", status: "fail", group: "Transport", title: "No Strict-Transport-Security header", detail: "Repeat visitors who type the bare domain still start on HTTP, which an attacker on the same network can intercept before the redirect.", fix: "Send `Strict-Transport-Security: max-age=31536000; includeSubDomains` once every subdomain works over HTTPS. Add `preload` and submit to hstspreload.org when you're sure." });
  } else {
    const maxAge = Number(hsts.match(/max-age\s*=\s*(\d+)/i)?.[1] ?? 0);
    const subs = /includeSubDomains/i.test(hsts);
    const preload = /preload/i.test(hsts);
    const status = maxAge >= 31_536_000 ? "pass" : maxAge >= 15_552_000 ? "warn" : "fail";
    checks.push({ id: "hsts", status, group: "Transport", title: status === "pass" ? `HSTS for ${Math.round(maxAge / 86_400)} days${subs ? " incl. subdomains" : ""}${preload ? " · preload" : ""}` : `HSTS max-age is only ${Math.round(maxAge / 86_400)} days`, detail: hsts, fix: status === "pass" ? undefined : "Set max-age to at least 31536000 (one year); shorter values are ignored by the preload list and give little protection." });
    if (status === "pass" && !subs) checks.push({ id: "hsts-subdomains", status: "info", group: "Transport", title: "HSTS doesn't cover subdomains", detail: "Cookies scoped to the parent domain can still be leaked via an insecure subdomain.", fix: "Add includeSubDomains once every subdomain is HTTPS-only." });
  }

  /* Content controls */
  const csp = get("content-security-policy");
  const cspRo = get("content-security-policy-report-only");
  let cspAnalysis: CspAnalysis | null = null;
  if (csp) {
    cspAnalysis = analyzeCsp(csp);
    const problems: string[] = [];
    if (cspAnalysis.unsafeInlineScript) problems.push("'unsafe-inline' for scripts");
    if (cspAnalysis.unsafeEval) problems.push("'unsafe-eval'");
    if (cspAnalysis.wildcardScript) problems.push("wildcard script sources");
    const status = problems.length === 0 ? "pass" : "warn";
    checks.push({ id: "csp", status, group: "Content", title: problems.length ? `Content-Security-Policy present but weakened by ${problems.join(", ")}` : `Content-Security-Policy${cspAnalysis.usesNonceOrHash ? " with nonces/hashes" : ""}${cspAnalysis.strictDynamic ? " and strict-dynamic" : ""}`, detail: csp.length > 240 ? `${csp.slice(0, 240)}…` : csp, fix: problems.length ? "Move inline scripts to files or add per-request nonces (`script-src 'nonce-…' 'strict-dynamic'`), drop 'unsafe-eval', and list exact script hosts instead of wildcards. Roll changes out with Content-Security-Policy-Report-Only first." : undefined });
    const gaps: string[] = [];
    if (!cspAnalysis.hasObjectSrc) gaps.push("object-src 'none'");
    if (!cspAnalysis.hasBaseUri) gaps.push("base-uri 'self'");
    if (!cspAnalysis.hasFrameAncestors && !get("x-frame-options")) gaps.push("frame-ancestors");
    if (gaps.length) checks.push({ id: "csp-directives", status: "warn", group: "Content", title: `CSP is missing ${gaps.join(", ")}`, detail: "These directives close off plugin injection, <base> hijacking and framing even when the rest of the policy is loose.", fix: `Append \`; ${gaps.join("; ")}\` to the policy.` });
    if (!cspAnalysis.reportTo) checks.push({ id: "csp-reporting", status: "info", group: "Content", title: "CSP has no report-to / report-uri", detail: "You won't hear about blocked resources or injection attempts in production.", fix: "Add a report-to endpoint (e.g. report-uri.com, Sentry) so violations reach you." });
  } else if (cspRo) {
    checks.push({ id: "csp", status: "warn", group: "Content", title: "CSP is report-only — nothing is enforced yet", detail: cspRo.length > 200 ? `${cspRo.slice(0, 200)}…` : cspRo, fix: "Once the reports are clean, ship the same policy as Content-Security-Policy." });
  } else {
    checks.push({ id: "csp", status: "fail", group: "Content", title: "No Content-Security-Policy", detail: "Any script that gets injected — through a vulnerable dependency, a compromised third-party tag or an XSS bug — runs with full access to the page and its cookies.", fix: "Start with `Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' <your CDNs>; object-src 'none'; base-uri 'self'; frame-ancestors 'self'` and tighten from the reports, then enforce it." });
  }

  const xfo = get("x-frame-options");
  if (cspAnalysis?.hasFrameAncestors) checks.push({ id: "framing", status: "pass", group: "Content", title: "Framing controlled by CSP frame-ancestors", detail: `frame-ancestors ${cspAnalysis.directives["frame-ancestors"]?.join(" ") ?? ""}${xfo ? ` · X-Frame-Options: ${xfo}` : ""}` });
  else if (xfo && /^(deny|sameorigin)$/i.test(xfo.trim())) checks.push({ id: "framing", status: "pass", group: "Content", title: `X-Frame-Options: ${xfo.toUpperCase()}`, detail: "The page can't be embedded in a hostile iframe (clickjacking)." });
  else if (xfo) checks.push({ id: "framing", status: "warn", group: "Content", title: `X-Frame-Options has an unsupported value: ${xfo}`, detail: "ALLOW-FROM and other values are ignored by modern browsers, leaving the page frameable.", fix: "Use `frame-ancestors` in CSP (supports allow-lists) or `X-Frame-Options: SAMEORIGIN`." });
  else checks.push({ id: "framing", status: "fail", group: "Content", title: "Page can be embedded in any iframe", detail: "Neither X-Frame-Options nor CSP frame-ancestors is set, so an attacker can overlay it invisibly and trick clicks (clickjacking).", fix: "Send `Content-Security-Policy: frame-ancestors 'self'` (or 'none'), plus `X-Frame-Options: SAMEORIGIN` for older browsers." });

  const xcto = get("x-content-type-options");
  if (xcto && /nosniff/i.test(xcto)) checks.push({ id: "nosniff", status: "pass", group: "Content", title: "X-Content-Type-Options: nosniff", detail: "Browsers respect declared MIME types instead of guessing." });
  else checks.push({ id: "nosniff", status: "fail", group: "Content", title: xcto ? `X-Content-Type-Options has value "${xcto}"` : "No X-Content-Type-Options header", detail: "Without nosniff a browser may execute an uploaded file or mislabelled response as script or a stylesheet.", fix: "Send `X-Content-Type-Options: nosniff` on every response. One line in most servers and frameworks." });

  /* Privacy */
  const referrer = get("referrer-policy");
  if (!referrer) checks.push({ id: "referrer", status: "warn", group: "Privacy", title: "No Referrer-Policy", detail: "Browsers default to strict-origin-when-cross-origin, which is reasonable, but an explicit policy protects older browsers and lets you tighten further.", fix: "Send `Referrer-Policy: strict-origin-when-cross-origin` (or `same-origin` for logged-in areas)." });
  else {
    const value = referrer.split(",").pop()!.trim().toLowerCase();
    if (SAFE_REFERRER.has(value)) checks.push({ id: "referrer", status: "pass", group: "Privacy", title: `Referrer-Policy: ${value}`, detail: "Full URLs stay on your origin." });
    else if (value === "unsafe-url" || value === "no-referrer-when-downgrade") checks.push({ id: "referrer", status: "warn", group: "Privacy", title: `Referrer-Policy: ${value} leaks full URLs`, detail: "Every third party the page links to or loads sees the complete URL, including query strings and paths that may identify users.", fix: "Use `strict-origin-when-cross-origin` or `same-origin`." });
    else checks.push({ id: "referrer", status: "warn", group: "Privacy", title: `Referrer-Policy: ${value}`, detail: "Origin-only policies are acceptable; consider strict-origin-when-cross-origin to keep full URLs same-origin only." });
  }
  const permissions = get("permissions-policy");
  checks.push(
    permissions
      ? { id: "permissions", status: "pass", group: "Privacy", title: "Permissions-Policy is set", detail: permissions.length > 200 ? `${permissions.slice(0, 200)}…` : permissions }
      : { id: "permissions", status: "warn", group: "Privacy", title: "No Permissions-Policy", detail: "Embedded third-party content can request camera, microphone, geolocation and other powerful features on your page.", fix: "Send `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()` and open only what you use." },
  );

  /* Isolation */
  const coop = get("cross-origin-opener-policy");
  const corp = get("cross-origin-resource-policy");
  if (coop || corp) checks.push({ id: "isolation", status: "pass", group: "Isolation", title: `Cross-origin isolation headers present`, detail: [coop && `COOP: ${coop}`, corp && `CORP: ${corp}`, get("cross-origin-embedder-policy") && `COEP: ${get("cross-origin-embedder-policy")}`].filter(Boolean).join(" · ") });
  else checks.push({ id: "isolation", status: "info", group: "Isolation", title: "No Cross-Origin-Opener-Policy / Resource-Policy", detail: "Optional hardening against cross-window attacks (Spectre-class leaks, tabnabbing via window.opener).", fix: "Send `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Resource-Policy: same-origin` (or same-site if you serve assets from a sibling domain)." });

  /* Legacy & leaks */
  const xss = get("x-xss-protection");
  if (xss && /^1/.test(xss.trim()) && !/mode=block/i.test(xss)) checks.push({ id: "xss-protection", status: "warn", group: "Hygiene", title: `X-XSS-Protection: ${xss} can introduce vulnerabilities`, detail: "The legacy auditor in filtering mode has been used for information leaks; modern browsers removed it.", fix: "Remove the header, or send `X-XSS-Protection: 0`. Rely on CSP instead." });
  else if (xss) checks.push({ id: "xss-protection", status: "info", group: "Hygiene", title: `X-XSS-Protection: ${xss}`, detail: "Legacy header; harmless but ignored by current browsers. CSP is the real protection." });
  const server = get("server");
  const powered = get("x-powered-by") ?? get("x-aspnet-version");
  const leaks = [server, powered].filter((v): v is string => Boolean(v && /\d+\.\d+/.test(v)));
  if (leaks.length) checks.push({ id: "version-leak", status: "warn", group: "Hygiene", title: `Software versions exposed: ${leaks.join(" · ")}`, detail: "Version strings let attackers match known CVEs to your stack without probing.", fix: "Strip version numbers from Server and remove X-Powered-By / X-AspNet-Version (e.g. `server_tokens off;` in nginx, `poweredByHeader: false` in Next.js)." });
  else if (powered) checks.push({ id: "version-leak", status: "info", group: "Hygiene", title: `X-Powered-By: ${powered}`, detail: "Reveals the framework, not the version. Low risk; easy to remove." });
  else checks.push({ id: "version-leak", status: "pass", group: "Hygiene", title: "No software versions leaked in headers", detail: server ? `Server: ${server}` : "No Server or X-Powered-By header." });

  /* Cookies */
  const setCookies = typeof (h as Headers & { getSetCookie?: () => string[] }).getSetCookie === "function" ? (h as Headers & { getSetCookie: () => string[] }).getSetCookie() : [];
  const cookies = parseSetCookie(setCookies);
  if (cookies.length) {
    const insecure = cookies.filter((c) => !c.secure);
    const noHttpOnly = cookies.filter((c) => !c.httpOnly);
    const noSameSite = cookies.filter((c) => !c.sameSite);
    const issues: string[] = [];
    if (insecure.length) issues.push(`${insecure.length} without Secure`);
    if (noHttpOnly.length) issues.push(`${noHttpOnly.length} without HttpOnly`);
    if (noSameSite.length) issues.push(`${noSameSite.length} without SameSite`);
    checks.push(issues.length ? { id: "cookies", status: insecure.length ? "fail" : "warn", group: "Hygiene", title: `${cookies.length} cookie${cookies.length > 1 ? "s" : ""} set · ${issues.join(", ")}`, detail: cookies.map((c) => `${c.name}: ${[c.secure && "Secure", c.httpOnly && "HttpOnly", c.sameSite && `SameSite=${c.sameSite}`].filter(Boolean).join(" ") || "no flags"}`).join(" · "), fix: "Set Secure and SameSite=Lax (or Strict) on every cookie, and HttpOnly on any cookie JavaScript doesn't need to read — session cookies especially." } : { id: "cookies", status: "pass", group: "Hygiene", title: `${cookies.length} cookie${cookies.length > 1 ? "s" : ""} with Secure, HttpOnly and SameSite`, detail: cookies.map((c) => c.name).join(", ") });
  } else {
    checks.push({ id: "cookies", status: "info", group: "Hygiene", title: "No cookies set on this response", detail: "Cookie flags couldn't be assessed; log in and check an authenticated page if the site has accounts." });
  }

  const headers = WATCHED_HEADERS.map((name) => ({ name, value: get(name) }));
  const base = finalizeChecklist(
    { kind: "security-headers", requestedUrl: rawUrl, finalUrl: final.toString(), status: res.status, title: null, facts: {} },
    checks,
  );
  const criticalFail = checks.some((c) => c.status === "fail" && ["https", "csp", "hsts", "framing"].includes(c.id));
  const grade = gradeFor(base.score, criticalFail);
  return {
    ...base,
    kind: "security-headers",
    grade,
    headers,
    cookies,
    facts: {
      grade,
      https: isHttps,
      hsts: Boolean(hsts),
      csp: csp ? (cspAnalysis?.unsafeInlineScript ? "weak" : "present") : cspRo ? "report-only" : "missing",
      framing: Boolean(xfo) || Boolean(cspAnalysis?.hasFrameAncestors),
      nosniff: Boolean(xcto && /nosniff/i.test(xcto)),
      server: server ?? null,
      cookies: cookies.length,
      present: headers.filter((x) => x.value).length,
    },
  };
}
