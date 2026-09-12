/**
 * Paste-ready DNS record formatting. Every DNS host wants the same data in
 * a slightly different shape — Cloudflare wants "@" for the apex, GoDaddy
 * and Namecheap want the host without the domain, Route 53 wants FQDNs
 * with quoted TXT values, and a zone file wants everything fully qualified.
 */

export type RecommendedRecord = { host: string; type: "TXT" | "MX" | "CNAME"; value: string; ttl?: number; why: string; priority?: number };

export const DNS_HOSTS = [
  { id: "cloudflare", label: "Cloudflare" },
  { id: "godaddy", label: "GoDaddy / Namecheap" },
  { id: "route53", label: "Route 53" },
  { id: "google", label: "Google / Squarespace" },
  { id: "zone", label: "Zone file" },
] as const;

export type DnsHostId = (typeof DNS_HOSTS)[number]["id"];

/** `host` is relative to the zone: "@" for the apex, "_dmarc" for _dmarc.example.com. */
export function formatRecords(records: RecommendedRecord[], domain: string, host: DnsHostId): string {
  const fqdn = (h: string) => (h === "@" ? domain : `${h}.${domain}`);
  const quote = (v: string) => (v.length > 255 ? splitTxt(v) : `"${v}"`);
  switch (host) {
    case "cloudflare":
      return records.map((r) => `Type: ${r.type}\nName: ${r.host}\nContent: ${r.value}${r.priority !== undefined ? `\nPriority: ${r.priority}` : ""}\nTTL: Auto`).join("\n\n");
    case "godaddy":
      return records.map((r) => `Type: ${r.type}\nHost: ${r.host}\nValue: ${r.value}${r.priority !== undefined ? `\nPriority: ${r.priority}` : ""}\nTTL: 1 hour`).join("\n\n");
    case "route53":
      return records.map((r) => `Record name: ${fqdn(r.host)}\nRecord type: ${r.type}\nValue: ${r.type === "TXT" ? quote(r.value) : r.priority !== undefined ? `${r.priority} ${r.value}` : r.value}\nTTL: 300`).join("\n\n");
    case "google":
      return records.map((r) => `Host name: ${r.host === "@" ? domain : fqdn(r.host)}\nType: ${r.type}\nTTL: 1H\nData: ${r.priority !== undefined ? `${r.priority} ${r.value}` : r.value}`).join("\n\n");
    case "zone":
      return records.map((r) => `${fqdn(r.host)}.\t${r.ttl ?? 3600}\tIN\t${r.type}\t${r.priority !== undefined ? `${r.priority} ` : ""}${r.type === "TXT" ? quote(r.value) : r.value}`).join("\n");
  }
}

/** TXT strings over 255 bytes must be split into quoted chunks. */
function splitTxt(value: string): string {
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += 255) chunks.push(`"${value.slice(i, i + 255)}"`);
  return chunks.join(" ");
}
