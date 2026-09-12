import { describe, expect, it } from "vitest";
import { z } from "zod";
import { applyStructuralFixes, trimString } from "./repair";

describe("tool-call repair", () => {
  it("trims strings at a word boundary without trailing punctuation", () => {
    expect(trimString("short", 80)).toBe("short");
    const trimmed = trimString("Tuesday to Thursday mornings, 8–9 am local time, when freelancers check LinkedIn before client work", 80);
    expect(trimmed.length).toBeLessThanOrEqual(80);
    expect(trimmed.endsWith(" ")).toBe(false);
    expect(trimmed).toMatch(/^Tuesday to Thursday mornings/);
  });

  it("fixes over-long strings, over-long arrays and unknown keys from the validator's issues", () => {
    const schema = z.object({
      pieces: z.array(z.object({ body: z.string(), bestTime: z.string().max(20).nullable() })).max(2),
      tags: z.array(z.string()).max(2),
    }).strict();
    const input = {
      pieces: [{ body: "a", bestTime: "Tuesday and Wednesday mornings before nine" }, { body: "b", bestTime: null }, { body: "c", bestTime: null }],
      tags: ["x", "y", "z"],
      extra: true,
    };
    const first = schema.safeParse(input);
    expect(first.success).toBe(false);
    const changed = applyStructuralFixes(input, first.success ? [] : (first.error.issues as never));
    expect(changed).toBe(true);
    const second = schema.safeParse(input);
    expect(second.success).toBe(true);
    expect(input.pieces).toHaveLength(2);
    expect(input.tags).toEqual(["x", "y"]);
    expect("extra" in input).toBe(false);
    expect(input.pieces[0].bestTime!.length).toBeLessThanOrEqual(20);
  });
});
