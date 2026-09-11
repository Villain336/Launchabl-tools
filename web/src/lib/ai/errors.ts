/**
 * Error classification for AI Gateway calls.
 *
 * The gateway surfaces problems in a few shapes: `APICallError` /
 * `GatewayError` subclasses with a `statusCode`, plain errors whose message
 * carries the status, and rate-limit errors with `type: "rate_limit_exceeded"`.
 * We normalise them into a small set of causes so the streaming layer can
 * decide whether to try the next model and the UI can show a useful message.
 */

export type AiFailureCause =
  | "no_access" // 402/403: model not on the current gateway plan / no credits
  | "not_found" // 404: model slug retired or mistyped
  | "rate_limited" // 429
  | "unauthorized" // 401: bad key
  | "bad_request" // 400: prompt/tool schema problem — retrying won't help
  | "upstream" // 5xx / network
  | "unknown";

export type AiFailure = {
  cause: AiFailureCause;
  status?: number;
  message: string;
  /** Whether it makes sense to try the next model in the chain. */
  fallback: boolean;
};

function readStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const record = error as Record<string, unknown>;
  for (const key of ["statusCode", "status"]) {
    const value = record[key];
    if (typeof value === "number") return value;
  }
  const response = record.response as Record<string, unknown> | undefined;
  if (response && typeof response.status === "number") return response.status;
  const match = String(record.message ?? "").match(/\b(4\d\d|5\d\d)\b/);
  return match ? Number(match[1]) : undefined;
}

export function classifyAiError(error: unknown): AiFailure {
  const message = error instanceof Error ? error.message : String(error ?? "Unknown error");
  const record = (error && typeof error === "object" ? error : {}) as { name?: unknown; type?: unknown };
  const name = typeof record.name === "string" ? record.name : "";
  const type = typeof record.type === "string" ? record.type : "";
  const status = readStatus(error);

  if (name === "GatewayRateLimitError" || type === "rate_limit_exceeded" || status === 429) {
    return { cause: "rate_limited", status: 429, message, fallback: true };
  }
  if (status === 401) return { cause: "unauthorized", status, message, fallback: false };
  if (status === 402 || status === 403 || /free tier|upgrade to paid|insufficient credits/i.test(message)) {
    return { cause: "no_access", status: status ?? 403, message, fallback: true };
  }
  if (status === 404 || /model .*not found/i.test(message)) {
    return { cause: "not_found", status: 404, message, fallback: true };
  }
  if (status === 400) return { cause: "bad_request", status, message, fallback: false };
  if ((status && status >= 500) || /ECONNRESET|ETIMEDOUT|fetch failed|network/i.test(message)) {
    return { cause: "upstream", status, message, fallback: true };
  }
  return { cause: "unknown", status, message, fallback: false };
}

/** Message safe to show to an end user. Never echoes provider internals. */
export function userFacingAiMessage(failure: AiFailure): string {
  switch (failure.cause) {
    case "rate_limited":
      return "Our AI models are busy right now. Wait a few seconds and try again.";
    case "no_access":
      return "This model isn't enabled on our AI plan yet. Try again in a moment while we route to another model.";
    case "unauthorized":
      return "The AI service isn't configured correctly. This is on us — please try again later.";
    case "bad_request":
      return "That request couldn't be processed. Try rephrasing or shortening your message.";
    case "not_found":
      return "One of our models is unavailable. Try again and we'll route around it.";
    case "upstream":
      return "The AI service had a hiccup. Try again in a moment.";
    default:
      return "Something went wrong generating a response. Try again.";
  }
}

export class NoModelAvailableError extends Error {
  readonly failures: { model: string; failure: AiFailure }[];
  constructor(failures: { model: string; failure: AiFailure }[]) {
    super(
      `No model in the chain responded: ${failures
        .map(({ model, failure }) => `${model} (${failure.cause}${failure.status ? ` ${failure.status}` : ""})`)
        .join(", ")}`,
    );
    this.name = "NoModelAvailableError";
    this.failures = failures;
  }

  /** The most useful failure to explain to the user. */
  get primary(): AiFailure {
    const priority: AiFailureCause[] = ["unauthorized", "bad_request", "rate_limited", "no_access", "upstream", "not_found", "unknown"];
    for (const cause of priority) {
      const hit = this.failures.find((f) => f.failure.cause === cause);
      if (hit) return hit.failure;
    }
    return this.failures[0]?.failure ?? { cause: "unknown", message: "No models configured", fallback: false };
  }
}
