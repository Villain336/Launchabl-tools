/**
 * Run the eval suite from the command line against the real model gateway.
 *
 *   npm run evals                       # every case
 *   npm run evals -- meta-stripe-pricing dns-stripe
 *
 * Reads web/.env.local like Next does, prints one line per case, then writes
 * the run to the configured store (memory when no Redis — which means the
 * admin dashboard on a *running* server won't see CLI runs; use the
 * dashboard's Run button for that).
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const { runEvals } = await import("@/lib/evals/run");
const { EVAL_CASES } = await import("@/lib/evals/cases");

const ids = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
const unknown = ids.filter((id) => !EVAL_CASES.some((c) => c.id === id));
if (unknown.length) {
  console.error(`Unknown case id(s): ${unknown.join(", ")}\nKnown: ${EVAL_CASES.map((c) => c.id).join(", ")}`);
  process.exit(2);
}

const run = await runEvals(ids.length ? ids : undefined, { concurrency: 3 });
for (const r of run.results) {
  const status = r.ok ? (r.passed ? "PASS" : "FAIL") : "ERROR";
  const tools = r.missingTools.length ? `missing ${r.missingTools.join(",")}` : `tools ok`;
  console.log(`${status.padEnd(5)} ${r.id.padEnd(24)} ${String(r.score ?? "—").padStart(3)}  ${tools.padEnd(28)} ${(r.durationMs / 1000).toFixed(1)}s  ${r.model ?? r.error}`);
  for (const issue of r.issues) console.log(`      · ${issue}`);
}
const s = run.summary;
console.log(`\n${s.passed}/${s.cases} passed · avg ${s.avgScore ?? "—"} · tool hit ${(s.toolHitRate * 100).toFixed(0)}% · ${s.errors} errors`);
process.exit(s.passed === s.cases ? 0 : 1);
