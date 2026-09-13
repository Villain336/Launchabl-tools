"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { InventoryItem } from "@/lib/service-business/inventory";

export function InventoryWorkspace() {
  const session = useSession();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState("0");
  const [reorder, setReorder] = useState("2");
  const [cost, setCost] = useState("");

  function applySnapshot(next: InventoryItem[]) {
    setItems(next);
  }

  async function loadAll(): Promise<InventoryItem[]> {
    const res = await fetch("/api/service-business/inventory", { credentials: "same-origin", cache: "no-store" }).then((r) => r.json());
    return res.items ?? [];
  }

  useEffect(() => {
    if (session.status === "ready" && session.user) void loadAll().then(applySnapshot);
  }, [session.status, session.user]);

  if (session.status !== "ready") return null;
  if (!session.user) {
    return (
      <p className="text-sm text-muted-foreground">
        <a href="/sign-in" className="underline">
          Sign in
        </a>{" "}
        to manage inventory.
      </p>
    );
  }

  async function addItem() {
    const res = await fetch("/api/service-business/inventory", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        sku,
        quantityOnHand: Number(qty),
        reorderThreshold: Number(reorder),
        costCents: Math.round(Number(cost) * 100),
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) setError(data.error ?? "Could not add the item.");
    else {
      setName("");
      setSku("");
      setQty("0");
      setCost("");
      setError(null);
      await loadAll().then(applySnapshot);
    }
  }

  async function consumeOne(item: InventoryItem) {
    const res = await fetch("/api/service-business/inventory", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ adjust: true, itemId: item.id, delta: -1 }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) setError(data.error ?? "Could not use that item.");
    else await loadAll().then(applySnapshot);
  }

  async function restock(item: InventoryItem) {
    const res = await fetch("/api/service-business/inventory", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ adjust: true, itemId: item.id, delta: 1 }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) setError(data.error ?? "Could not restock.");
    else await loadAll().then(applySnapshot);
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Card>
        <CardHeader>
          <CardTitle>Add stock</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. 50-gal heater)" />
          <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" />
          <Input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qty on hand" />
          <Input value={reorder} onChange={(e) => setReorder(e.target.value)} placeholder="Reorder when at or below" />
          <Input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Unit cost (USD)" />
          <Button type="button" onClick={() => void addItem()}>Save item</Button>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-sm text-muted-foreground">Nothing on the truck or in the shop yet.</p>}
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.sku ? `${item.sku} · ` : ""}
                  {item.quantityOnHand} on hand · reorder at {item.reorderThreshold}
                  {item.quantityOnHand <= item.reorderThreshold ? " · low" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => void consumeOne(item)}>
                  Use 1
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => void restock(item)}>
                  Add 1
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
