/**
 * Runs every .sql file in src/lib/db/migrations, in filename order, against
 * DATABASE_URL_DIRECT (falls back to DATABASE_URL). Statements use
 * `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS`, so this is
 * safe to re-run.
 *
 * Usage: npx tsx scripts/migrate.ts
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
  if (!url) {
    console.error("Set DATABASE_URL (or DATABASE_URL_DIRECT) before running migrations.");
    process.exit(1);
  }
  const sql = neon(url);
  const dir = path.join(__dirname, "../src/lib/db/migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const contents = readFileSync(path.join(dir, file), "utf8")
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");
    const statements = contents.split(";").map((stmt) => stmt.trim()).filter(Boolean);
    console.log(`Applying ${file} (${statements.length} statement(s))...`);
    for (const statement of statements) await sql.query(statement);
    console.log(`  done.`);
  }
  console.log(`Applied ${files.length} migration file(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
