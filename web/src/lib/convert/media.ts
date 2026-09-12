/**
 * Browser-only media conversions for the File Converter: images through a
 * canvas re-encode, and audio extracted from audio/video files through
 * the Web Audio decoder and written out as WAV. Nothing leaves the device.
 */

export const IMAGE_TARGETS = [
  { id: "image/png", label: "PNG", ext: "png", lossy: false },
  { id: "image/jpeg", label: "JPG", ext: "jpg", lossy: true },
  { id: "image/webp", label: "WebP", ext: "webp", lossy: true },
] as const;

export type ImageTarget = (typeof IMAGE_TARGETS)[number]["id"];

export async function convertImage(file: Blob, options: { type: ImageTarget; quality?: number; maxWidth?: number }): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = options.maxWidth && bitmap.width > options.maxWidth ? options.maxWidth / bitmap.width : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't available in this browser.");
  if (options.type === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, options.type, options.quality ?? 0.9));
  if (!blob) throw new Error("The browser couldn't encode that format.");
  return { blob, width, height };
}

/** Interleaved 16-bit PCM WAV from decoded audio. */
export function encodeWav(buffer: AudioBuffer): Blob {
  const channels = Math.min(2, buffer.numberOfChannels);
  const frames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataSize = frames * blockAlign;
  const out = new ArrayBuffer(44 + dataSize);
  const view = new DataView(out);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, dataSize, true);
  const data = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < frames; i += 1) {
    for (let c = 0; c < channels; c += 1) {
      const sample = Math.max(-1, Math.min(1, data[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([out], { type: "audio/wav" });
}

/** Decode any audio or video the browser can play and return its soundtrack as WAV. */
export async function extractAudioToWav(file: Blob): Promise<{ blob: Blob; seconds: number; sampleRate: number; channels: number }> {
  const bytes = await file.arrayBuffer();
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  try {
    const decoded = await ctx.decodeAudioData(bytes);
    return { blob: encodeWav(decoded), seconds: decoded.duration, sampleRate: decoded.sampleRate, channels: Math.min(2, decoded.numberOfChannels) };
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
