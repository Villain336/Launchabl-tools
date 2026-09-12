"use client";

import { useState } from "react";
import { AtSign, ChevronDown, Info } from "lucide-react";
import type { DnsEmailReport } from "@/lib/web/dns-email";
import type { SecurityHeadersReport } from "@/lib/web/security-headers";
import type { AccessibilityReport } from "@/lib/web/accessibility";
import type { SslReport } from "@/lib/web/ssl";
import type { EmailFinderResult } from "@/lib/web/email-finder";
import { ArtifactHeader, CopyButton, Footnote, Pill, Tabs, shorten, type Tone } from "@/components/tools/chat/bits";
import { DNS_HOSTS, formatRecords, type DnsHostId, type RecommendedRecord } from "@/lib/web/dns-format";

/* ── Strips rendered inside ChecklistArtifact for the infra report kinds ── */

function Fact({ label, value, t }: { label: string; value: string; t?: Tone }) {
  return (
    <div className="min-w-0 rounded-control bg-field px-3 py-2">
      <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">{label}</p>
      <p className={`mt-0.5 truncate text-[12.5px] font-medium tabular-nums ${t ? (t === "good" ? "text-green" : t === "warn" ? "text-orange" : t === "bad" ? "text-red" : "text-ink") : "text-ink"}`} title={value}>
        {value}
      </p>
    </div>
  );
}

function RawBlock({ label, rows }: { label: string; rows: { name: string; value: string }[] }) {
  const [open, setOpen] = useState(false);
  if (rows.length === 0) return null;
  return (
    <div className="border-b border-line">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-2 text-[11.5px] font-medium text-ink-3 hover:bg-hover hover:text-ink">
        <span className="tracking-wide uppercase">{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <dl className="grid gap-x-3 gap-y-1 px-4 pb-3 text-[12px] sm:grid-cols-[minmax(120px,max-content)_1fr]">
          {rows.map((r) => (
            <div key={`${r.name}-${r.value.slice(0, 20)}`} className="contents">
              <dt className="truncate font-mono text-ink-3">{r.name}</dt>
              <dd className="min-w-0 font-mono break-all text-ink">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function RecordsToPublish({ records, domain }: { records: RecommendedRecord[]; domain: string }) {
  const [host, setHost] = useState<DnsHostId>("cloudflare");
  if (!records.length) return null;
  const text = formatRecords(records, domain, host);
  return (
    <div className="border-b border-line px-4 py-3" data-dns-recommended>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">
          Records to publish · {records.length}
        </p>
        <div className="flex items-center gap-1">
          <Tabs value={host} onChange={setHost} options={DNS_HOSTS.map((h) => ({ key: h.id, label: h.label }))} />
          <CopyButton text={text} label="Copy all" />
        </div>
      </div>
      <ul className="mt-2 space-y-2">
        {records.map((r, i) => (
          <li key={i} className="rounded-control bg-field px-3 py-2">
            <div className="flex items-start gap-2">
              <code className="min-w-0 flex-1 font-mono text-[11.5px] break-all text-ink">
                <span className="text-ink-3">{r.host === "@" ? domain : `${r.host}.${domain}`}</span> <span className="text-ink-3">{r.type}</span> {r.value}
              </code>
              <CopyButton text={r.value} />
            </div>
            <p className="mt-1 text-[11.5px] text-ink-2">{r.why}</p>
          </li>
        ))}
      </ul>
      <pre className="mt-2 max-h-48 overflow-auto rounded-control border border-line bg-surface px-3 py-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-ink-2">{text}</pre>
    </div>
  );
}

export function DnsEmailStrip({ report }: { report: DnsEmailReport }) {
  const f = report.facts;
  const rows = [
    ...report.records.mx.map((m) => ({ name: "MX", value: `${m.priority} ${m.exchange}` })),
    ...(report.records.spf ? [{ name: "TXT (SPF)", value: report.records.spf }] : []),
    ...(report.records.dmarc ? [{ name: "_dmarc", value: report.records.dmarc }] : []),
    ...report.records.dkim.map((d) => ({ name: `${d.selector}._domainkey`, value: d.record.length > 160 ? `${d.record.slice(0, 160)}…` : d.record })),
    ...(report.records.mtaSts ? [{ name: "_mta-sts", value: report.records.mtaSts }] : []),
    ...(report.records.tlsRpt ? [{ name: "_smtp._tls", value: report.records.tlsRpt }] : []),
    ...(report.records.bimi ? [{ name: "default._bimi", value: report.records.bimi }] : []),
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-2 border-b border-line px-4 py-3 sm:grid-cols-4">
        <Fact label="Mail provider" value={String(f.provider ?? (f.mxCount ? "Custom" : "None"))} />
        <Fact label="SPF" value={f.spf ? `${f.spfQualifier ?? "?"}all · ${f.spfLookups ?? "?"}/10 lookups` : "Missing"} t={f.spf ? (f.spfQualifier === "-" || f.spfQualifier === "~" ? "good" : "warn") : "bad"} />
        <Fact label="DMARC" value={f.dmarcPolicy ? `p=${f.dmarcPolicy}${f.dmarcReporting ? " · reports" : ""}` : "Missing"} t={f.dmarcPolicy === "reject" || f.dmarcPolicy === "quarantine" ? "good" : f.dmarcPolicy === "none" ? "warn" : "bad"} />
        <Fact label="DKIM" value={f.dkimSelectors ? String(f.dkimSelectors) : "Not found"} t={f.dkimSelectors ? "good" : "warn"} />
      </div>
      <RecordsToPublish records={report.recommended ?? []} domain={report.domain} />
      <RawBlock label="DNS records found" rows={rows} />
    </>
  );
}

export function SecurityHeadersStrip({ report }: { report: SecurityHeadersReport }) {
  const gradeTone: Tone = report.grade.startsWith("A") ? "good" : report.grade === "B" || report.grade === "C" ? "warn" : "bad";
  const present = report.headers.filter((h) => h.value);
  return (
    <>
      <div className="grid grid-cols-2 gap-2 border-b border-line px-4 py-3 sm:grid-cols-4">
        <Fact label="Grade" value={report.grade} t={gradeTone} />
        <Fact label="CSP" value={String(report.facts.csp)} t={report.facts.csp === "present" ? "good" : report.facts.csp === "missing" ? "bad" : "warn"} />
        <Fact label="HSTS" value={report.facts.hsts ? "On" : "Off"} t={report.facts.hsts ? "good" : "bad"} />
        <Fact label="Cookies" value={report.cookies.length ? `${report.cookies.length} set` : "None on this page"} />
      </div>
      <RawBlock label={`Response headers · ${present.length} of ${report.headers.length} watched`} rows={present.map((h) => ({ name: h.name, value: h.value ?? "" }))} />
    </>
  );
}

export function AccessibilityStrip({ report }: { report: AccessibilityReport }) {
  const s = report.stats;
  const examples = Object.entries(report.examples).filter(([, list]) => list.length > 0);
  return (
    <>
      <div className="grid grid-cols-2 gap-2 border-b border-line px-4 py-3 sm:grid-cols-4">
        <Fact label="Images" value={`${s.images - s.imagesMissingAlt}/${s.images} with alt`} t={s.imagesMissingAlt ? "bad" : "good"} />
        <Fact label="Form fields" value={s.formFields ? `${s.formFields - s.unlabeledFields}/${s.formFields} labelled` : "None"} t={s.unlabeledFields ? "bad" : "good"} />
        <Fact label="Controls" value={s.emptyButtons || s.emptyLinks ? `${s.emptyButtons + s.emptyLinks} unnamed` : "All named"} t={s.emptyButtons || s.emptyLinks ? "bad" : "good"} />
        <Fact label="Headings" value={`${s.headings}`} />
      </div>
      {examples.length > 0 && <RawBlock label="Offending elements" rows={examples.flatMap(([id, list]) => list.map((v) => ({ name: id, value: v })))} />}
    </>
  );
}

export function SslStrip({ report }: { report: SslReport }) {
  const c = report.certificate;
  const conn = report.connection;
  if (!c || !conn) return null;
  const days = c.daysRemaining ?? 0;
  const rows = [
    { name: "Subject", value: c.subject ?? "—" },
    { name: "Issuer", value: [c.issuerOrg, c.issuer].filter(Boolean).join(" · ") || "—" },
    { name: "Valid from", value: c.validFrom?.slice(0, 10) ?? "—" },
    { name: "Valid to", value: c.validTo?.slice(0, 10) ?? "—" },
    { name: "Names", value: c.sans.join(", ") || "—" },
    { name: "Key", value: c.keyType ? `${c.keyType}${c.keyBits ? ` ${c.keyBits}-bit` : ""}` : "—" },
    { name: "Chain", value: `${c.chainLength} certificate${c.chainLength === 1 ? "" : "s"}${c.selfSigned ? " · self-signed" : ""}` },
    { name: "Protocol", value: `${conn.protocol ?? "—"} · ${conn.cipher ?? "—"}${conn.alpn ? ` · ${conn.alpn}` : ""}` },
    { name: "Serial", value: c.serial ?? "—" },
    { name: "SHA-256", value: c.fingerprint256 ?? "—" },
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-2 border-b border-line px-4 py-3 sm:grid-cols-4">
        <Fact label="Trusted" value={conn.authorized ? "Yes" : "No"} t={conn.authorized ? "good" : "bad"} />
        <Fact label="Expires" value={c.daysRemaining === null ? "—" : days < 0 ? `${-days}d ago` : `in ${days}d`} t={days < 0 || days <= 7 ? "bad" : days <= 30 ? "warn" : "good"} />
        <Fact label="Issuer" value={c.issuerOrg ?? c.issuer ?? "—"} />
        <Fact label="Protocol" value={conn.protocol ?? "—"} t={conn.protocol === "TLSv1.3" || conn.protocol === "TLSv1.2" ? "good" : "bad"} />
      </div>
      <RawBlock label="Certificate details" rows={rows} />
    </>
  );
}

/* ── Email finder card ─────────────────────────────────── */

export function EmailFinderArtifact({ result }: { result: EmailFinderResult }) {
  const top = result.candidates[0];
  const mailTone: Tone = result.mail.accepts ? "good" : "bad";
  return (
    <>
      <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card">
        <ArtifactHeader icon={<AtSign className="h-4 w-4" />} title={`Likely emails for ${result.person.full}`} subtitle={<>{result.domain}{result.mail.provider ? ` · ${result.mail.provider}` : ""} · {result.pagesRead.length} page{result.pagesRead.length === 1 ? "" : "s"} read</>}>
          <Pill t={mailTone}>{result.mail.accepts ? "Accepts mail" : "No mail server"}</Pill>
        </ArtifactHeader>

        <div className="grid grid-cols-2 gap-2 border-b border-line px-4 py-3 sm:grid-cols-3">
          <Fact label="Pattern on site" value={result.detectedPattern ?? "Not found"} t={result.detectedPattern ? "good" : undefined} />
          <Fact label="Best guess" value={top?.email ?? "—"} t={top && top.confidence >= 0.5 ? "good" : "warn"} />
          <Fact label="Confidence" value={top ? `${Math.round(top.confidence * 100)}%` : "—"} />
        </div>

        <ul className="divide-y divide-line">
          {result.candidates.slice(0, 8).map((c, i) => (
            <li key={c.email} className="flex items-center gap-3 px-4 py-2">
              <div className="w-14 shrink-0">
                <div className="h-1.5 overflow-hidden rounded-full bg-field">
                  <div className={`h-full rounded-full ${i === 0 ? "bg-primary" : "bg-ink-3/40"}`} style={{ width: `${Math.max(4, Math.round(c.confidence * 100))}%` }} />
                </div>
                <p className="mt-0.5 text-[10.5px] tabular-nums text-ink-3">{Math.round(c.confidence * 100)}%</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate font-mono text-[12.5px] ${i === 0 ? "font-medium text-ink" : "text-ink"}`}>{c.email}</p>
                <p className="truncate text-[11.5px] text-ink-3">{c.reason}</p>
              </div>
              <CopyButton text={c.email} label="" />
            </li>
          ))}
        </ul>

        {(result.roleAddresses.length > 0 || result.observed.length > 0) && (
          <div className="border-t border-line px-4 py-3">
            <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">Found on {result.domain}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {result.roleAddresses.map((r) => (
                <a key={r.email} href={`mailto:${r.email}`} className="inline-flex h-6 items-center rounded-chip bg-field px-2 font-mono text-[11.5px] text-ink hover:bg-hover" title={`Seen on ${shorten(r.source)}`}>
                  {r.email}
                </a>
              ))}
              {result.observed.map((o) => (
                <span key={o.email} className="inline-flex h-6 items-center gap-1 rounded-chip bg-accent-tint px-2 font-mono text-[11.5px] text-accent-ink" title={`Seen on ${shorten(o.source)}`}>
                  {o.email}
                  {o.pattern && <span className="text-[10.5px] opacity-70">· {o.pattern}</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        <Footnote icon={<Info className="h-3 w-3" />}>Ranks patterns and confirms the domain&apos;s mail server; it does not verify that a mailbox exists.</Footnote>
      </div>
    </>
  );
}
