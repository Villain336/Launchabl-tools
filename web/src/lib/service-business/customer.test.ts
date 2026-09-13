import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import { upsertUser } from "@/lib/auth/session";
import { createOrg } from "@/lib/orgs/org";
import { archiveCustomer, createCustomer, getCustomer, listCustomers, updateCustomer } from "./customer";

async function seedOrg(store = createMemoryStore()) {
  const { user } = await upsertUser("owner@example.com", "Owner", store);
  const org = await createOrg(user.uid, "Carolina Lawn Co", store);
  if ("error" in org) throw new Error(org.error);
  return { store, owner: user, org };
}

describe("customer CRM", () => {
  it("creates a customer with cleaned fields and a default 'direct' source", async () => {
    const { store, owner, org } = await seedOrg();
    const customer = await createCustomer(org.id, owner.uid, { name: "  Jane   Doe ", email: "Jane@Example.com", addresses: ["1 Main St"] }, store);
    if ("error" in customer) throw new Error(customer.error);
    expect(customer.name).toBe("Jane Doe");
    expect(customer.email).toBe("jane@example.com");
    expect(customer.source).toBe("direct");
    expect(customer.archived).toBe(false);
    expect(await getCustomer(org.id, customer.id, store)).toEqual(customer);
  });

  it("rejects a customer with no name", async () => {
    const { store, owner, org } = await seedOrg();
    expect(await createCustomer(org.id, owner.uid, { name: "   " }, store)).toEqual({ error: "Give the customer a name." });
  });

  it("scopes customers per org — listing one org never returns another org's customers", async () => {
    const store = createMemoryStore();
    const { user: ownerA } = await upsertUser("a@example.com", "A", store);
    const orgA = await createOrg(ownerA.uid, "Org A", store);
    const { user: ownerB } = await upsertUser("b@example.com", "B", store);
    const orgB = await createOrg(ownerB.uid, "Org B", store);
    if ("error" in orgA || "error" in orgB) throw new Error("unexpected error");

    await createCustomer(orgA.id, ownerA.uid, { name: "A's customer" }, store);
    await createCustomer(orgB.id, ownerB.uid, { name: "B's customer" }, store);
    const listA = await listCustomers(orgA.id, store);
    expect(listA).toHaveLength(1);
    expect(listA[0].name).toBe("A's customer");
  });

  it("marketplace-sourced leads land with source 'marketplace-lead' when specified", async () => {
    const { store, owner, org } = await seedOrg();
    const customer = await createCustomer(org.id, owner.uid, { name: "Lead Customer", source: "marketplace-lead" }, store);
    if ("error" in customer) throw new Error(customer.error);
    expect(customer.source).toBe("marketplace-lead");
  });

  it("updates leave unspecified fields untouched, and archiving is reflected on read", async () => {
    const { store, owner, org } = await seedOrg();
    const created = await createCustomer(org.id, owner.uid, { name: "Jane Doe", phone: "555-0100", tags: ["vip"] }, store);
    if ("error" in created) throw new Error(created.error);

    const updated = await updateCustomer(org.id, owner.uid, created.id, { notes: "Prefers morning visits" }, store);
    if ("error" in updated) throw new Error(updated.error);
    expect(updated.phone).toBe("555-0100");
    expect(updated.tags).toEqual(["vip"]);
    expect(updated.notes).toBe("Prefers morning visits");

    const archived = await archiveCustomer(org.id, owner.uid, created.id, store);
    if ("error" in archived) throw new Error(archived.error);
    expect(archived.archived).toBe(true);
    expect((await getCustomer(org.id, created.id, store))?.archived).toBe(true);
  });

  it("returns an error for a customer that doesn't exist", async () => {
    const { store, owner, org } = await seedOrg();
    expect(await updateCustomer(org.id, owner.uid, "cust_missing", { notes: "x" }, store)).toEqual({ error: "Customer not found." });
    expect(await archiveCustomer(org.id, owner.uid, "cust_missing", store)).toEqual({ error: "Customer not found." });
  });

  it("rejects a user with no membership in the org", async () => {
    const { store, org } = await seedOrg();
    const { user: outsider } = await upsertUser("outsider@example.com", "Outsider", store);
    expect(await createCustomer(org.id, outsider.uid, { name: "Nope" }, store)).toEqual({ error: "You don't have permission to do that." });
  });
});
