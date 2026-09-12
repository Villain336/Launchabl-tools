import { NextResponse, type NextRequest } from "next/server";
import { convertToModelMessages, createGateway, createUIMessageStreamResponse, isStepCount, toUIMessageStream, type LanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { classifyAiError, NoModelAvailableError, userFacingAiMessage } from "@/lib/ai/errors";
import { hasGatewayKey, modelChain, modelLabel } from "@/lib/ai/models";
import { chatRateLimiter, clientKey, describeRetry } from "@/lib/ai/rate-limit";
import { repairToolCall } from "@/lib/ai/repair";
import { streamWithFallback } from "@/lib/ai/stream";
import { CODE_EDITOR_INSTRUCTIONS, codeEditorTools, type IdeMessage, type IdeMessageMetadata } from "@/lib/ai/tools/code-editor";
import { checkDailySpend, recordUsage, SPEND_CAP_MESSAGE } from "@/lib/ai/usage";
import { gateRun, SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/session";

/**
 * Chat for the IDE assistant. Tools run in the browser (the workspace never
 * leaves it), so each request is one model step: the client executes any
 * tool calls and posts the results back for the next step.
 *
 * Bring-your-own-key: `x-ide-provider` + `x-ide-key` (+ optional
 * `x-ide-model`) route the call straight to the user's provider. Their key is
 * used for this request only and never logged or stored; BYOK requests skip
 * our sign-in gate and spend cap (they cost us nothing) but keep the rate limit.
 */

export const maxDuration = 120;

const MAX_MESSAGES = 60;
const MAX_TEXT_CHARS = 160_000;
const MAX_TREE_CHARS = 24_000;

const BYOK_DEFAULTS: Record<string, string> = { openai: "gpt-5.4", anthropic: "claude-sonnet-4.6", gateway: "anthropic/claude-sonnet-4.6" };

function isUIMessage(value: unknown): value is IdeMessage {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && (record.role === "user" || record.role === "assistant" || record.role === "system") && Array.isArray(record.parts);
}

function textLength(messages: IdeMessage[]): number {
  let total = 0;
  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type === "text") total += part.text.length;
      else if (part.type.startsWith("tool-") && "output" in part && part.output) total += JSON.stringify(part.output).length;
    }
  }
  return total;
}

type Byok = { provider: "openai" | "anthropic" | "gateway"; key: string; model: string };

function readByok(headers: Headers): Byok | { error: string } | null {
  const provider = headers.get("x-ide-provider");
  if (!provider || provider === "launchabl") return null;
  const key = headers.get("x-ide-key")?.trim() ?? "";
  if (provider !== "openai" && provider !== "anthropic" && provider !== "gateway") return { error: "Unknown provider." };
  if (key.length < 20 || key.length > 400 || /\s/.test(key)) return { error: "That API key doesn't look right. Paste the whole key in Settings." };
  const model = (headers.get("x-ide-model")?.trim() || BYOK_DEFAULTS[provider]).slice(0, 120);
  if (!/^[\w.:\/-]+$/.test(model)) return { error: "Invalid model id." };
  return { provider, key, model };
}

function byokModel(byok: Byok): LanguageModel {
  switch (byok.provider) {
    case "openai":
      return createOpenAI({ apiKey: byok.key })(byok.model);
    case "anthropic":
      return createAnthropic({ apiKey: byok.key })(byok.model);
    case "gateway":
      return createGateway({ apiKey: byok.key })(byok.model);
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { messages?: unknown; context?: unknown } | null;
  const messages = Array.isArray(body?.messages) ? body.messages.filter(isUIMessage) : [];
  if (messages.length === 0) return NextResponse.json({ error: "Send at least one message." }, { status: 400 });
  if (messages.length > MAX_MESSAGES || textLength(messages) > MAX_TEXT_CHARS) {
    return NextResponse.json({ error: "This conversation is too long for one thread. Start a new chat to keep going." }, { status: 413 });
  }
  const context = (body?.context ?? {}) as { workspace?: unknown; tree?: unknown; activePath?: unknown; selection?: unknown; source?: unknown };
  const workspaceName = typeof context.workspace === "string" ? context.workspace.slice(0, 120) : "workspace";
  const tree = typeof context.tree === "string" ? context.tree.slice(0, MAX_TREE_CHARS) : "";
  const activePath = typeof context.activePath === "string" ? context.activePath.slice(0, 400) : null;
  const selection = typeof context.selection === "string" ? context.selection.slice(0, 6_000) : null;
  const source = typeof context.source === "string" ? context.source.slice(0, 200) : null;

  const byok = readByok(request.headers);
  if (byok && "error" in byok) return NextResponse.json({ error: byok.error }, { status: 400 });

  const limit = await chatRateLimiter().check(`ide:${clientKey(request.headers)}`);
  if (!limit.ok) return NextResponse.json({ error: describeRetry(limit) }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });

  const responseHeaders = new Headers();
  let account = `anon:${clientKey(request.headers)}`;
  let chain: LanguageModel[];

  if (byok) {
    chain = [byokModel(byok)];
  } else {
    if (!hasGatewayKey()) return NextResponse.json({ error: "AI is not configured on this deployment. Add your own key in Settings to use the assistant." }, { status: 503 });
    // Only count a gate run on a fresh user turn, not on the tool-result round trips that follow it.
    const last = messages[messages.length - 1];
    const freshTurn = last.role === "user";
    if (freshTurn) {
      const gate = await gateRun(request.cookies, clientKey(request.headers));
      for (const cookie of gate.setCookies) responseHeaders.append("Set-Cookie", cookie);
      if (!gate.allowed) return NextResponse.json({ error: SIGN_IN_REQUIRED_MESSAGE, cause: "sign_in_required" }, { status: 401, headers: responseHeaders });
      if (gate.kind === "user") account = gate.session.uid;
    }
    const spend = await checkDailySpend();
    if (!spend.ok) return NextResponse.json({ error: SPEND_CAP_MESSAGE, cause: "spend_cap" }, { status: 503, headers: { "Retry-After": String(spend.resetsInSeconds) } });
    chain = modelChain("writer");
  }

  const modelMessages = await convertToModelMessages(messages, { tools: codeEditorTools, ignoreIncompleteToolCalls: true });
  const instructions = [
    CODE_EDITOR_INSTRUCTIONS,
    `Workspace: ${workspaceName}${source ? ` (${source})` : ""}.`,
    tree ? `Files (path and size):\n${tree}` : "The workspace is empty; the user may want you to create the first files.",
    activePath ? `The user has ${activePath} open in the editor.${selection ? ` They selected these lines:\n${selection}` : ""}` : null,
    `Today is ${new Date().toISOString().slice(0, 10)}.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const startedAt = Date.now();
  try {
    const { model, stream, skipped } = await streamWithFallback(chain, {
      instructions,
      messages: modelMessages,
      tools: codeEditorTools,
      // Tools have no execute, so a step ends at the tool calls; the client continues.
      stopWhen: isStepCount(1),
      repairToolCall,
      abortSignal: request.signal,
      providerOptions: byok ? undefined : { gateway: { tags: ["launchabl", "tool:ide", account.startsWith("anon:") ? "anon" : "account"], user: account } },
    });
    if (skipped.length > 0) console.warn(`[ide/chat] fell back to ${model} after`, skipped.map((s) => `${s.model} (${s.failure.cause})`).join("; "));

    let recorded = false;
    const record = (ok: boolean, usage?: { inputTokens?: number; outputTokens?: number }) => {
      if (recorded || byok) return;
      recorded = true;
      void recordUsage({ slug: "ide", model, inputTokens: usage?.inputTokens ?? 0, outputTokens: usage?.outputTokens ?? 0, reportedCostUsd: null, durationMs: Date.now() - startedAt, ok, template: null });
    };
    const label = byok ? `${modelLabel(byok.model.includes("/") ? byok.model : `${byok.provider}/${byok.model}`)} · your key` : modelLabel(model);

    responseHeaders.set("x-launchabl-model", model);
    return createUIMessageStreamResponse({
      headers: responseHeaders,
      stream: toUIMessageStream<typeof codeEditorTools, IdeMessage>({
        stream,
        tools: codeEditorTools,
        originalMessages: messages,
        sendReasoning: false,
        messageMetadata: ({ part }): IdeMessageMetadata | undefined => {
          if (part.type === "start") return { model, modelLabel: label };
          if (part.type === "finish") {
            record(true, part.totalUsage);
            return { model, modelLabel: label, totalUsage: { inputTokens: part.totalUsage.inputTokens, outputTokens: part.totalUsage.outputTokens, totalTokens: part.totalUsage.totalTokens } };
          }
          return undefined;
        },
        onError: (error) => {
          console.error("[ide/chat] stream error", byok ? "(byok)" : "", error instanceof Error ? error.message : error);
          record(false);
          return userFacingAiMessage(classifyAiError(error));
        },
      }),
    });
  } catch (error) {
    if (error instanceof NoModelAvailableError) {
      const failure = error.primary;
      const status = failure.cause === "rate_limited" ? 429 : failure.cause === "no_access" ? 503 : 502;
      return NextResponse.json({ error: byok ? `Your provider rejected the request: ${failure.message}` : userFacingAiMessage(failure), cause: failure.cause }, { status });
    }
    console.error("[ide/chat] unexpected", error);
    return NextResponse.json({ error: userFacingAiMessage(classifyAiError(error)) }, { status: 500 });
  }
}
