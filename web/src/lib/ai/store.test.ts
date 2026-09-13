import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";

describe("KeyValueStore counter primitives", () => {
  it("incrBy adds an arbitrary amount and returns the new total", async () => {
    const store = createMemoryStore();
    expect(await store.incrBy("credits:u1", 20)).toBe(20);
    expect(await store.incrBy("credits:u1", 5)).toBe(25);
    expect(await store.getCounter("credits:u1")).toBe(25);
  });

  it("getCounter reads 0 for a key that was never set", async () => {
    const store = createMemoryStore();
    expect(await store.getCounter("credits:missing")).toBe(0);
  });

  it("decrIfAtLeast decrements only when the balance covers the amount", async () => {
    const store = createMemoryStore();
    await store.incrBy("credits:u1", 10);
    expect(await store.decrIfAtLeast("credits:u1", 3)).toBe(7);
    expect(await store.getCounter("credits:u1")).toBe(7);
    expect(await store.decrIfAtLeast("credits:u1", 7)).toBe(0);
    expect(await store.getCounter("credits:u1")).toBe(0);
  });

  it("decrIfAtLeast returns null and makes no change when the balance is too low", async () => {
    const store = createMemoryStore();
    await store.incrBy("credits:u1", 2);
    expect(await store.decrIfAtLeast("credits:u1", 5)).toBeNull();
    expect(await store.getCounter("credits:u1")).toBe(2);
  });

  it("decrIfAtLeast on a never-set key behaves as balance 0", async () => {
    const store = createMemoryStore();
    expect(await store.decrIfAtLeast("credits:new", 1)).toBeNull();
    expect(await store.getCounter("credits:new")).toBe(0);
  });

  it("a burst of concurrent decrements never drives the balance negative", async () => {
    const store = createMemoryStore();
    await store.incrBy("credits:u1", 5);
    const results = await Promise.all(Array.from({ length: 8 }, () => store.decrIfAtLeast("credits:u1", 1)));
    const succeeded = results.filter((r) => r !== null);
    expect(succeeded).toHaveLength(5);
    expect(await store.getCounter("credits:u1")).toBe(0);
  });

  it("incrBy respects a ttl only on first creation", async () => {
    let now = 1000;
    const store = createMemoryStore(() => now);
    await store.incrBy("credits:u1", 10, 5);
    now += 4_000;
    expect(await store.getCounter("credits:u1")).toBe(10);
    now += 2_000;
    expect(await store.getCounter("credits:u1")).toBe(0);
  });
});

describe("KeyValueStore.setNx", () => {
  it("sets and returns true the first time, then makes no change and returns false", async () => {
    const store = createMemoryStore();
    expect(await store.setNx("guard:1", "a")).toBe(true);
    expect(await store.get("guard:1")).toBe("a");
    expect(await store.setNx("guard:1", "b")).toBe(false);
    expect(await store.get("guard:1")).toBe("a");
  });

  it("only one of several concurrent callers wins for the same key", async () => {
    const store = createMemoryStore();
    const results = await Promise.all(Array.from({ length: 6 }, (_, i) => store.setNx("guard:race", `caller-${i}`)));
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("expires like other string keys", async () => {
    let now = 1000;
    const store = createMemoryStore(() => now);
    await store.setNx("guard:ttl", "a", 5);
    now += 6_000;
    expect(await store.get("guard:ttl")).toBeNull();
    expect(await store.setNx("guard:ttl", "b")).toBe(true);
  });
});
