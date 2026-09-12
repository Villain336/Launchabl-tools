/**
 * Generated images (image generator, social card backdrops) carry their
 * pixels inline in the tool output. Anywhere a conversation has to fit a
 * byte budget the pixels go first and the artifact shows an "ask again"
 * placeholder with the prompt intact.
 */
export function stripGeneratedPixels(output: Record<string, unknown>): Record<string, unknown> {
  if (Array.isArray(output.images) && output.images.some((i) => i && typeof i === "object" && "dataUrl" in i)) {
    return { ...output, images: [], expired: true };
  }
  if (output.backgroundImage && typeof output.backgroundImage === "object") {
    return { ...output, backgroundImage: null, expired: true };
  }
  return output;
}

/** True when the output still carries inline pixels that `stripGeneratedPixels` would remove. */
export function hasGeneratedPixels(output: unknown): boolean {
  if (!output || typeof output !== "object") return false;
  return stripGeneratedPixels(output as Record<string, unknown>) !== output;
}
