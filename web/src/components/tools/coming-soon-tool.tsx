"use client";

import { useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/agency-button";

export function ComingSoonTool({
  architectureNotes,
}: {
  architectureNotes: string[];
}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="flex flex-col items-center py-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <Clock className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">This tool is on our public roadmap</h3>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        We ship tools in the open — see the <a href="/roadmap" className="text-indigo-600 underline">roadmap</a> for
        what&apos;s next. Leave your email and we&apos;ll notify you the day this one ships.
      </p>

      {submitted ? (
        <div className="mt-6 flex items-center gap-2 text-sm font-medium text-emerald-600">
          <CheckCircle2 className="h-4 w-4" /> You&apos;re on the list.
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.includes("@")) setSubmitted(true);
          }}
          className="mt-6 flex w-full max-w-sm gap-2"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <Button type="submit" size="sm">
            Notify me
          </Button>
        </form>
      )}

      <div className="mt-8 w-full max-w-md rounded-xl bg-slate-50 p-5 text-left">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Build architecture notes
        </p>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {architectureNotes.map((note) => (
            <li key={note} className="flex gap-2">
              <span className="text-indigo-500">→</span> {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
