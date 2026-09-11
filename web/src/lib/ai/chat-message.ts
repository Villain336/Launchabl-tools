import type { UIMessage } from "ai";

/** Metadata attached to every assistant message by `/api/tools/chat`. */
export type ToolChatMetadata = {
  /** Gateway slug of the model that produced the message. */
  model?: string;
  /** Human label for the model, for the footer. */
  modelLabel?: string;
  totalUsage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
};

export type ToolChatMessage = UIMessage<ToolChatMetadata>;

/** Request body accepted by `/api/tools/chat`. */
export type ToolChatRequest = {
  tool: string;
  messages: ToolChatMessage[];
};
