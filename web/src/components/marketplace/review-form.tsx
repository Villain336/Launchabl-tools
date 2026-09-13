"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ReviewForm({ token }: { token: string }) {
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState("5");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return <p className="text-sm text-foreground">Saved. It will show on their public page — attached to that completed job, not as a floating star.</p>;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/marketplace/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, authorName, rating: Number(rating), body }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) setError(data.error ?? "Could not save the review.");
    else setDone(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Your name" />
      <select value={rating} onChange={(e) => setRating(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
        <option value="5">5 — excellent</option>
        <option value="4">4</option>
        <option value="3">3</option>
        <option value="2">2</option>
        <option value="1">1</option>
      </select>
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What did they do, and how did it go?" rows={5} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit">Publish review</Button>
    </form>
  );
}
