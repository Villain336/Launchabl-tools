import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import type { ToolChatMessage } from "@/lib/ai/chat-message";
import { deleteConversationRecord, listConversationRecords, loadConversationRecord, MAX_CONVERSATIONS_PER_TOOL, saveConversationRecord, shrinkMessages } from "./conversations";

const msgs = (text: string): ToolChatMessage[] => [
  { id: "u1", role: "user", parts: [{ type: "text", text }] },
  { id: "a1", role: "assistant", parts: [{ type: "text", text: "ok" }] },
];

describe("server conversations", () => {
  it("stores per user and tool, newest first, capped per tool, owner-checked", async () => {
    const store = createMemoryStore();
    for (let i = 0; i < MAX_CONVERSATIONS_PER_TOOL + 3; i++) {
      await saveConversationRecord({ id: `conversation-${i}`, uid: "u1", slug: "seo-audit", projectId: null, title: `c${i}`, messages: msgs(`m${i}`), updatedAt: 1_000 + i }, store);
    }
    const list = await listConversationRecords("u1", "seo-audit", store);
    expect(list).toHaveLength(MAX_CONVERSATIONS_PER_TOOL);
    expect(list[0].id).toBe(`conversation-${MAX_CONVERSATIONS_PER_TOOL + 2}`);
    expect(await loadConversationRecord("conversation-0", "u1", store)).toBeNull(); // pruned (oldest)
    expect(await loadConversationRecord(list[0].id, "u2", store)).toBeNull();
    expect(await deleteConversationRecord(list[0].id, "u1", store)).toBe(true);
    expect((await listConversationRecords("u1", "seo-audit", store)).some((c) => c.id === list[0].id)).toBe(false);
  });

  it("shrinks oversized conversations by dropping attachment bytes, then oldest turns", () => {
    const big = "x".repeat(50_000);
    const messages: ToolChatMessage[] = [
      { id: "u1", role: "user", parts: [{ type: "file", url: `data:image/png;base64,${big}`, mediaType: "image/png", filename: "a.png" }, { type: "text", text: "old" }] },
      { id: "a1", role: "assistant", parts: [{ type: "text", text: "ok" }] },
      { id: "u2", role: "user", parts: [{ type: "text", text: "newer" }] },
      { id: "a2", role: "assistant", parts: [{ type: "text", text: big }] },
    ];
    const shrunk = shrinkMessages(messages, 40_000);
    expect(shrunk.length).toBe(2);
    expect(shrunk[0].id).toBe("u2");
    const fileOnly = shrinkMessages(messages.slice(0, 2), 10_000);
    expect(fileOnly.length).toBe(2);
    expect((fileOnly[0].parts[0] as { url: string }).url).toBe("");
  });
});
