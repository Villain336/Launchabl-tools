"use client";

import { useEffect, useRef, useState } from "react";
import { Check, FolderOpen, Pencil, Plus, Trash2, X } from "lucide-react";
import { useSession } from "@/lib/auth/use-session";
import type { Project, ProjectInput } from "@/lib/projects/project";
import { removeProject, saveProject, selectProject, useProjects } from "@/lib/projects/use-projects";

/**
 * Project switcher in the chat header. A project is the workspace context
 * (company, site, audience, tone, offers, competitors, brand) that every
 * tool and the agent receive, so nobody retypes it — and the white-label
 * settings shared reports carry.
 */

const field = "w-full rounded-[8px] border border-line bg-field px-2.5 py-1.5 text-[13px] text-ink outline-none placeholder:text-ink-3 focus:border-line-strong";
const label = "block text-[11.5px] font-medium text-ink-2";

function ProjectForm({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const [draft, setDraft] = useState<ProjectInput>(() => ({
    name: project?.name ?? "",
    company: project?.company ?? "",
    url: project?.url ?? "",
    audience: project?.audience ?? "",
    tone: project?.tone ?? "",
    offers: project?.offers ?? "",
    competitors: project?.competitors ?? [],
    notes: project?.notes ?? "",
    brand: {
      primary: project?.brand.primary ?? null,
      logoUrl: project?.brand.logoUrl ?? null,
      agencyName: project?.brand.agencyName ?? null,
      hideBadge: project?.brand.hideBadge ?? false,
    },
  }));
  const [competitorsText, setCompetitorsText] = useState((project?.competitors ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof ProjectInput, value: string) => setDraft((d) => ({ ...d, [key]: value }));
  const setBrand = (key: keyof NonNullable<ProjectInput["brand"]>, value: string | boolean | null) => setDraft((d) => ({ ...d, brand: { ...d.brand, [key]: value } }));

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const result = await saveProject(
      { ...draft, competitors: competitorsText.split(/[,\n]/).map((c) => c.trim()).filter(Boolean), brand: { ...draft.brand, primary: draft.brand?.primary || null, logoUrl: draft.brand?.logoUrl || null, agencyName: draft.brand?.agencyName || null } },
      project?.id,
    );
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/30 p-4 pt-[6vh] backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={project ? "Edit project" : "New project"} data-project-form>
      <form onSubmit={submit} className="w-full max-w-[640px] rounded-[14px] border border-line bg-surface shadow-card" style={{ animation: "fade-up 200ms cubic-bezier(0.23,1,0.32,1) both" }}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div>
            <p className="text-[14px] font-semibold text-ink">{project ? "Edit project" : "New project"}</p>
            <p className="text-[12px] text-ink-3">Everything here is handed to every tool and the agent, so you stop retyping it.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-7 items-center justify-center rounded-[6px] text-ink-3 hover:bg-hover hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="pf-name">Project name</label>
            <input id="pf-name" className={`${field} mt-1`} value={draft.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="Acme — Q4 launch" autoFocus />
          </div>
          <div>
            <label className={label} htmlFor="pf-company">Company</label>
            <input id="pf-company" className={`${field} mt-1`} value={draft.company ?? ""} onChange={(e) => set("company", e.target.value)} placeholder="Acme Invoicing" />
          </div>
          <div>
            <label className={label} htmlFor="pf-url">Website</label>
            <input id="pf-url" className={`${field} mt-1`} value={draft.url ?? ""} onChange={(e) => set("url", e.target.value)} placeholder="https://acme.io" inputMode="url" />
          </div>
          <div>
            <label className={label} htmlFor="pf-tone">Voice and tone</label>
            <input id="pf-tone" className={`${field} mt-1`} value={draft.tone ?? ""} onChange={(e) => set("tone", e.target.value)} placeholder="Plain, confident, no hype" />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="pf-audience">Audience</label>
            <input id="pf-audience" className={`${field} mt-1`} value={draft.audience ?? ""} onChange={(e) => set("audience", e.target.value)} placeholder="Freelance designers and small agencies in the US who invoice monthly" />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="pf-offers">Offers / products (one per line)</label>
            <textarea id="pf-offers" className={`${field} mt-1 min-h-[64px]`} value={draft.offers ?? ""} onChange={(e) => set("offers", e.target.value)} placeholder={"Invoicing app — $29/mo\nDone-for-you setup — $499"} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="pf-competitors">Competitors (comma-separated)</label>
            <input id="pf-competitors" className={`${field} mt-1`} value={competitorsText} onChange={(e) => setCompetitorsText(e.target.value)} placeholder="freshbooks.com, bonsai.com" />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="pf-notes">Notes for the agent</label>
            <textarea id="pf-notes" className={`${field} mt-1 min-h-[72px]`} value={draft.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Never mention pricing in ads. UK spelling. Founder is Priya (she/her)." />
          </div>
          <div className="sm:col-span-2 mt-1 border-t border-line pt-3">
            <p className="text-[12px] font-semibold text-ink">White-label reports</p>
            <p className="text-[11.5px] text-ink-3">Shared client reports from this project carry these instead of Launchabl&apos;s.</p>
          </div>
          <div>
            <label className={label} htmlFor="pf-agency">Report author</label>
            <input id="pf-agency" className={`${field} mt-1`} value={draft.brand?.agencyName ?? ""} onChange={(e) => setBrand("agencyName", e.target.value)} placeholder="Northwind Studio" />
          </div>
          <div>
            <label className={label} htmlFor="pf-colour">Brand colour</label>
            <div className="mt-1 flex items-center gap-2">
              <input type="color" aria-label="Pick brand colour" value={draft.brand?.primary ?? "#FF6600"} onChange={(e) => setBrand("primary", e.target.value.toUpperCase())} className="h-8 w-10 cursor-pointer rounded-[6px] border border-line bg-field" />
              <input id="pf-colour" className={field} value={draft.brand?.primary ?? ""} onChange={(e) => setBrand("primary", e.target.value)} placeholder="#FF6600" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="pf-logo">Logo URL</label>
            <input id="pf-logo" className={`${field} mt-1`} value={draft.brand?.logoUrl ?? ""} onChange={(e) => setBrand("logoUrl", e.target.value)} placeholder="https://acme.io/logo.png" inputMode="url" />
          </div>
          <label className="flex items-center gap-2 text-[12.5px] text-ink-2 sm:col-span-2">
            <input type="checkbox" className="accent-primary" checked={Boolean(draft.brand?.hideBadge)} onChange={(e) => setBrand("hideBadge", e.target.checked)} />
            Hide the &ldquo;made with Launchabl&rdquo; line on shared reports
          </label>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
          <p className="text-[12px] text-red">{error}</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="h-8 rounded-control px-3 text-[13px] font-medium text-ink-2 hover:bg-hover hover:text-ink">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="h-8 rounded-control bg-ink px-3 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50">
              {saving ? "Saving…" : project ? "Save changes" : "Create project"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function ProjectSwitcher() {
  const session = useSession();
  const signedIn = session.status === "ready" && Boolean(session.user);
  const projects = useProjects(signedIn);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ project: Project | null } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!signedIn) return null;
  const current = projects.projects.find((p) => p.id === projects.current) ?? null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Switch project"
        title={current ? `Working in ${current.name}` : "Choose a project so tools know your company, site and audience"}
        className={`flex h-7 max-w-[200px] items-center gap-1 rounded-[6px] px-1.5 text-[12px] font-medium transition-colors duration-100 hover:bg-hover ${current ? "text-ink" : "text-ink-3 hover:text-ink"}`}
        data-project-switcher
      >
        <FolderOpen className={`h-3.5 w-3.5 shrink-0 ${current ? "text-primary" : ""}`} />
        <span className="truncate">{current ? current.name : "No project"}</span>
      </button>
      {open && (
        <div role="menu" aria-label="Projects" className="absolute right-0 top-full z-20 mt-1 w-[300px] overflow-hidden rounded-[10px] border border-line bg-surface shadow-card" style={{ animation: "fade-up 200ms cubic-bezier(0.23,1,0.32,1) both" }}>
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="text-[11.5px] font-medium tracking-wide text-ink-3 uppercase">Projects</span>
            <button
              type="button"
              onClick={() => {
                setEditing({ project: null });
                setOpen(false);
              }}
              className="flex items-center gap-1 text-[11.5px] font-medium text-ink-2 hover:text-ink"
              data-new-project
            >
              <Plus className="h-3 w-3" /> New
            </button>
          </div>
          {projects.status !== "ready" ? (
            <p className="px-3 py-4 text-[12.5px] text-ink-3">Loading…</p>
          ) : (
            <ul className="max-h-[320px] overflow-y-auto py-1">
              <li>
                <button type="button" role="menuitemradio" aria-checked={!current} onClick={() => void selectProject(null).then(() => setOpen(false))} className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-hover ${current ? "text-ink-2" : "text-ink"}`}>
                  <span className="flex size-4 items-center justify-center">{!current && <Check className="h-3.5 w-3.5 text-primary" />}</span>
                  No project — ask me each time
                </button>
              </li>
              {projects.projects.map((project) => {
                const active = project.id === current?.id;
                return (
                  <li key={project.id} className="group flex items-stretch">
                    <button type="button" role="menuitemradio" aria-checked={active} onClick={() => void selectProject(project.id).then(() => setOpen(false))} className={`flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-hover ${active ? "bg-field" : ""}`}>
                      <span className="flex size-4 shrink-0 items-center justify-center">{active && <Check className="h-3.5 w-3.5 text-primary" />}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-ink">{project.name}</span>
                        <span className="block truncate text-[11.5px] text-ink-3">{[project.company, project.url.replace(/^https?:\/\//, "")].filter(Boolean).join(" · ") || "No details yet"}</span>
                      </span>
                    </button>
                    <button type="button" aria-label={`Edit ${project.name}`} title="Edit" onClick={() => { setEditing({ project }); setOpen(false); }} className="flex w-8 shrink-0 items-center justify-center text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 hover:text-ink focus-visible:opacity-100">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" aria-label={`Delete ${project.name}`} title="Delete" onClick={() => void removeProject(project.id)} className="flex w-8 shrink-0 items-center justify-center pr-1 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red focus-visible:opacity-100">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="border-t border-line px-3 py-2 text-[11px] leading-relaxed text-ink-3">The active project&apos;s company, site, audience, tone and brand go to every tool and the agent. Templates fill their blanks from it.</p>
        </div>
      )}
      {editing && <ProjectForm project={editing.project} onClose={() => setEditing(null)} />}
    </div>
  );
}
