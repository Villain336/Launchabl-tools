import { z } from "zod";

/**
 * QR design language.
 *
 * Shared by the model (which fills it from a natural-language prompt), the
 * artifact controls (which let people tweak it by hand), the renderer, and
 * the hosted `/api/qr` endpoint. Everything is serialisable so a design can
 * live in a URL.
 */

const hex = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use a hex colour like #FF6600")
  .describe("Hex colour");

export const moduleShapes = ["square", "rounded", "dots", "diamond", "leaf", "fluid"] as const;
export const eyeFrameShapes = ["square", "rounded", "circle", "leaf"] as const;
export const eyePupilShapes = ["square", "rounded", "circle", "leaf"] as const;
export const errorCorrectionLevels = ["L", "M", "Q", "H"] as const;

export const qrGradientSchema = z.object({
  type: z.enum(["linear", "radial"]),
  from: hex,
  to: hex,
  angle: z.number().min(0).max(360).default(45).describe("Linear gradient angle in degrees"),
});

export const qrLogoSchema = z.object({
  /** Fraction of the code's width the logo occupies. Above ~0.3 scanning suffers even at EC level H. */
  sizeRatio: z.number().min(0.12).max(0.3).default(0.22),
  /** Clear the modules behind the logo and paint the background colour there. */
  knockout: z.boolean().default(true),
  /** Rounded corners on the knockout area, as a fraction of the logo size. */
  radius: z.number().min(0).max(0.5).default(0.2),
});

export const qrLabelSchema = z.object({
  text: z.string().min(1).max(48).describe("Caption printed with the code, e.g. 'Scan for the menu'."),
  position: z.enum(["below", "above"]).default("below"),
  color: hex.optional().describe("Defaults to the foreground colour."),
  font: z.enum(["sans", "serif", "mono"]).default("sans"),
  weight: z.enum(["regular", "bold"]).default("bold"),
});

export type QrLabel = z.infer<typeof qrLabelSchema>;

export const qrStyleSchema = z.object({
  moduleShape: z.enum(moduleShapes).default("square"),
  eyeFrameShape: z.enum(eyeFrameShapes).default("square"),
  eyePupilShape: z.enum(eyePupilShapes).default("square"),
  foreground: hex.default("#111111"),
  background: hex.or(z.literal("transparent")).default("#ffffff"),
  /** Overrides the foreground for the three finder patterns. */
  eyeColor: hex.optional(),
  gradient: qrGradientSchema.optional(),
  /** Quiet zone in modules. The spec wants 4; 2 scans fine on screens and clean prints. */
  margin: z.number().int().min(0).max(8).default(2),
  errorCorrection: z.enum(errorCorrectionLevels).default("H"),
  /** Corner radius of the whole tile as a fraction of its size. */
  cornerRadius: z.number().min(0).max(0.5).default(0),
  logo: qrLogoSchema.optional(),
  /** Caption rendered in a band above or below the code, part of the exported image. */
  label: qrLabelSchema.optional(),
});

export type QrStyle = z.infer<typeof qrStyleSchema>;
export type QrStyleInput = z.input<typeof qrStyleSchema>;
export type QrGradient = z.infer<typeof qrGradientSchema>;

export const defaultQrStyle: QrStyle = qrStyleSchema.parse({});

export function normalizeQrStyle(input: unknown): QrStyle {
  const parsed = qrStyleSchema.safeParse(input ?? {});
  return parsed.success ? parsed.data : defaultQrStyle;
}

/** Design brief the model can fill in. Keeps the logo image itself out of the model's hands. */
export const qrDesignSchema = z.object({
  data: z.string().min(1).max(2_000).describe("The URL or text the code should open when scanned. Use https:// URLs."),
  style: qrStyleSchema.partial().describe("Visual style. Omit fields you don't want to change from defaults."),
  name: z.string().max(60).describe("Short name for this design, e.g. 'Sunset gradient dots'"),
  notes: z
    .string()
    .max(300)
    .optional()
    .describe("One sentence on the design choice or a scan-reliability caveat, shown under the preview."),
});

export type QrDesign = {
  data: string;
  style: QrStyle;
  name: string;
  notes?: string;
};

export function normalizeQrDesign(input: z.infer<typeof qrDesignSchema>): QrDesign {
  return {
    data: input.data,
    style: normalizeQrStyle(input.style),
    name: input.name,
    notes: input.notes,
  };
}

/* ── Contrast guard ─────────────────────────────────────────── */

function luminance(hexColor: string): number {
  const h = hexColor.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Scanner-facing risks in a style, phrased for the person designing it. */
export function styleWarnings(style: QrStyle): string[] {
  const warnings: string[] = [];
  const bg = style.background === "transparent" ? "#ffffff" : style.background;
  const fgs = style.gradient ? [style.gradient.from, style.gradient.to] : [style.foreground];
  const weakest = Math.min(...fgs.map((fg) => contrastRatio(fg, bg)));
  if (weakest < 2.5) {
    warnings.push("Low contrast between the code and its background — many phone cameras will struggle. Aim for at least 3:1.");
  }
  if (style.background === "transparent") {
    warnings.push("Transparent background: scanning depends on whatever sits behind the code. Keep it on a plain, light surface.");
  }
  if (style.logo && style.errorCorrection !== "H") {
    warnings.push("A logo covers data modules. Use error correction H so the code still scans with the centre hidden.");
  }
  if (style.logo && style.logo.sizeRatio > 0.26) {
    warnings.push("Logo is large. Above about a quarter of the width, even level H codes start failing on small prints.");
  }
  if (style.margin < 1) {
    warnings.push("No quiet zone. Scanners need blank space around the code — keep at least one module of margin.");
  }
  if (style.moduleShape === "dots" || style.moduleShape === "diamond") {
    warnings.push("Dotted and diamond modules reduce the effective ink area; print at 3 cm or larger.");
  }
  return warnings;
}
