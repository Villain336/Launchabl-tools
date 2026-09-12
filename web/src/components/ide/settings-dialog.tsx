"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IdeProvider, IdeSettings } from "@/lib/ide/store";
import { cn } from "@/lib/utils";

type Props = { open: boolean; settings: IdeSettings; onOpenChange: (open: boolean) => void; onSave: (settings: IdeSettings) => void };

const PROVIDERS: { id: IdeProvider; label: string; hint: string; placeholder: string; models: string[] }[] = [
  { id: "launchabl", label: "Launchabl", hint: "Free, signed in. Same models as the rest of the tools; counts toward the daily allowance.", placeholder: "", models: [] },
  { id: "anthropic", label: "Anthropic", hint: "Your Anthropic API key. Best for multi-file edits.", placeholder: "sk-ant-…", models: ["claude-sonnet-4.6", "claude-opus-4.2", "claude-haiku-4.5"] },
  { id: "openai", label: "OpenAI", hint: "Your OpenAI API key.", placeholder: "sk-…", models: ["gpt-5.4", "gpt-5.4-mini", "gpt-5.2"] },
  { id: "gateway", label: "Vercel AI Gateway", hint: "A Gateway key gives you every provider; use provider/model ids.", placeholder: "vck_…", models: ["anthropic/claude-sonnet-4.6", "openai/gpt-5.4", "google/gemini-3-pro"] },
];

function SecretInput({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input id={id} type={shown ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value.trim())} placeholder={placeholder} autoComplete="off" spellCheck={false} className="pr-9 font-mono text-[12.5px]" />
      <button type="button" onClick={() => setShown((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={shown ? "Hide" : "Show"}>
        {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function SettingsDialog({ open, settings, onOpenChange, onSave }: Props) {
  // The parent mounts this only while open, so the draft starts fresh each time.
  const [draft, setDraft] = useState(settings);
  const provider = PROVIDERS.find((p) => p.id === draft.provider) ?? PROVIDERS[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-ide-settings>
        <DialogHeader>
          <DialogTitle>Editor settings</DialogTitle>
          <DialogDescription>Keys are stored in this browser only and sent with each request straight to the provider. Launchabl never stores them.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-[12.5px] font-medium text-foreground">Assistant model</legend>
            <div className="grid grid-cols-2 gap-1.5" role="radiogroup">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={draft.provider === p.id}
                  onClick={() => setDraft({ ...draft, provider: p.id, model: "" })}
                  className={cn("rounded-lg border px-3 py-2 text-left text-[12.5px] transition-colors", draft.provider === p.id ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:bg-muted/50")}
                  data-ide-provider={p.id}
                >
                  <span className="block font-medium">{p.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[12px] text-muted-foreground">{provider.hint}</p>
            {provider.id !== "launchabl" && (
              <div className="mt-1 grid gap-3 sm:grid-cols-[1fr_180px]">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ide-api-key" className="text-[12px]">
                    API key
                  </Label>
                  <SecretInput id="ide-api-key" value={draft.apiKey} onChange={(apiKey) => setDraft({ ...draft, apiKey })} placeholder={provider.placeholder} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ide-model" className="text-[12px]">
                    Model
                  </Label>
                  <Input id="ide-model" list="ide-model-options" value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value.trim() })} placeholder={provider.models[0]} className="font-mono text-[12.5px]" spellCheck={false} />
                  <datalist id="ide-model-options">
                    {provider.models.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
              </div>
            )}
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ide-gh-token" className="flex items-center gap-1.5 text-[12.5px] font-medium">
              <KeyRound className="size-3.5" /> GitHub token
            </Label>
            <SecretInput id="ide-gh-token" value={draft.githubToken} onChange={(githubToken) => setDraft({ ...draft, githubToken })} placeholder="github_pat_… or ghp_…" />
            <p className="text-[12px] text-muted-foreground">
              Needed for private repos and to commit. Create a{" "}
              <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
                fine-grained token
              </a>{" "}
              with Contents: read and write (plus Pull requests: write to open PRs) on the repos you want to edit.
            </p>
          </div>

          <label className="flex items-center gap-2 text-[12.5px] text-foreground">
            <input type="checkbox" checked={draft.wordWrap} onChange={(e) => setDraft({ ...draft, wordWrap: e.target.checked })} className="accent-primary" /> Wrap long lines
          </label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSave(draft);
              onOpenChange(false);
            }}
            data-ide-settings-save
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
