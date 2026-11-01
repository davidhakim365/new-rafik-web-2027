import { locatePrintedNumber, stretchContrast } from "@/lib/printed-code-image";
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

/** The on-screen brackets, mapped back through object-fit: cover. */
function aimedFrame(video: HTMLVideoElement) {
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

  // Brackets are 72% by 46%. A little extra keeps the line at the bottom edge.
  const cropW = Math.round(sw * 0.78);
  const cropH = Math.round(sh * 0.52);
  return {
    sx: sx + Math.round((sw - cropW) / 2),
    sy: sy + Math.round((sh - cropH) / 2),
    sw: cropW,
    sh: cropH,
  };
}

function captureNumber(
  video: HTMLVideoElement,
  source: HTMLCanvasElement,
  output: HTMLCanvasElement
): HTMLCanvasElement | null {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return null;
  const region = aimedFrame(video);
  if (!region) return null;

  const targetWidth = 640;
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
  const detect = new Uint8ClampedArray(image.data);
  stretchContrast(detect);
  const line = locatePrintedNumber(detect, targetWidth, targetHeight);
  if (!line || line.w < 24 || line.h < 4) return null;

  const scale = Math.min(8, Math.max(4, Math.ceil(110 / line.h)));
  const pad = 26;
  const dw = line.w * scale;
  const dh = line.h * scale;
  output.width = dw + pad * 2;
  output.height = dh + pad * 2;
  const outputCtx = output.getContext("2d");
  if (!outputCtx) return null;
  outputCtx.fillStyle = "#fff";
  outputCtx.fillRect(0, 0, output.width, output.height);
  outputCtx.imageSmoothingEnabled = true;
  outputCtx.imageSmoothingQuality = "high";
  outputCtx.drawImage(source, line.x, line.y, line.w, line.h, pad, pad, dw, dh);
  return output;
}

/**
 * Reads the student id printed under a barcode. Aimed at the number on screen,
 * including when a finger is covering the bars.
 */
export function startPrintedCodeReader(
  video: HTMLVideoElement,
  onDetected: (code: string) => void,
  options?: { onStatus?: (message: string) => void; shouldWait?: () => boolean }
): () => void {
  let stopped = false;
  let busy = false;
  let worker: OcrWorker | null = null;
  let lastCode = "";
  let hits = 0;
  let held = "";
  let misses = 0;
  let lastStatus = "";
  const armAt = Date.now() + 600;
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
        workerBlobURL: true,
        gzip: true,
        logger: () => undefined,
      })) as OcrWorker;
      if (stopped) {
        await created.terminate();
        return null;
      }
      await created.setParameters({
        tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-",
        tessedit_pageseg_mode: "7",
        user_defined_dpi: "300",
      });
      worker = created;
      report("Point at the barcode. If it will not scan, hold the number under it in the frame.");
      return created;
    })
    .catch(() => {
      report("Number reader did not start. Type the code under the barcode.");
      return null;
    });

  const tick = async () => {
    if (stopped || busy || Date.now() < armAt || options?.shouldWait?.()) return;
    busy = true;
    try {
      const current = worker ?? (await ready);
      if (!current || stopped) return;
      const frame = captureNumber(video, source, output);
      if (!frame || stopped) return;

      const result = await current.recognize(frame, {}, { text: true });
      if (stopped) return;

      const code = extractPrintedCode(result.data.text);
      const confidence = result.data.confidence ?? 0;
      if (!code) {
        if (held || lastCode) {
          misses += 1;
          if (misses >= 3) {
            held = "";
            misses = 0;
            lastCode = "";
            hits = 0;
            report("Point at the barcode. If it will not scan, hold the number under it in the frame.");
          }
        }
        return;
      }

      misses = 0;
      if (code === held) return;
      const confirmed =
        confidence >= 55 || (code === lastCode && hits >= 1 && confidence >= 35);
      if (code === lastCode) hits += 1;
      else {
        lastCode = code;
        hits = 1;
      }
      if (!confirmed) {
        report(`Seeing ${code} — hold steady`);
        return;
      }
      held = code;
      hits = 0;
      onDetected(code);
    } catch {
      // Keep the camera up if one frame cannot be read.
    } finally {
      busy = false;
    }
  };

  void tick();
  const timer = window.setInterval(() => {
    void tick();
  }, 320);

  return () => {
    stopped = true;
    window.clearInterval(timer);
    const active = worker;
    worker = null;
    if (active) void active.terminate().catch(() => undefined);
    else void ready.then((created) => created?.terminate().catch(() => undefined));
  };
}
