import { NextResponse, type NextRequest } from "next/server";
import { convertToModelMessages, createUIMessageStreamResponse, isStepCount, toUIMessageStream } from "ai";
import { getChatToolRuntime } from "@/lib/ai/chat-runtime";
import type { ToolChatMessage, ToolChatMetadata } from "@/lib/ai/chat-message";
import { classifyAiError, NoModelAvailableError, userFacingAiMessage } from "@/lib/ai/errors";
import { hasGatewayKey, modelChain, modelLabel } from "@/lib/ai/models";
import { chatRateLimiter, clientKey } from "@/lib/ai/rate-limit";
import { streamWithFallback } from "@/lib/ai/stream";

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

  const limit = chatRateLimiter().check(`${slug}:${clientKey(request.headers)}`);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `You've hit the free usage limit for this tool. Try again in about ${Math.ceil(limit.retryAfter / 60)} min.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const chain = modelChain(runtime.modelKind);
  const modelMessages = await convertToModelMessages(messages, {
    tools: runtime.tools,
    ignoreIncompleteToolCalls: true,
  });

  try {
    const { model, stream, skipped } = await streamWithFallback(chain, {
      instructions: runtime.instructions,
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
        skipped.map(({ model: m, failure }) => `${m} (${failure.cause})`).join(", "),
      );
    }

    return createUIMessageStreamResponse({
      headers: { "x-launchabl-model": model },
      stream: toUIMessageStream<typeof runtime.tools & object, ToolChatMessage>({
        stream,
        tools: runtime.tools,
        originalMessages: messages,
        sendReasoning: false,
        messageMetadata: ({ part }): ToolChatMetadata | undefined => {
          if (part.type === "start") return { model, modelLabel: modelLabel(model) };
          if (part.type === "finish") {
            const usage = part.totalUsage;
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
