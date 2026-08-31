import Quagga, { type QuaggaJSResultObject } from "@ericblade/quagga2";

/**
 * Android Chrome treats width/height min-max as hard limits. In portrait the
 * rear camera is often 1080x1920, which exceeds height.max 1080 and fails as
 * OverconstrainedError / NotAllowedError — with no permission prompt.
 * iOS Safari ignores those limits and still asks. Request facingMode only.
 */
async function cameraConstraintAttempts(): Promise<MediaTrackConstraints[]> {
  const attempts: MediaTrackConstraints[] = [
    { facingMode: { ideal: "environment" } },
    { facingMode: "environment" },
    { facingMode: "user" },
    {},
  ];

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const rear =
      cameras.find((device) =>
        /back|rear|environment|world/i.test(device.label)
      ) ?? cameras.at(-1);
    if (rear?.deviceId) {
      attempts.unshift({ deviceId: { exact: rear.deviceId } });
    }
  } catch {
    // Permission labels may be empty; facingMode fallbacks still run.
  }

  return attempts;
}

const QUAGGA_READERS = [
  "code_128_reader",
  "ean_reader",
  "ean_8_reader",
  "code_39_reader",
  "codabar_reader",
  "upc_reader",
] as const;

function errorName(err: unknown): string {
  if (err && typeof err === "object" && "name" in err) {
    return String((err as { name: unknown }).name);
  }
  return "";
}

function errorText(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err ?? "");
}

export function describeCameraError(err: unknown): string {
  const name = errorName(err);
  const message = errorText(err);

  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "Camera needs HTTPS. Open the site with https:// and try again.";
  }
  if (
    name === "NotAllowedError" ||
    /permission|notallowed|denied/i.test(`${name} ${message}`)
  ) {
    return "Camera permission was blocked. Tap Allow camera so Android can show the prompt.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "No usable camera found. Close other camera apps and tap Allow camera.";
  }
  if (name === "NotReadableError") {
    return "Camera is in use by another app. Close it and tap Allow camera.";
  }
  return "Could not start the camera. Tap Allow camera to try again.";
}

async function warmUpPermission() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera is not supported in this browser.");
  }

  const stream = await navigator.mediaDevices
    .getUserMedia({
      audio: false,
      video: { facingMode: { ideal: "environment" } },
    })
    .catch(() =>
      navigator.mediaDevices.getUserMedia({ audio: false, video: true })
    );

  stream.getTracks().forEach((track) => track.stop());
  // Android needs a beat before the same camera can be opened again.
  await new Promise((resolve) => window.setTimeout(resolve, 200));
}

function initQuagga(
  target: HTMLElement,
  constraints: MediaTrackConstraints
): Promise<void> {
  return new Promise((resolve, reject) => {
    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target,
          constraints,
        },
        locator: {
          patchSize: "medium",
          halfSample: true,
        },
        // Workers are unreliable on Android Chrome.
        numOfWorkers: 0,
        decoder: {
          readers: [...QUAGGA_READERS],
        },
        locate: true,
        frequency: 10,
      },
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function prepareVideo(target: HTMLElement) {
  const video = target.querySelector("video");
  if (!video) return;
  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  void video.play().catch(() => undefined);
}

function stopQuaggaQuietly() {
  try {
    Quagga.stop();
  } catch {
    // Already stopped.
  }
}

export async function startBarcodeScanner(
  target: HTMLElement,
  onDetected: (code: string) => void
): Promise<() => void> {
  await warmUpPermission();

  const attempts = await cameraConstraintAttempts();
  let lastError: unknown;
  let started = false;

  for (const constraints of attempts) {
    try {
      await initQuagga(target, constraints);
      Quagga.start();
      prepareVideo(target);
      started = true;
      lastError = undefined;
      break;
    } catch (err) {
      lastError = err;
      stopQuaggaQuietly();
    }
  }

  if (!started) {
    throw lastError instanceof Error
      ? lastError
      : new Error(describeCameraError(lastError));
  }

  const handleDetected = (result: QuaggaJSResultObject) => {
    const code = result?.codeResult?.code;
    if (code) onDetected(code);
  };

  Quagga.onDetected(handleDetected);

  return () => {
    Quagga.offDetected(handleDetected);
    stopQuaggaQuietly();
  };
}
