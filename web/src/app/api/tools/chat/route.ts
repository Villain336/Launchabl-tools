import { NextResponse, type NextRequest } from "next/server";
import { convertToModelMessages, createUIMessageStreamResponse, isStepCount, toUIMessageStream } from "ai";
import { getChatToolRuntime } from "@/lib/ai/chat-runtime";
import type { ToolChatMessage, ToolChatMetadata } from "@/lib/ai/chat-message";
import { classifyAiError, NoModelAvailableError, userFacingAiMessage } from "@/lib/ai/errors";
import { hasGatewayKey, modelChain, modelLabel } from "@/lib/ai/models";
import { chatRateLimiter, clientKey, describeRetry } from "@/lib/ai/rate-limit";
import { streamWithFallback } from "@/lib/ai/stream";
import { checkDailySpend, recordUsage, SPEND_CAP_MESSAGE } from "@/lib/ai/usage";

export const maxDuration = 60;

const MAX_MESSAGES = 40;
const MAX_TEXT_CHARS = 24_000;

function isUIMessage(value: unknown): value is ToolChatMessage {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    (record.role === "user" || record.role === "assistant" || record.role === "system") &&
    Array.isArray(record.parts)
  );
}

function textLength(messages: ToolChatMessage[]): number {
  let total = 0;
  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type === "text") total += part.text.length;
    }
  }
  return total;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { tool?: unknown; messages?: unknown } | null;
  const slug = typeof body?.tool === "string" ? body.tool : "";
  const runtime = getChatToolRuntime(slug);
  if (!runtime) {
    return NextResponse.json({ error: "Unknown tool." }, { status: 404 });
  }

  const messages = Array.isArray(body?.messages) ? body.messages.filter(isUIMessage) : [];
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Send at least one user message." }, { status: 400 });
  }
  if (messages.length > MAX_MESSAGES || textLength(messages) > MAX_TEXT_CHARS) {
    return NextResponse.json(
      { error: "This conversation is too long. Start a new one to keep going." },
      { status: 413 },
    );
  }

  if (!hasGatewayKey()) {
    return NextResponse.json(
      { error: "AI is not configured on this deployment (missing AI_GATEWAY_API_KEY)." },
      { status: 503 },
    );
  }

  const limit = await chatRateLimiter().check(`${slug}:${clientKey(request.headers)}`);
  if (!limit.ok) {
    return NextResponse.json({ error: describeRetry(limit) }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  }

  const spend = await checkDailySpend();
  if (!spend.ok) {
    console.warn(`[tools/chat:${slug}] daily spend cap reached: $${spend.spentUsd.toFixed(2)} of $${spend.capUsd}`);
    return NextResponse.json({ error: SPEND_CAP_MESSAGE, cause: "spend_cap" }, { status: 503, headers: { "Retry-After": String(spend.resetsInSeconds) } });
  }

  const chain = modelChain(runtime.modelKind);
  const modelMessages = await convertToModelMessages(messages, {
    tools: runtime.tools,
    ignoreIncompleteToolCalls: true,
  });

  const startedAt = Date.now();
  try {
    const today = new Date();
    const { model, stream, skipped } = await streamWithFallback(chain, {
      // Models don't know the date; calendars, "next Monday", dates in schema and
      // "how old is this post" all depend on it.
      instructions: `${runtime.instructions}\n\nToday is ${today.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })} (${today.toISOString().slice(0, 10)}).`,
      messages: modelMessages,
      tools: runtime.tools,
      stopWhen: isStepCount(runtime.maxSteps ?? 3),
      abortSignal: request.signal,
      providerOptions: {
        gateway: { tags: ["launchabl", `tool:${slug}`], user: clientKey(request.headers) },
      },
    });

    if (skipped.length > 0) {
      console.warn(
        `[tools/chat:${slug}] fell back to ${model} after`,
        skipped.map(({ model: m, failure }) => `${m} (${failure.cause}: ${failure.message.slice(0, 160)})`).join("; "),
      );
    }

    // The gateway reports per-step cost in provider metadata; sum it so usage
    // accounting can prefer real cost over the price-table estimate.
    let reportedCostUsd: number | null = null;
    let recorded = false;
    const record = (ok: boolean, usage?: { inputTokens?: number; outputTokens?: number }) => {
      if (recorded) return;
      recorded = true;
      void recordUsage({
        slug,
        model,
        inputTokens: usage?.inputTokens ?? 0,
        outputTokens: usage?.outputTokens ?? 0,
        reportedCostUsd,
        durationMs: Date.now() - startedAt,
        ok,
      });
    };

    return createUIMessageStreamResponse({
      headers: { "x-launchabl-model": model },
      stream: toUIMessageStream<typeof runtime.tools & object, ToolChatMessage>({
        stream,
        tools: runtime.tools,
        originalMessages: messages,
        sendReasoning: false,
        messageMetadata: ({ part }): ToolChatMetadata | undefined => {
          if (part.type === "start") return { model, modelLabel: modelLabel(model) };
          if (part.type === "finish-step") {
            const cost = (part.providerMetadata?.gateway as { cost?: string | number } | undefined)?.cost;
            if (cost !== undefined && Number.isFinite(Number(cost))) reportedCostUsd = (reportedCostUsd ?? 0) + Number(cost);
            return undefined;
          }
          if (part.type === "finish") {
            const usage = part.totalUsage;
            record(true, usage);
            return {
              model,
              modelLabel: modelLabel(model),
              totalUsage: {
                inputTokens: usage.inputTokens,
                outputTokens: usage.outputTokens,
                totalTokens: usage.totalTokens,
              },
            };
          }
          return undefined;
        },
        onError: (error) => {
          console.error(`[tools/chat:${slug}] stream error`, error);
          record(false);
          return userFacingAiMessage(classifyAiError(error));
        },
      }),
    });
  } catch (error) {
    if (error instanceof NoModelAvailableError) {
      console.error(`[tools/chat:${slug}] ${error.message}`);
      const failure = error.primary;
      const status = failure.cause === "rate_limited" ? 429 : failure.cause === "no_access" ? 503 : 502;
      return NextResponse.json({ error: userFacingAiMessage(failure), cause: failure.cause }, { status });
    }
    console.error(`[tools/chat:${slug}] unexpected`, error);
    return NextResponse.json({ error: userFacingAiMessage(classifyAiError(error)) }, { status: 500 });
  }
}
