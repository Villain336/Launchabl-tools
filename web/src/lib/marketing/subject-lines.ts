/**
 * Deterministic subject-line scoring: the checks an email deliverability lead
 * runs before a send, so the model can propose alternatives and the user
 * gets a number that doesn't change between runs.
 */

export type SubjectFlag = { id: string; severity: "high" | "medium" | "low"; message: string };

export type SubjectScore = {
  line: string;
  previewText: string | null;
  score: number;
  length: number;
  words: number;
  /** Characters visible on a typical mobile client (~41). */
  mobileTruncated: boolean;
  previewLength: number | null;
  flags: SubjectFlag[];
  /** Human labels for what this line leans on, e.g. "question", "number", "personalised". */
  traits: string[];
};

export const MOBILE_VISIBLE = 41;
export const IDEAL_MIN = 30;
export const IDEAL_MAX = 50;

/** Terms filters and users have learned to distrust. Matched as whole words/phrases, case-insensitive. */
const SPAM_TERMS = [
  "free",
  "guarantee",
  "guaranteed",
  "act now",
  "winner",
  "you have been selected",
  "100%",
  "click here",
  "no obligation",
  "risk-free",
  "risk free",
  "urgent",
  "limited time",
  "buy now",
  "cash",
  "credit",
  "earn",
  "income",
  "miracle",
  "dear friend",
  "congratulations",
  "double your",
  "make money",
  "no cost",
  "order now",
  "once in a lifetime",
  "this isn't spam",
  "unsubscribe",
  "winning",
  "prize",
  "lowest price",
  "cheap",
  "million",
  "billion",
  "viagra",
  "casino",
  "lottery",
];

const GENERIC_TERMS = ["newsletter", "update", "monthly update", "weekly update", "news", "hello", "hi there", "checking in", "following up", "quick question", "touching base"];

const EMOJI_RE = /\p{Extended_Pictographic}/gu;
const TOKEN_RE = /\{\{?\s*[\w.]+\s*\}?\}|\[[^\]]{2,40}\]|%[A-Z_]+%|\*\|[A-Z_]+\|\*/g;

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countMatches(text: string, terms: string[]): string[] {
  const lower = text.toLowerCase();
  return terms.filter((term) => new RegExp(`(^|[^a-z0-9])${escapeRe(term)}([^a-z0-9]|$)`, "i").test(lower));
}

export function scoreSubjectLine(rawLine: string, rawPreview?: string | null): SubjectScore {
  const line = rawLine.replace(/\s+/g, " ").trim();
  const previewText = rawPreview?.replace(/\s+/g, " ").trim() || null;
  const flags: SubjectFlag[] = [];
  const traits: string[] = [];
  let score = 100;

  const length = [...line].length;
  const wordsList = line.split(" ").filter(Boolean);
  const words = wordsList.length;

  if (length === 0) {
    return { line, previewText, score: 0, length, words, mobileTruncated: false, previewLength: previewText ? previewText.length : null, flags: [{ id: "empty", severity: "high", message: "The subject line is empty." }], traits };
  }

  /* Length */
  if (length < 15) {
    score -= 18;
    flags.push({ id: "too-short", severity: "medium", message: `Only ${length} characters — too vague to earn the open. Aim for ${IDEAL_MIN}–${IDEAL_MAX}.` });
  } else if (length < IDEAL_MIN) {
    score -= 6;
    flags.push({ id: "short", severity: "low", message: `${length} characters is a little short; ${IDEAL_MIN}–${IDEAL_MAX} gives room for a specific promise.` });
  } else if (length > 70) {
    score -= 18;
    flags.push({ id: "too-long", severity: "high", message: `${length} characters — most of it is cut off on every client. Keep it under ${IDEAL_MAX}.` });
  } else if (length > IDEAL_MAX) {
    score -= 8;
    flags.push({ id: "long", severity: "medium", message: `${length} characters — the end is clipped on mobile (about ${MOBILE_VISIBLE} visible). Put the key words first or trim.` });
  }
  const mobileTruncated = length > MOBILE_VISIBLE;
  if (words > 9) {
    score -= 5;
    flags.push({ id: "wordy", severity: "low", message: `${words} words — subject lines that scan in under a second are usually 4–9 words.` });
  }

  /* Shouting and punctuation */
  const capsWords = wordsList.filter((w) => w.length >= 3 && /^[A-Z0-9!?$%]+$/.test(w) && /[A-Z]/.test(w));
  if (capsWords.length >= 2 || (capsWords.length === 1 && words <= 3)) {
    score -= 15;
    flags.push({ id: "all-caps", severity: "high", message: `ALL-CAPS words (${capsWords.join(", ")}) read as shouting and are a classic spam-filter signal.` });
  } else if (capsWords.length === 1) {
    score -= 5;
    flags.push({ id: "caps-word", severity: "low", message: `"${capsWords[0]}" is in all caps — fine for an acronym, a risk for emphasis.` });
  }
  const exclaims = (line.match(/!/g) ?? []).length;
  if (exclaims >= 2) {
    score -= 12;
    flags.push({ id: "exclamation", severity: "high", message: `${exclaims} exclamation marks — one at most, and usually none.` });
  } else if (exclaims === 1) {
    score -= 3;
    flags.push({ id: "exclamation", severity: "low", message: "An exclamation mark rarely helps; specificity does." });
  }
  if (/[!?]{2,}|\.{4,}|[$]{2,}/.test(line)) {
    score -= 10;
    flags.push({ id: "punctuation-run", severity: "high", message: "Repeated punctuation (!!, ??, $$$) is one of the strongest spam signals there is." });
  }

  /* Emoji */
  const emoji = line.match(EMOJI_RE) ?? [];
  if (emoji.length > 1) {
    score -= 8;
    flags.push({ id: "emoji", severity: "medium", message: `${emoji.length} emoji — one is plenty, and only if your audience expects it.` });
  } else if (emoji.length === 1) {
    traits.push("emoji");
  }

  /* Spam vocabulary */
  const spam = countMatches(line, SPAM_TERMS);
  if (spam.length) {
    score -= Math.min(30, 12 * spam.length);
    flags.push({ id: "spam-words", severity: spam.length > 1 ? "high" : "medium", message: `Trigger words: ${spam.map((s) => `"${s}"`).join(", ")}. Filters and readers both discount them.` });
  }
  const money = line.match(/(^|\s)[$€£]\s?\d[\d,.]*|\d+\s?%/g) ?? [];
  if (money.length) {
    traits.push("offer");
    if (money.length > 1 || spam.length) {
      score -= 6;
      flags.push({ id: "money", severity: "low", message: "Prices and percentages together with promotional words push the line into the Promotions tab." });
    }
  }

  /* Fakes */
  if (/^(re|fw|fwd)\s*:/i.test(line)) {
    score -= 20;
    flags.push({ id: "fake-reply", severity: "high", message: "A fake RE:/FWD: gets opens once and then a spam complaint. Remove it." });
  }

  /* Generic */
  const generic = countMatches(line, GENERIC_TERMS);
  if (generic.length && !/\d/.test(line)) {
    score -= 14;
    flags.push({ id: "generic", severity: "medium", message: `"${generic[0]}" says what the email is, not why to open it. Lead with the specific thing inside.` });
  }

  /* Positive traits */
  if (TOKEN_RE.test(line)) {
    traits.push("personalised");
    TOKEN_RE.lastIndex = 0;
    if (!previewText) flags.push({ id: "token-fallback", severity: "low", message: "Personalisation token present — make sure the ESP has a fallback value so nobody gets \"Hi ,\"." });
  }
  if (/\d/.test(line) && !money.length) traits.push("number");
  if (/\?\s*$/.test(line)) traits.push("question");
  if (/\b(you|your)\b/i.test(line)) traits.push("second-person");
  if (/\b(how|why|what|when)\b/i.test(line)) traits.push("curiosity");
  if (words <= 6 && length >= IDEAL_MIN) traits.push("concise");

  /* Preview text */
  let previewLength: number | null = null;
  if (previewText) {
    previewLength = [...previewText].length;
    if (previewLength < 40) {
      score -= 4;
      flags.push({ id: "preview-short", severity: "low", message: `Preview text is ${previewLength} characters; clients show 40–90, and the rest is filled with whatever your email starts with ("View in browser…").` });
    } else if (previewLength > 110) {
      score -= 3;
      flags.push({ id: "preview-long", severity: "low", message: `Preview text is ${previewLength} characters; only about 90 are shown.` });
    }
    const a = line.toLowerCase().replace(/[^a-z0-9 ]/g, "");
    const b = previewText.toLowerCase().replace(/[^a-z0-9 ]/g, "");
    if (a && b && (b.startsWith(a) || a.startsWith(b) || a === b)) {
      score -= 8;
      flags.push({ id: "preview-duplicate", severity: "medium", message: "Preview text repeats the subject line — it should extend the promise, not echo it." });
    }
  } else {
    score -= 5;
    flags.push({ id: "preview-missing", severity: "medium", message: "No preview text — the inbox will show the first line of the email body instead." });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { line, previewText, score, length, words, mobileTruncated, previewLength, flags, traits };
}

export function scoreSubjectLines(lines: { line: string; previewText?: string | null }[]): SubjectScore[] {
  return lines.map((l) => scoreSubjectLine(l.line, l.previewText));
}
