import { TRADES, TRADE_LABELS, type Trade } from "@/lib/service-business/profile";

export type NcCity = { slug: string; name: string; region: string };

export const NC_CITIES: readonly NcCity[] = [
  { slug: "greensboro", name: "Greensboro", region: "Triad" },
  { slug: "winston-salem", name: "Winston-Salem", region: "Triad" },
  { slug: "high-point", name: "High Point", region: "Triad" },
  { slug: "raleigh", name: "Raleigh", region: "Triangle" },
  { slug: "durham", name: "Durham", region: "Triangle" },
  { slug: "cary", name: "Cary", region: "Triangle" },
  { slug: "charlotte", name: "Charlotte", region: "Charlotte" },
  { slug: "wilmington", name: "Wilmington", region: "Coast" },
  { slug: "fayetteville", name: "Fayetteville", region: "Sandhills" },
  { slug: "asheville", name: "Asheville", region: "Mountains" },
] as const;

export const isNcCitySlug = (value: string): boolean => NC_CITIES.some((city) => city.slug === value);

export function getCity(slug: string): NcCity | null {
  return NC_CITIES.find((city) => city.slug === slug) ?? null;
}

export function citySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Map a free-text service-area string (from a profile) onto a known NC city slug when we can. */
export function matchCitySlug(area: string): string | null {
  const slug = citySlug(area);
  if (isNcCitySlug(slug)) return slug;
  const lower = area.toLowerCase();
  if (lower.includes("triad") || lower.includes("guilford")) return "greensboro";
  if (lower.includes("triangle") || lower.includes("wake")) return "raleigh";
  return null;
}

export { TRADES, TRADE_LABELS, type Trade };

export function isTradeSlug(value: string): value is Trade {
  return (TRADES as readonly string[]).includes(value);
}
