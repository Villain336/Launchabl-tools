import { describe, expect, it } from "vitest";
import { describeCadence, emptySchedule, nextRunAfter, normaliseSchedule, untilText } from "./schedule";

const base = emptySchedule("sc_AAAAAAAAAAAA", "u1", "me@example.com", "Me", new Date("2026-09-12T10:00:00Z"));

describe("schedules", () => {
  it("computes the next run per cadence", () => {
    const from = new Date("2026-09-12T10:00:00Z"); // a Saturday
    expect(nextRunAfter({ cadence: "daily", hourUtc: 8, weekday: 1, dayOfMonth: 1 }, from).toISOString()).toBe("2026-09-13T08:00:00.000Z");
    expect(nextRunAfter({ cadence: "daily", hourUtc: 12, weekday: 1, dayOfMonth: 1 }, from).toISOString()).toBe("2026-09-12T12:00:00.000Z");
    expect(nextRunAfter({ cadence: "weekly", hourUtc: 8, weekday: 1, dayOfMonth: 1 }, from).toISOString()).toBe("2026-09-14T08:00:00.000Z");
    expect(nextRunAfter({ cadence: "weekly", hourUtc: 8, weekday: 6, dayOfMonth: 1 }, from).toISOString()).toBe("2026-09-19T08:00:00.000Z");
    expect(nextRunAfter({ cadence: "monthly", hourUtc: 8, weekday: 1, dayOfMonth: 1 }, from).toISOString()).toBe("2026-10-01T08:00:00.000Z");
    expect(nextRunAfter({ cadence: "monthly", hourUtc: 8, weekday: 1, dayOfMonth: 20 }, from).toISOString()).toBe("2026-09-20T08:00:00.000Z");
  });

  it("validates and normalises input, setting nextRunAt on creation", () => {
    const now = new Date("2026-09-12T10:00:00Z");
    expect(normaliseSchedule({ prompt: "short" }, base, now)).toEqual({ error: "Describe the job in at least a sentence." });
    expect(normaliseSchedule({ prompt: "Audit https://acme.io every week and list what changed.", email: "nope" }, base, now)).toEqual({ error: "Enter a valid email for the report link." });
    const ok = normaliseSchedule({ prompt: "Audit https://acme.io every week and list what changed.", cadence: "weekly", weekday: 3, hourUtc: 30 }, base, now);
    expect("error" in ok).toBe(false);
    if ("error" in ok) return;
    expect(ok.hourUtc).toBe(23);
    expect(ok.title).toBe("Audit https://acme.io every week and list what changed.");
    expect(ok.nextRunAt).toBe("2026-09-16T23:00:00.000Z");
    expect(describeCadence(ok)).toBe("Every Wednesday at 23:00 UTC");
  });

  it("re-enabling a paused schedule moves the next run forward", () => {
    const now = new Date("2026-09-12T10:00:00Z");
    const paused = { ...base, prompt: "Audit https://acme.io every week and list what changed.", enabled: false, nextRunAt: "2026-01-01T08:00:00.000Z" };
    const resumed = normaliseSchedule({ enabled: true }, paused, now);
    if ("error" in resumed) throw new Error(resumed.error);
    expect(resumed.nextRunAt > now.toISOString()).toBe(true);
  });

  it("describes time until the next run", () => {
    const now = Date.parse("2026-09-12T10:00:00Z");
    expect(untilText("2026-09-12T10:30:00Z", now)).toBe("in 30 min");
    expect(untilText("2026-09-13T08:00:00Z", now)).toBe("in 22 h");
    expect(untilText("2026-09-16T08:00:00Z", now)).toBe("in 4 d");
    expect(untilText("2026-09-12T09:00:00Z", now)).toBe("due now");
  });
});
