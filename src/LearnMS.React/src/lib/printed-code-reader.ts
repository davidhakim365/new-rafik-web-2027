import { findDigitBand, stretchContrast } from "@/lib/printed-code-image";
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
  stretchContrast(image.data);
  sourceCtx.putImageData(image, 0, 0);

  const band = findDigitBand(image.data, targetWidth, targetHeight);
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
  outputCtx.imageSmoothingEnabled = true;
  outputCtx.imageSmoothingQuality = "high";
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
