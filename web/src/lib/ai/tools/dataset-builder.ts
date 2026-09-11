import { tool } from "ai";
import { z } from "zod";
import type { ChatToolRuntime } from "@/lib/ai/chat-runtime";
import { fetchPageTool } from "@/lib/ai/tools/shared/fetch-page-tool";

export const datasetSchema = z.object({
  name: z.string().min(1).max(80).describe("Short dataset name, used for the file name."),
  description: z.string().max(300).describe("What the rows represent and how the data was produced (generated, extracted, transformed)."),
  columns: z
    .array(
      z.object({
        name: z.string().min(1).max(60).describe("snake_case column name"),
        type: z.enum(["string", "integer", "number", "boolean", "date", "datetime", "email", "url", "category"]),
        description: z.string().max(160),
      }),
    )
    .min(1)
    .max(20),
  rows: z
    .array(z.array(z.string()))
    .min(1)
    .max(60)
    .describe("Row values as strings, in column order. Booleans as true/false, dates as ISO 8601, empty string for null."),
  notes: z
    .string()
    .max(400)
    .optional()
    .describe("Caveats: synthetic data warning, assumptions, or how to extend to more rows."),
});

export type Dataset = z.infer<typeof datasetSchema>;

const deliverDataset = tool({
  description:
    "Deliver a tabular dataset. Call once per dataset with every row fully populated and each row having exactly one value per column. The user gets a table preview and CSV / JSON downloads.",
  inputSchema: datasetSchema,
  execute: async (input) => {
    const width = input.columns.length;
    const rows = input.rows
      .filter((row) => row.length > 0)
      .map((row) => (row.length === width ? row : [...row.slice(0, width), ...Array(Math.max(0, width - row.length)).fill("")]));
    return { ...input, rows };
  },
});

export const datasetBuilderRuntime: ChatToolRuntime = {
  slug: "dataset-builder",
  modelKind: "writer",
  maxSteps: 4,
  tools: { fetchPage: fetchPageTool, deliverDataset },
  instructions: `You are Launchabl's data builder. You turn a description into a clean, typed, tabular dataset — for prototyping a product, seeding a database, testing an import, training a small classifier, or filling a demo dashboard.

Process:
1. Understand what each row represents and what the data is for. Pick 4–12 columns with clear snake_case names and the right types. Include an id column when rows are entities.
2. Decide the source of the values:
   - Synthetic: generate realistic, varied, internally consistent rows (names match emails, dates in plausible ranges, prices match categories, no two rows identical). Never use real people's personal data. Use example.com domains for emails.
   - Extracted: if the user gives a URL, call fetchPage and build rows from what the page actually contains (headings, listed items, structured data). Do not invent values that aren't on the page — leave cells empty and say so.
   - Transformed: if the user pastes messy text or a list, normalise it into columns.
3. Default to 20 rows; respect a requested count up to 60. If they need more, say the CSV is a seed and how to extend it (a script, a spreadsheet fill-down, or asking again for the next batch with different ranges).
4. Call deliverDataset once with all rows filled and every row the same width as columns. Booleans as true/false, dates as ISO 8601, numbers without thousands separators or currency symbols (put units in the column description).
5. Reply in one to three sentences: what you assumed, and one suggestion (a column to add, a validation to run). Don't list the rows in prose.

Match the user's language. No headers, no bullet lists in the chat reply.`,
};
