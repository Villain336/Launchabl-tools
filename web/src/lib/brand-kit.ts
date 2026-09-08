import { hashString, palettes } from "@/lib/brand-name-generator";

const fontPairings = [
  { heading: "Poppins", body: "Inter" },
  { heading: "Playfair Display", body: "Source Sans Pro" },
  { heading: "Space Grotesk", body: "Inter" },
  { heading: "DM Serif Display", body: "DM Sans" },
  { heading: "Sora", body: "Rubik" },
];

export function paletteForSeed(seed: string) {
  return palettes[hashString(seed) % palettes.length];
}

export function fontPairingForSeed(seed: string) {
  return fontPairings[hashString(seed + "font") % fontPairings.length];
}

function initialsFor(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function monogramSvg(name: string, size = 512): string {
  const [dark, mid] = paletteForSeed(name);
  const initials = initialsFor(name);
  const fontSize = Math.round(size * 0.4);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${dark}" />
      <stop offset="100%" stop-color="${mid}" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#g)" />
  <text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-weight="700" font-size="${fontSize}" fill="#ffffff">${initials}</text>
</svg>`;
}

export function faviconSvg(name: string): string {
  return monogramSvg(name, 64);
}
