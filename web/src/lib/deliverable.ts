export type SourceKind =
  | "live fetch"
  | "Search Console"
  | "USPTO"
  | "operator-provided"
  | "Vercel";

export type SkillSource = {
  kind: SourceKind;
  href?: string;
  retrievedAt: string;
  note: string;
};

export type SkillStatus = "queued" | "running" | "done" | "failed";

export type SkillResult = {
  id: string;
  label: string;
  status: SkillStatus;
  payload?: unknown;
  sources: SkillSource[];
  warnings: string[];
  detail?: string;
  startedAt?: string;
  endedAt?: string;
};

export type GateState = "locked" | "ready" | "done";

export type DeliverableKind = "report" | "kit" | "copy" | "zip" | "repo" | "preview" | "production";

export type DeliverableArtifact = {
  name: string;
  mime: string;
  text?: string;
  url?: string;
};

export type Deliverable = {
  kind: DeliverableKind;
  title: string;
  artifacts: DeliverableArtifact[];
  sources: SkillSource[];
  warnings: string[];
  gates: {
    download?: GateState;
    push?: GateState;
    publish?: GateState;
  };
};

export function liveFetchSource(url: string, fetchedAt: string, note = "HTML response"): SkillSource {
  return { kind: "live fetch", href: url, retrievedAt: fetchedAt, note };
}

export function operatorSource(note: string, retrievedAt = new Date().toISOString()): SkillSource {
  return { kind: "operator-provided", retrievedAt, note };
}

export function sourcesFromLog(log: SkillResult[]): SkillSource[] {
  const seen = new Set<string>();
  const out: SkillSource[] = [];
  for (const skill of log) {
    for (const source of skill.sources) {
      const key = `${source.kind}|${source.href ?? ""}|${source.retrievedAt}|${source.note}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(source);
    }
  }
  return out;
}

export function warningsFromLog(log: SkillResult[]): string[] {
  return log.flatMap((skill) => skill.warnings);
}
