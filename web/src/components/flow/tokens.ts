export const FLOW_HUES = {
  trigger: "#9a5cff",
  process: "#FF6600",
  condition: "#f09a2f",
  deliver: "#16a34a",
} as const;

export type FlowHue = (typeof FLOW_HUES)[keyof typeof FLOW_HUES];

export const mix = (hue: string, pct: number, base = "var(--card)") =>
  `color-mix(in srgb, ${hue} ${pct}%, ${base})`;
