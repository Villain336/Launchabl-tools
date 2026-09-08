// Production notes: this is a "WCAG-lite" static heuristic scan — it reads
// raw HTML and cannot evaluate rendered color contrast, keyboard focus
// order, or JS-driven ARIA state changes. A full audit needs a headless
// browser with an accessibility-tree inspector (e.g. axe-core running
// against rendered DOM). Treat this as a fast first pass, not a compliance
// certification.

export type A11yFinding = {
  id: string;
  label: string;
  passed: boolean;
  severity: "critical" | "warning" | "info";
  detail: string;
};

export type A11yResult = {
  url: string;
  score: number;
  findings: A11yFinding[];
};

const USER_AGENT = "LaunchablAuditBot/1.0 (+https://launchabl.example/tools)";

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ");
}

export async function auditAccessibility(rawUrl: string): Promise<A11yResult> {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const parsed = new URL(url);

  const res = await fetch(parsed.toString(), {
    redirect: "follow",
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(12000),
  });
  const html = await res.text();

  const hasLang = /<html[^>]+lang=["'][a-zA-Z-]+["']/i.test(html);

  const imgTags = Array.from(html.matchAll(/<img\b[^>]*>/gi)).map((m) => m[0]);
  const imagesWithAlt = imgTags.filter((tag) => /\balt=["'][^"']*["']/i.test(tag)).length;

  const headingMatches = Array.from(html.matchAll(/<h([1-6])[\s>]/gi)).map((m) => Number(m[1]));
  let skippedHeading = false;
  for (let i = 1; i < headingMatches.length; i++) {
    if (headingMatches[i] - headingMatches[i - 1] > 1) skippedHeading = true;
  }
  const hasH1 = headingMatches.includes(1);

  const inputTags = Array.from(
    html.matchAll(/<input\b[^>]*type=["'](?:text|email|tel|number|password|search|url)["'][^>]*>/gi),
  ).map((m) => m[0]);
  const inputsWithLabelHint = inputTags.filter(
    (tag) => /\baria-label=["'][^"']+["']/i.test(tag) || /\bid=["']([^"']+)["']/i.test(tag),
  ).length;
  const labelCount = (html.match(/<label\b/gi) ?? []).length;

  const emptyLinks = Array.from(html.matchAll(/<a\b[^>]*>(\s*)<\/a>/gi)).length;
  const linkTotal = (html.match(/<a\b/gi) ?? []).length;

  const viewportMeta = html.match(/<meta[^>]+name=["']viewport["'][^>]*content=["']([^"']*)["']/i);
  const blocksZoom = viewportMeta
    ? /user-scalable=no|maximum-scale=1(\.0)?(?!\d)/i.test(viewportMeta[1])
    : false;

  const bodyText = stripTags(html);
  const hasSkipLink = /skip to (main )?content|skip navigation/i.test(bodyText) || /#main-content|#main\b/i.test(html);

  const findings: A11yFinding[] = [
    {
      id: "html-lang",
      label: "Page declares a language",
      passed: hasLang,
      severity: "critical",
      detail: hasLang
        ? "Found a lang attribute on the <html> element."
        : "No lang attribute on <html> — screen readers can't reliably choose pronunciation rules.",
    },
    {
      id: "image-alt",
      label: "Images have alt text",
      passed: imgTags.length === 0 || imagesWithAlt / imgTags.length >= 0.9,
      severity: "critical",
      detail:
        imgTags.length === 0
          ? "No <img> tags found."
          : `${imagesWithAlt}/${imgTags.length} images have an alt attribute.`,
    },
    {
      id: "h1-present",
      label: "Page has a top-level heading",
      passed: hasH1,
      severity: "warning",
      detail: hasH1 ? "Found an <h1>." : "No <h1> found — assistive tech users lose a key page landmark.",
    },
    {
      id: "heading-order",
      label: "Heading levels aren't skipped",
      passed: !skippedHeading,
      severity: "warning",
      detail: skippedHeading
        ? "Found a heading level skip (e.g. an <h2> followed directly by an <h4>) — this breaks the outline screen reader users navigate by."
        : "No heading level skips detected.",
    },
    {
      id: "form-labels",
      label: "Form fields appear to have labels",
      passed: inputTags.length === 0 || labelCount > 0 || inputsWithLabelHint > 0,
      severity: "warning",
      detail:
        inputTags.length === 0
          ? "No text-style form fields found."
          : `${inputTags.length} form field(s) found, ${labelCount} <label> element(s) on the page. This is a heuristic — verify each field has a real associated label.`,
    },
    {
      id: "link-text",
      label: "Links have discernible text",
      passed: linkTotal === 0 || emptyLinks / linkTotal < 0.1,
      severity: "warning",
      detail:
        linkTotal === 0
          ? "No links found."
          : `${emptyLinks}/${linkTotal} links appear to have empty text content (icon-only links need an aria-label).`,
    },
    {
      id: "zoom-not-blocked",
      label: "Pinch-to-zoom isn't disabled",
      passed: !blocksZoom,
      severity: "critical",
      detail: blocksZoom
        ? "Viewport meta tag disables zoom (user-scalable=no or maximum-scale=1) — this actively blocks low-vision users."
        : "Zoom is not disabled in the viewport meta tag.",
    },
    {
      id: "skip-link",
      label: "Has a skip-to-content link",
      passed: hasSkipLink,
      severity: "info",
      detail: hasSkipLink
        ? "Found a likely skip-navigation link or main-content landmark."
        : "No obvious skip-to-content link found — keyboard users have to tab through the whole nav on every page.",
    },
  ];

  const weights: Record<string, number> = {
    "html-lang": 15,
    "image-alt": 20,
    "h1-present": 10,
    "heading-order": 15,
    "form-labels": 15,
    "link-text": 10,
    "zoom-not-blocked": 10,
    "skip-link": 5,
  };
  const maxScore = Object.values(weights).reduce((a, b) => a + b, 0);
  const rawScore = findings.reduce((sum, f) => sum + (f.passed ? weights[f.id] ?? 0 : 0), 0);

  return {
    url: parsed.toString(),
    score: Math.round((rawScore / maxScore) * 100),
    findings,
  };
}
