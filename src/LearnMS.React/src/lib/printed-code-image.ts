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

export type PrintedLine = {
  x: number;
  y: number;
  w: number;
  h: number;
};

/**
 * The id is the short line printed under the bars. A barcode is a tall run of
 * rows with the same edges. A finger covering the bars is a solid dark blob,
 * so the digit line is the lowest short text run left in the frame.
 * `data` must already be contrast-stretched grayscale in the RGB channels.
 */
export function locatePrintedNumber(
  data: Uint8ClampedArray,
  width: number,
  height: number
): PrintedLine | null {
  if (width < 20 || height < 20) return null;

  const x0 = Math.round(width * 0.12);
  const x1 = Math.round(width * 0.88);
  const span = Math.max(1, x1 - x0);
  const flips = new Int16Array(height);
  const ink = new Float32Array(height);

  for (let y = 0; y < height; y += 1) {
    let edges = 0;
    let dark = 0;
    let prev = 0;
    const row = y * width * 4;
    for (let x = x0; x < x1; x += 1) {
      const bit = data[row + x * 4] < 165 ? 1 : 0;
      if (bit) dark += 1;
      if (x > x0 && bit !== prev) edges += 1;
      prev = bit;
    }
    flips[y] = edges;
    ink[y] = dark / span;
  }

  const barMin = Math.max(16, Math.round(span * 0.045));
  const isBar = (y: number) => flips[y] >= barMin && ink[y] >= 0.2 && ink[y] <= 0.8;
  let barcode: { y: number; end: number; h: number } | null = null;
  let start = -1;
  let holes = 0;
  for (let y = 0; y <= height; y += 1) {
    if (y < height && isBar(y)) {
      if (start < 0) start = y;
      holes = 0;
    } else if (start >= 0 && holes < 1 && y < height) {
      holes += 1;
    } else if (start >= 0) {
      const end = y - 1 - holes;
      const bandH = end - start + 1;
      if (bandH >= 18 && (!barcode || bandH > barcode.h)) {
        barcode = { y: start, end, h: bandH };
      }
      start = -1;
      holes = 0;
    }
  }

  const textMax = Math.max(22, Math.round(span * 0.11));
  const textLimit = Math.max(34, Math.round(height * 0.14));
  const isText = (y: number) =>
    flips[y] >= 6 && flips[y] <= textMax && ink[y] >= 0.05 && ink[y] <= 0.62;

  const textRuns = (from: number, to: number) => {
    const runs: { y: number; end: number; h: number }[] = [];
    let runStart = -1;
    const stop = Math.min(height, to);
    for (let y = Math.max(0, from); y <= stop; y += 1) {
      if (y < stop && isText(y)) {
        if (runStart < 0) runStart = y;
      } else if (runStart >= 0) {
        const end = y - 1;
        const bandH = end - runStart + 1;
        if (bandH >= 5 && bandH <= textLimit) runs.push({ y: runStart, end, h: bandH });
        runStart = -1;
      }
    }
    return runs;
  };

  let line: { y: number; end: number; h: number } | undefined;
  let barcodeEnd = -1;
  if (barcode) {
    barcodeEnd = barcode.end;
    const windowEnd = Math.min(
      height,
      barcode.end + 2 + Math.max(16, Math.round(barcode.h * 0.45))
    );
    line = textRuns(barcode.end + 1, windowEnd)[0];
  } else {
    const runs = textRuns(Math.round(height * 0.32), height);
    line = runs[runs.length - 1];
  }
  if (!line) return null;

  const aboveOk = (row: number) =>
    row > barcodeEnd && row >= 0 && ink[row] < 0.45 && flips[row] < 8;
  const belowOk = (row: number) => row < height && ink[row] < 0.45 && flips[row] < 8;
  let top = line.y;
  if (aboveOk(top - 1)) top -= 1;
  if (aboveOk(top - 1)) top -= 1;
  let bottom = line.end;
  if (belowOk(bottom + 1)) bottom += 1;
  if (belowOk(bottom + 1)) bottom += 1;

  // The id sits in the middle of the brackets. A full-width crop also takes in
  // the dark card corners, which Tesseract reads as extra characters.
  const w = Math.round(width * 0.7);
  return { x: Math.round((width - w) / 2), y: top, w, h: bottom - top + 1 };
}
