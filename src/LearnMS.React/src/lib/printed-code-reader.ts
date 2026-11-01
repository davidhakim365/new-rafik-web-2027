import { extractPrintedCode } from "@/lib/printed-code";

type OcrPage = {
  text: string;
  confidence: number;
};

type OcrWorker = {
  setParameters: (params: Record<string, string>) => Promise<unknown>;
  recognize: (
    image: HTMLCanvasElement,
    options: { rotateAuto?: boolean },
    output: { text: boolean }
  ) => Promise<{ data: OcrPage }>;
  terminate: () => Promise<unknown>;
};

function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  return new URL(path, new URL(base, window.location.origin)).href;
}

/** Map the on-screen video (object-fit: cover) back to camera pixels. */
function visibleFrame(video: HTMLVideoElement) {
  const frameWidth = video.videoWidth;
  const frameHeight = video.videoHeight;
  const box = video.getBoundingClientRect();
  if (!frameWidth || !frameHeight || box.width < 2 || box.height < 2) return null;

  const frameAspect = frameWidth / frameHeight;
  const boxAspect = box.width / box.height;
  let sx = 0;
  let sy = 0;
  let sw = frameWidth;
  let sh = frameHeight;
  if (frameAspect > boxAspect) {
    sw = Math.round(frameHeight * boxAspect);
    sx = Math.round((frameWidth - sw) / 2);
  } else {
    sh = Math.round(frameWidth / boxAspect);
    sy = Math.round((frameHeight - sh) / 2);
  }

  // The printed id sits in the middle/lower part of what the user is framing.
  const cropW = Math.round(sw * 0.9);
  const cropH = Math.round(sh * 0.58);
  return {
    sx: sx + Math.round((sw - cropW) / 2),
    sy: sy + Math.round(sh * 0.28),
    sw: cropW,
    sh: cropH,
  };
}

function threshold(image: ImageData) {
  const { data } = image;
  const gray = new Uint8Array(data.length / 4);
  const hist = new Uint32Array(256);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const value = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) | 0;
    gray[p] = value;
    hist[value] += 1;
  }

  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i += 1) sum += i * hist[i];
  let sumBackground = 0;
  let weightBackground = 0;
  let best = 0;
  let limit = 140;
  for (let i = 0; i < 256; i += 1) {
    weightBackground += hist[i];
    if (!weightBackground) continue;
    const weightForeground = total - weightBackground;
    if (!weightForeground) break;
    sumBackground += i * hist[i];
    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sum - sumBackground) / weightForeground;
    const between = weightBackground * weightForeground * (meanBackground - meanForeground) ** 2;
    if (between > best) {
      best = between;
      limit = i;
    }
  }

  for (let p = 0, i = 0; p < gray.length; p += 1, i += 4) {
    const value = gray[p] < limit ? 0 : 255;
    data[i] = data[i + 1] = data[i + 2] = value;
  }
}

/** A row of digits is a thin band of black marks. A finger is a solid blob. */
function findDigitBand(image: ImageData): { y: number; h: number } | null {
  const { width, height, data } = image;
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
    let dark = 0;
    let flips = 0;
    let prev = 0;
    for (let x = 0; x < width; x += 1) {
      const bit = data[(y * width + x) * 4] < 128 ? 1 : 0;
      if (bit) dark += 1;
      if (x > 0 && bit !== prev) flips += 1;
      prev = bit;
    }
    const ratio = dark / width;
    const isText = ratio > 0.008 && ratio < 0.45 && flips >= 8;
    if (!isText) {
      if (start >= 0 && y > end + 3) close();
      continue;
    }
    if (start < 0) start = y;
    end = y;
    score += flips;
  }
  close();
  if (bestY < 0) return null;

  const pad = 10;
  const y = Math.max(0, bestY - pad);
  return { y, h: Math.min(height - y, bestH + pad * 2) };
}

function captureNumber(
  video: HTMLVideoElement,
  source: HTMLCanvasElement,
  output: HTMLCanvasElement
): { canvas: HTMLCanvasElement; singleLine: boolean } | null {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return null;
  const region = visibleFrame(video);
  if (!region) return null;

  const targetWidth = 960;
  const targetHeight = Math.max(1, Math.round(targetWidth * (region.sh / region.sw)));
  source.width = targetWidth;
  source.height = targetHeight;
  const sourceCtx = source.getContext("2d", { willReadFrequently: true });
  if (!sourceCtx) return null;
  sourceCtx.drawImage(
    video,
    region.sx,
    region.sy,
    region.sw,
    region.sh,
    0,
    0,
    targetWidth,
    targetHeight
  );

  const image = sourceCtx.getImageData(0, 0, targetWidth, targetHeight);
  threshold(image);
  sourceCtx.putImageData(image, 0, 0);

  const band = findDigitBand(image);
  const slice = band ?? {
    y: Math.round(targetHeight * 0.35),
    h: Math.round(targetHeight * 0.45),
  };
  const scale = band
    ? Math.min(3, Math.max(2, Math.ceil(64 / Math.max(slice.h, 1))))
    : 2;
  const pad = 24;
  output.width = targetWidth * scale + pad * 2;
  output.height = slice.h * scale + pad * 2;
  const outputCtx = output.getContext("2d");
  if (!outputCtx) return null;
  outputCtx.fillStyle = "#fff";
  outputCtx.fillRect(0, 0, output.width, output.height);
  outputCtx.imageSmoothingEnabled = false;
  outputCtx.drawImage(
    source,
    0,
    slice.y,
    targetWidth,
    slice.h,
    pad,
    pad,
    targetWidth * scale,
    slice.h * scale
  );
  return { canvas: output, singleLine: Boolean(band) };
}

/**
 * Reads the student id printed under a barcode. Aimed at the number on screen,
 * including when a finger is covering the bars.
 */
export function startPrintedCodeReader(
  video: HTMLVideoElement,
  onDetected: (code: string) => void,
  options?: { onStatus?: (message: string) => void }
): () => void {
  let stopped = false;
  let busy = false;
  let worker: OcrWorker | null = null;
  let pageMode = "";
  let lastCode = "";
  let hits = 0;
  let held = "";
  let misses = 0;
  let lastStatus = "";
  const source = document.createElement("canvas");
  const output = document.createElement("canvas");

  const report = (message: string) => {
    if (message === lastStatus) return;
    lastStatus = message;
    options?.onStatus?.(message);
  };

  report("Starting the number reader…");

  const ready = import("tesseract.js")
    .then(async (tesseract) => {
      if (stopped) return null;
      const created = (await tesseract.createWorker("eng", 1, {
        workerPath: assetUrl("ocr/worker.min.js"),
        corePath: assetUrl("ocr/tesseract-core-simd-lstm.wasm.js"),
        langPath: assetUrl("ocr"),
        workerBlobURL: false,
        gzip: true,
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
      report("Cover the barcode and hold the number under it in the frame.");
      return created;
    })
    .catch(() => {
      report("Number reader did not start. Type the code under the barcode.");
      return null;
    });

  const tick = async () => {
    if (stopped || busy) return;
    busy = true;
    try {
      const current = worker ?? (await ready);
      if (!current || stopped) return;
      const region = captureNumber(video, source, output);
      if (!region || stopped) return;

      const mode = region.singleLine ? "7" : "6";
      if (mode !== pageMode) {
        await current.setParameters({ tessedit_pageseg_mode: mode });
        pageMode = mode;
      }
      const result = await current.recognize(region.canvas, { rotateAuto: true }, { text: true });
      if (stopped) return;

      const code = extractPrintedCode(result.data.text);
      if (!code) {
        if (held) {
          misses += 1;
          if (misses >= 3) {
            held = "";
            misses = 0;
            lastCode = "";
            hits = 0;
            report("Cover the barcode and hold the number under it in the frame.");
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
      report(`Seeing ${code} — hold steady`);
      if (hits >= 2) {
        held = code;
        hits = 0;
        onDetected(code);
      }
    } catch {
      // Keep the camera up if one frame cannot be read.
    } finally {
      busy = false;
    }
  };

  void tick();
  const timer = window.setInterval(() => {
    void tick();
  }, 700);

  return () => {
    stopped = true;
    window.clearInterval(timer);
    const active = worker;
    worker = null;
    if (active) void active.terminate().catch(() => undefined);
    else void ready.then((created) => created?.terminate().catch(() => undefined));
  };
}
