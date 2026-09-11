import { attr, decodeEntities, fetchHtml, tags, type RawPage } from "@/lib/web/fetch-page";
import { finalizeChecklist, plural, type Check, type ChecklistReport } from "@/lib/web/checklist";

/**
 * Voice-search readiness from server-rendered HTML.
 *
 * Assistants (Google Assistant, Siri, Alexa) mostly read featured-snippet
 * style answers: a question, then a ~30–50 word plain answer, on a fast,
 * mobile-ready page with FAQ/HowTo/Speakable structured data. Every check
 * below maps to one of those requirements.
 */

const QUESTION_START = /^(who|what|when|where|why|how|which|can|could|does|do|is|are|should|will|would)\b/i;

export type VoiceSearchInput = Pick<RawPage, "html" | "finalUrl" | "requestedUrl" | "status"> & { loadTimeMs?: number; ttfbMs?: number };

type Heading = { level: number; text: string };

function headings(html: string): Heading[] {
  return Array.from(html.matchAll(/<h([1-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi))
    .map((m) => ({ level: Number(m[1]), text: decodeEntities(m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")) }))
    .filter((h) => h.text.length > 0)
    .slice(0, 200);
}

function paragraphs(html: string): string[] {
  return Array.from(html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
    .map((m) => decodeEntities(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")))
    .filter((p) => p.split(/\s+/).length >= 5)
    .slice(0, 400);
}

function bodyText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<(nav|footer|header)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  );
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 3);
}

export function isQuestion(text: string): boolean {
  const t = text.trim();
  return t.endsWith("?") || QUESTION_START.test(t);
}

function jsonLdTypes(html: string): string[] {
  return Array.from(html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi))
    .flatMap((m) => Array.from(m[1].matchAll(/"@type"\s*:\s*"([^"]+)"/g)).map((t) => t[1]))
    .filter((v, i, arr) => arr.indexOf(v) === i);
}

export function analyzeVoiceSearchHtml(input: VoiceSearchInput): ChecklistReport {
  const { html, finalUrl } = input;
  const url = new URL(finalUrl);
  const heads = headings(html);
  const questionHeads = heads.filter((h) => isQuestion(h.text));
  const paras = paragraphs(html);
  const snippetParas = paras.filter((p) => {
    const words = p.split(/\s+/).length;
    return words >= 25 && words <= 60;
  });
  const text = bodyText(html);
  const words = text ? text.split(/\s+/).length : 0;
  const sents = sentences(text);
  const avgSentence = sents.length ? Math.round(sents.reduce((n, s) => n + s.split(/\s+/).length, 0) / sents.length) : 0;
  const youCount = (text.match(/\b(you|your|you're|you'll)\b/gi) ?? []).length;
  const types = jsonLdTypes(html);
  const hasFaq = types.includes("FAQPage") || types.includes("Question");
  const hasHowTo = types.includes("HowTo");
  const hasSpeakable = /"speakable"/i.test(html) || types.includes("SpeakableSpecification");
  const hasLocal = types.some((t) => /LocalBusiness|Organization|Store|Restaurant|Dentist|Attorney|Hotel|Physician|Plumber|Electrician/i.test(t));
  const phone = /(\+?\d[\d\s().-]{8,}\d)/.test(text) || tags(html, "a").some((a) => /^tel:/i.test(attr(a, "href") ?? ""));
  const metas = tags(html.slice(0, 200_000), "meta");
  const viewport = metas.some((m) => (attr(m, "name") ?? "").toLowerCase() === "viewport");
  const description = metas.find((m) => (attr(m, "name") ?? "").toLowerCase() === "description");
  const descriptionText = description ? (attr(description, "content") ?? "") : "";
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1].replace(/\s+/g, " ")) : null;
  const orderedLists = (html.match(/<ol\b/gi) ?? []).length;
  const tables = (html.match(/<table\b/gi) ?? []).length;
  const lang = attr(html.match(/<html\b[^>]*>/i)?.[0] ?? "", "lang");
  const h1 = heads.find((h) => h.level === 1);

  // Does a question heading get a snippet-length answer right after it?
  let answered = 0;
  for (const q of questionHeads) {
    const idx = html.indexOf(q.text.slice(0, 40));
    if (idx < 0) continue;
    const after = html.slice(idx, idx + 4_000);
    const firstPara = after.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
    if (!firstPara) continue;
    const n = decodeEntities(firstPara[1].replace(/<[^>]+>/g, " ")).split(/\s+/).filter(Boolean).length;
    if (n >= 20 && n <= 70) answered += 1;
  }

  const checks: Check[] = [];
  const add = (c: Check) => checks.push(c);

  add(
    questionHeads.length >= 3
      ? { id: "question-headings", status: "pass", group: "Content", title: "Headings phrased as questions", detail: `${plural(questionHeads.length, "heading")} ask a question the way people speak, e.g. “${questionHeads[0].text}”.` }
      : questionHeads.length > 0
        ? { id: "question-headings", status: "warn", group: "Content", title: "Few question-style headings", detail: `Only ${plural(questionHeads.length, "heading")} is phrased as a question (“${questionHeads[0].text}”). Voice queries are questions; headings should match them.`, fix: "Rewrite section headings as the exact questions your customers ask, e.g. “How much does X cost?” or “Is X safe for Y?”." }
        : { id: "question-headings", status: "fail", group: "Content", title: "No question-style headings", detail: `${plural(heads.length, "heading")} found, none phrased as a question. Assistants match spoken questions against headings and nearby text.`, fix: "Add an H2/H3 for each real customer question (start with who/what/how/why/can/does, end with “?”) and answer it immediately below." },
  );

  add(
    questionHeads.length === 0
      ? { id: "direct-answers", status: "info", group: "Content", title: "Direct answers under questions", detail: "Nothing to check until there are question headings." }
      : answered >= Math.ceil(questionHeads.length * 0.6)
        ? { id: "direct-answers", status: "pass", group: "Content", title: "Questions get a snippet-length answer", detail: `${answered} of ${questionHeads.length} question headings are followed by a 20–70 word paragraph — the length assistants read aloud.` }
        : { id: "direct-answers", status: "warn", group: "Content", title: "Answers don't follow the questions", detail: `${answered} of ${questionHeads.length} question headings are followed by a 20–70 word paragraph. Long or missing first paragraphs rarely get read aloud.`, fix: "Put a one-paragraph, 30–50 word plain answer directly under each question heading. Elaborate afterwards." },
  );

  add(
    snippetParas.length >= 3
      ? { id: "snippet-paragraphs", status: "pass", group: "Content", title: "Snippet-length paragraphs", detail: `${plural(snippetParas.length, "paragraph")} are 25–60 words — featured-snippet range.` }
      : { id: "snippet-paragraphs", status: snippetParas.length ? "warn" : "fail", group: "Content", title: "Paragraphs miss the snippet range", detail: `${plural(snippetParas.length, "paragraph")} between 25 and 60 words out of ${paras.length}. Google's spoken answers average ~29 words; featured snippets 40–50.`, fix: "Break long paragraphs up. Lead each with a self-contained sentence that answers the heading." },
  );

  add(
    avgSentence === 0
      ? { id: "sentence-length", status: "info", group: "Content", title: "Sentence length", detail: "Not enough body text to measure." }
      : avgSentence <= 20
        ? { id: "sentence-length", status: "pass", group: "Content", title: "Sentences are easy to read aloud", detail: `Average ${avgSentence} words per sentence across ${plural(sents.length, "sentence")}.` }
        : { id: "sentence-length", status: avgSentence > 28 ? "fail" : "warn", group: "Content", title: "Sentences are long", detail: `Average ${avgSentence} words per sentence. Spoken answers are picked from text that reads at roughly a 9th-grade level (under 20 words per sentence).`, fix: "Split sentences over 20 words. Prefer one idea per sentence and everyday words." },
  );

  add(
    words === 0
      ? { id: "conversational", status: "info", group: "Content", title: "Conversational tone", detail: "Not enough body text to measure." }
      : youCount / Math.max(1, words) >= 0.008
        ? { id: "conversational", status: "pass", group: "Content", title: "Conversational tone", detail: `“You/your” appears ${youCount} times in ${words.toLocaleString()} words — the page talks to the reader.` }
        : { id: "conversational", status: "warn", group: "Content", title: "Formal tone", detail: `“You/your” appears only ${youCount} times in ${words.toLocaleString()} words. Voice queries are conversational; matching text ranks better.`, fix: "Address the reader directly and mirror the words they'd say out loud (“How do I…”, “Can you…”)." },
  );

  add(
    orderedLists + tables > 0
      ? { id: "structured-content", status: "pass", group: "Content", title: "Steps or tables present", detail: `${plural(orderedLists, "numbered list")} and ${plural(tables, "table")}. Assistants read numbered steps well and use tables for comparisons.` }
      : { id: "structured-content", status: "info", group: "Content", title: "No numbered lists or tables", detail: "Process or comparison content is easier for assistants to read when it's an ordered list or a table." },
  );

  add(
    hasFaq
      ? { id: "faq-schema", status: "pass", group: "Structured data", title: "FAQPage schema present", detail: "Question/answer pairs are marked up, so assistants can pull them directly." }
      : questionHeads.length > 0
        ? { id: "faq-schema", status: "fail", group: "Structured data", title: "No FAQPage schema", detail: "The page asks and answers questions but doesn't mark them up. Structured Q&A is the most reliable way into voice answers.", fix: "Add a JSON-LD <script type=\"application/ld+json\"> with @type FAQPage listing each Question and its acceptedAnswer. Ask the assistant here to generate it from the page." }
        : { id: "faq-schema", status: "warn", group: "Structured data", title: "No FAQPage schema", detail: "No FAQ markup found. Once you add question headings, mark them up as FAQPage.", fix: "Add FAQPage JSON-LD with 3–8 real customer questions." },
  );

  add(
    hasHowTo
      ? { id: "howto-schema", status: "pass", group: "Structured data", title: "HowTo schema present", detail: "Step content is marked up for assistants." }
      : orderedLists > 0
        ? { id: "howto-schema", status: "warn", group: "Structured data", title: "Steps without HowTo schema", detail: `${plural(orderedLists, "numbered list")} but no HowTo structured data.`, fix: "If a list is a procedure, add HowTo JSON-LD with a HowToStep per item." }
        : { id: "howto-schema", status: "info", group: "Structured data", title: "HowTo schema", detail: "No step-by-step content detected; HowTo markup isn't needed." },
  );

  add(
    hasSpeakable
      ? { id: "speakable", status: "pass", group: "Structured data", title: "Speakable markup present", detail: "Sections are flagged for text-to-speech (used by Google Assistant for news/articles)." }
      : { id: "speakable", status: "info", group: "Structured data", title: "No speakable markup", detail: "Optional: Article/WebPage schema can include a speakable property pointing at the summary via CSS selector. Mainly used for news publishers." },
  );

  add(
    hasLocal
      ? { id: "local-schema", status: "pass", group: "Local", title: "Business schema present", detail: `Found ${types.filter((t) => /LocalBusiness|Organization|Store|Restaurant|Dentist|Attorney|Hotel|Physician|Plumber|Electrician/i.test(t)).join(", ")}. “Near me” queries rely on it.` }
      : phone
        ? { id: "local-schema", status: "warn", group: "Local", title: "Contact details without business schema", detail: "A phone number is on the page but there's no LocalBusiness/Organization JSON-LD to tie name, address, phone and hours together.", fix: "Add LocalBusiness (or the specific subtype) JSON-LD with name, address, telephone, openingHoursSpecification and geo." }
        : { id: "local-schema", status: "info", group: "Local", title: "No local business signals", detail: "If you serve a physical area, add LocalBusiness schema and a clickable phone number — most voice searches are local." },
  );

  add(
    url.protocol === "https:"
      ? { id: "https", status: "pass", group: "Technical", title: "Served over HTTPS", detail: "Voice results are drawn almost exclusively from secure pages." }
      : { id: "https", status: "fail", group: "Technical", title: "Not HTTPS", detail: "The page loads over plain http. Assistants effectively never read answers from insecure pages.", fix: "Install a certificate and 301 http → https." },
  );

  const load = input.loadTimeMs ?? null;
  if (load !== null) {
    add(
      load <= 1500
        ? { id: "speed", status: "pass", group: "Technical", title: "Fast server response", detail: `HTML arrived in ${load} ms. Pages in voice results load noticeably faster than average.` }
        : { id: "speed", status: load > 3000 ? "fail" : "warn", group: "Technical", title: "Slow to deliver HTML", detail: `HTML took ${load} ms to arrive (time to first byte ${input.ttfbMs ?? "?"} ms). Google's voice answers come from pages that load in about half the time of the average result.`, fix: "Cache HTML at the edge or CDN, cut server work, and run the Page Speed Audit tool for specifics." },
    );
  }

  add(
    viewport
      ? { id: "mobile", status: "pass", group: "Technical", title: "Mobile viewport set", detail: "Most voice searches happen on phones; the page declares a responsive viewport." }
      : { id: "mobile", status: "fail", group: "Technical", title: "No mobile viewport", detail: "Without a viewport meta tag the page is treated as desktop-only.", fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to <head>.' },
  );

  add(
    !title
      ? { id: "title", status: "fail", group: "Technical", title: "Missing <title>", detail: "Assistants often read the title when introducing a result.", fix: "Add a descriptive title under 60 characters." }
      : descriptionText.length >= 50
        ? { id: "title", status: "pass", group: "Technical", title: "Title and description present", detail: `“${title}” · description ${descriptionText.length} characters.` }
        : { id: "title", status: "warn", group: "Technical", title: "Meta description missing or thin", detail: descriptionText ? `Description is ${descriptionText.length} characters.` : "No meta description. It's frequently what gets read aloud as the summary.", fix: "Write a 120–155 character description that answers the page's main question in one sentence." },
  );

  add(
    h1 && h1.text.split(/\s+/).length >= 4
      ? { id: "h1", status: "pass", group: "Technical", title: "Descriptive H1", detail: `“${h1.text}”` }
      : h1
        ? { id: "h1", status: "warn", group: "Technical", title: "H1 is very short", detail: `“${h1.text}” — spoken queries are long-tail (7+ words); a fuller H1 helps match them.`, fix: "Expand the H1 to the full natural-language question or statement the page answers." }
        : { id: "h1", status: "fail", group: "Technical", title: "No H1", detail: "The page has no H1 to anchor its topic.", fix: "Add one H1 stating the question or topic in plain words." },
  );

  add(
    lang
      ? { id: "lang", status: "pass", group: "Technical", title: "Language declared", detail: `<html lang="${lang}"> — assistants pick the right voice and locale.` }
      : { id: "lang", status: "warn", group: "Technical", title: "No lang attribute", detail: "Without <html lang> assistants guess the language from the text.", fix: 'Add lang="en" (or the page\'s language) to the <html> tag.' },
  );

  return finalizeChecklist(
    {
      kind: "voice-search",
      requestedUrl: input.requestedUrl,
      finalUrl,
      status: input.status,
      title,
      facts: {
        words,
        headings: heads.length,
        questionHeadings: questionHeads.length,
        answeredQuestions: answered,
        snippetParagraphs: snippetParas.length,
        avgSentenceWords: avgSentence,
        jsonLdTypes: types.join(", ") || null,
        loadTimeMs: load,
        lang,
      },
    },
    checks,
  );
}

export async function analyzeVoiceSearch(rawUrl: string): Promise<ChecklistReport> {
  const raw = await fetchHtml(rawUrl);
  return analyzeVoiceSearchHtml(raw);
}
