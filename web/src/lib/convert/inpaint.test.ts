import { describe, expect, it } from "vitest";
import { blurRegion, inpaintSmooth, maskFromRects, pixelateRegion } from "./inpaint";

function gradient(width: number, height: number) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      data[i] = Math.round((x / (width - 1)) * 255);
      data[i + 1] = 100;
      data[i + 2] = Math.round((y / (height - 1)) * 255);
      data[i + 3] = 255;
    }
  }
  return data;
}

describe("inpaint", () => {
  it("builds a clipped mask from rectangles", () => {
    const mask = maskFromRects(10, 10, [{ x: 8, y: 8, w: 5, h: 5 }]);
    expect(mask.reduce<number>((n, m) => n + m, 0)).toBe(4);
    expect(mask[9 * 10 + 9]).toBe(1);
    expect(mask[0]).toBe(0);
  });

  it("smooth fill reconstructs a linear gradient under a white stamp", () => {
    const w = 64;
    const h = 48;
    const clean = gradient(w, h);
    const stamped = Uint8ClampedArray.from(clean);
    const rect = { x: 20, y: 14, w: 24, h: 20 };
    const mask = maskFromRects(w, h, [rect]);
    for (let i = 0; i < mask.length; i += 1) if (mask[i]) stamped.set([255, 255, 255, 255], i * 4);

    inpaintSmooth(stamped, w, h, mask, 60);

    let maxErr = 0;
    for (let i = 0; i < mask.length; i += 1) {
      if (!mask[i]) continue;
      for (let c = 0; c < 3; c += 1) maxErr = Math.max(maxErr, Math.abs(stamped[i * 4 + c] - clean[i * 4 + c]));
    }
    // A harmonic fill of a linear gradient is exact up to rounding/convergence.
    expect(maxErr).toBeLessThan(6);
    // unmasked pixels untouched
    expect(stamped[0]).toBe(clean[0]);
  });

  it("blur and pixelate only touch masked pixels", () => {
    const w = 20;
    const h = 20;
    const base = gradient(w, h);
    const mask = maskFromRects(w, h, [{ x: 5, y: 5, w: 6, h: 6 }]);
    const blurred = blurRegion(Uint8ClampedArray.from(base), w, h, mask, 2);
    const pixelated = pixelateRegion(Uint8ClampedArray.from(base), w, h, mask, 4);
    for (let i = 0; i < mask.length; i += 1) {
      if (mask[i]) continue;
      expect(blurred[i * 4]).toBe(base[i * 4]);
      expect(pixelated[i * 4]).toBe(base[i * 4]);
    }
    // pixelate flattens a 4x4 cell to one colour
    const cell = 6 * w + 6;
    expect(pixelated[cell * 4]).toBe(pixelated[(cell + 1) * 4]);
  });
});
