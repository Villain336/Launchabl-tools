export type HeaderCheck = {
  id: string;
  label: string;
  present: boolean;
  value: string | null;
  severity: "critical" | "warning" | "info";
  detail: string;
};

export type SecurityHeadersResult = {
  url: string;
  checks: HeaderCheck[];
  score: number;
};

const USER_AGENT = "LaunchableAuditBot/1.0 (+https://launchable.example/tools)";

const HEADER_SPECS: {
  id: string;
  header: string;
  label: string;
  severity: HeaderCheck["severity"];
  weight: number;
  missingDetail: string;
  presentDetail: (value: string) => string;
}[] = [
  {
    id: "hsts",
    header: "strict-transport-security",
    label: "Strict-Transport-Security (HSTS)",
    severity: "critical",
    weight: 20,
    missingDetail: "Missing — browsers won't be forced to use HTTPS on repeat visits, leaving a downgrade-attack window.",
    presentDetail: (v) => `Present: ${v}`,
  },
  {
    id: "csp",
    header: "content-security-policy",
    label: "Content-Security-Policy",
    severity: "warning",
    weight: 25,
    missingDetail: "Missing — no defense-in-depth against injected/malicious scripts (XSS).",
    presentDetail: (v) => `Present: ${v.length > 120 ? v.slice(0, 120) + "…" : v}`,
  },
  {
    id: "x-frame-options",
    header: "x-frame-options",
    label: "X-Frame-Options",
    severity: "warning",
    weight: 15,
    missingDetail: "Missing — the page can potentially be embedded in a hostile iframe (clickjacking).",
    presentDetail: (v) => `Present: ${v}`,
  },
  {
    id: "x-content-type-options",
    header: "x-content-type-options",
    label: "X-Content-Type-Options",
    severity: "warning",
    weight: 15,
    missingDetail: "Missing — browsers may MIME-sniff responses in ways that enable some attacks.",
    presentDetail: (v) => `Present: ${v}`,
  },
  {
    id: "referrer-policy",
    header: "referrer-policy",
    label: "Referrer-Policy",
    severity: "info",
    weight: 10,
    missingDetail: "Missing — the browser default may leak more of your URL to third parties than necessary.",
    presentDetail: (v) => `Present: ${v}`,
  },
  {
    id: "permissions-policy",
    header: "permissions-policy",
    label: "Permissions-Policy",
    severity: "info",
    weight: 10,
    missingDetail: "Missing — no explicit limits on which browser features (camera, mic, geolocation) embedded content can request.",
    presentDetail: (v) => `Present: ${v}`,
  },
  {
    id: "x-xss-protection",
    header: "x-xss-protection",
    label: "X-XSS-Protection (legacy)",
    severity: "info",
    weight: 5,
    missingDetail: "Not set — a legacy header modern browsers mostly ignore now that CSP exists; not required, informational only.",
    presentDetail: (v) => `Present: ${v}`,
  },
];

export async function checkSecurityHeaders(rawUrl: string): Promise<SecurityHeadersResult> {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const parsed = new URL(url);

  const res = await fetch(parsed.toString(), {
    redirect: "follow",
    method: "GET",
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(12000),
  });

  const checks: HeaderCheck[] = HEADER_SPECS.map((spec) => {
    const value = res.headers.get(spec.header);
    return {
      id: spec.id,
      label: spec.label,
      present: Boolean(value),
      value,
      severity: spec.severity,
      detail: value ? spec.presentDetail(value) : spec.missingDetail,
    };
  });

  const maxScore = HEADER_SPECS.reduce((a, s) => a + s.weight, 0);
  const rawScore = HEADER_SPECS.reduce(
    (sum, spec, i) => sum + (checks[i].present ? spec.weight : 0),
    0,
  );

  return {
    url: parsed.toString(),
    checks,
    score: Math.round((rawScore / maxScore) * 100),
  };
}
