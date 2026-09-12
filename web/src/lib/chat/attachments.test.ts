import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { dataUrlBytes, dataUrlText, isTextLike, textMediaType } from "./attachments";
import { inlineAttachments, trimImageHistory } from "./inline-attachments";

const toDataUrl = (mediaType: string, text: string) => `data:${mediaType};base64,${Buffer.from(text, "utf8").toString("base64")}`;

const user = (parts: UIMessage["parts"], id = "u1"): UIMessage => ({ id, role: "user", parts });

describe("attachment helpers", () => {
  it("classifies text-like files by mime or extension", () => {
    expect(isTextLike("rows.csv", "")).toBe(true);
    expect(isTextLike("notes", "text/plain")).toBe(true);
    expect(isTextLike("data.bin", "application/octet-stream")).toBe(false);
    expect(textMediaType("rows.csv", "")).toBe("text/csv");
    expect(textMediaType("x.json", "application/json; charset=utf-8")).toBe("application/json");
  });

  it("measures and decodes data URLs", () => {
    const url = toDataUrl("text/plain", "héllo, wörld");
    expect(dataUrlText(url)).toBe("héllo, wörld");
    expect(dataUrlBytes(url)).toBe(Buffer.byteLength("héllo, wörld"));
    expect(dataUrlText("data:text/plain,a%20b")).toBe("a b");
  });
});

describe("inlineAttachments", () => {
  it("inlines text files as fenced blocks ahead of the user's text and keeps images as file parts", () => {
    const csv = "name,price\nWidget,9.99\n";
    const result = inlineAttachments([
      user([
        { type: "file", mediaType: "text/csv", filename: "products.csv", url: toDataUrl("text/csv", csv) },
        { type: "file", mediaType: "image/png", filename: "shot.png", url: "data:image/png;base64,iVBORw0KGgo=" },
        { type: "text", text: "Clean this up" },
      ]),
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.attachments).toBe(2);
    expect(result.images).toBe(1);
    const parts = result.messages[0].parts;
    expect(parts.map((p) => p.type)).toEqual(["file", "text", "text"]);
    const inlined = parts[1] as { type: "text"; text: string };
    expect(inlined.text).toContain('Attached file "products.csv" (text/csv');
    expect(inlined.text).toContain("```csv\nname,price\nWidget,9.99\n```");
    expect((parts[2] as { text: string }).text).toBe("Clean this up");
  });

  it("uses a longer fence when the file contains backticks", () => {
    const result = inlineAttachments([
      user([{ type: "file", mediaType: "text/markdown", filename: "doc.md", url: toDataUrl("text/markdown", "```js\nx\n```") }]),
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect((result.messages[0].parts[0] as { text: string }).text).toContain("````markdown\n```js");
  });

  it("rejects unsupported types and oversized files", () => {
    expect(inlineAttachments([user([{ type: "file", mediaType: "application/pdf", filename: "a.pdf", url: "data:application/pdf;base64,AAAA" }])])).toMatchObject({
      ok: false,
      error: expect.stringContaining("a.pdf"),
    });
    const huge = `data:image/png;base64,${"A".repeat(9_000_000)}`;
    expect(inlineAttachments([user([{ type: "file", mediaType: "image/png", filename: "big.png", url: huge }])])).toMatchObject({ ok: false, error: expect.stringContaining("too large") });
  });

  it("notes attachments whose bytes were dropped instead of failing", () => {
    const result = inlineAttachments([user([{ type: "file", mediaType: "image/png", filename: "old.png", url: "" }, { type: "text", text: "and now?" }])]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.attachments).toBe(0);
    expect((result.messages[0].parts[0] as { text: string }).text).toContain('"old.png" from this message is no longer available');
  });

  it("leaves messages without files untouched", () => {
    const messages = [user([{ type: "text", text: "hi" }])];
    const result = inlineAttachments(messages);
    expect(result.ok && result.messages[0]).toBe(messages[0]);
  });
});

describe("trimImageHistory", () => {
  const image = (id: string, kb: number) => user([{ type: "file", mediaType: "image/jpeg", filename: `${id}.jpg`, url: `data:image/jpeg;base64,${"A".repeat(Math.ceil((kb * 1024 * 4) / 3))}` }], id);

  it("keeps the newest images and blanks older ones past the budget", () => {
    const trimmed = trimImageHistory([image("a", 100), image("b", 100), image("c", 100)], 250 * 1024);
    const urls = trimmed.map((m) => (m.parts[0] as { url: string }).url.length > 0);
    expect(urls).toEqual([false, true, true]);
  });

  it("returns the same array when nothing changes", () => {
    const messages = [image("a", 10)];
    expect(trimImageHistory(messages)).toBe(messages);
  });
});
