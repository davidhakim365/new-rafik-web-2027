/**
 * Grayscale contrast stretch for the Cambria digits printed under a barcode.
 * A hard black/white cut removes the thin serifs on 1, 4, 5, and 7.
 * Stretching the paper-to-ink range keeps those gray edges.
 */
export function stretchContrast(data: Uint8ClampedArray) {
  const count = data.length / 4;
  const gray = new Uint8Array(count);
  const hist = new Uint32Array(256);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const value = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) | 0;
    gray[p] = value;
    hist[value] += 1;
  }

  const lowTarget = Math.max(1, Math.floor(count * 0.02));
  const highTarget = Math.max(1, Math.floor(count * 0.02));
  let seen = 0;
  let low = 0;
  for (let value = 0; value < 256; value += 1) {
    seen += hist[value];
    if (seen >= lowTarget) {
      low = value;
      break;
    }
  }
  seen = 0;
  let high = 255;
  for (let value = 255; value >= 0; value -= 1) {
    seen += hist[value];
    if (seen >= highTarget) {
      high = value;
      break;
    }
  }
  if (high < low + 24) high = Math.min(255, low + 24);

  const scale = 255 / (high - low);
  for (let p = 0, i = 0; p < count; p += 1, i += 4) {
    let value = (gray[p] - low) * scale;
    if (value < 0) value = 0;
    else if (value > 255) value = 255;
    data[i] = data[i + 1] = data[i + 2] = value;
  }
}

/** A row of Cambria digits is a thin ink band. A finger is a solid blob. */
export function findDigitBand(
  data: Uint8ClampedArray,
  width: number,
  height: number
): { y: number; h: number } | null {
  let bestY = -1;
  let bestH = 0;
  let bestScore = 0;
  let start = -1;
  let end = -1;
  let score = 0;

  const close = () => {
    const bandH = end - start + 1;
    if (start >= 0 && bandH >= 8 && score > bestScore) {
      bestScore = score;
      bestY = start;
      bestH = bandH;
    }
    start = -1;
    end = -1;
    score = 0;
  };

  for (let y = 0; y < height; y += 1) {
    let ink = 0;
    let flips = 0;
    let prev = 0;
    const row = y * width * 4;
    for (let x = 0; x < width; x += 1) {
      const bit = data[row + x * 4] < 190 ? 1 : 0;
      if (bit) ink += 1;
      if (x > 0 && bit !== prev) flips += 1;
      prev = bit;
    }
    const ratio = ink / width;
    const isText = ratio > 0.01 && ratio < 0.42 && flips >= 8;
    if (!isText) {
      if (start >= 0 && y > end + 4) close();
      continue;
    }
    if (start < 0) start = y;
    end = y;
    score += flips;
  }
  close();
  if (bestY < 0) return null;

  const pad = 16;
  const y = Math.max(0, bestY - pad);
  return { y, h: Math.min(height - y, bestH + pad * 2) };
}
