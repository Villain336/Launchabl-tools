// Deterministic, client-side name/palette generator.
//
// Production notes: swap `generateNames` for an LLM-backed call (via a server
// route, same pattern as /api/copywriter) once quality needs outpace what a
// combinatorial generator can do — keep the output shape stable so the UI
// doesn't need to change.

const prefixes = ["Nova", "Bright", "Arc", "Vivid", "North", "Lumen", "Crate", "Forge", "Bloom", "Pulse"];
const suffixes = ["ify", "Labs", "Co", "Studio", "Works", "Hive", "ly", "Base", "Craft", "House"];

const palettes = [
  ["#4338CA", "#818CF8", "#EEF2FF"],
  ["#0F766E", "#5EEAD4", "#ECFDF5"],
  ["#B45309", "#FCD34D", "#FFFBEB"],
  ["#BE123C", "#FB7185", "#FFF1F2"],
  ["#1D4ED8", "#93C5FD", "#EFF6FF"],
];

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export type NameSuggestion = {
  name: string;
  tagline: string;
  palette: string[];
};

export function generateNames(seed: string, count = 6): NameSuggestion[] {
  const cleanSeed = seed.trim() || "Brand";
  const suggestions: NameSuggestion[] = [];

  for (let i = 0; i < count; i++) {
    const hash = hashString(`${cleanSeed}-${i}`);
    const prefix = prefixes[hash % prefixes.length];
    const suffix = suffixes[(hash >> 3) % suffixes.length];
    const useSeed = i % 2 === 0;
    const name = useSeed
      ? `${cleanSeed.replace(/\s+/g, "")}${suffix}`
      : `${prefix}${cleanSeed.replace(/\s+/g, "")}`;

    suggestions.push({
      name,
      tagline: taglineFor(cleanSeed, hash),
      palette: palettes[hash % palettes.length],
    });
  }

  return suggestions;
}

function taglineFor(seed: string, hash: number) {
  const templates = [
    `${seed}, done right the first time.`,
    `Everything ${seed} needs to launch, in one place.`,
    `${seed} — built to grow with you.`,
    `The smarter way to run ${seed}.`,
    `${seed}, without the guesswork.`,
  ];
  return templates[hash % templates.length];
}
