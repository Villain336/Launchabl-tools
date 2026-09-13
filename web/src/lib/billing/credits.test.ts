import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import { readCreditStats } from "@/lib/ai/usage";
import { getCreditBalance, grantCreditPack, grantCredits, spendCredit } from "./credits";

describe("getCreditBalance", () => {
  it("reads 0 for an account that has never had credits", async () => {
    const store = createMemoryStore();
    expect(await getCreditBalance("u1", store)).toBe(0);
  });
});

describe("grantCredits", () => {
  it("adds to the balance and returns the new total", async () => {
    const store = createMemoryStore();
    expect(await grantCredits("u1", 20, store)).toBe(20);
    expect(await grantCredits("u1", 5, store)).toBe(25);
    expect(await getCreditBalance("u1", store)).toBe(25);
  });

  it("rejects a non-positive amount", async () => {
    const store = createMemoryStore();
    await expect(grantCredits("u1", 0, store)).rejects.toThrow();
    await expect(grantCredits("u1", -5, store)).rejects.toThrow();
  });
});

describe("grantCreditPack", () => {
  it("credits the pack's amount and records a purchase event", async () => {
    const store = createMemoryStore();
    const balance = await grantCreditPack("u1", "starter", store);
    expect(balance).toBe(20);
    expect(await getCreditBalance("u1", store)).toBe(20);

    const stats = await readCreditStats(1, store);
    expect(stats.packsSold).toBe(1);
    expect(stats.creditsPurchased).toBe(20);
    expect(stats.revenueUsd).toBeCloseTo(9);
    expect(stats.byPack.starter).toBe(1);
  });

  it("stacks on top of an existing balance", async () => {
    const store = createMemoryStore();
    await grantCreditPack("u1", "starter", store);
    const balance = await grantCreditPack("u1", "growth", store);
    expect(balance).toBe(120);
  });
});

describe("spendCredit", () => {
  it("decrements the balance and returns it when there's at least one credit", async () => {
    const store = createMemoryStore();
    await grantCredits("u1", 2, store);
    expect(await spendCredit("u1", store)).toBe(1);
    expect(await spendCredit("u1", store)).toBe(0);
  });

  it("returns null and makes no change when the balance is 0", async () => {
    const store = createMemoryStore();
    expect(await spendCredit("u1", store)).toBeNull();
    expect(await getCreditBalance("u1", store)).toBe(0);
  });

  it("records a spent event only on success", async () => {
    const store = createMemoryStore();
    await spendCredit("u1", store); // balance 0 — no-op, no event
    await grantCredits("u1", 1, store);
    await spendCredit("u1", store); // succeeds

    const stats = await readCreditStats(1, store);
    expect(stats.creditsSpent).toBe(1);
  });

  it("a burst of concurrent spends never drives the balance negative", async () => {
    const store = createMemoryStore();
    await grantCredits("u1", 5, store);
    const results = await Promise.all(Array.from({ length: 8 }, () => spendCredit("u1", store)));
    expect(results.filter((r) => r !== null)).toHaveLength(5);
    expect(await getCreditBalance("u1", store)).toBe(0);
  });
});
