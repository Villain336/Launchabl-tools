import { isStepCount, type ModelMessage, type ToolSet } from "ai";
import { getChatToolRuntime } from "@/lib/ai/chat-runtime";
import { modelChain } from "@/lib/ai/models";
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { generateWithFallback } from "@/lib/ai/stream";
import { recordUsage } from "@/lib/ai/usage";
import { projectContext } from "@/lib/projects/project";
import { loadProject } from "@/lib/projects/storage";
import { fitReport, type Report, type ReportItem } from "@/lib/reports/extract";
import { newReportId, saveReport } from "@/lib/reports/storage";
import { describeCadence, nextRunAfter, type Schedule } from "@/lib/schedules/schedule";
import { claimSchedule, releaseSchedule, saveSchedule } from "@/lib/schedules/storage";
import { siteConfig } from "@/lib/site-config";

/**
 * Executes one scheduled brief without a chat: same runtime, tools and
 * model chain as the live tool, non-streaming. The deliverables become a
 * report page (the same /r/<id> pages "Share" makes) and the owner gets
 * the link by email when Resend is configured.
 */

const INTERNAL_TOOLS = new Set(["fetchPage", "readTranscript", "loadSkillGuide", "reviewDeliverables"]);

type StepLike = {
  text: string;
  toolResults: Array<{ toolName: string; toolCallId: string; input: unknown; output: unknown }>;
};

export type ScheduleRunOutcome = { ok: true; reportId: string; durationMs: number; emailed: boolean } | { ok: false; error: string; durationMs: number };

export function reportItemsFromSteps(prompt: string, steps: StepLike[], closing: string): ReportItem[] {
  const items: ReportItem[] = [{ kind: "prompt", text: prompt }];
  for (const step of steps) {
    for (const result of step.toolResults) {
      if (INTERNAL_TOOLS.has(result.toolName)) continue;
      const output = result.output as { type?: string } | null;
      if (output && typeof output === "object" && (output.type === "error-text" || output.type === "error-json")) continue;
      items.push({ kind: "tool", tool: result.toolName, toolCallId: result.toolCallId, input: result.input ?? null, output: result.output ?? null });
    }
  }
  const text = closing.trim();
  if (text) items.push({ kind: "text", text: text.slice(0, 20_000) });
  return items;
}

async function sendReportEmail(schedule: Schedule, report: Report): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  const from = process.env.AUTH_EMAIL_FROM ?? "Launchabl <hello@launchabl.io>";
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;
  const link = `${origin}/r/${report.id}`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [schedule.email],
      subject: `${schedule.title} — your report is ready`,
      text: [
        `Your scheduled job "${schedule.title}" just ran (${describeCadence(schedule)}).`,
        "",
        `Report: ${link}`,
        "",
        `Manage this automation: ${origin}/automations`,
      ].join("\n"),
    }),
    signal: AbortSignal.timeout(8_000),
  });
  return res.ok;
}

export async function runSchedule(schedule: Schedule, store: KeyValueStore = getStore(), now = new Date()): Promise<ScheduleRunOutcome> {
  const startedAt = Date.now();
  const runtime = getChatToolRuntime(schedule.slug);
  if (!runtime) return finish(schedule, store, now, { ok: false, error: `Unknown tool "${schedule.slug}".`, durationMs: 0 });

  const project = schedule.projectId ? await loadProject(schedule.projectId, schedule.ownerUid, store) : null;
  const instructions = [
    runtime.instructions,
    project ? projectContext(project) : null,
    "This is a scheduled, unattended run: nobody will answer questions. Never ask; make the sensible assumption, state it once, and produce the deliverables. The last run's report is linked to the user separately, so finish with a short handover that a reader would find useful on its own.",
    `Today is ${now.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })} (${now.toISOString().slice(0, 10)}).`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const messages: ModelMessage[] = [{ role: "user", content: schedule.prompt }];
    const { model, result } = await generateWithFallback(modelChain(runtime.modelKind), {
      instructions,
      messages,
      tools: runtime.tools as ToolSet,
      stopWhen: isStepCount(runtime.maxSteps ?? 3),
      prepareStep: runtime.prepareStep,
      providerOptions: { gateway: { tags: ["launchabl", `tool:${schedule.slug}`, "schedule", ...(project ? ["project"] : [])] } },
    });
    void recordUsage(
      { slug: schedule.slug, model, inputTokens: result.totalUsage.inputTokens ?? 0, outputTokens: result.totalUsage.outputTokens ?? 0, durationMs: Date.now() - startedAt, ok: true },
      store,
    );

    const items = reportItemsFromSteps(schedule.prompt, result.steps as unknown as StepLike[], result.text);
    if (!items.some((item) => item.kind === "tool")) {
      return finish(schedule, store, now, { ok: false, error: "The run produced no deliverable. Make the brief more specific about what to produce.", durationMs: Date.now() - startedAt });
    }
    const draft: Report = {
      id: newReportId(),
      slug: schedule.slug,
      title: `${schedule.title} — ${now.toISOString().slice(0, 10)}`,
      ownerUid: schedule.ownerUid,
      preparedBy: schedule.preparedBy,
      projectId: schedule.projectId,
      createdAt: now.toISOString(),
      items,
    };
    const report = fitReport(draft);
    if (!report) return finish(schedule, store, now, { ok: false, error: "The deliverables were too large to store as one report.", durationMs: Date.now() - startedAt });
    await saveReport(report, store);
    let emailed = false;
    try {
      emailed = await sendReportEmail(schedule, report);
    } catch (cause) {
      console.warn(`[schedules] email failed for ${schedule.id}:`, cause instanceof Error ? cause.message : cause);
    }
    return finish(schedule, store, now, { ok: true, reportId: report.id, durationMs: Date.now() - startedAt, emailed });
  } catch (cause) {
    return finish(schedule, store, now, { ok: false, error: cause instanceof Error ? cause.message.slice(0, 300) : String(cause), durationMs: Date.now() - startedAt });
  }
}

async function finish(schedule: Schedule, store: KeyValueStore, now: Date, outcome: ScheduleRunOutcome): Promise<ScheduleRunOutcome> {
  const next: Schedule = {
    ...schedule,
    lastRunAt: now.toISOString(),
    lastStatus: outcome.ok ? "ok" : "error",
    lastError: outcome.ok ? null : outcome.error,
    lastReportId: outcome.ok ? outcome.reportId : schedule.lastReportId,
    runs: schedule.runs + 1,
    nextRunAt: nextRunAfter(schedule, now).toISOString(),
    updatedAt: now.toISOString(),
  };
  await saveSchedule(next, store);
  return outcome;
}

/** Cron entry point: run everything due, a few at a time, within the time budget. */
export async function runDueSchedules(due: Schedule[], options: { concurrency?: number; budgetMs?: number; store?: KeyValueStore } = {}) {
  const store = options.store ?? getStore();
  const deadline = Date.now() + (options.budgetMs ?? 600_000);
  const outcomes: Array<{ id: string; outcome: ScheduleRunOutcome | "skipped" | "locked" }> = [];
  let cursor = 0;
  const worker = async () => {
    for (;;) {
      const index = cursor++;
      if (index >= due.length) return;
      const schedule = due[index];
      if (Date.now() > deadline - 90_000) {
        outcomes.push({ id: schedule.id, outcome: "skipped" });
        continue;
      }
      if (!(await claimSchedule(schedule.id, store))) {
        outcomes.push({ id: schedule.id, outcome: "locked" });
        continue;
      }
      try {
        outcomes.push({ id: schedule.id, outcome: await runSchedule(schedule, store) });
      } finally {
        await releaseSchedule(schedule.id, store);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(options.concurrency ?? 2, Math.max(1, due.length)) }, worker));
  return outcomes;
}
