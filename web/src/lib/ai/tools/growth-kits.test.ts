import { describe, expect, it } from "vitest";
import { annotatePieces, assemblePressRelease, checkPressRelease, formatDateline, pressReleaseSchema, repurposeSchema, summarizeTestPlan, testPlanSchema } from "./growth-kits";

const release = pressReleaseSchema.parse({
  headline: "Ledgerly launches automatic payment chasing for freelancers",
  subheadline: "12,000 freelancers already use the invoicing app; the new feature recovers late payments without awkward emails.",
  dateline: { city: "Austin", region: "Texas", date: "2026-10-01" },
  embargo: null,
  lede: "Ledgerly, the invoicing app for independent professionals, today announced Ledgerly 2.0, adding automatic payment chasing that follows up on overdue invoices on the freelancer's behalf. The feature is available today to all customers at no extra cost.",
  body: [
    "Late payment is the most common complaint among freelancers, with invoices paid an average of 18 days after the due date according to Ledgerly's customer data. The new feature sends escalating reminders on a schedule the freelancer sets and stops the moment the invoice is paid.",
    "Ledgerly 2.0 also adds recurring invoices, a redesigned dashboard and integrations with Stripe and Wise. Plans start at $29 per month with a 14-day free trial.",
  ],
  quotes: [
    { text: "Nobody becomes a freelancer to spend Friday afternoons writing polite reminder emails. Chasing should be the software's job, and now it is.", name: "Jane Doe", title: "CEO and co-founder", company: "Ledgerly" },
    { text: "I recovered three overdue invoices in the first week without sending a single email myself.", name: "Sam Lee", title: "Independent designer", company: null },
  ],
  quotePositions: [0, 2],
  boilerplate: { company: "Ledgerly", text: "Ledgerly is the invoicing app built for independent professionals. Founded in 2023 and headquartered in Austin, Texas, it helps more than 12,000 freelancers get paid on time. Learn more at ledgerly.app." },
  mediaContact: { name: "Alex Kim", email: "press@ledgerly.app", phone: null, title: "Head of Communications" },
  links: [{ label: "Press kit", url: "https://ledgerly.app/press" }],
  notes: "Confirm the quote with Jane Doe.",
});

describe("press release", () => {
  it("formats an AP dateline", () => {
    expect(formatDateline({ city: "Austin", region: "Texas", date: "2026-10-01" })).toBe("AUSTIN, Texas, Oct. 1, 2026");
    expect(formatDateline({ city: "London", region: null, date: "2026-03-15" })).toBe("LONDON, March 15, 2026");
  });

  it("assembles markdown and plain text with quotes in position and the ### close", () => {
    const { markdown, plainText, wordCount } = assemblePressRelease(release);
    expect(markdown.startsWith("**FOR IMMEDIATE RELEASE**")).toBe(true);
    expect(markdown).toContain("# Ledgerly launches automatic payment chasing");
    expect(markdown).toContain("AUSTIN, Texas, Oct. 1, 2026 — Ledgerly");
    expect(markdown.indexOf("Nobody becomes a freelancer")).toBeLessThan(markdown.indexOf("Late payment is the most common"));
    expect(markdown.indexOf("I recovered three")).toBeGreaterThan(markdown.indexOf("Plans start at $29"));
    expect(markdown).toContain("## About Ledgerly");
    expect(markdown.trim().endsWith("###")).toBe(true);
    expect(plainText).toContain("Media contact\nAlex Kim\nHead of Communications\npress@ledgerly.app");
    expect(wordCount).toBeGreaterThan(100);
  });

  it("runs newsroom checks", () => {
    const checks = checkPressRelease(release, 450);
    const byId = Object.fromEntries(checks.map((c) => [c.id, c.ok]));
    expect(byId["headline-length"]).toBe(true);
    expect(byId["headline-tone"]).toBe(true);
    expect(byId.length).toBe(true);
    expect(byId.lede).toBe(true);
    expect(byId["quote-substance"]).toBe(true);
    expect(byId.placeholders).toBe(true);
    expect(byId.contact).toBe(true);

    const hype = checkPressRelease(
      { ...release, headline: "Revolutionary game-changing launch!", quotes: [{ ...release.quotes[0], text: "We are excited to announce this launch to the world today and tomorrow." }], mediaContact: { ...release.mediaContact, email: "[email]" } },
      120,
    );
    const hypeById = Object.fromEntries(hype.map((c) => [c.id, c.ok]));
    expect(hypeById["headline-tone"]).toBe(false);
    expect(hypeById.length).toBe(false);
    expect(hypeById["quote-substance"]).toBe(false);
    expect(hypeById.placeholders).toBe(false);
    expect(hypeById.contact).toBe(false);
  });
});

describe("test plan summary", () => {
  const plan = testPlanSchema.parse({
    title: "Sign-up flow",
    product: "Ledgerly",
    version: null,
    objective: "Prove that new users can create an account on every supported browser without data loss.",
    scope: ["Email sign-up", "Google OAuth"],
    environments: [{ name: "Chrome desktop", detail: "latest", priority: "P0" }],
    scenarios: Array.from({ length: 6 }, (_, i) => ({
      id: `TC-00${i + 1}`,
      area: i < 3 ? "Sign-up" : "OAuth",
      title: `Scenario ${i + 1}`,
      priority: i === 0 ? "P0" : "P1",
      type: i === 5 ? "negative" : "functional",
      preconditions: null,
      steps: ["Open /sign-up", "Submit the form"],
      expected: "Account created and dashboard shown",
      testData: null,
      automate: i < 2,
    })),
    exitCriteria: ["All P0 pass", "No open P1"],
    notes: "",
  });

  it("counts by priority, type and area and flags gaps", () => {
    const { summary, warnings } = summarizeTestPlan(plan);
    expect(summary.total).toBe(6);
    expect(summary.byPriority).toEqual({ P0: 1, P1: 5 });
    expect(summary.byArea).toEqual({ "Sign-up": 3, OAuth: 3 });
    expect(summary.automatable).toBe(2);
    expect(warnings.some((w) => w.includes("accessibility"))).toBe(true);
    expect(warnings.some((w) => w.includes("P0"))).toBe(false);
  });

  it("flags duplicate ids and missing P0/negative cases", () => {
    const dup = { ...plan, scenarios: plan.scenarios.map((s) => ({ ...s, id: "TC-001", priority: "P1" as const, type: "functional" as const })) };
    const { warnings } = summarizeTestPlan(dup);
    expect(warnings.some((w) => w.includes("Duplicate"))).toBe(true);
    expect(warnings.some((w) => w.includes("No P0"))).toBe(true);
    expect(warnings.some((w) => w.includes("negative"))).toBe(true);
  });
});

describe("repurpose annotation", () => {
  it("measures pieces against channel limits and flags reach killers", () => {
    const input = repurposeSchema.parse({
      source: { title: "Why DMARC is still p=none", url: null, kind: "blog post", summary: "Most domains never move past monitoring mode because nobody owns the rollout, and that leaves spoofing wide open.", keyPoints: ["a", "b", "c"], quotes: [] },
      pieces: [
        { channel: "linkedin", title: null, body: "Hook line.\n\nRead more at https://example.com/post", parts: [], cta: null, hashtags: [], visual: null, bestTime: null },
        { channel: "x-thread", title: null, body: "", parts: ["First tweet without terminal punctuation", "x".repeat(300)], cta: null, hashtags: [], visual: null, bestTime: null },
        { channel: "x-post", title: null, body: "y".repeat(281), parts: [], cta: null, hashtags: [], visual: null, bestTime: null },
      ],
      notes: "",
    });
    const out = annotatePieces(input);
    expect(out.pieces[0].label).toBe("LinkedIn post");
    expect(out.pieces[0].warnings.some((w) => w.includes("first comment"))).toBe(true);
    expect(out.pieces[1].warnings.some((w) => w.includes("Part 2"))).toBe(true);
    expect(out.pieces[1].warnings.some((w) => w.includes("hook"))).toBe(true);
    expect(out.pieces[2].chars).toBe(281);
    expect(out.pieces[2].warnings.some((w) => w.includes("over the 280"))).toBe(true);
  });
});
