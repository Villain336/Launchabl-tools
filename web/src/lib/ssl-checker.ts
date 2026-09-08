import tls from "node:tls";

export type SslResult = {
  host: string;
  connected: boolean;
  valid: boolean;
  issuer: string | null;
  subject: string | null;
  validFrom: string | null;
  validTo: string | null;
  daysRemaining: number | null;
  protocol: string | null;
  error?: string;
};

function toSingleString(value: string | string[] | undefined | null): string | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function emptyResult(host: string, error: string): SslResult {
  return {
    host,
    connected: false,
    valid: false,
    issuer: null,
    subject: null,
    validFrom: null,
    validTo: null,
    daysRemaining: null,
    protocol: null,
    error,
  };
}

export function checkSsl(hostRaw: string, port = 443): Promise<SslResult> {
  const host = hostRaw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();

  if (!host) {
    return Promise.resolve(emptyResult(host, "Provide a domain to check."));
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: SslResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const socket = tls.connect(
      { host, port, servername: host, timeout: 8000, rejectUnauthorized: false },
      () => {
        const cert = socket.getPeerCertificate();
        const protocol = socket.getProtocol();

        if (!cert || Object.keys(cert).length === 0) {
          finish(emptyResult(host, "The server did not present a certificate."));
          socket.end();
          return;
        }

        const validTo = new Date(cert.valid_to);
        const daysRemaining = Math.round((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        finish({
          host,
          connected: true,
          valid: socket.authorized || daysRemaining > 0,
          issuer: toSingleString(cert.issuer?.O) ?? toSingleString(cert.issuer?.CN),
          subject: toSingleString(cert.subject?.CN),
          validFrom: cert.valid_from ?? null,
          validTo: cert.valid_to ?? null,
          daysRemaining,
          protocol: protocol ?? null,
          error: socket.authorized ? undefined : socket.authorizationError?.toString(),
        });
        socket.end();
      },
    );

    socket.on("error", (err) => {
      finish(emptyResult(host, err instanceof Error ? err.message : "Connection failed."));
    });

    socket.setTimeout(8000, () => {
      finish(emptyResult(host, "Connection timed out."));
      socket.destroy();
    });
  });
}
