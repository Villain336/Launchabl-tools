import { describe, expect, it } from "vitest";
import { simulateReadableStream } from "ai";
import { MockLanguageModelV3 } from "ai/test";
import { APICallError } from "@ai-sdk/provider";
import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";
import { NoModelAvailableError } from "@/lib/ai/errors";
import { streamWithFallback } from "@/lib/ai/stream";

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 5, text: 5, reasoning: 0 },
};

function okModel(id: string, text: string) {
  const chunks: LanguageModelV3StreamPart[] = [
    { type: "stream-start", warnings: [] },
    { type: "text-start", id: "t" },
    { type: "text-delta", id: "t", delta: text },
    { type: "text-end", id: "t" },
    { type: "finish", finishReason: { unified: "stop", raw: "stop" }, usage },
  ];
  return new MockLanguageModelV3({
    provider: "mock",
    modelId: id,
    doStream: async () => ({ stream: simulateReadableStream({ chunks }) }),
  });
}

function failingModel(id: string, statusCode: number, message = `HTTP ${statusCode}`) {
  return new MockLanguageModelV3({
    provider: "mock",
    modelId: id,
    doStream: async () => {
      throw new APICallError({ message, url: "https://gateway.test", requestBodyValues: {}, statusCode });
    },
  });
}

async function collectText(stream: ReadableStream<{ type: string; text?: string }>) {
  let text = "";
  const types: string[] = [];
  for await (const part of stream as unknown as AsyncIterable<{ type: string; text?: string }>) {
    types.push(part.type);
    if (part.type === "text-delta" && part.text) text += part.text;
  }
  return { text, types };
}

const messages = [{ role: "user" as const, content: "hi" }];

describe("streamWithFallback", () => {
  it("streams from the first healthy model without skipping", async () => {
    const { model, stream, skipped } = await streamWithFallback([okModel("a", "hello")], { messages });
    expect(model).toBe("mock/a");
    expect(skipped).toEqual([]);
    const { text, types } = await collectText(stream);
    expect(text).toBe("hello");
    expect(types[0]).toBe("start");
    expect(types).toContain("finish");
  });

  it("skips models that fail with plan/rate-limit errors and reports them", async () => {
    const { model, stream, skipped } = await streamWithFallback(
      [failingModel("premium", 403, "Free tier users do not have access"), failingModel("busy", 429), okModel("scout", "ok")],
      { messages },
    );
    expect(model).toBe("mock/scout");
    expect(skipped.map((s) => [s.model, s.failure.cause])).toEqual([
      ["mock/premium", "no_access"],
      ["mock/busy", "rate_limited"],
    ]);
    expect((await collectText(stream)).text).toBe("ok");
  });

  it("throws NoModelAvailableError when every model fails", async () => {
    await expect(
      streamWithFallback([failingModel("a", 429), failingModel("b", 503)], { messages }),
    ).rejects.toBeInstanceOf(NoModelAvailableError);
  });

  it("stops immediately on non-recoverable errors", async () => {
    const spare = okModel("spare", "never");
    const error = await streamWithFallback([failingModel("a", 401), spare], { messages }).catch((e) => e);
    expect(error).toBeInstanceOf(NoModelAvailableError);
    expect((error as NoModelAvailableError).primary.cause).toBe("unauthorized");
    expect(spare.doStreamCalls).toHaveLength(0);
  });
});
