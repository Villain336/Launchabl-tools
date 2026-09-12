import tls, { type DetailedPeerCertificate, type TLSSocket } from "node:tls";
import { finalizeChecklist, type Check, type ChecklistReport } from "@/lib/web/checklist";
import { FETCH_HEADERS } from "@/lib/web/fetch-page";
import { normalizeDomain } from "@/lib/web/dns-email";

/**
 * Real TLS handshake to the host — the same thing a browser does — plus the
 * things a browser wouldn't tell you: chain completeness, key strength,
 * legacy protocol support, cipher quality, whether the www/apex twin is
 * covered, whether HTTP redirects and HSTS are in place.
 */

export type SslReport = ChecklistReport & {
  kind: "ssl";
  host: string;
  certificate: {
    subject: string | null;
    issuer: string | null;
    issuerOrg: string | null;
    sans: string[];
    validFrom: string | null;
    validTo: string | null;
    daysRemaining: number | null;
    serial: string | null;
    fingerprint256: string | null;
    keyType: string | null;
    keyBits: number | null;
    chainLength: number;
    selfSigned: boolean;
  } | null;
  connection: { protocol: string | null; cipher: string | null; authorized: boolean; authorizationError: string | null; alpn: string | null } | null;
};

type Handshake = { socket: TLSSocket; cert: DetailedPeerCertificate } | { error: string };

function handshake(host: string, opts: Partial<tls.ConnectionOptions> = {}, timeoutMs = 8_000): Promise<Handshake> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: Handshake) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    let socket: TLSSocket;
    try {
      socket = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false, ALPNProtocols: ["h2", "http/1.1"], ...opts }, () => {
        const cert = socket.getPeerCertificate(true);
        if (!cert || Object.keys(cert).length === 0) {
          finish({ error: "The server did not present a certificate." });
          socket.destroy();
          return;
        }
        finish({ socket, cert });
      });
    } catch (error) {
      finish({ error: error instanceof Error ? error.message : "Connection failed." });
      return;
    }
    socket.setTimeout(timeoutMs, () => {
      finish({ error: "Connection timed out." });
      socket.destroy();
    });
    socket.on("error", (err: NodeJS.ErrnoException) => {
      finish({ error: err.code === "ENOTFOUND" ? "Host not found." : err.code === "ECONNREFUSED" ? "Nothing is listening on port 443." : err.message });
    });
  });
}

const single = (v: string | string[] | undefined | null) => (Array.isArray(v) ? v[0] ?? null : v ?? null);

export function parseSans(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^DNS:/i.test(s))
    .map((s) => s.slice(4).toLowerCase());
}

export function coversHost(host: string, sans: string[], cn: string | null): boolean {
  const names = sans.length ? sans : cn ? [cn.toLowerCase()] : [];
  return names.some((n) => n === host || (n.startsWith("*.") && host.endsWith(n.slice(1)) && host.split(".").length === n.split(".").length));
}

function chainLength(cert: DetailedPeerCertificate): { length: number; selfSigned: boolean } {
  let length = 1;
  let current = cert;
  const seen = new Set<string>([cert.fingerprint256]);
  while (current.issuerCertificate && !seen.has(current.issuerCertificate.fingerprint256)) {
    seen.add(current.issuerCertificate.fingerprint256);
    current = current.issuerCertificate;
    length += 1;
  }
  const selfSigned = length === 1 && (!cert.issuerCertificate || cert.issuerCertificate.fingerprint256 === cert.fingerprint256);
  return { length, selfSigned };
}

async function probeHttp(host: string): Promise<{ https: { status: number; hsts: string | null } | null; http: { status: number; location: string | null } | null }> {
  const run = async (url: string): Promise<Response | null> => {
    try {
      const res = await fetch(url, { method: "GET", redirect: "manual", headers: FETCH_HEADERS, signal: AbortSignal.timeout(6_000) });
      res.body?.cancel().catch(() => undefined);
      return res;
    } catch {
      return null;
    }
  };
  const [https, http] = await Promise.all([run(`https://${host}/`), run(`http://${host}/`)]);
  return {
    https: https ? { status: https.status, hsts: https.headers.get("strict-transport-security") } : null,
    http: http ? { status: http.status, location: http.headers.get("location") } : null,
  };
}

export async function checkSsl(rawHost: string): Promise<SslReport> {
  const host = normalizeDomain(rawHost);
  const checks: Check[] = [];
  const base = { kind: "ssl" as const, requestedUrl: rawHost, finalUrl: `https://${host}`, status: 200, title: host };

  const main = await handshake(host);
  if ("error" in main) {
    checks.push({ id: "connect", status: "fail", group: "Connection", title: `Couldn't complete a TLS handshake with ${host}`, detail: main.error, fix: main.error.includes("port 443") ? "The site isn't serving HTTPS. Enable TLS on the web server or load balancer, then redirect HTTP to HTTPS." : "Check that the domain resolves to the right server and that port 443 is open." });
    const probe = await probeHttp(host);
    if (probe.http && probe.http.status < 400) checks.push({ id: "http-redirect", status: "fail", group: "Connection", title: "The site answers on plain HTTP only", detail: `http://${host} returned ${probe.http.status}.`, fix: "Add a certificate (Let's Encrypt is free and automatic on most hosts) and redirect HTTP → HTTPS." });
    return { ...finalizeChecklist({ ...base, facts: { host, connected: false, error: main.error } }, checks), kind: "ssl", host, certificate: null, connection: null };
  }

  const { socket, cert } = main;
  const protocol = socket.getProtocol();
  const cipher = socket.getCipher();
  const authorized = socket.authorized;
  const authError = socket.authorizationError ? String(socket.authorizationError) : null;
  const alpn = typeof socket.alpnProtocol === "string" ? socket.alpnProtocol : null;
  const sans = parseSans(cert.subjectaltname);
  const cn = single(cert.subject?.CN);
  const issuerOrg = single(cert.issuer?.O);
  const issuerCn = single(cert.issuer?.CN);
  const validFrom = cert.valid_from ? new Date(cert.valid_from) : null;
  const validTo = cert.valid_to ? new Date(cert.valid_to) : null;
  const daysRemaining = validTo ? Math.floor((validTo.getTime() - Date.now()) / 86_400_000) : null;
  const lifetimeDays = validFrom && validTo ? Math.round((validTo.getTime() - validFrom.getTime()) / 86_400_000) : null;
  const chain = chainLength(cert);
  const keyType = cert.asn1Curve ? `EC ${cert.asn1Curve}` : cert.bits ? "RSA" : null;
  const keyBits = cert.bits ?? null;
  socket.destroy();

  /* Connection */
  checks.push({ id: "connect", status: "pass", group: "Connection", title: `TLS handshake succeeded over ${protocol ?? "TLS"}`, detail: `${cipher?.name ?? "unknown cipher"}${alpn ? ` · ${alpn.toUpperCase()}` : ""}` });
  const hostnameMatch = coversHost(host, sans, cn);
  if (!authorized) {
    const reason = authError ?? "unknown";
    const expired = /expired|CERT_HAS_EXPIRED/i.test(reason);
    const selfSigned = /self.signed|SELF_SIGNED/i.test(reason) || chain.selfSigned;
    const unknownCa = /unable to get (local )?issuer|UNABLE_TO_GET_ISSUER|UNABLE_TO_VERIFY_LEAF/i.test(reason);
    const mismatch = /altname|hostname|ERR_TLS_CERT_ALTNAME_INVALID/i.test(reason) || !hostnameMatch;
    checks.push({
      id: "trusted",
      status: "fail",
      group: "Certificate",
      title: expired ? "Certificate has expired" : selfSigned ? "Certificate is self-signed" : mismatch ? `Certificate doesn't cover ${host}` : unknownCa ? "Certificate chain is incomplete or untrusted" : "Certificate isn't trusted by browsers",
      detail: `${reason}. Visitors see a full-page security warning and most leave.`,
      fix: expired ? "Renew the certificate now and set up automatic renewal (certbot, your host's managed TLS, or a CDN)." : selfSigned ? "Replace it with a certificate from a public CA — Let's Encrypt is free." : mismatch ? `Issue a certificate that lists ${host} (and www.${host.replace(/^www\./, "")}) as Subject Alternative Names.` : unknownCa ? "Serve the full chain: your certificate plus the intermediate CA certificate (fullchain.pem, not cert.pem)." : "Check the issuing CA and chain configuration.",
    });
  } else {
    checks.push({ id: "trusted", status: "pass", group: "Certificate", title: `Trusted certificate from ${issuerOrg ?? issuerCn ?? "a public CA"}`, detail: issuerCn ?? "" });
  }
  if (authorized && !hostnameMatch) checks.push({ id: "hostname", status: "fail", group: "Certificate", title: `Certificate names don't include ${host}`, detail: `Covers: ${(sans.length ? sans : [cn ?? "?"]).slice(0, 6).join(", ")}${sans.length > 6 ? "…" : ""}`, fix: `Reissue with ${host} in the SAN list.` });

  /* Expiry */
  if (daysRemaining !== null) {
    const when = validTo!.toISOString().slice(0, 10);
    if (daysRemaining < 0) checks.push({ id: "expiry", status: "fail", group: "Certificate", title: `Expired ${-daysRemaining} day${daysRemaining === -1 ? "" : "s"} ago (${when})`, detail: "Every browser blocks the site with a warning.", fix: "Renew immediately and automate renewal so this can't recur." });
    else if (daysRemaining <= 7) checks.push({ id: "expiry", status: "fail", group: "Certificate", title: `Expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} (${when})`, detail: "Renewal has probably failed — automated setups renew 30 days out.", fix: "Renew today; check the ACME client logs or your host's TLS dashboard for the failure." });
    else if (daysRemaining <= 30) checks.push({ id: "expiry", status: "warn", group: "Certificate", title: `Expires in ${daysRemaining} days (${when})`, detail: lifetimeDays && lifetimeDays <= 90 ? "Normal for a 90-day Let's Encrypt certificate if renewal is automated; verify the renewal job is healthy." : "Schedule the renewal now.", fix: lifetimeDays && lifetimeDays <= 90 ? undefined : "Renew the certificate and add expiry monitoring." });
    else checks.push({ id: "expiry", status: "pass", group: "Certificate", title: `Valid for ${daysRemaining} more days (until ${when})`, detail: validFrom ? `Issued ${validFrom.toISOString().slice(0, 10)} · ${lifetimeDays}-day certificate.` : "" });
    if (lifetimeDays && lifetimeDays > 398) checks.push({ id: "lifetime", status: "warn", group: "Certificate", title: `${lifetimeDays}-day validity exceeds the 398-day browser limit`, detail: "Chrome, Safari and Firefox reject publicly-trusted certificates valid longer than 398 days when issued after Sept 2020.", fix: "Reissue with a one-year (or shorter) validity." });
  }

  /* Chain, key, names */
  if (authorized) {
    checks.push(chain.length >= 2 ? { id: "chain", status: "pass", group: "Certificate", title: `Full chain served (${chain.length} certificates)`, detail: `Leaf → ${issuerCn ?? "intermediate"}${chain.length > 2 ? " → root" : ""}` } : { id: "chain", status: "warn", group: "Certificate", title: "Only the leaf certificate is served", detail: "Modern browsers often fetch the intermediate themselves, but older Android, Java clients and some crawlers fail.", fix: "Configure the server with fullchain.pem (leaf + intermediates)." });
  }
  if (keyType) {
    const weak = keyType === "RSA" && (keyBits ?? 0) < 2048;
    checks.push(weak ? { id: "key", status: "fail", group: "Certificate", title: `Weak ${keyBits}-bit RSA key`, detail: "Keys under 2048 bits are rejected by browsers and CAs.", fix: "Reissue with a 2048-bit RSA or P-256 EC key." } : { id: "key", status: "pass", group: "Certificate", title: keyType === "RSA" ? `RSA ${keyBits}-bit key` : `${keyType} key`, detail: keyType === "RSA" && (keyBits ?? 0) >= 4096 ? "Strong; EC P-256 would be faster with equivalent security." : "Strong." });
  }
  const twin = host.startsWith("www.") ? host.slice(4) : `www.${host}`;
  const isApexOrWww = host.startsWith("www.") ? host.split(".").length === 3 : host.split(".").length === 2;
  if (sans.length && isApexOrWww && !coversHost(twin, sans, cn)) {
    checks.push({ id: "twin", status: "warn", group: "Certificate", title: `Certificate doesn't cover ${twin}`, detail: "Visitors who type (or are linked to) the other form of the address get a certificate error before any redirect can run.", fix: `Add ${twin} as a SAN when you reissue, or point ${twin} at a host that has its own valid certificate.` });
  } else if (sans.length >= 2) {
    checks.push({ id: "twin", status: "pass", group: "Certificate", title: `Covers ${sans.length} names including ${sans.includes(twin) || sans.some((s) => s.startsWith("*.")) ? twin : sans[1]}`, detail: sans.slice(0, 8).join(", ") + (sans.length > 8 ? "…" : "") });
  }

  /* Protocols */
  const proto = protocol ?? "";
  if (proto === "TLSv1.3") checks.push({ id: "protocol", status: "pass", group: "Protocol", title: "Negotiated TLS 1.3", detail: "The current standard: faster handshakes and only forward-secret ciphers." });
  else if (proto === "TLSv1.2") checks.push({ id: "protocol", status: "pass", group: "Protocol", title: "Negotiated TLS 1.2", detail: "Still secure. Enabling TLS 1.3 shaves a round-trip off every new connection.", fix: "Enable TLS 1.3 on the server or CDN." });
  else checks.push({ id: "protocol", status: "fail", group: "Protocol", title: `Negotiated ${proto || "an unknown protocol"}`, detail: "TLS 1.0/1.1 are deprecated and blocked by modern browsers.", fix: "Enable TLS 1.2 and 1.3; disable everything older." });

  const legacy = await handshake(host, { minVersion: "TLSv1", maxVersion: "TLSv1.1" }, 5_000);
  if (!("error" in legacy)) {
    legacy.socket.destroy();
    checks.push({ id: "legacy-protocols", status: "warn", group: "Protocol", title: `Server still accepts ${legacy.socket.getProtocol() ?? "TLS 1.0/1.1"}`, detail: "Deprecated since 2020 (RFC 8996); flagged by PCI DSS and security scanners.", fix: "Set the minimum protocol version to TLS 1.2 on the server, load balancer or CDN." });
  } else {
    checks.push({ id: "legacy-protocols", status: "pass", group: "Protocol", title: "TLS 1.0 and 1.1 are refused", detail: "Only modern protocol versions are accepted." });
  }
  if (cipher?.name) {
    const weakCipher = /CBC|RC4|3DES|DES-|NULL|EXPORT|MD5|anon/i.test(cipher.name);
    const forwardSecret = /ECDHE|DHE|TLS_(AES|CHACHA)/i.test(cipher.name) || proto === "TLSv1.3";
    checks.push(weakCipher ? { id: "cipher", status: "warn", group: "Protocol", title: `Weak cipher negotiated: ${cipher.name}`, detail: "CBC-mode and legacy ciphers have known padding-oracle and downgrade issues.", fix: "Prefer AES-GCM and ChaCha20-Poly1305 suites with ECDHE key exchange (Mozilla's “intermediate” profile)." } : { id: "cipher", status: "pass", group: "Protocol", title: `Modern cipher: ${cipher.name}`, detail: forwardSecret ? "Forward secrecy: recorded traffic can't be decrypted later even if the key leaks." : "" });
  }

  /* HTTP layer */
  const probe = await probeHttp(host);
  if (probe.http) {
    const redirects = [301, 302, 307, 308].includes(probe.http.status) && (probe.http.location ?? "").startsWith("https://");
    if (redirects) checks.push({ id: "http-redirect", status: probe.http.status === 301 || probe.http.status === 308 ? "pass" : "warn", group: "HTTP", title: `HTTP redirects to HTTPS (${probe.http.status})`, detail: probe.http.location ?? "", fix: probe.http.status === 301 || probe.http.status === 308 ? undefined : "Use a permanent 301/308 so browsers cache the upgrade." });
    else if (probe.http.status < 400) checks.push({ id: "http-redirect", status: "fail", group: "HTTP", title: "Site is also served over plain HTTP", detail: `http://${host} returned ${probe.http.status} instead of redirecting.`, fix: "Redirect every HTTP request to HTTPS with a 301." });
  } else {
    checks.push({ id: "http-redirect", status: "info", group: "HTTP", title: "Port 80 doesn't answer", detail: "Nothing insecure is served, but users who type the bare domain in an old browser get a connection error rather than a redirect." });
  }
  if (probe.https) {
    const hsts = probe.https.hsts;
    const maxAge = Number(hsts?.match(/max-age\s*=\s*(\d+)/i)?.[1] ?? 0);
    checks.push(!hsts ? { id: "hsts", status: "warn", group: "HTTP", title: "No HSTS header", detail: "Browsers will still try HTTP first on later visits typed without https://.", fix: "Send `Strict-Transport-Security: max-age=31536000; includeSubDomains`." } : maxAge >= 15_552_000 ? { id: "hsts", status: "pass", group: "HTTP", title: `HSTS enabled (${Math.round(maxAge / 86_400)} days)`, detail: hsts } : { id: "hsts", status: "warn", group: "HTTP", title: `HSTS max-age is short (${Math.round(maxAge / 86_400)} days)`, detail: hsts, fix: "Raise max-age to 31536000." });
  }

  const certificate: SslReport["certificate"] = {
    subject: cn,
    issuer: issuerCn,
    issuerOrg,
    sans,
    validFrom: validFrom?.toISOString() ?? null,
    validTo: validTo?.toISOString() ?? null,
    daysRemaining,
    serial: cert.serialNumber ?? null,
    fingerprint256: cert.fingerprint256 ?? null,
    keyType,
    keyBits,
    chainLength: chain.length,
    selfSigned: chain.selfSigned,
  };
  const connection: SslReport["connection"] = { protocol, cipher: cipher?.name ?? null, authorized, authorizationError: authError, alpn };
  const report = finalizeChecklist(
    {
      ...base,
      facts: { host, issuer: issuerOrg ?? issuerCn, validTo: certificate.validTo, daysRemaining, protocol, cipher: cipher?.name ?? null, trusted: authorized, sans: sans.length, keyType, keyBits, chainLength: chain.length, lifetimeDays },
    },
    checks,
  );
  return { ...report, kind: "ssl", host, certificate, connection };
}
