import {
  generateText,
  streamText,
  type GenerateTextResult,
  type LanguageModel,
  type ModelMessage,
  type OutputInterface,
  type PrepareStepFunction,
  type TextStreamPart,
  type ToolCallRepairFunction,
  type ToolChoice,
  type ToolSet,
} from "ai";
import { classifyAiError, NoModelAvailableError, type AiFailure } from "@/lib/ai/errors";

type StreamParams<TOOLS extends ToolSet> = Parameters<typeof streamText<TOOLS>>[0];

/**
 * The subset of `streamText` / `generateText` options tools need. Kept
 * explicit (rather than `Omit<Parameters<...>>`) because the SDK's option
 * type is a union on `prompt | messages` that `Omit` flattens.
 */
type CallOptions<TOOLS extends ToolSet> = {
  instructions?: string;
  messages: ModelMessage[];
  tools?: TOOLS;
  toolChoice?: ToolChoice<TOOLS>;
  stopWhen?: StreamParams<TOOLS>["stopWhen"];
  prepareStep?: PrepareStepFunction<TOOLS>;
  repairToolCall?: ToolCallRepairFunction<TOOLS>;
  abortSignal?: AbortSignal;
  providerOptions?: StreamParams<TOOLS>["providerOptions"];
  temperature?: number;
  maxOutputTokens?: number;
};

type StreamOptions<TOOLS extends ToolSet> = CallOptions<TOOLS>;
type GenerateOptions<TOOLS extends ToolSet, OUTPUT extends OutputInterface> = Omit<CallOptions<TOOLS>, "prepareStep" | "repairToolCall"> & {
  /** Structured output spec, e.g. `Output.object({ schema })`. */
  output?: OUTPUT;
};

/** Gateway slugs in production; model objects are accepted so tests can inject mocks. */
export type ModelChain = LanguageModel[];

function slugOf(model: LanguageModel): string {
  return typeof model === "string" ? model : `${model.provider}/${model.modelId}`;
}

export type ModelAttempt = { model: string; failure: AiFailure };

export type FallbackStream<TOOLS extends ToolSet> = {
  /** The gateway slug that actually answered. */
  model: string;
  stream: ReadableStream<TextStreamPart<TOOLS>>;
  /** Models that were skipped before `model` responded. */
  skipped: ModelAttempt[];
};

/**
 * Chunks emitted before the model has actually committed to a response.
 * Anything after these tells us whether the call succeeded or failed.
 */
const PREAMBLE = new Set(["start", "start-step"]);

/**
 * Stream from the first model in `chain` that responds.
 *
 * `streamText` never throws for provider failures — it emits an `error`
 * part. We read the head of each stream until the first decisive chunk;
 * on a recoverable error (no plan access, rate limit, retired model,
 * upstream 5xx) we cancel and try the next model. Once a model starts
 * producing real output the buffered head is replayed and the rest of
 * the stream is piped through untouched.
 */
export async function streamWithFallback<TOOLS extends ToolSet>(
  chain: ModelChain,
  options: StreamOptions<TOOLS>,
): Promise<FallbackStream<TOOLS>> {
  const skipped: ModelAttempt[] = [];

  for (const candidate of chain) {
    const model = slugOf(candidate);
    // Errors are surfaced as stream parts and handled below; the SDK's default
    // onError would otherwise console.error every model we intentionally skip.
    const result = streamText<TOOLS>({ ...options, model: candidate, maxRetries: 0, onError: () => undefined });
    const reader = result.stream.getReader();
    const head: TextStreamPart<TOOLS>[] = [];
    let failure: AiFailure | null = null;
    let closed = false;

    for (;;) {
      const { value, done } = await reader.read();
      if (done) {
        closed = true;
        break;
      }
      head.push(value);
      if (PREAMBLE.has(value.type)) continue;
      if (value.type === "error") failure = classifyAiError(value.error);
      break;
    }

    if (closed && head.every((part) => PREAMBLE.has(part.type))) {
      failure = { cause: "upstream", message: "Model closed the stream without responding", fallback: true };
    }

    if (failure) {
      reader.cancel().catch(() => undefined);
      skipped.push({ model, failure });
      if (!failure.fallback) throw new NoModelAvailableError(skipped);
      continue;
    }

    const stream = new ReadableStream<TextStreamPart<TOOLS>>({
      start(controller) {
        for (const part of head) controller.enqueue(part);
        if (closed) controller.close();
      },
      async pull(controller) {
        const { value, done } = await reader.read();
        if (done) controller.close();
        else controller.enqueue(value);
      },
      cancel(reason) {
        return reader.cancel(reason);
      },
    });

    return { model, stream, skipped };
  }

  throw new NoModelAvailableError(skipped);
}

/** Non-streaming counterpart for API routes that return JSON. */
export async function generateWithFallback<
  TOOLS extends ToolSet,
  OUTPUT extends OutputInterface = OutputInterface<string, string, never>,
>(
  chain: ModelChain,
  options: GenerateOptions<TOOLS, OUTPUT>,
): Promise<{ model: string; result: GenerateTextResult<TOOLS, never, OUTPUT>; skipped: ModelAttempt[] }> {
  const skipped: ModelAttempt[] = [];
  for (const candidate of chain) {
    const model = slugOf(candidate);
    try {
      const result = await generateText<TOOLS, never, OUTPUT>({ ...options, model: candidate, maxRetries: 0 });
      return { model, result, skipped };
    } catch (error) {
      const failure = classifyAiError(error);
      skipped.push({ model, failure });
      if (!failure.fallback) throw new NoModelAvailableError(skipped);
    }
  }
  throw new NoModelAvailableError(skipped);
}
