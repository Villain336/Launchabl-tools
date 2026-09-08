// Production notes: v1 checks only the links found on a single page (not a
// full-site crawl) and caps the number of links checked to keep response
// times reasonable on a free tool. A production crawler would walk the
// sitemap/internal link graph and queue checks across many pages.

export type LinkCheckResult = {
  url: string;
  status: number | null;
  ok: boolean;
  error?: string;
};

export type BrokenLinkReport = {
  pageUrl: string;
  totalLinksChecked: number;
  brokenCount: number;
  links: LinkCheckResult[];
};

const MAX_LINKS = 25;
const USER_AGENT = "LaunchableAuditBot/1.0 (+https://launchable.example/tools)";

export async function checkBrokenLinks(rawUrl: string): Promise<BrokenLinkReport> {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const pageUrl = new URL(url);

  const res = await fetch(pageUrl.toString(), {
    redirect: "follow",
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(12000),
  });
  const html = await res.text();

  const hrefs = Array.from(html.matchAll(/<a\b[^>]*href=["']([^"'#][^"']*)["']/gi)).map((m) => m[1]);
  const uniqueAbsolute = Array.from(
    new Set(
      hrefs
        .filter((h) => !/^(mailto:|tel:|javascript:)/i.test(h))
        .map((h) => {
          try {
            return new URL(h, pageUrl).toString();
          } catch {
            return null;
          }
        })
        .filter((h): h is string => Boolean(h)),
    ),
  ).slice(0, MAX_LINKS);

  const links = await Promise.all(
    uniqueAbsolute.map(async (link): Promise<LinkCheckResult> => {
      try {
        let response = await fetch(link, {
          method: "HEAD",
          redirect: "follow",
          signal: AbortSignal.timeout(8000),
          headers: { "User-Agent": USER_AGENT },
        });
        if (response.status === 405 || response.status === 501) {
          response = await fetch(link, {
            method: "GET",
            redirect: "follow",
            signal: AbortSignal.timeout(8000),
            headers: { "User-Agent": USER_AGENT },
          });
        }
        return { url: link, status: response.status, ok: response.ok };
      } catch (err) {
        return {
          url: link,
          status: null,
          ok: false,
          error: err instanceof Error ? err.message : "Request failed.",
        };
      }
    }),
  );

  return {
    pageUrl: pageUrl.toString(),
    totalLinksChecked: links.length,
    brokenCount: links.filter((l) => !l.ok).length,
    links,
  };
}
