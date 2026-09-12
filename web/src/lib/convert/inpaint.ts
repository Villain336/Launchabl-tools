/**
 * Pure pixel operations behind the Watermark Remover. Everything works on
 * RGBA byte buffers so it runs in the browser (canvas ImageData) and in
 * tests without a DOM.
 *
 * The "smooth fill" is a multi-scale diffusion inpaint: masked pixels are
 * repeatedly replaced with the average of their neighbours, so colour flows
 * in from the boundary. Solving coarse-to-fine makes it converge in a few
 * dozen sweeps even for large regions.
 */

export type Rect = { x: number; y: number; w: number; h: number };
export type Method = "smooth" | "blur" | "pixelate";

/** Build a 0/1 mask (1 = repaint) from rectangles clipped to the image. */
export function maskFromRects(width: number, height: number, rects: Rect[], feather = 0): Uint8Array {
  const mask = new Uint8Array(width * height);
  for (const r of rects) {
    const x0 = Math.max(0, Math.floor(r.x - feather));
    const y0 = Math.max(0, Math.floor(r.y - feather));
    const x1 = Math.min(width, Math.ceil(r.x + r.w + feather));
    const y1 = Math.min(height, Math.ceil(r.y + r.h + feather));
    for (let y = y0; y < y1; y += 1) mask.fill(1, y * width + x0, y * width + x1);
  }
  return mask;
}

function downsample(rgba: Float32Array, mask: Uint8Array, width: number, height: number) {
  const w = Math.max(1, Math.floor(width / 2));
  const h = Math.max(1, Math.floor(height / 2));
  const out = new Float32Array(w * h * 4);
  const outMask = new Uint8Array(w * h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let n = 0;
      let known = 0;
      const acc = [0, 0, 0, 0];
      for (let dy = 0; dy < 2; dy += 1) {
        for (let dx = 0; dx < 2; dx += 1) {
          const sx = Math.min(width - 1, x * 2 + dx);
          const sy = Math.min(height - 1, y * 2 + dy);
          const si = sy * width + sx;
          n += 1;
          if (mask[si]) continue;
          known += 1;
          for (let c = 0; c < 4; c += 1) acc[c] += rgba[si * 4 + c];
        }
      }
      const oi = y * w + x;
      if (known === 0) {
        outMask[oi] = 1;
        for (let c = 0; c < 4; c += 1) {
          let sum = 0;
          for (let dy = 0; dy < 2; dy += 1) for (let dx = 0; dx < 2; dx += 1) sum += rgba[(Math.min(height - 1, y * 2 + dy) * width + Math.min(width - 1, x * 2 + dx)) * 4 + c];
          out[oi * 4 + c] = sum / n;
        }
      } else {
        for (let c = 0; c < 4; c += 1) out[oi * 4 + c] = acc[c] / known;
      }
    }
  }
  return { rgba: out, mask: outMask, width: w, height: h };
}

/** Jacobi sweeps: each masked pixel becomes the mean of its 4 neighbours. */
function diffuse(rgba: Float32Array, mask: Uint8Array, width: number, height: number, iterations: number) {
  const idx: number[] = [];
  for (let i = 0; i < mask.length; i += 1) if (mask[i]) idx.push(i);
  if (idx.length === 0) return;
  const next = new Float32Array(idx.length * 4);
  for (let it = 0; it < iterations; it += 1) {
    for (let k = 0; k < idx.length; k += 1) {
      const i = idx[k];
      const x = i % width;
      const y = (i - x) / width;
      let n = 0;
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      const add = (j: number) => {
        r += rgba[j * 4];
        g += rgba[j * 4 + 1];
        b += rgba[j * 4 + 2];
        a += rgba[j * 4 + 3];
        n += 1;
      };
      if (x > 0) add(i - 1);
      if (x < width - 1) add(i + 1);
      if (y > 0) add(i - width);
      if (y < height - 1) add(i + width);
      next[k * 4] = r / n;
      next[k * 4 + 1] = g / n;
      next[k * 4 + 2] = b / n;
      next[k * 4 + 3] = a / n;
    }
    for (let k = 0; k < idx.length; k += 1) {
      const i = idx[k];
      rgba[i * 4] = next[k * 4];
      rgba[i * 4 + 1] = next[k * 4 + 1];
      rgba[i * 4 + 2] = next[k * 4 + 2];
      rgba[i * 4 + 3] = next[k * 4 + 3];
    }
  }
}

function solve(rgba: Float32Array, mask: Uint8Array, width: number, height: number, depth: number, iterations: number): void {
  const masked = mask.reduce<number>((n, m) => n + m, 0);
  if (masked === 0) return;
  if (depth > 0 && width > 8 && height > 8 && masked > 64) {
    const small = downsample(rgba, mask, width, height);
    solve(small.rgba, small.mask, small.width, small.height, depth - 1, iterations);
    // seed masked pixels from the coarse solution (nearest upsample)
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = y * width + x;
        if (!mask[i]) continue;
        const si = Math.min(small.height - 1, y >> 1) * small.width + Math.min(small.width - 1, x >> 1);
        for (let c = 0; c < 4; c += 1) rgba[i * 4 + c] = small.rgba[si * 4 + c];
      }
    }
  }
  diffuse(rgba, mask, width, height, iterations);
}

/** Smooth-fill inpaint. Mutates and returns `data` (RGBA bytes). */
export function inpaintSmooth(data: Uint8ClampedArray, width: number, height: number, mask: Uint8Array, iterations = 40): Uint8ClampedArray {
  const rgba = Float32Array.from(data);
  solve(rgba, mask, width, height, 8, iterations);
  for (let i = 0; i < mask.length; i += 1) {
    if (!mask[i]) continue;
    for (let c = 0; c < 4; c += 1) data[i * 4 + c] = Math.round(rgba[i * 4 + c]);
  }
  return data;
}

/** Box blur restricted to the mask, sampling from the original image. */
export function blurRegion(data: Uint8ClampedArray, width: number, height: number, mask: Uint8Array, radius = 6): Uint8ClampedArray {
  const src = Uint8ClampedArray.from(data);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      if (!mask[i]) continue;
      const acc = [0, 0, 0, 0];
      let n = 0;
      for (let dy = -radius; dy <= radius; dy += 1) {
        const sy = y + dy;
        if (sy < 0 || sy >= height) continue;
        for (let dx = -radius; dx <= radius; dx += 1) {
          const sx = x + dx;
          if (sx < 0 || sx >= width) continue;
          const si = (sy * width + sx) * 4;
          for (let c = 0; c < 4; c += 1) acc[c] += src[si + c];
          n += 1;
        }
      }
      for (let c = 0; c < 4; c += 1) data[i * 4 + c] = Math.round(acc[c] / n);
    }
  }
  return data;
}

/** Pixelate the masked area with `block`-sized cells. */
export function pixelateRegion(data: Uint8ClampedArray, width: number, height: number, mask: Uint8Array, block = 12): Uint8ClampedArray {
  const src = Uint8ClampedArray.from(data);
  for (let by = 0; by < height; by += block) {
    for (let bx = 0; bx < width; bx += block) {
      const acc = [0, 0, 0, 0];
      let n = 0;
      let hit = false;
      for (let y = by; y < Math.min(height, by + block); y += 1) {
        for (let x = bx; x < Math.min(width, bx + block); x += 1) {
          const i = y * width + x;
          if (mask[i]) hit = true;
          for (let c = 0; c < 4; c += 1) acc[c] += src[i * 4 + c];
          n += 1;
        }
      }
      if (!hit) continue;
      for (let y = by; y < Math.min(height, by + block); y += 1) {
        for (let x = bx; x < Math.min(width, bx + block); x += 1) {
          const i = y * width + x;
          if (!mask[i]) continue;
          for (let c = 0; c < 4; c += 1) data[i * 4 + c] = Math.round(acc[c] / n);
        }
      }
    }
  }
  return data;
}

export function applyMethod(method: Method, data: Uint8ClampedArray, width: number, height: number, mask: Uint8Array): Uint8ClampedArray {
  if (method === "blur") return blurRegion(data, width, height, mask);
  if (method === "pixelate") return pixelateRegion(data, width, height, mask);
  return inpaintSmooth(data, width, height, mask);
}
