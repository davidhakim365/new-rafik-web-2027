import { extractPrintedCode } from "@/lib/printed-code";

type OcrPage = {
  text: string;
  confidence: number;
  lines?: { text: string; confidence: number }[];
  words?: { text: string; confidence: number }[];
};

type OcrWorker = {
  setParameters: (params: Record<string, string>) => Promise<unknown>;
  recognize: (image: HTMLCanvasElement) => Promise<{ data: OcrPage }>;
  terminate: () => Promise<unknown>;
};

const MIN_CONFIDENCE = 42;

function codeFromPage(page: OcrPage): string | null {
  const lines = [...(page.lines ?? [])].sort((a, b) => b.confidence - a.confidence);
  for (const line of lines) {
    if (line.confidence < MIN_CONFIDENCE) continue;
    const code = extractPrintedCode(line.text);
    if (code) return code;
  }

  const words = [...(page.words ?? [])].sort((a, b) => b.confidence - a.confidence);
  for (const word of words) {
    if (word.confidence < MIN_CONFIDENCE) continue;
    const code = extractPrintedCode(word.text);
    if (code) return code;
  }

  if (page.confidence >= MIN_CONFIDENCE) return extractPrintedCode(page.text);
  return null;
}

function grayscale(image: ImageData) {
  const pixels = image.data;
  for (let i = 0; i < pixels.length; i += 4) {
    let gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    gray = Math.max(0, Math.min(255, (gray - 128) * 1.7 + 128));
    pixels[i] = pixels[i + 1] = pixels[i + 2] = gray;
  }
}

/** The printed id sits under the bars. Find that text row when the bars are visible. */
function findTextBand(image: ImageData): { y: number; h: number } | null {
  const { width, height, data } = image;
  const flips = new Array<number>(height).fill(0);
  const darkRatio = new Array<number>(height).fill(0);
  const flipBar = Math.max(18, width * 0.12);

  for (let y = 0; y < height; y++) {
    let flip = 0;
    let dark = 0;
    let prev = data[y * width * 4] < 140 ? 1 : 0;
    if (prev) dark += 1;
    for (let x = 1; x < width; x++) {
      const bit = data[(y * width + x) * 4] < 140 ? 1 : 0;
      if (bit) dark += 1;
      if (bit !== prev) flip += 1;
      prev = bit;
    }
    flips[y] = flip;
    darkRatio[y] = dark / width;
  }

  let lastBarcode = -1;
  let barcodeRows = 0;
  for (let y = 0; y < height; y++) {
    if (flips[y] >= flipBar && darkRatio[y] > 0.15 && darkRatio[y] < 0.9) {
      lastBarcode = y;
      barcodeRows += 1;
    }
  }
  if (barcodeRows < 8 || lastBarcode < 0 || lastBarcode > height - 10) return null;

  let start = -1;
  let end = -1;
  for (let y = lastBarcode + 1; y < height; y++) {
    const isText =
      darkRatio[y] > 0.015 && darkRatio[y] < 0.45 && flips[y] < flipBar;
    if (isText) {
      if (start < 0) start = y;
      end = y;
    } else if (start >= 0 && y > end + 4) {
      break;
    }
  }
  if (start < 0 || end - start < 6) return null;

  const pad = 6;
  const y = Math.max(0, start - pad);
  return { y, h: Math.min(height - y, end - start + 1 + pad * 2) };
}

function captureReadRegion(
  video: HTMLVideoElement,
  source: HTMLCanvasElement,
  output: HTMLCanvasElement
): { canvas: HTMLCanvasElement; singleLine: boolean } | null {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return null;
  const frameWidth = video.videoWidth;
  const frameHeight = video.videoHeight;
  if (!frameWidth || !frameHeight) return null;

  const sx = Math.floor(frameWidth * 0.08);
  const sy = Math.floor(frameHeight * 0.22);
  const sw = Math.floor(frameWidth * 0.84);
  const sh = Math.floor(frameHeight * 0.56);
  const targetWidth = 640;
  const targetHeight = Math.max(1, Math.round(targetWidth * (sh / sw)));

  source.width = targetWidth;
  source.height = targetHeight;
  const sourceCtx = source.getContext("2d", { willReadFrequently: true });
  if (!sourceCtx) return null;
  sourceCtx.drawImage(video, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

  const image = sourceCtx.getImageData(0, 0, targetWidth, targetHeight);
  grayscale(image);
  sourceCtx.putImageData(image, 0, 0);

  const band = findTextBand(image);
  if (!band) return { canvas: source, singleLine: false };

  const scale = 2;
  output.width = targetWidth * scale;
  output.height = Math.max(32, band.h * scale);
  const outputCtx = output.getContext("2d");
  if (!outputCtx) return { canvas: source, singleLine: false };
  outputCtx.imageSmoothingEnabled = false;
  outputCtx.drawImage(
    source,
    0,
    band.y,
    targetWidth,
    band.h,
    0,
    0,
    output.width,
    output.height
  );
  return { canvas: output, singleLine: true };
}

/**
 * Reads the student code printed under a barcode when the bars themselves
 * will not scan. The same code must be read twice before it is reported.
 */
export function startPrintedCodeReader(
  video: HTMLVideoElement,
  onDetected: (code: string) => void,
  options?: { isPaused?: () => boolean }
): () => void {
  let stopped = false;
  let busy = false;
  let worker: OcrWorker | null = null;
  let pageMode = "";
  let lastCode = "";
  let hits = 0;
  let held = "";
  let misses = 0;
  const source = document.createElement("canvas");
  const output = document.createElement("canvas");

  const ready = import("tesseract.js")
    .then(async (tesseract) => {
      if (stopped) return null;
      const created = (await tesseract.createWorker("eng", 1, {
        logger: () => undefined,
      })) as OcrWorker;
      if (stopped) {
        await created.terminate();
        return null;
      }
      await created.setParameters({
        tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-",
        user_defined_dpi: "300",
      });
      worker = created;
      return created;
    })
    .catch(() => null);

  const tick = async () => {
    if (stopped || busy) return;
    busy = true;
    try {
      if (options?.isPaused?.()) {
        lastCode = "";
        hits = 0;
        return;
      }
      const current = worker ?? (await ready);
      if (!current || stopped) return;
      const region = captureReadRegion(video, source, output);
      if (!region || stopped) return;

      const mode = region.singleLine ? "7" : "11";
      if (mode !== pageMode) {
        await current.setParameters({ tessedit_pageseg_mode: mode });
        pageMode = mode;
      }
      const result = await current.recognize(region.canvas);
      if (stopped) return;

      const code = codeFromPage(result.data);
      if (!code) {
        if (held) {
          misses += 1;
          if (misses >= 2) {
            held = "";
            misses = 0;
            lastCode = "";
            hits = 0;
          }
        }
        return;
      }

      misses = 0;
      if (code === held) return;
      if (code === lastCode) hits += 1;
      else {
        lastCode = code;
        hits = 1;
      }
      if (hits >= 2) {
        held = code;
        hits = 0;
        onDetected(code);
      }
    } catch {
      // A failed read leaves barcode scanning running.
    } finally {
      busy = false;
    }
  };

  const timer = window.setInterval(() => {
    void tick();
  }, 1000);

  return () => {
    stopped = true;
    window.clearInterval(timer);
    const active = worker;
    worker = null;
    if (active) void active.terminate().catch(() => undefined);
    else void ready.then((created) => created?.terminate().catch(() => undefined));
  };
}
