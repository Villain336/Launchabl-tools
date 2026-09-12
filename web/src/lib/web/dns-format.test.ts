import { describe, expect, it } from "vitest";
import { formatRecords } from "./dns-format";
import { recommendedRecords } from "./dns-email";

describe("dns fixes", () => {
  it("recommends SPF + DMARC when both are missing, DKIM hint for a known provider", () => {
    const recs = recommendedRecords({ domain: "acme.com", provider: "Google Workspace", spf: null, spfAnalysis: null, dmarc: null, dmarcTags: {}, dkimFound: false, spfCount: 0, dmarcCount: 0 });
    expect(recs.map((r) => r.host)).toEqual(["@", "_dmarc", "<selector>._domainkey"]);
    expect(recs[0].value).toBe("v=spf1 include:_spf.google.com -all");
    expect(recs[1].value).toContain("p=none");
  });

  it("moves p=none forward and leaves an enforcing domain alone", () => {
    const next = recommendedRecords({ domain: "acme.com", provider: null, spf: "v=spf1 include:x -all", spfAnalysis: { lookups: 1, qualifier: "-", includes: ["x"], hasPtr: false, overBudget: false, unresolved: [], allowsAll: false }, dmarc: "v=DMARC1; p=none; rua=mailto:r@acme.com", dmarcTags: { p: "none", rua: "mailto:r@acme.com" }, dkimFound: true, spfCount: 1, dmarcCount: 1 });
    expect(next).toHaveLength(1);
    expect(next[0].value).toContain("p=quarantine; pct=25; rua=mailto:r@acme.com");
    const done = recommendedRecords({ domain: "acme.com", provider: null, spf: "v=spf1 include:x -all", spfAnalysis: { lookups: 1, qualifier: "-", includes: ["x"], hasPtr: false, overBudget: false, unresolved: [], allowsAll: false }, dmarc: "v=DMARC1; p=reject; rua=mailto:r@acme.com", dmarcTags: { p: "reject", rua: "mailto:r@acme.com" }, dkimFound: true, spfCount: 1, dmarcCount: 1 });
    expect(done).toHaveLength(0);
  });

  it("formats per DNS host", () => {
    const recs = [{ host: "_dmarc", type: "TXT" as const, value: "v=DMARC1; p=none", why: "" }];
    expect(formatRecords(recs, "acme.com", "cloudflare")).toContain("Name: _dmarc");
    expect(formatRecords(recs, "acme.com", "route53")).toContain('Record name: _dmarc.acme.com\nRecord type: TXT\nValue: "v=DMARC1; p=none"');
    expect(formatRecords(recs, "acme.com", "zone")).toBe('_dmarc.acme.com.\t3600\tIN\tTXT\t"v=DMARC1; p=none"');
    const long = [{ host: "@", type: "TXT" as const, value: "x".repeat(300), why: "" }];
    expect(formatRecords(long, "acme.com", "zone").match(/"/g)?.length).toBe(4);
  });
});
