import { attr, decodeEntities, fetchHtml, tags, type RawPage } from "@/lib/web/fetch-page";
import { finalizeChecklist, plural, type Check, type ChecklistReport } from "@/lib/web/checklist";

/**
 * Website compliance scan (GDPR / ePrivacy / CCPA / accessibility basics /
 * security hygiene) from a page's HTML and response headers.
 *
 * This is a signal scan, not legal advice: it finds the things a regulator
 * or a privacy-minded visitor would notice first — trackers firing without
 * a consent manager, missing policies, insecure cookies, no contact route.
 */

export type ComplianceInput = Pick<RawPage, "html" | "finalUrl" | "requestedUrl" | "status" | "headers">;

const TRACKERS: { name: string; test: RegExp; category: "analytics" | "advertising" | "session-replay" | "marketing" }[] = [
  { name: "Google Analytics / Tag Manager", test: /googletagmanager\.com|google-analytics\.com|\bgtag\s*\(|\bga\s*\(\s*['"]create/i, category: "analytics" },
  { name: "Google Ads / DoubleClick", test: /googleadservices\.com|doubleclick\.net|googlesyndication\.com/i, category: "advertising" },
  { name: "Meta Pixel", test: /connect\.facebook\.net|\bfbq\s*\(/i, category: "advertising" },
  { name: "LinkedIn Insight", test: /snap\.licdn\.com|_linkedin_partner_id/i, category: "advertising" },
  { name: "TikTok Pixel", test: /analytics\.tiktok\.com|\bttq\.load/i, category: "advertising" },
  { name: "Twitter/X Pixel", test: /static\.ads-twitter\.com|\btwq\s*\(/i, category: "advertising" },
  { name: "Pinterest Tag", test: /pintrk\s*\(|ct\.pinterest\.com/i, category: "advertising" },
  { name: "Hotjar", test: /static\.hotjar\.com|\bhj\s*\(|_hjSettings/i, category: "session-replay" },
  { name: "Microsoft Clarity", test: /clarity\.ms|\bclarity\s*\(/i, category: "session-replay" },
  { name: "FullStory", test: /fullstory\.com/i, category: "session-replay" },
  { name: "LogRocket", test: /logrocket/i, category: "session-replay" },
  { name: "Mixpanel", test: /cdn\.mxpnl\.com|mixpanel\.init/i, category: "analytics" },
  { name: "Amplitude", test: /cdn\.amplitude\.com|amplitude\.getInstance|amplitude\.init/i, category: "analytics" },
  { name: "Segment", test: /cdn\.segment\.com|analytics\.load\(/i, category: "analytics" },
  { name: "HubSpot", test: /js\.hs-scripts\.com|js\.hsforms\.net|hs-analytics/i, category: "marketing" },
  { name: "Intercom", test: /widget\.intercom\.io|Intercom\(/i, category: "marketing" },
  { name: "Drift", test: /js\.driftt\.com/i, category: "marketing" },
  { name: "Klaviyo", test: /static\.klaviyo\.com/i, category: "marketing" },
  { name: "Plausible (cookieless)", test: /plausible\.io\/js/i, category: "analytics" },
  { name: "Fathom (cookieless)", test: /cdn\.usefathom\.com/i, category: "analytics" },
  { name: "Vercel Analytics (cookieless)", test: /\/_vercel\/insights|va\.vercel-scripts\.com/i, category: "analytics" },
];

const COOKIELESS = /cookieless/i;

const CMPS: { name: string; test: RegExp }[] = [
  { name: "Cookiebot", test: /cookiebot\.com|Cookiebot/i },
  { name: "OneTrust", test: /onetrust\.com|optanon|OneTrust/i },
  { name: "CookieYes", test: /cookieyes\.com|cky-consent/i },
  { name: "Osano", test: /osano\.com/i },
  { name: "Termly", test: /termly\.io/i },
  { name: "iubenda", test: /iubenda\.com/i },
  { name: "Usercentrics", test: /usercentrics\.eu|usercentrics/i },
  { name: "Didomi", test: /didomi\.io/i },
  { name: "TrustArc", test: /trustarc\.com|truste\.com/i },
  { name: "Quantcast Choice", test: /quantcast\.mgr\.consensu\.org|quantcast\.com\/choice/i },
  { name: "Complianz", test: /complianz/i },
  { name: "Klaro", test: /\bklaro\b/i },
  { name: "Axeptio", test: /axeptio/i },
  { name: "CookieFirst", test: /cookiefirst/i },
  { name: "Orestbida CookieConsent", test: /cookieconsent(\.umd|\.esm|\.js)|vanilla-cookieconsent/i },
  { name: "HubSpot cookie banner", test: /hs-banner|_hsp\.push\(\['showBanner/i },
];

function linkMatches(html: string, finalUrl: string, hrefRe: RegExp, textRe: RegExp): string | null {
  for (const m of html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = attr(m[0], "href") ?? "";
    const text = decodeEntities(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
    if (hrefRe.test(href) || textRe.test(text)) {
      try {
        return new URL(href, finalUrl).toString();
      } catch {
        return href || text;
      }
    }
  }
  return null;
}

function setCookies(headers: Headers): string[] {
  const h = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof h.getSetCookie === "function") return h.getSetCookie();
  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

export function scanComplianceHtml(input: ComplianceInput): ChecklistReport {
  const { html, finalUrl, headers } = input;
  const url = new URL(finalUrl);
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1].replace(/\s+/g, " ")) : null;

  const trackers = TRACKERS.filter((t) => t.test.test(html));
  const cookieTrackers = trackers.filter((t) => !COOKIELESS.test(t.name));
  const cmp = CMPS.find((c) => c.test.test(html));
  const genericBanner = /cookie[-_ ]?(consent|banner|notice|policy)|accept (all )?cookies|we use cookies/i.test(html);

  const privacy = linkMatches(html, finalUrl, /privacy|datenschutz|confidentialit|privacidad/i, /^\s*(privacy( policy| notice)?|datenschutz(erklärung)?|politique de confidentialité|política de privacidad)\s*$/i);
  const terms = linkMatches(html, finalUrl, /terms|conditions|agb|legal/i, /^\s*(terms( of (service|use))?|terms (&|and) conditions|agb|legal|conditions générales)\s*$/i);
  const cookiePolicy = linkMatches(html, finalUrl, /cookie/i, /^\s*cookie[s]?( policy| settings| preferences)?\s*$/i);
  const imprint = linkMatches(html, finalUrl, /impressum|imprint|legal-notice|mentions-legales/i, /^\s*(impressum|imprint|legal notice|mentions légales)\s*$/i);
  const contact = linkMatches(html, finalUrl, /^mailto:|\/contact|\/kontakt|\/support/i, /^\s*(contact( us)?|kontakt|support|get in touch)\s*$/i);
  const doNotSell = linkMatches(html, finalUrl, /do-not-sell|ccpa|your-privacy-choices|privacy-choices/i, /do not sell|your privacy choices|opt[- ]out/i);
  const accessibilityStatement = linkMatches(html, finalUrl, /accessibility/i, /^\s*accessibility( statement)?\s*$/i);

  const forms = tags(html, "form").length;
  const inputs = tags(html, "input");
  const emailInputs = inputs.filter((i) => /email/i.test(attr(i, "type") ?? "") || /email/i.test(attr(i, "name") ?? "")).length;
  const passwordInputs = inputs.filter((i) => /password/i.test(attr(i, "type") ?? "")).length;
  const consentCheckbox = inputs.some((i) => /checkbox/i.test(attr(i, "type") ?? "") && /consent|agree|privacy|terms|gdpr|marketing|newsletter|subscribe/i.test(`${attr(i, "name") ?? ""} ${attr(i, "id") ?? ""} ${attr(i, "aria-label") ?? ""}`)) ||
    /<label\b[^>]*>[\s\S]{0,200}?(i agree|i consent|agree to|accept the|privacy policy|terms)/i.test(html) && /type\s*=\s*["']?checkbox/i.test(html);

  const images = tags(html, "img");
  const missingAlt = images.filter((i) => attr(i, "alt") === null).length;
  const lang = attr(html.match(/<html\b[^>]*>/i)?.[0] ?? "", "lang");

  const mixed = url.protocol === "https:" ? Array.from(html.matchAll(/\b(?:src|href)\s*=\s*["']http:\/\/[^"']+["']/gi)).filter((m) => !/rel\s*=\s*["'][^"']*(?:alternate|profile)/i.test(m[0])).length : 0;
  const googleFonts = /fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(html);
  const youtube = /youtube\.com\/embed|youtube-nocookie\.com/i.test(html);
  const youtubeNoCookie = /youtube-nocookie\.com/i.test(html);
  const maps = /maps\.google\.com\/maps|google\.com\/maps\/embed/i.test(html);
  const blankNoOpener = tags(html, "a").filter((a) => /_blank/i.test(attr(a, "target") ?? "") && !/noopener|noreferrer/i.test(attr(a, "rel") ?? "")).length;

  const cookies = setCookies(headers);
  const insecureCookies = cookies.filter((c) => !/;\s*secure/i.test(c) || !/;\s*samesite=/i.test(c));
  const csp = headers.get("content-security-policy");
  const hsts = headers.get("strict-transport-security");
  const xfo = headers.get("x-frame-options");
  const xcto = headers.get("x-content-type-options");
  const referrer = headers.get("referrer-policy");
  const permissions = headers.get("permissions-policy");
  const frameProtected = Boolean(xfo) || /frame-ancestors/i.test(csp ?? "");

  const checks: Check[] = [];
  const add = (c: Check) => checks.push(c);

  /* ── Consent & tracking ─────────────────────────────── */
  add(
    cookieTrackers.length === 0
      ? { id: "trackers", status: "pass", group: "Consent & tracking", title: trackers.length ? "Only cookieless analytics" : "No third-party trackers detected", detail: trackers.length ? `${trackers.map((t) => t.name).join(", ")} — these don't set cookies or profile users, so consent isn't required under ePrivacy.` : "No analytics, advertising or session-replay scripts found in the HTML." }
      : { id: "trackers", status: "info", group: "Consent & tracking", title: `${plural(cookieTrackers.length, "cookie-setting tracker")} detected`, detail: cookieTrackers.map((t) => `${t.name} (${t.category})`).join(", ") + ". Each needs a legal basis — in the EU/UK that means prior opt-in consent." },
  );

  if (cookieTrackers.length > 0) {
    add(
      cmp
        ? { id: "cmp", status: "pass", group: "Consent & tracking", title: `Consent manager present (${cmp.name})`, detail: "A recognised CMP is loaded. Make sure trackers are blocked until the visitor accepts — verify in DevTools → Network before clicking anything." }
        : genericBanner
          ? { id: "cmp", status: "warn", group: "Consent & tracking", title: "Cookie banner without a recognised CMP", detail: "The page mentions cookie consent but no known consent-management platform was found. Home-made banners usually inform without actually blocking trackers.", fix: "Use a CMP that blocks scripts until consent (Cookiebot, CookieYes, Usercentrics, Osano, iubenda) or gate every tracker behind your own consent state." }
          : { id: "cmp", status: "fail", group: "Consent & tracking", title: "Trackers load with no consent mechanism", detail: `${cookieTrackers.map((t) => t.name).join(", ")} appear in the HTML with no consent banner or CMP. Under GDPR/ePrivacy this is the most common enforcement trigger.`, fix: "Install a consent-management platform in blocking mode, or switch to cookieless analytics (Plausible, Fathom, Vercel Analytics) and drop the ad pixels." },
    );
    const replay = cookieTrackers.filter((t) => t.category === "session-replay");
    if (replay.length) {
      add({ id: "session-replay", status: "warn", group: "Consent & tracking", title: "Session-replay tools record visitor behaviour", detail: `${replay.map((t) => t.name).join(", ")} record clicks, scrolls and sometimes keystrokes. This needs explicit consent and careful masking of form fields.`, fix: "Load session-replay only after consent and enable input masking / privacy mode in the tool's settings." });
    }
  }

  add(
    googleFonts
      ? { id: "google-fonts", status: "warn", group: "Consent & tracking", title: "Google Fonts loaded from Google's servers", detail: "Every visitor's IP address is sent to Google before consent. A German court (LG München, 2022) ruled this a GDPR violation; it's a frequent source of warning letters in the EU.", fix: "Self-host the font files (next/font does this automatically) and remove the fonts.googleapis.com <link>." }
      : { id: "google-fonts", status: "pass", group: "Consent & tracking", title: "No Google Fonts CDN calls", detail: "Fonts are self-hosted or not loaded from Google." },
  );

  if (youtube || maps) {
    add(
      youtube && !youtubeNoCookie
        ? { id: "embeds", status: "warn", group: "Consent & tracking", title: "YouTube embed sets cookies before consent", detail: "youtube.com/embed sets tracking cookies on load.", fix: "Use youtube-nocookie.com, or a click-to-load facade (lite-youtube-embed) so nothing loads until the visitor plays." }
        : { id: "embeds", status: "info", group: "Consent & tracking", title: "Third-party embeds present", detail: `${[youtube && "YouTube (privacy-enhanced)", maps && "Google Maps"].filter(Boolean).join(", ")}. Maps embeds transfer IP data to Google; consider a click-to-load placeholder.` },
    );
  }

  add(
    cookies.length === 0
      ? { id: "cookies", status: "pass", group: "Consent & tracking", title: "No cookies set by the server", detail: "The initial response sets no cookies." }
      : insecureCookies.length === 0
        ? { id: "cookies", status: "pass", group: "Consent & tracking", title: `${plural(cookies.length, "cookie")} set with Secure + SameSite`, detail: cookies.map((c) => c.split("=")[0]).join(", ") }
        : { id: "cookies", status: "warn", group: "Consent & tracking", title: `${plural(insecureCookies.length, "cookie")} missing Secure or SameSite`, detail: insecureCookies.map((c) => c.split("=")[0]).join(", "), fix: "Set every cookie with Secure; SameSite=Lax (or Strict), and HttpOnly unless JavaScript must read it." },
  );

  /* ── Legal pages ─────────────────────────────────────── */
  add(
    privacy
      ? { id: "privacy", status: "pass", group: "Legal pages", title: "Privacy policy linked", detail: privacy }
      : { id: "privacy", status: "fail", group: "Legal pages", title: "No privacy policy link", detail: "Required by GDPR (Art. 13), CCPA, and the app stores; also required by Google Ads and Meta to run campaigns.", fix: "Publish a privacy policy covering what you collect, why, who processes it, retention and user rights, and link it from the footer of every page." },
  );
  add(
    terms
      ? { id: "terms", status: "pass", group: "Legal pages", title: "Terms linked", detail: terms }
      : { id: "terms", status: forms || passwordInputs ? "warn" : "info", group: "Legal pages", title: "No terms / conditions link", detail: forms || passwordInputs ? "The page collects data or has accounts but shows no terms of service." : "No terms link found. Optional for a brochure site; needed once you sell or create accounts.", fix: "Add Terms of Service and link them beside the privacy policy." },
  );
  add(
    cookiePolicy || !cookieTrackers.length
      ? { id: "cookie-policy", status: cookiePolicy ? "pass" : "info", group: "Legal pages", title: cookiePolicy ? "Cookie policy / settings linked" : "Cookie policy", detail: cookiePolicy ?? "No cookies requiring consent, so a separate cookie policy isn't essential." }
      : { id: "cookie-policy", status: "warn", group: "Legal pages", title: "No cookie policy or settings link", detail: "Trackers are present but visitors have no page listing cookies or a way to change their choice later.", fix: "Add a cookie policy (most CMPs generate one) and a persistent “Cookie settings” link in the footer." },
  );
  add(
    contact || imprint
      ? { id: "contact", status: "pass", group: "Legal pages", title: "Contact route available", detail: [contact, imprint].filter(Boolean).join(" · ") }
      : { id: "contact", status: "warn", group: "Legal pages", title: "No contact or legal notice link", detail: "Data-subject requests need a contact route; the EU (Art. 13 GDPR) and Germany/Austria (Impressum) require identifying the operator.", fix: "Add a Contact page (or mailto link) in the footer; in DACH countries add an Impressum with the legal entity, address and email." },
  );
  add(
    doNotSell
      ? { id: "ccpa", status: "pass", group: "Legal pages", title: "“Do Not Sell / Privacy Choices” link", detail: doNotSell }
      : { id: "ccpa", status: cookieTrackers.some((t) => t.category === "advertising") ? "warn" : "info", group: "Legal pages", title: "No CCPA/CPRA opt-out link", detail: cookieTrackers.some((t) => t.category === "advertising") ? "Ad pixels share data in a way California treats as a “sale/share”; businesses over the CCPA thresholds need a “Your Privacy Choices” link and Global Privacy Control support." : "Only relevant if you meet CCPA thresholds and share data with ad platforms.", fix: "Add a “Your Privacy Choices” footer link wired to your CMP's opt-out, and honour the GPC signal." },
  );

  /* ── Forms & data collection ─────────────────────────── */
  if (forms > 0) {
    add(
      consentCheckbox || (!emailInputs && !passwordInputs)
        ? { id: "form-consent", status: consentCheckbox ? "pass" : "info", group: "Forms", title: consentCheckbox ? "Consent or terms acknowledgement on forms" : `${plural(forms, "form")}, no personal-data fields detected`, detail: consentCheckbox ? "Forms include a checkbox or explicit acknowledgement of the privacy policy/terms." : "Search or navigation forms only." }
        : { id: "form-consent", status: emailInputs ? "warn" : "info", group: "Forms", title: "Forms collect personal data without visible consent", detail: `${plural(forms, "form")} with ${plural(emailInputs, "email field")}${passwordInputs ? ` and ${plural(passwordInputs, "password field")}` : ""}, and no consent checkbox or privacy notice detected near them.`, fix: "Add a short notice under the submit button linking to the privacy policy. For marketing emails add an unticked opt-in checkbox — never pre-ticked." },
    );
  }

  /* ── Security ────────────────────────────────────────── */
  add(
    url.protocol === "https:"
      ? mixed
        ? { id: "https", status: "warn", group: "Security", title: `HTTPS with ${plural(mixed, "insecure resource")}`, detail: "The page is secure but references http:// scripts, styles or images (mixed content). Browsers block or flag these.", fix: "Change http:// asset URLs to https:// or protocol-relative paths." }
        : { id: "https", status: "pass", group: "Security", title: "Served over HTTPS, no mixed content", detail: "Personal data submitted through the page is encrypted in transit." }
      : { id: "https", status: "fail", group: "Security", title: "Not served over HTTPS", detail: "Any form data is sent in the clear; GDPR Art. 32 expects encryption in transit.", fix: "Install a TLS certificate and redirect http → https." },
  );
  add(
    hsts
      ? { id: "hsts", status: "pass", group: "Security", title: "HSTS enabled", detail: hsts }
      : { id: "hsts", status: "warn", group: "Security", title: "No Strict-Transport-Security header", detail: "Visitors typing the bare domain can be downgraded to http on first visit.", fix: "Send Strict-Transport-Security: max-age=63072000; includeSubDomains; preload." },
  );
  add(
    csp
      ? { id: "csp", status: "pass", group: "Security", title: "Content-Security-Policy set", detail: csp.length > 140 ? `${csp.slice(0, 140)}…` : csp }
      : { id: "csp", status: "warn", group: "Security", title: "No Content-Security-Policy", detail: "Without a CSP a single injected script can exfiltrate form data or cookies (and third-party scripts run unconstrained).", fix: "Start with Content-Security-Policy-Report-Only listing your script/style/img/connect sources, watch reports, then enforce." },
  );
  add(
    frameProtected
      ? { id: "framing", status: "pass", group: "Security", title: "Clickjacking protection", detail: xfo ? `X-Frame-Options: ${xfo}` : "CSP frame-ancestors set" }
      : { id: "framing", status: "warn", group: "Security", title: "Page can be framed by other sites", detail: "No X-Frame-Options or CSP frame-ancestors — login/checkout pages could be overlaid (clickjacking).", fix: "Send X-Frame-Options: SAMEORIGIN or Content-Security-Policy: frame-ancestors 'self'." },
  );
  add(
    xcto && referrer
      ? { id: "misc-headers", status: "pass", group: "Security", title: "X-Content-Type-Options and Referrer-Policy set", detail: `${xcto} · ${referrer}${permissions ? " · Permissions-Policy set" : ""}` }
      : { id: "misc-headers", status: "info", group: "Security", title: "Hardening headers incomplete", detail: `${xcto ? "" : "X-Content-Type-Options missing. "}${referrer ? "" : "Referrer-Policy missing (full URLs with query strings may leak to third parties). "}${permissions ? "" : "Permissions-Policy missing."}`.trim(), fix: "Add X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, and a Permissions-Policy disabling camera/microphone/geolocation unless used." },
  );
  if (blankNoOpener > 0) {
    add({ id: "noopener", status: "info", group: "Security", title: `${plural(blankNoOpener, "target=_blank link")} without rel=noopener`, detail: "Modern browsers imply noopener, but older ones let the opened page control yours.", fix: 'Add rel="noopener noreferrer" to external links that open in a new tab.' });
  }

  /* ── Accessibility basics ────────────────────────────── */
  add(
    lang
      ? { id: "lang", status: "pass", group: "Accessibility", title: "Page language declared", detail: `<html lang="${lang}">` }
      : { id: "lang", status: "warn", group: "Accessibility", title: "No lang attribute on <html>", detail: "Screen readers need it to choose pronunciation (WCAG 3.1.1). Accessibility is a legal requirement under the ADA (US), EAA (EU, from June 2025) and the UK Equality Act.", fix: 'Add lang="en" (or the page language) to <html>.' },
  );
  add(
    images.length === 0
      ? { id: "alt", status: "info", group: "Accessibility", title: "No images", detail: "Nothing to check." }
      : missingAlt === 0
        ? { id: "alt", status: "pass", group: "Accessibility", title: "Every image has an alt attribute", detail: `${plural(images.length, "image")} checked.` }
        : { id: "alt", status: missingAlt / images.length > 0.3 ? "fail" : "warn", group: "Accessibility", title: `${missingAlt} of ${images.length} images lack alt text`, detail: "Missing alt attributes are the most-cited item in accessibility lawsuits and demand letters (WCAG 1.1.1).", fix: 'Add descriptive alt text to meaningful images and alt="" to decorative ones. Run the Accessibility Checker tool for the full list.' },
  );
  add(
    accessibilityStatement
      ? { id: "a11y-statement", status: "pass", group: "Accessibility", title: "Accessibility statement linked", detail: accessibilityStatement }
      : { id: "a11y-statement", status: "info", group: "Accessibility", title: "No accessibility statement", detail: "Public-sector sites in the EU/UK must publish one; for everyone else it's good practice and reduces legal exposure." },
  );

  return finalizeChecklist(
    {
      kind: "compliance",
      requestedUrl: input.requestedUrl,
      finalUrl,
      status: input.status,
      title,
      facts: {
        trackers: trackers.map((t) => t.name).join(", ") || null,
        consentManager: cmp?.name ?? (genericBanner ? "generic banner" : null),
        privacyPolicy: privacy,
        terms,
        contact: contact ?? imprint,
        forms,
        emailFields: emailInputs,
        cookiesSet: cookies.length,
        hsts: Boolean(hsts),
        csp: Boolean(csp),
        lang,
        imagesMissingAlt: missingAlt,
      },
    },
    checks,
  );
}

export async function scanCompliance(rawUrl: string): Promise<ChecklistReport> {
  const raw = await fetchHtml(rawUrl);
  return scanComplianceHtml(raw);
}
