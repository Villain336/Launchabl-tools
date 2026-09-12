import { describe, expect, it } from "vitest";
import { scoreSubjectLine, scoreSubjectLines } from "./subject-lines";

const ids = (line: string, preview?: string) => scoreSubjectLine(line, preview).flags.map((f) => f.id);

describe("scoreSubjectLine", () => {
  it("rewards a specific, short, second-person line with preview text", () => {
    const s = scoreSubjectLine("Your invoice went out 3 days late — here's why", "The fix takes two minutes and stops it happening again next month.");
    expect(s.score).toBeGreaterThanOrEqual(90);
    expect(s.traits).toContain("second-person");
    expect(s.traits).toContain("number");
    expect(s.mobileTruncated).toBe(true);
    expect(s.flags.map((f) => f.id)).not.toContain("preview-missing");
  });

  it("punishes shouting, spam words and fake replies", () => {
    const s = scoreSubjectLine("RE: FREE MONEY!!! Act now, WINNER — 100% guaranteed $$$");
    expect(s.score).toBeLessThan(30);
    const flagIds = s.flags.map((f) => f.id);
    expect(flagIds).toEqual(expect.arrayContaining(["all-caps", "exclamation", "punctuation-run", "spam-words", "fake-reply"]));
  });

  it("flags length problems in both directions", () => {
    expect(ids("Hi")).toContain("too-short");
    expect(ids("This is a very long subject line that keeps going and going well past what any client will show")).toContain("too-long");
    expect(scoreSubjectLine("A perfectly sized line about pricing").mobileTruncated).toBe(false);
  });

  it("flags generic lines, duplicated preview text, and empty input", () => {
    expect(ids("Our monthly newsletter")).toContain("generic");
    expect(ids("Pricing changes on Oct 1", "Pricing changes on Oct 1 — read more")).toContain("preview-duplicate");
    expect(ids("Pricing changes on Oct 1", "Short")).toContain("preview-short");
    expect(scoreSubjectLine("   ").score).toBe(0);
  });

  it("recognises personalisation tokens and emoji", () => {
    const s = scoreSubjectLine("{{first_name}}, your Q4 plan is ready 🚀", "Three moves for the next ninety days, in order of payoff.");
    expect(s.traits).toEqual(expect.arrayContaining(["personalised", "emoji"]));
    expect(ids("🚀🔥🎉 Big news")).toContain("emoji");
  });

  it("scores a batch", () => {
    const batch = scoreSubjectLines([{ line: "One" }, { line: "Two", previewText: "x" }]);
    expect(batch).toHaveLength(2);
    expect(batch[1].previewText).toBe("x");
  });
});
